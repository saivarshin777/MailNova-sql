import Campaign from "../models/Campaign.js";
import CampaignRecipient from "../models/CampaignRecipient.js";
import Contact from "../models/Contact.js";
import Notification from "../models/Notification.js";

const canSeeGlobalWorkspace = (req) => ["Admin", "Manager"].includes(req.user?.role);

const leadContactFilter = (req) =>
  canSeeGlobalWorkspace(req)
    ? {}
    : req.user?.role === "Lead"
    ? { email: req.user.email, status: "Lead" }
    : { addedBy: req.user?._id };

const leadCampaignFilter = (req) => {
  if (canSeeGlobalWorkspace(req)) return {};
  if (req.user?.role === "Lead") return { recipients: req.user.email };
  return { createdBy: req.user?._id };
};

const leadRecipientFilter = (req, campaignIds) => {
  if (canSeeGlobalWorkspace(req)) return { campaign: { $in: campaignIds } };
  if (req.user?.role === "Lead") return { email: req.user.email, campaign: { $in: campaignIds } };
  return { campaign: { $in: campaignIds } };
};

const leadNotificationFilter = (req) => {
  if (canSeeGlobalWorkspace(req)) return {};
  return { recipient: req.user?._id };
};

const nextStepForStatus = (status = "Lead") => {
  if (status === "Customer") return "Expansion check-in";
  if (status === "Prospect") return "Demo follow-up";
  if (status === "Inactive") return "Re-engagement email";
  return "Intro call";
};

const priorityForStatus = (status = "Lead") => (["Prospect", "Customer"].includes(status) ? "High" : "Medium");

const dueTime = (index) => {
  const hours = [10, 12, 14, 16, 17];
  return `${hours[index % hours.length]}:30`;
};

export const getLeadOverview = async (req, res, next) => {
  try {
    const contacts = await Contact.find(leadContactFilter(req)).sort({ updatedAt: -1 }).limit(30).lean();
    const campaigns = await Campaign.find(leadCampaignFilter(req)).sort({ createdAt: -1 }).limit(12).lean();
    const campaignIds = campaigns.map((campaign) => campaign._id);
    const [recipientEvents, notifications] = await Promise.all([
      CampaignRecipient.find(leadRecipientFilter(req, campaignIds)).sort({ lastEventAt: -1, updatedAt: -1 }).limit(20).lean(),
      Notification.find(leadNotificationFilter(req)).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const assignedLeads = contacts.slice(0, 12).map((contact) => ({
      id: contact._id,
      name: contact.name,
      company: contact.city || "MailNova Contact",
      email: contact.email,
      phone: contact.phone || "",
      stage: contact.status || "Lead",
      nextStep: nextStepForStatus(contact.status),
    }));

    const followUps = assignedLeads.slice(0, 8).map((lead, index) => ({
      id: `${lead.id}-follow-up`,
      task: `${lead.nextStep} with ${lead.name}`,
      due: dueTime(index),
      priority: priorityForStatus(lead.stage),
      leadName: lead.name,
      email: lead.email,
    }));

    const campaignById = new Map(campaigns.map((campaign) => [String(campaign._id), campaign]));
    const campaignSignals = recipientEvents.slice(0, 10).map((event) => {
      const campaign = campaignById.get(String(event.campaign));
      return {
        id: event._id,
        campaign: campaign?.name || "Campaign",
        opened: event.email,
        signal: event.clickedAt
          ? `Clicked tracked link${event.lastClickedUrl ? `: ${event.lastClickedUrl}` : ""}`
          : event.openedAt
          ? `Opened ${event.opens || 1} time${Number(event.opens || 1) === 1 ? "" : "s"}`
          : `Delivery status: ${event.status}`,
        lastEventAt: event.lastEventAt || event.updatedAt,
      };
    });

    const qualified = assignedLeads.filter((lead) => ["Prospect", "Customer"].includes(lead.stage)).length;

    res.json({
      summary: {
        assigned: assignedLeads.length,
        qualified,
        followUpsToday: followUps.length,
        hotSignals: campaignSignals.length,
        responseRate: assignedLeads.length ? Math.round((qualified / assignedLeads.length) * 100) : 0,
      },
      assignedLeads,
      followUps,
      campaignSignals,
      notifications: notifications.map((notification) => ({
        id: notification._id,
        title: notification.title,
        desc: notification.desc,
        read: Boolean(notification.read),
        time: notification.time || new Date(notification.createdAt).toLocaleString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};
