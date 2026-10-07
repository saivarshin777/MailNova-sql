import { defineModel } from "../db/orm.js";

const User = defineModel("User", {
  table: "users",
  fields: {
    name: { type: "string", required: true, trim: true },
    email: { type: "string", required: true, unique: true, lowercase: true, trim: true },
    password: { type: "string", required: true },
    phone: { type: "string", default: "", trim: true },
    senderName: { type: "string", default: "MailNova Workspace", trim: true },
    replyTo: { type: "string", default: "", lowercase: true, trim: true },
    role: { type: "string", enum: ["Admin", "Manager", "User", "Lead", "Viewer"], default: "User" },
    isOwner: { type: "boolean", default: false },
    status: { type: "string", enum: ["Active", "Suspended"], default: "Active" },
    "plan.name": { type: "string", enum: ["Free", "Pro", "Enterprise"], default: "Free" },
    "plan.sendLimit": { type: "number", default: 5000 },
    "plan.contactLimit": { type: "number", default: 1000 },
    "plan.billingStatus": { type: "string", enum: ["Trial", "Active", "Contract", "Past Due"], default: "Trial" },
    lastLogin: { type: "date" },
    loginCount: { type: "number", default: 0 },
    workDoneAtLogin: { type: "mixed", default: () => ({}) },
    resetPasswordToken: { type: "string" },
    resetPasswordExpire: { type: "date" },
  },
});

export default User;
