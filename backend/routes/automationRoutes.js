import express from "express";
import {
  createAutomation,
  deleteAutomation,
  getAutomations,
  toggleAutomation,
  updateAutomation,
} from "../controllers/automationController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", allowRoles("Admin", "Manager", "User"), getAutomations);
router.post("/", allowRoles("Admin", "Manager", "User"), createAutomation);
router.put("/:id", allowRoles("Admin", "Manager", "User"), updateAutomation);
router.patch("/:id/toggle", allowRoles("Admin", "Manager", "User"), toggleAutomation);
router.delete("/:id", allowRoles("Admin", "Manager", "User"), deleteAutomation);

export default router;
