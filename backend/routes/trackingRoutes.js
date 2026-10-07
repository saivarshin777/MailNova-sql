import express from "express";
import { recordDeliveryEvent, trackClick, trackOpen } from "../controllers/trackingController.js";

const router = express.Router();

// User-specific database routes
router.get("/open/:userId/:campaignId/:token.gif", trackOpen);
router.get("/open/:userId/:campaignId.gif", trackOpen);
router.get("/click/:userId/:campaignId/:token", trackClick);
router.get("/click/:userId/:campaignId", trackClick);
router.post("/delivery/:userId", express.json({ limit: "1mb" }), recordDeliveryEvent);

// Fallback/Legacy routes (pointing to default database)
router.get("/open/:campaignId/:token.gif", trackOpen);
router.get("/open/:campaignId.gif", trackOpen);
router.get("/click/:campaignId/:token", trackClick);
router.get("/click/:campaignId", trackClick);
router.post("/delivery", express.json({ limit: "1mb" }), recordDeliveryEvent);

export default router;
