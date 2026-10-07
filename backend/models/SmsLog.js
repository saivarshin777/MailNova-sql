import { defineModel } from "../db/orm.js";

const SmsLog = defineModel("SmsLog", {
  table: "sms_logs",
  tenant: true,
  fields: {
    contact: { type: "ref", ref: "Contact" },
    phone: { type: "string", required: true, trim: true },
    message: { type: "string", required: true, trim: true },
    status: { type: "string", enum: ["sent", "failed", "mock"], default: "sent" },
    provider: { type: "string", default: "mock" },
    providerMessageId: { type: "string", default: "" },
    error: { type: "string", default: "" },
    sentBy: { type: "ref", ref: "User" },
  },
});

export default SmsLog;
