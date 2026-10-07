import express from "express";
import {
  createCampaign,
  deleteCampaign,
  getCampaignRecipients,
  getCampaigns,
} from "../controllers/campaignController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { campaignSendLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateCampaignPayload } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), getCampaigns);
router.get("/:campaignId/recipients", allowRoles("Admin", "Manager", "User", "Lead", "Viewer"), getCampaignRecipients);
router.post(
  "/",
  allowRoles("Admin", "Manager", "User"),
  campaignSendLimiter,
  validateCampaignPayload,
  createCampaign
);
router.delete("/:campaignId", allowRoles("Admin", "Manager", "User"), deleteCampaign);

export default router;
