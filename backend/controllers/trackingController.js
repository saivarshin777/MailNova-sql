import Campaign from "../models/Campaign.js";
import CampaignRecipient from "../models/CampaignRecipient.js";
import { getUrlSignature } from "../services/emailTrackingService.js";
import { tenantStorage } from "../config/tenantDb.js";
import { runClickedLinkAutomations } from "../services/automationEngine.js";

const pixel = Buffer.from("R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");

const runInTenantContext = async (req, callback) => {
  const userId = req.params.userId || req.body.userId || req.query.userId;
  if (userId && userId !== "unknown") {
    return tenantStorage.run({ tenantId: userId }, callback);
  }
  return callback();
};

const incrementMetrics = async (campaignId, fields) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) return;

  const maxCount = Math.max(campaign.delivered || 0, campaign.emailsSent || 0, 1);
  fields.forEach((field) => {
    campaign[field] = Math.min(Number(campaign[field] || 0) + 1, maxCount);
  });
  await campaign.save();
};

const syncCampaignTotals = async (campaignId) => {
  const [sent, opened, clicked, bounced] = await Promise.all([
    CampaignRecipient.countDocuments({ campaign: campaignId, status: { $in: ["sent", "bounced", "unsubscribed"] } }),
    CampaignRecipient.countDocuments({ campaign: campaignId, openedAt: { $ne: null } }),
    CampaignRecipient.countDocuments({ campaign: campaignId, clickedAt: { $ne: null } }),
    CampaignRecipient.countDocuments({ campaign: campaignId, status: "bounced" }),
  ]);

  await Campaign.findByIdAndUpdate(campaignId, {
    delivered: Math.max(sent - bounced, 0),
    opened,
    clicked,
  });
};

const recordRecipientEvent = async ({ campaignId, token, eventType, req, clickedUrl = "", actorId = null }) => {
  if (!token) {
    await incrementMetrics(campaignId, eventType === "click" ? ["clicked", "opened"] : ["opened"]);
    return;
  }

  const recipient = await CampaignRecipient.findOne({ campaign: campaignId, token });
  if (!recipient) {
    await incrementMetrics(campaignId, eventType === "click" ? ["clicked", "opened"] : ["opened"]);
    return;
  }

  const now = new Date();
  recipient.lastEventAt = now;
  recipient.lastUserAgent = req.get("user-agent") || "";
  recipient.lastIp = req.ip || req.headers["x-forwarded-for"] || "";

  if (eventType === "open") {
    recipient.opens += 1;
    if (!recipient.openedAt) recipient.openedAt = now;
  }

  if (eventType === "click") {
    recipient.clicks += 1;
    recipient.lastClickedUrl = clickedUrl;
    if (!recipient.openedAt) recipient.openedAt = now;
    if (!recipient.clickedAt) recipient.clickedAt = now;
  }

  await recipient.save();
  await syncCampaignTotals(campaignId);

  if (eventType === "click") {
    await runClickedLinkAutomations(recipient.email, actorId).catch((error) =>
      console.error("runClickedLinkAutomations failed:", error.message)
    );
  }
};

export const trackOpen = async (req, res, next) => {
  try {
    await runInTenantContext(req, async () => {
      await recordRecipientEvent({
        campaignId: req.params.campaignId,
        token: req.params.token,
        eventType: "open",
        req,
      });
    });

    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.end(pixel);
  } catch (error) {
    next(error);
  }
};

export const trackClick = async (req, res, next) => {
  try {
    const fallback = process.env.CLIENT_URL || "http://localhost:5173";
    const target = req.query.url || fallback;
    const sig = req.query.sig;

    const expectedSig = getUrlSignature(String(target));
    if (sig !== expectedSig) {
      return res.redirect(fallback);
    }

    await runInTenantContext(req, async () => {
      const actorId = req.params.userId || req.body.userId || req.query.userId || null;
      await recordRecipientEvent({
        campaignId: req.params.campaignId,
        token: req.params.token,
        eventType: "click",
        clickedUrl: String(target),
        req,
        actorId,
      });
    });

    try {
      const parsed = new URL(target, fallback);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return res.redirect(fallback);
      }
      return res.redirect(parsed.toString());
    } catch (_error) {
      return res.redirect(fallback);
    }
  } catch (error) {
    next(error);
  }
};

export const recordDeliveryEvent = async (req, res, next) => {
  try {
    if (
      process.env.DELIVERY_WEBHOOK_SECRET &&
      req.get("x-mailnova-webhook-secret") !== process.env.DELIVERY_WEBHOOK_SECRET
    ) {
      return res.status(401).json({ success: false, message: "Invalid delivery webhook secret" });
    }

    await runInTenantContext(req, async () => {
      const { campaignId, token, email, event = "bounced", error = "" } = req.body;
      const filter = token ? { campaign: campaignId, token } : { campaign: campaignId, email };
      const update =
        event === "bounced"
          ? { status: "bounced", bouncedAt: new Date(), error }
          : event === "delivered"
          ? { status: "sent", deliveredAt: new Date(), error: "" }
          : { status: event, error };

      await CampaignRecipient.findOneAndUpdate(filter, update);
      await syncCampaignTotals(campaignId);
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
