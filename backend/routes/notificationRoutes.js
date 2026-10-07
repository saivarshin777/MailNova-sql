import express from "express";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  simulateNotification,
} from "../controllers/notificationController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), getNotifications);
router.post("/simulate", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), simulateNotification);
router.patch("/read-all", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), markAllNotificationsRead);
router.patch("/:id/read", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), markNotificationRead);

export default router;
