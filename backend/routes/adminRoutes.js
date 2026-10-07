import express from "express";
import {
  getAdminOverview,
  getAdminUsers,
  getSystemLogs,
  updateAdminUserPlan,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../controllers/adminController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("Admin"));

router.get("/overview", getAdminOverview);
router.get("/users", getAdminUsers);
router.patch("/users/:id/role", updateAdminUserRole);
router.patch("/users/:id/status", updateAdminUserStatus);
router.patch("/users/:id/plan", updateAdminUserPlan);
router.get("/logs", getSystemLogs);

export default router;
