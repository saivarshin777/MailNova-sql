import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { PLAN_DEFINITIONS, PAYABLE_PLANS } from "../config/plans.js";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
  isRazorpayConfigured,
} from "../services/razorpayService.js";
import { recordActivity } from "./activityController.js";

// Applies a paid plan to a user and writes it to the activity log.
// Shared by both the verify endpoint (client-side callback) and the
// webhook (server-side source of truth) so a purchase is recorded exactly
// the same way regardless of which one gets there first.
const activatePlanForUser = async ({ userId, planName, paymentId, source }) => {
  const user = await User.findById(userId);
  if (!user) return;

  const planDef = PLAN_DEFINITIONS[planName];
  const previousPlan = user.plan?.name || "Free";

  user.plan = {
    name: planName,
    sendLimit: planDef.sendLimit,
    contactLimit: planDef.contactLimit,
    billingStatus: "Active",
  };
  await user.save();

  await recordActivity({
    action: "payment.plan_activated",
    entityType: "User",
    entityId: user._id,
    actor: user._id,
    message: `${user.email} plan activated to ${planName} after Razorpay payment (${source})`,
    metadata: { previousPlan, plan: planName, paymentId: String(paymentId), source },
  });
};

export const getPaymentConfig = async (_req, res) => {
  res.json({
    configured: isRazorpayConfigured(),
    keyId: isRazorpayConfigured() ? process.env.RAZORPAY_KEY_ID : null,
    webhookConfigured: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
    currency: "INR",
    payablePlans: PAYABLE_PLANS.map((name) => ({
      name,
      priceInPaise: PLAN_DEFINITIONS[name].priceInPaise,
    })),
  });
};

export const createOrder = async (req, res, next) => {
  try {
    const { planName } = req.body;

    if (!PAYABLE_PLANS.includes(planName)) {
      return res.status(400).json({
        success: false,
        message: "This plan cannot be purchased directly. Choose Pro or Enterprise.",
      });
    }

    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "Payments are not configured yet. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
      });
    }

    const planDef = PLAN_DEFINITIONS[planName];
    const receipt = `plan_${planName}_${req.user._id}_${Date.now()}`.slice(0, 40);

    const order = await createRazorpayOrder({
      amount: planDef.priceInPaise,
      currency: "INR",
      receipt,
      notes: { userId: String(req.user._id), planName },
    });

    await Payment.create({
      user: req.user._id,
      planName,
      amount: planDef.priceInPaise,
      currency: "INR",
      razorpayOrderId: order.id,
      status: "created",
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment verification fields" });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user._id,
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Order not found for this user" });
    }

    const validSignature = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!validSignature) {
      payment.status = "failed";
      payment.failureReason = "Signature verification failed";
      await payment.save();
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. If money was deducted, contact support.",
      });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;

    if (payment.status !== "paid") {
      payment.status = "paid";
      await payment.save();
      await activatePlanForUser({
        userId: payment.user,
        planName: payment.planName,
        paymentId: payment._id,
        source: "checkout-callback",
      });
    } else {
      await payment.save();
    }

    const user = await User.findById(req.user._id).select("-password");
    res.json({
      success: true,
      message: "Payment verified. Plan activated.",
      plan: user.plan,
    });
  } catch (error) {
    next(error);
  }
};

// Razorpay calls this directly - there is no user session, so trust is
// established purely through the webhook signature, never through the
// request body alone. req.body arrives as a raw Buffer (see server.js,
// where this route is mounted with express.raw() ahead of the global
// express.json() parser).
export const razorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body;
    const rawBodyString = Buffer.isBuffer(rawBody) ? rawBody.toString("utf8") : JSON.stringify(rawBody);

    const isValid = verifyWebhookSignature({ rawBody: rawBodyString, signature });
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = JSON.parse(rawBodyString);
    const eventId = event.id || `${event.event}_${event.created_at || Date.now()}`;
    const paymentEntity = event.payload?.payment?.entity;
    const orderId = paymentEntity?.order_id;

    if (!orderId) {
      // Nothing we track (e.g. account-level events) - acknowledge so
      // Razorpay doesn't keep retrying.
      return res.status(200).json({ success: true });
    }

    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (!payment) {
      return res.status(200).json({ success: true });
    }

    if (payment.webhookEventIds.includes(eventId)) {
      // Already processed this exact event - webhooks can be delivered
      // more than once, this keeps re-delivery a no-op.
      return res.status(200).json({ success: true, message: "duplicate" });
    }
    payment.webhookEventIds.push(eventId);

    if (event.event === "payment.captured") {
      payment.razorpayPaymentId = paymentEntity.id;
      const alreadyPaid = payment.status === "paid";
      payment.status = "paid";
      await payment.save();
      if (!alreadyPaid) {
        await activatePlanForUser({
          userId: payment.user,
          planName: payment.planName,
          paymentId: payment._id,
          source: "webhook",
        });
      }
    } else if (event.event === "payment.failed") {
      payment.status = "failed";
      payment.failureReason = paymentEntity?.error_description || "Payment failed";
      await payment.save();
    } else {
      await payment.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error.message);
    // 500 tells Razorpay to retry - safe here since idempotency is keyed
    // on event id, not on whether we responded 200 last time.
    res.status(500).json({ success: false });
  }
};
