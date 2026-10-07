import express from "express";
import { getActivityLogs } from "../controllers/activityController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", allowRoles("Admin"), getActivityLogs);

export default router;
