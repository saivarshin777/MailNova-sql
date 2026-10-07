import { defineModel } from "../db/orm.js";

const Contact = defineModel("Contact", {
  table: "contacts",
  tenant: true,
  fields: {
    name: { type: "string", required: true, trim: true },
    email: { type: "string", required: true, lowercase: true, trim: true },
    phone: { type: "string", trim: true, default: "" },
    city: { type: "string", trim: true, default: "" },
    status: { type: "string", enum: ["Lead", "Prospect", "Customer", "Inactive"], default: "Lead" },
    addedBy: { type: "ref", ref: "User" },
    isSeedData: { type: "boolean", default: false },
  },
  indexes: [{ fields: ["email"] }, { fields: ["status", "createdAt"] }, { fields: ["city", "status"] }],
});

export default Contact;
