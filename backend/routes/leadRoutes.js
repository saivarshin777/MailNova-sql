import express from "express";
import { getLeadOverview } from "../controllers/leadController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", allowRoles("Admin", "Lead", "Viewer", "Manager"), getLeadOverview);

export default router;
