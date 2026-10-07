import { defineModel } from "../db/orm.js";

const ContactList = defineModel("ContactList", {
  table: "contact_lists",
  tenant: true,
  fields: {
    name: { type: "string", required: true, trim: true },
    description: { type: "string", trim: true, default: "" },
    color: { type: "string", default: "#2563eb" },
    // Array of Contact ids (stored as a JSON array; populate("contacts") resolves them)
    contacts: { type: "array", of: "ref", ref: "Contact" },
    createdBy: { type: "ref", ref: "User", default: null },
    isSeedData: { type: "boolean", default: false },
  },
});

export default ContactList;
