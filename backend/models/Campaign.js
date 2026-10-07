import { defineModel } from "../db/orm.js";

const Campaign = defineModel("Campaign", {
  table: "campaigns",
  tenant: true,
  fields: {
    name: { type: "string", required: true, trim: true },
    subject: { type: "string", required: true, trim: true },
    content: { type: "string", default: "", trim: true },
    recipients: { type: "array", of: "string", default: () => [] },
    htmlContent: { type: "string", default: "" },
    textContent: { type: "string", default: "" },
    template: { type: "ref", ref: "Template", default: null },
    templateName: { type: "string", default: "", trim: true },
    contactList: { type: "ref", ref: "ContactList", default: null },
    contactListName: { type: "string", default: "", trim: true },
    sendStatus: { type: "string", enum: ["draft", "pending", "sending", "sent", "failed"], default: "pending" },
    sendError: { type: "string", default: "" },
    status: {
      type: "string",
      enum: ["Active", "Completed", "Running", "Draft", "Scheduled", "Failed"],
      default: "Running",
    },
    emailsSent: { type: "number", default: 0, min: 0 },
    delivered: { type: "number", default: 0, min: 0 },
    opened: { type: "number", default: 0, min: 0 },
    clicked: { type: "number", default: 0, min: 0 },
    createdBy: { type: "ref", ref: "User", default: null },
    scheduledFor: { type: "date", default: null },
    trackingBaseUrl: { type: "string", default: "", trim: true },
    isSeedData: { type: "boolean", default: false },
  },
  indexes: [
    { fields: ["createdAt", "status"] },
    { fields: ["sendStatus", "createdAt"] },
    { fields: ["createdBy", "createdAt"] },
  ],
});

export default Campaign;
