import { defineModel } from "../db/orm.js";

// Every attempted plan purchase gets a row here, created at "order created"
// time and updated as Razorpay confirms it (audit trail for plan changes).
const Payment = defineModel("Payment", {
  table: "payments",
  fields: {
    user: { type: "ref", ref: "User", required: true, index: true },
    planName: { type: "string", enum: ["Free", "Pro", "Enterprise"], required: true },
    amount: { type: "number", required: true }, // in paise
    currency: { type: "string", default: "INR" },
    razorpayOrderId: { type: "string", required: true, unique: true },
    razorpayPaymentId: { type: "string" },
    razorpaySignature: { type: "string" },
    status: { type: "string", enum: ["created", "paid", "failed", "refunded"], default: "created" },
    failureReason: { type: "string" },
    // Razorpay can deliver the same webhook event more than once; processed
    // event ids are tracked so a repeat delivery is a no-op.
    webhookEventIds: { type: "array", of: "string", default: () => [] },
  },
});

export default Payment;
