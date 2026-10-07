// Single source of truth for plan limits and pricing.
// Previously these numbers were duplicated (and inconsistent) between
// adminController.js and authRoutes.js. Edit prices here to match your
// real Razorpay pricing - priceInPaise is what gets charged (100 paise = ₹1).
export const PLAN_DEFINITIONS = {
  Free: {
    sendLimit: 5000,
    contactLimit: 1000,
    billingStatus: "Trial",
    priceInPaise: 0,
  },
  Pro: {
    sendLimit: 100000,
    contactLimit: 25000,
    billingStatus: "Active",
    priceInPaise: 249900, // ₹2,499 / month - adjust to your real price
  },
  Enterprise: {
    sendLimit: 1000000,
    contactLimit: 250000,
    billingStatus: "Contract",
    priceInPaise: 999900, // ₹9,999 / month - adjust to your real price
  },
};

// Plans that require a real Razorpay payment to activate.
// Free is always self-service (no payment needed).
export const PAYABLE_PLANS = ["Pro", "Enterprise"];

export const isValidPlanName = (planName) => Object.prototype.hasOwnProperty.call(PLAN_DEFINITIONS, planName);
