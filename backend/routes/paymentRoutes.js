import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createRateLimiter } from "../middleware/rateLimitMiddleware.js";
import { createOrder, verifyPayment, getPaymentConfig } from "../controllers/paymentController.js";

const router = express.Router();

const paymentRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "payments",
});

// Note: the /webhook route is intentionally NOT here - it needs the raw
// request body for signature verification and no user session, so it is
// mounted directly in server.js ahead of the global express.json() parser.

router.get("/config", protect, getPaymentConfig);
router.post("/create-order", protect, paymentRateLimiter, createOrder);
router.post("/verify", protect, paymentRateLimiter, verifyPayment);

export default router;
