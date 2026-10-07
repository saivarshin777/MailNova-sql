import { defineModel } from "../db/orm.js";

// One row per (workflow, contact) pending or completed scheduled fire.
// This is what makes "Wait 24 hours" etc. real instead of firing instantly.
const AutomationTask = defineModel("AutomationTask", {
  table: "automation_tasks",
  tenant: true,
  fields: {
    automation: { type: "ref", ref: "Automation", required: true },
    contact: { type: "ref", ref: "Contact", required: true },
    dueAt: { type: "date", required: true, index: true },
    status: { type: "string", enum: ["pending", "completed", "failed"], default: "pending", index: true },
    result: { type: "string", default: "" },
  },
  indexes: [{ fields: ["automation", "contact"], unique: true }],
});

export default AutomationTask;
