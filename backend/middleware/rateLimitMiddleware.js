const buckets = new Map();

// Buckets are never removed once created, so a long-running process would
// otherwise accumulate one entry per unique user/IP forever. Sweep expired
// entries periodically to keep memory bounded.
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref();

export const createRateLimiter = ({ windowMs = 60_000, max = 60, keyPrefix = "global" } = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const identity = req.user?._id || req.ip || "anonymous";
    const key = `${keyPrefix}:${identity}`;
    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (bucket.resetAt <= now) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(max - bucket.count, 0)));
    res.setHeader("X-RateLimit-Reset", String(bucket.resetAt));

    if (bucket.count > max) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait before trying again.",
      });
    }

    next();
  };
};

export const campaignSendLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.CAMPAIGN_SEND_LIMIT || 20),
  keyPrefix: "campaign-send",
});

export const smsSendLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.SMS_SEND_LIMIT || 30),
  keyPrefix: "sms-send",
});

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "login",
});

export const otpVerifyRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "otp-verify",
});

export const otpResendRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3,
  keyPrefix: "otp-resend",
});

export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyPrefix: "password-reset",
});

