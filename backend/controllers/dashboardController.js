import Campaign from "../models/Campaign.js";
import CampaignRecipient from "../models/CampaignRecipient.js";
import Contact from "../models/Contact.js";
import Notification from "../models/Notification.js";
import { buildAnalytics, buildDashboard } from "../services/dashboardService.js";
import { getTrackingBaseUrl } from "../services/emailTrackingService.js";

const canSeeGlobalWorkspace = (req) => ["Admin", "Manager"].includes(req.user?.role);
const campaignScope = (req) => (canSeeGlobalWorkspace(req) ? {} : { createdBy: req.user?._id });
const contactScope = (req) => (canSeeGlobalWorkspace(req) ? {} : { addedBy: req.user?._id });
// Notifications were previously fetched with Notification.find() and no
// filter at all here, which meant every user's dashboard/analytics load
// included every other user's notification titles and descriptions -
// campaigns and contacts were already correctly scoped just above, this
// brings notifications in line with the same pattern.
const notificationScope = (req) => (canSeeGlobalWorkspace(req) ? {} : { recipient: req.user?._id });

const rangeStartDate = (range = "") => {
  const normalized = String(range).toLowerCase();
  if (!normalized || normalized.includes("all")) return null;
  const now = Date.now();
  if (normalized.includes("today")) return new Date(new Date().setHours(0, 0, 0, 0));
  if (normalized.includes("7")) return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (normalized.includes("90")) return new Date(now - 90 * 24 * 60 * 60 * 1000);
  return new Date(now - 30 * 24 * 60 * 60 * 1000);
};

const analyticsCampaignScope = (req) => {
  const startDate = rangeStartDate(req.query.range || "All Time");
  return startDate
    ? { ...campaignScope(req), createdAt: { $gte: startDate } }
    : campaignScope(req);
};

const trackingConfig = (req) => {
  const baseUrl = getTrackingBaseUrl(req);
  const hostname = (() => {
    try {
      return new URL(baseUrl).hostname;
    } catch (_error) {
      return "";
    }
  })();
  const isPublic =
    hostname &&
    !["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname) &&
    !hostname.endsWith(".local");

  return {
    baseUrl,
    isPublic,
    status: isPublic ? "Ready for Gmail open pixels" : "Local tracking URL - clicks work, Gmail open pixels need public URL",
  };
};

export const getDashboard = async (req, res, next) => {
  try {
    const [campaigns, notifications] = await Promise.all([
      Campaign.find(campaignScope(req)).sort({ createdAt: -1 }).populate("createdBy", "name email role").lean(),
      Notification.find(notificationScope(req)).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
      ...buildDashboard(campaigns, notifications),
      trackingConfig: trackingConfig(req),
      userPlan: req.user?.plan || { name: "Free", sendLimit: 5000, contactLimit: 1000, billingStatus: "Trial" },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find(analyticsCampaignScope(req))
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role")
      .lean();
    const campaignIds = campaigns.map((campaign) => campaign._id);
    const [contacts, notifications, recipients] = await Promise.all([
      Contact.find(contactScope(req)).sort({ createdAt: -1 }).lean(),
      Notification.find(notificationScope(req)).sort({ createdAt: -1 }).lean(),
      CampaignRecipient.find({ campaign: { $in: campaignIds } }).sort({ updatedAt: -1 }).limit(500).lean(),
    ]);

    res.json({
      ...buildAnalytics(campaigns, contacts, notifications, recipients),
      trackingConfig: trackingConfig(req),
      activeRange: req.query.range || "All Time",
    });
  } catch (error) {
    next(error);
  }
};
