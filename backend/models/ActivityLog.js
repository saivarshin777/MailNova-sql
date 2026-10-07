import { defineModel } from "../db/orm.js";

const ActivityLog = defineModel("ActivityLog", {
  table: "activity_logs",
  fields: {
    action: { type: "string", required: true, trim: true },
    entityType: { type: "string", required: true, trim: true },
    entityId: { type: "ref", default: null },
    message: { type: "string", default: "", trim: true },
    actor: { type: "ref", ref: "User", default: null },
    metadata: { type: "mixed", default: () => ({}) },
  },
  indexes: [{ fields: ["createdAt"] }, { fields: ["entityType", "entityId"] }, { fields: ["actor", "createdAt"] }],
});

export default ActivityLog;
