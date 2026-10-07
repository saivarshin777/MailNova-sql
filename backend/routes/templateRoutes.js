import express from "express";
import {
  createTemplate,
  deleteTemplate,
  getTemplate,
  getTemplates,
  updateTemplate,
} from "../controllers/templateController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), getTemplates);
router.post("/", allowRoles("Admin", "Manager", "User"), createTemplate);
router.get("/:id", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), getTemplate);
router.put("/:id", allowRoles("Admin", "Manager", "User"), updateTemplate);
router.delete("/:id", allowRoles("Admin", "Manager", "User"), deleteTemplate);

export default router;
