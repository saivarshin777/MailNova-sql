import { defineModel } from "../db/orm.js";

const EmailLog = defineModel("EmailLog", {
  table: "email_logs",
  tenant: true,
  fields: {
    campaign: { type: "ref", ref: "Campaign", required: true },
    recipients: { type: "array", of: "string", default: () => [] },
    subject: { type: "string", required: true },
    htmlContent: { type: "string", required: true },
    textContent: { type: "string", required: true },
    status: { type: "string", enum: ["sent", "failed"], required: true },
    providerMessageId: { type: "string", default: "" },
    error: { type: "string", default: "" },
  },
  indexes: [{ fields: ["campaign", "createdAt"] }],
});

export default EmailLog;
