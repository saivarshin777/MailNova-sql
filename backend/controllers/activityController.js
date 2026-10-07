import ActivityLog from "../models/ActivityLog.js";

export const recordActivity = async ({ action, entityType, entityId = null, message = "", actor = null, metadata = {} }) => {
  try {
    await ActivityLog.create({
      action,
      entityType,
      entityId,
      message,
      actor,
      metadata,
    });
  } catch (error) {
    console.error("Failed to record activity log:", error.message);
  }
};

export const getActivityLogs = async (_req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("actor", "name email role")
      .lean();

    res.json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};
