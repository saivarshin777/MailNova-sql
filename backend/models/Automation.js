import { defineModel } from "../db/orm.js";

const Automation = defineModel("Automation", {
  table: "automations",
  tenant: true,
  fields: {
    name: { type: "string", required: true, trim: true },
    trigger: {
      type: "string",
      required: true,
      enum: ["New contact added", "Campaign not opened", "Clicked link", "Contact becomes inactive"],
    },
    condition: { type: "string", default: "Immediately", trim: true },
    action: {
      type: "string",
      required: true,
      enum: ["Send welcome email", "Send follow-up campaign", "Move to interested folder", "Notify manager"],
    },
    folder: { type: "string", default: "All Contacts", trim: true },
    active: { type: "boolean", default: true },
    runs: { type: "number", default: 0 },
    lastTriggeredAt: { type: "date", default: null },
    "lastTriggeredContact.name": { type: "string", default: "" },
    "lastTriggeredContact.email": { type: "string", default: "" },
    lastResult: { type: "string", default: "", trim: true },
    // Prevents the same workflow firing twice for the same contact.
    firedForContacts: { type: "array", of: "ref", ref: "Contact" },
    createdBy: { type: "ref", ref: "User", default: null },
    isSeedData: { type: "boolean", default: false },
  },
});

export default Automation;
