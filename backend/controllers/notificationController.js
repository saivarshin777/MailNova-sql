import Notification from "../models/Notification.js";
import { toClientNotification } from "../services/dashboardService.js";
import { sendRealTimeNotification } from "../services/socketService.js";

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user?._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications.map(toClientNotification));
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user?._id },
      { read: true, isRead: true }
    );
    const notifications = await Notification.find({ recipient: req.user?._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications.map(toClientNotification));
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user?._id,
        $or: [
          { read: false },
          { read: { $exists: false } },
          { isRead: false },
          { isRead: { $exists: false } },
        ],
      },
      { read: true, isRead: true }
    );
    const notifications = await Notification.find({ recipient: req.user?._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notifications.map(toClientNotification));
  } catch (error) {
    next(error);
  }
};

export const simulateNotification = async (req, res, next) => {
  try {
    const { category, title, desc } = req.body;

    const notification = await Notification.create({
      type: category || "System Alert",
      title: title || `Mock ${category}`,
      desc: desc || `This is a simulated message for category ${category}.`,
      recipient: req.user?._id,
      read: false,
      isRead: false
    });

    const formatted = toClientNotification(notification);

    // Emit live via socket
    sendRealTimeNotification(req.user?._id, formatted);

    res.status(201).json({ success: true, notification: formatted });
  } catch (error) {
    next(error);
  }
};
