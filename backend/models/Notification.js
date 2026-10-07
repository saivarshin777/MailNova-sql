import { defineModel } from "../db/orm.js";

const Notification = defineModel("Notification", {
  table: "notifications",
  tenant: true,
  fields: {
    type: {
      type: "string",
      enum: [
        "campaign",
        "system",
        "warning",
        "growth",
        "New Contact Message",
        "Support Message",
        "Lead Generated",
        "System Alert",
      ],
      default: "system",
    },
    title: { type: "string", required: true, trim: true },
    desc: { type: "string", required: true, trim: true },
    time: { type: "string", default: "Just now" },
    read: { type: "boolean", default: false },
    isRead: { type: "boolean", default: false },
    recipient: { type: "ref", ref: "User", default: null },
    isSeedData: { type: "boolean", default: false },
  },
  indexes: [{ fields: ["recipient", "createdAt"] }],
});

export default Notification;
