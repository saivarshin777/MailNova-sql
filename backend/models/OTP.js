import { defineModel } from "../db/orm.js";

// OTPs expire after 5 minutes. Mongo did this with a TTL index; the SQL layer
// purges expired rows automatically before every OTP query (see `ttl`).
const OTP = defineModel("OTP", {
  table: "otps",
  timestamps: false,
  ttl: { field: "createdAt", seconds: 300 },
  fields: {
    email: { type: "string", required: true, lowercase: true, trim: true, index: true },
    otp: { type: "string", required: true },
    createdAt: { type: "date", default: () => new Date() },
    attempts: { type: "number", default: 0 },
  },
});

export default OTP;
