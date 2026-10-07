import ActivityLog from "../models/ActivityLog.js";
import Campaign from "../models/Campaign.js";
import Contact from "../models/Contact.js";
import ContactList from "../models/ContactList.js";
import Notification from "../models/Notification.js";
import Template from "../models/Template.js";
import User from "../models/User.js";
import { recordActivity } from "./activityController.js";
import { verifySmtpConnection } from "../services/mailService.js";
import { PLAN_DEFINITIONS } from "../config/plans.js";

const roles = ["Admin", "User"];
const statuses = ["Active", "Suspended"];
const ownerEmail = (process.env.OWNER_EMAIL || process.env.SEED_ADMIN_EMAIL || process.env.EMAIL_USER || "owner@mailnova.local")
  .toLowerCase()
  .trim();
const ownerName = process.env.OWNER_NAME || "Admin";

// Plan limits now come from config/plans.js - this used to be a second,
// slightly different copy of the numbers in authRoutes.js (100000 sends
// here vs 50000 there for Pro, for example). Single source of truth now.
const planDefinitions = PLAN_DEFINITIONS;

const countBy = (field) =>
  User.aggregate([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

const isOwnerAccount = (user) => user?.email?.toLowerCase?.().trim() === ownerEmail;

const publicUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: isOwnerAccount(user) ? ownerName : user.name,
  email: user.email,
  role: isOwnerAccount(user) ? "Admin" : user.role,
  status: isOwnerAccount(user) ? "Active" : user.status,
  plan: user.plan,
  isOwner: isOwnerAccount(user),
  phone: user.phone || "",
  senderName: user.senderName || "MailNova Workspace",
  replyTo: user.replyTo || user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

import { runGlobally } from "../config/tenantDb.js";

export const getAdminOverview = async (_req, res, next) => {
  try {
    const [
      totalUsers,
      roleBreakdown,
      statusBreakdown,
      logs,
      planBreakdown,
    ] = await Promise.all([
      User.countDocuments(),
      countBy("role"),
      countBy("status"),
      ActivityLog.find().sort({ createdAt: -1 }).limit(8).populate("actor", "name email role").lean(),
      User.aggregate([{ $group: { _id: "$plan.name", count: { $sum: 1 } } }]),
    ]);

    // Aggregate tenant counts from all user databases
    const tenantSummaries = await runGlobally(async () => {
      const [
        campaignCount,
        failedCampaignCount,
        runningCampaignCount,
        contactCount,
        listCount,
        templateCount,
        unreadNotificationCount
      ] = await Promise.all([
        Campaign.countDocuments(),
        Campaign.countDocuments({ $or: [{ status: "Failed" }, { sendStatus: "failed" }] }),
        Campaign.countDocuments({ status: { $in: ["Active", "Running"] } }),
        Contact.countDocuments(),
        ContactList.countDocuments(),
        Template.countDocuments(),
        Notification.countDocuments({ read: false }),
      ]);
      return {
        campaignCount,
        failedCampaignCount,
        runningCampaignCount,
        contactCount,
        listCount,
        templateCount,
        unreadNotificationCount
      };
    });

    let campaigns = 0;
    let failedCampaigns = 0;
    let runningCampaigns = 0;
    let contacts = 0;
    let lists = 0;
    let templates = 0;
    let unreadNotifications = 0;

    for (const item of tenantSummaries) {
      campaigns += item.data.campaignCount;
      failedCampaigns += item.data.failedCampaignCount;
      runningCampaigns += item.data.runningCampaignCount;
      contacts += item.data.contactCount;
      lists += item.data.listCount;
      templates += item.data.templateCount;
      unreadNotifications += item.data.unreadNotificationCount;
    }
    const planCounts = new Map(planBreakdown.map((item) => [item._id || "Free", item.count]));
    const plans = Object.entries(planDefinitions).map(([name, definition]) => ({
      name,
      users: planCounts.get(name) || 0,
      sendLimit: `${definition.sendLimit.toLocaleString()} emails/month`,
      contactLimit: `${definition.contactLimit.toLocaleString()} contacts`,
      billingStatus: definition.billingStatus,
    }));

    const smtpCheck = await verifySmtpConnection();

    res.json({
      users: { total: totalUsers, roles: roleBreakdown, statuses: statusBreakdown },
      plans,
      monitoring: {
        campaigns,
        failedCampaigns,
        runningCampaigns,
        contacts,
        lists,
        templates,
        unreadNotifications,
        apiStatus: "Operational",
        smtpStatus: smtpCheck.status === "connected"
          ? "Healthy"
          : smtpCheck.status === "error"
          ? `Failed: ${smtpCheck.error}`
          : "Mock email mode",
        queueStatus: process.env.EMAIL_QUEUE_PROVIDER || "inline",
      },
      logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (_req, res, next) => {
  try {
    const users = await User.find()
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ isOwner: -1, createdAt: -1 })
      .lean();
    res.json({
      users: users
        .map(publicUser)
        .sort((a, b) => Number(b.isOwner) - Number(a.isOwner) || new Date(b.createdAt) - new Date(a.createdAt)),
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!roles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (String(user._id) === String(req.user?._id) && role !== "Admin") {
      return res.status(400).json({ success: false, message: "You cannot demote your own admin account" });
    }

    const actorIsOwner = isOwnerAccount(req.user);
    const targetIsOwner = isOwnerAccount(user);

    if (targetIsOwner) {
      return res.status(403).json({
        success: false,
        message: "Varshini P is the protected owner admin and cannot be demoted or reassigned.",
      });
    }

    if ((role === "Admin" || user.role === "Admin") && !actorIsOwner) {
      return res.status(403).json({
        success: false,
        message: "Only Varshini P can grant or retrieve admin rights.",
      });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await recordActivity({
      action: "admin.user_role_updated",
      entityType: "User",
      entityId: user._id,
      actor: req.user?._id,
      message: `${user.email} role changed from ${previousRole} to ${role}`,
      metadata: { previousRole, role },
    });

    res.json({ success: true, user: publicUser(user.toObject()) });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!statuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (String(user._id) === String(req.user?._id) && status === "Suspended") {
      return res.status(400).json({ success: false, message: "You cannot suspend your own admin account" });
    }

    const actorIsOwner = isOwnerAccount(req.user);
    const targetIsOwner = isOwnerAccount(user);

    if (targetIsOwner) {
      return res.status(403).json({
        success: false,
        message: "Varshini P is the protected owner admin and cannot be suspended.",
      });
    }

    if (user.role === "Admin" && !actorIsOwner) {
      return res.status(403).json({
        success: false,
        message: "Only Varshini P can suspend or reactivate admin accounts.",
      });
    }

    const previousStatus = user.status;
    user.status = status;
    await user.save();

    await recordActivity({
      action: "admin.user_status_updated",
      entityType: "User",
      entityId: user._id,
      actor: req.user?._id,
      message: `${user.email} status changed from ${previousStatus} to ${status}`,
      metadata: { previousStatus, status },
    });

    res.json({ success: true, user: publicUser(user.toObject()) });
  } catch (error) {
    next(error);
  }
};

export const updateAdminUserPlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!planDefinitions[plan]) {
      return res.status(400).json({ success: false, message: "Invalid plan" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (isOwnerAccount(user)) {
      return res.status(403).json({
        success: false,
        message: "Varshini P is the protected owner admin and cannot be modified by plan controls.",
      });
    }

    const previousPlan = user.plan?.name || "Free";
    user.plan = { name: plan, ...planDefinitions[plan] };
    await user.save();

    await recordActivity({
      action: "admin.user_plan_updated",
      entityType: "User",
      entityId: user._id,
      actor: req.user?._id,
      message: `${user.email} plan changed from ${previousPlan} to ${plan}`,
      metadata: { previousPlan, plan },
    });

    res.json({
      success: true,
      user: publicUser(user.toObject()),
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemLogs = async (_req, res, next) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(100).populate("actor", "name email role").lean();
    res.json({ logs });
  } catch (error) {
    next(error);
  }
};
