import express from "express";
import { getAnalytics, getDashboard } from "../controllers/dashboardController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), getDashboard);
router.get("/analytics", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), getAnalytics);

export default router;
