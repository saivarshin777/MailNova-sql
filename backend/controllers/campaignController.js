import Campaign from "../models/Campaign.js";
import crypto from "crypto";
import CampaignRecipient from "../models/CampaignRecipient.js";
import ContactList from "../models/ContactList.js";
import EmailLog from "../models/EmailLog.js";
import Notification from "../models/Notification.js";
import Template from "../models/Template.js";
import { recordActivity } from "./activityController.js";
import {
  buildDashboard,
  createCampaignMetrics,
  toClientCampaign,
} from "../services/dashboardService.js";
import { buildProfessionalEmail } from "../services/emailTemplateService.js";
import {
  getDefaultRecipients,
  normalizeRecipients,
} from "../services/mailService.js";
import { enqueueCampaignEmail } from "../services/emailQueueService.js";
import { getTrackingBaseUrl, prepareTrackedEmail } from "../services/emailTrackingService.js";
import { clearSeedDataForTenant } from "../services/seedCleanupService.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value);
const canSeeGlobalWorkspace = (req) => ["Admin", "Manager"].includes(req.user?.role);
// See dashboardController.js for why this exists - notifications were
// previously fetched unfiltered here too, leaking every user's
// notification content into this response.
const notificationScope = (req) => (canSeeGlobalWorkspace(req) ? {} : { recipient: req.user?._id });

const scopeCampaignFilter = (req, filter = {}) =>
  canSeeGlobalWorkspace(req) ? filter : { ...filter, createdBy: req.user?._id };
const scopeSharedReadFilter = (req, filter = {}) =>
  canSeeGlobalWorkspace(req)
    ? filter
    : {
        ...filter,
        $or: [{ createdBy: req.user?._id }, { createdBy: null }, { createdBy: { $exists: false } }],
      };

const applyTemplateVariables = (value = "", campaign) =>
  String(value)
    .replaceAll("{{campaignName}}", campaign.name)
    .replaceAll("{{subject}}", campaign.subject)
    .replaceAll("{{content}}", campaign.content || "")
    .replaceAll("{{recipientCount}}", String(campaign.recipients.length));

const createRecipientToken = () => crypto.randomBytes(24).toString("hex");

const createRecipientRecords = async (campaignId, recipients) => {
  await CampaignRecipient.deleteMany({ campaign: campaignId });
  return CampaignRecipient.insertMany(
    recipients.map((email) => ({
      campaign: campaignId,
      email,
      token: createRecipientToken(),
      status: "pending",
    }))
  );
};

const finalizeTemplateHtml = ({ htmlContent, background, campaign }) => {
  const body = applyTemplateVariables(htmlContent || "<p>{{content}}</p>", campaign);
  const hasFullDocument = /<html[\s>]/i.test(body) || /<body[\s>]/i.test(body);

  if (hasFullDocument) {
    return body;
  }

  return `<!doctype html>
<html>
  <body style="margin:0;background:${background || "#f8fafc"};font-family:Arial,sans-serif;color:#0f172a;">
    ${body}
    <p style="text-align:center;color:#64748b;font-size:12px;margin:18px 0 28px;">
      You are receiving this email because you are included in a Mail Nova campaign.
    </p>
  </body>
</html>`;
};

const resolveCampaignContent = async (req, campaignDraft) => {
  if (!req.body.templateId) {
    return buildProfessionalEmail({
      campaignName: campaignDraft.name,
      subject: campaignDraft.subject,
      content: campaignDraft.content,
    });
  }

  const template = await Template.findOne(scopeSharedReadFilter(req, { _id: req.body.templateId })).lean();
  if (!template) {
    const error = new Error("Selected template was not found.");
    error.status = 404;
    throw error;
  }

  return {
    htmlContent: finalizeTemplateHtml({
      htmlContent: req.body.htmlContent || template.htmlContent,
      background: req.body.templateBackground || template.background,
      campaign: campaignDraft,
    }),
    textContent: applyTemplateVariables(
      req.body.textContent || template.textContent || campaignDraft.content,
      campaignDraft
    ),
    template,
  };
};

const resolveCampaignRecipients = async (req, { allowEmpty = false } = {}) => {
  const manualRecipients = normalizeRecipients(req.body.recipients);

  if (manualRecipients.length) {
    return {
      recipients: manualRecipients,
      contactList: null,
    };
  }

  if (req.body.contactListId) {
    const list = await ContactList.findOne(scopeSharedReadFilter(req, { _id: req.body.contactListId }))
      .populate("contacts", "email")
      .lean();

    if (!list) {
      const error = new Error("Selected contact folder was not found.");
      error.status = 404;
      throw error;
    }

    const listRecipients = normalizeRecipients(
      (list.contacts || []).map((contact) => contact.email).filter(Boolean)
    );

    if (listRecipients.length === 0) {
      const error = new Error("Selected contact folder has no contacts with email addresses.");
      error.status = 400;
      throw error;
    }

    return {
      recipients: listRecipients,
      contactList: {
        id: list._id,
        name: list.name,
      },
    };
  }

  const defaultRecipients =
    process.env.USE_CAMPAIGN_DEFAULT_RECIPIENTS === "true" ? getDefaultRecipients() : [];

  if (defaultRecipients.length) {
    return {
      recipients: defaultRecipients,
      contactList: null,
    };
  }

  if (allowEmpty) {
    return {
      recipients: [],
      contactList: null,
    };
  }

  const error = new Error("Choose a contact folder or provide recipients before sending.");
  error.status = 400;
  throw error;
};

export const getCampaigns = async (req, res, next) => {
  try {
    const query = req.query.q?.trim();
    const filter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { campaignName: { $regex: query, $options: "i" } },
            { campaign_name: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } },
            { campaignTitle: { $regex: query, $options: "i" } },
            { subject: { $regex: query, $options: "i" } },
            { emailSubject: { $regex: query, $options: "i" } },
            { mailSubject: { $regex: query, $options: "i" } },
            { status: { $regex: query, $options: "i" } },
            { sendStatus: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const campaigns = await Campaign.find(scopeCampaignFilter(req, filter))
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email role")
      .lean();
    res.json(campaigns.map(toClientCampaign));
  } catch (error) {
    next(error);
  }
};

export const getCampaignRecipients = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne(scopeCampaignFilter(req, { _id: req.params.campaignId })).lean();
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    const recipients = await CampaignRecipient.find({ campaign: campaign._id }).sort({ updatedAt: -1 }).lean();

    res.json({
      campaign: toClientCampaign(campaign),
      recipients: recipients.map((recipient) => ({
        id: recipient._id,
        email: recipient.email,
        status: recipient.status,
        read: Boolean(recipient.openedAt),
        clicked: Boolean(recipient.clickedAt),
        opens: recipient.opens,
        clicks: recipient.clicks,
        openedAt: recipient.openedAt,
        clickedAt: recipient.clickedAt,
        bouncedAt: recipient.bouncedAt,
        error: recipient.error,
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne(scopeCampaignFilter(req, { _id: req.params.campaignId }));
    if (!campaign) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }
    if (campaign.status !== "Draft") {
      return res.status(400).json({
        success: false,
        message: "Only draft campaigns can be deleted. Sent or in-progress campaigns are kept for your records.",
      });
    }

    await CampaignRecipient.deleteMany({ campaign: campaign._id });
    await campaign.deleteOne();

    await recordActivity({
      action: "campaign.deleted",
      entityType: "Campaign",
      entityId: campaign._id,
      actor: req.user?._id,
      message: `${req.user?.email || "A user"} deleted draft campaign "${campaign.name}"`,
    });

    const [campaigns, notifications] = await Promise.all([
      Campaign.find(scopeCampaignFilter(req)).sort({ createdAt: -1 }).lean(),
      Notification.find(notificationScope(req)).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
      success: true,
      message: "Draft deleted",
      dashboard: buildDashboard(campaigns, notifications),
    });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req, res, next) => {
  try {
    const status = req.body.status === "Draft" ? "Draft" : "Running";
    const { recipients: finalRecipients, contactList } = await resolveCampaignRecipients(req, {
      allowEmpty: status === "Draft",
    });
    if (status !== "Draft" && req.user?.role !== "Admin") {
      const monthlyStart = new Date();
      monthlyStart.setDate(1);
      monthlyStart.setHours(0, 0, 0, 0);
      const monthlyUsage = await Campaign.aggregate([
        {
          $match: {
            createdBy: req.user?._id,
            createdAt: { $gte: monthlyStart },
            sendStatus: { $ne: "draft" },
          },
        },
        { $group: { _id: null, total: { $sum: "$emailsSent" } } },
      ]);
      const usedThisMonth = monthlyUsage[0]?.total || 0;
      const sendLimit = req.user?.plan?.sendLimit || 5000;

      if (usedThisMonth + finalRecipients.length > sendLimit) {
        return res.status(403).json({
          success: false,
          message: `Plan send limit exceeded. Used ${usedThisMonth}/${sendLimit} emails this month.`,
        });
      }
    }
    const campaignDraft = {
      name: req.body.name?.trim() || "Untitled Campaign",
      subject: req.body.subject?.trim() || "Campaign update",
      content: req.body.content?.trim() || "",
      recipients: finalRecipients,
    };
    const metrics =
      status === "Draft"
        ? createCampaignMetrics({})
        : createCampaignMetrics({
            ...req.body,
            emailsSent: finalRecipients.length,
            delivered: 0,
          });
    const { htmlContent, textContent, template } = await resolveCampaignContent(req, campaignDraft);

    const scheduledFor = status === "Draft" ? null : (req.body.scheduledFor ? new Date(req.body.scheduledFor) : null);
    const trackingBaseUrl = getTrackingBaseUrl(req);

    const campaign = await Campaign.create({
      name: campaignDraft.name,
      subject: campaignDraft.subject,
      content: campaignDraft.content,
      recipients: finalRecipients,
      htmlContent,
      textContent,
      template: template?._id || null,
      templateName: template?.name || "",
      contactList: contactList?.id || null,
      contactListName: contactList?.name || "",
      status: status === "Draft" ? "Draft" : (scheduledFor ? "Scheduled" : "Running"),
      sendStatus: status === "Draft" ? "draft" : "pending",
      scheduledFor,
      trackingBaseUrl,
      createdBy: req.user?._id,
      ...metrics,
    });

    await Notification.create({
      type: "campaign",
      recipient: req.user?._id,
      title:
        status === "Draft"
          ? "Campaign draft saved"
          : scheduledFor
          ? "Campaign scheduled"
          : "Campaign queued for delivery",
      desc: `${campaign.name} ${
        status === "Draft"
          ? "was saved as a draft"
          : scheduledFor
          ? `is scheduled to send on ${scheduledFor.toLocaleString()}`
          : `has been queued for delivery to ${formatNumber(finalRecipients.length)} recipient${finalRecipients.length === 1 ? "" : "s"}`
      }.`,
      time: "Just now",
      read: false,
    });

    await recordActivity({
      action: status === "Draft" ? "campaign.draft_saved" : (scheduledFor ? "campaign.scheduled" : "campaign.queued"),
      entityType: "Campaign",
      entityId: campaign._id,
      actor: req.user?._id,
      message: `${campaign.name} ${status === "Draft" ? "saved as draft" : (scheduledFor ? "scheduled for later" : "queued for sending")}`,
      metadata: {
        recipients: finalRecipients.length,
        templateName: campaign.templateName,
        contactListName: campaign.contactListName,
        sendStatus: campaign.sendStatus,
      },
    });

    // A real campaign now exists for this workspace - drop the demo/seed
    // campaigns, contacts, folders, and notifications so the dashboard
    // shows only real, live data going forward.
    await clearSeedDataForTenant();

    const [campaigns, notifications] = await Promise.all([
      Campaign.find(scopeCampaignFilter(req)).sort({ createdAt: -1 }).lean(),
      Notification.find(notificationScope(req)).sort({ createdAt: -1 }).lean(),
    ]);

    res.status(201).json({
      campaign: toClientCampaign(campaign),
      dashboard: buildDashboard(campaigns, notifications),
    });
  } catch (error) {
    next(error);
  }
};
