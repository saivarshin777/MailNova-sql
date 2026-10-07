import crypto from "crypto";

// We call Razorpay's REST API directly with fetch (Node 18+ has it built in)
// instead of adding the razorpay npm package - one less dependency to manage,
// and the API surface we need (create order, verify signature) is small.
const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

const getAuthHeader = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env"
    );
  }
  return "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
};

/**
 * Creates a Razorpay order. This MUST run on the backend - the key secret
 * never touches the browser. Amount is in the smallest currency unit
 * (paise for INR).
 */
export const createRazorpayOrder = async ({ amount, currency = "INR", receipt, notes }) => {
  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency, receipt, notes, payment_capture: 1 }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.description || "Failed to create Razorpay order";
    throw new Error(message);
  }
  return data;
};

/**
 * Verifies the signature Razorpay Checkout returns to the browser after a
 * successful payment. This is the check that's most commonly skipped -
 * without it, anyone could call the "mark as paid" endpoint directly.
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) return false;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false; // length mismatch etc - definitely not a match
  }
};

/**
 * Verifies the X-Razorpay-Signature header on incoming webhook calls against
 * the raw request body. This is what makes the webhook trustworthy as the
 * source of truth (client-side checkout callbacks alone aren't reliable -
 * browsers close, networks drop).
 */
export const verifyWebhookSignature = ({ rawBody, signature }) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return false;
  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
};
