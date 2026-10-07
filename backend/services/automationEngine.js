import Automation from "../models/Automation.js";
import AutomationTask from "../models/AutomationTask.js";
import Contact from "../models/Contact.js";
import ContactList from "../models/ContactList.js";
import Notification from "../models/Notification.js";
import CampaignRecipient from "../models/CampaignRecipient.js";
import { sendCampaignEmail } from "./mailService.js";
import { toClientNotification } from "./dashboardService.js";
import { sendRealTimeNotification } from "./socketService.js";

// "Wait 24 hours" / "Wait 48 hours" -> real delay in ms. Anything else
// (Immediately, Status is Lead, High engagement) fires right away - those
// aren't time-based conditions.
const parseWaitMs = (condition = "") => {
  const match = String(condition).match(/wait\s+(\d+)\s*hour/i);
  return match ? Number(match[1]) * 60 * 60 * 1000 : 0;
};

const buildWelcomeEmail = (contact, workflowName) => ({
  subject: `Welcome, ${contact.name || "there"}!`,
  htmlContent: `<p>Hi ${contact.name || "there"},</p><p>Thanks for connecting with us - we're glad to have you.</p><p style="color:#94a3b8;font-size:12px;">Sent automatically by the "${workflowName}" workflow.</p>`,
  textContent: `Hi ${contact.name || "there"},\n\nThanks for connecting with us - we're glad to have you.\n\n(Sent automatically by the "${workflowName}" workflow.)`,
});

const buildFollowUpEmail = (contact, workflowName) => ({
  subject: `Following up, ${contact.name || "there"}`,
  htmlContent: `<p>Hi ${contact.name || "there"},</p><p>Just checking in - let us know if you have any questions.</p><p style="color:#94a3b8;font-size:12px;">Sent automatically by the "${workflowName}" workflow.</p>`,
  textContent: `Hi ${contact.name || "there"},\n\nJust checking in - let us know if you have any questions.\n\n(Sent automatically by the "${workflowName}" workflow.)`,
});

// Executes a single workflow's action against a single contact. Never
// throws - a failed action (e.g. SMTP not configured) is logged and
// reported back, but must never break whatever triggered it.
const runAction = async (workflow, contact, actorId) => {
  try {
    switch (workflow.action) {
      case "Send welcome email": {
        if (!contact.email) return { ok: false, reason: "Contact has no email" };
        const { subject, htmlContent, textContent } = buildWelcomeEmail(contact, workflow.name);
        await sendCampaignEmail({ recipients: [contact.email], subject, htmlContent, textContent });
        return { ok: true, reason: `Welcome email sent to ${contact.email}` };
      }
      case "Send follow-up campaign": {
        if (!contact.email) return { ok: false, reason: "Contact has no email" };
        const { subject, htmlContent, textContent } = buildFollowUpEmail(contact, workflow.name);
        await sendCampaignEmail({ recipients: [contact.email], subject, htmlContent, textContent });
        return { ok: true, reason: `Follow-up email sent to ${contact.email}` };
      }
      case "Move to interested folder": {
        const folderName = workflow.folder && workflow.folder !== "All Contacts" ? workflow.folder : "Interested";
        let list = await ContactList.findOne({ name: folderName });
        if (!list) {
          list = await ContactList.create({ name: folderName, createdBy: actorId });
        }
        await ContactList.updateOne({ _id: list._id }, { $addToSet: { contacts: contact._id } });
        return { ok: true, reason: `Moved ${contact.name || contact.email} into "${folderName}"` };
      }
      case "Notify manager": {
        const notif = await Notification.create({
          type: "system",
          title: "Automation triggered",
          desc: `"${workflow.name}" ran for ${contact.name || contact.email} (${workflow.trigger} \u2192 ${workflow.action}).`,
          recipient: actorId || null,
          read: false,
          isRead: false,
        });
        sendRealTimeNotification(actorId, toClientNotification(notif));
        return { ok: true, reason: `Notification sent for ${contact.name || contact.email}` };
      }
      default:
        return { ok: false, reason: "Unknown action" };
    }
  } catch (error) {
    console.error(`Automation "${workflow.name}" action failed:`, error.message);
    return { ok: false, reason: error.message };
  }
};

const recordRun = async (workflow, contact, result) => {
  workflow.runs += 1;
  workflow.lastTriggeredAt = new Date();
  workflow.lastTriggeredContact = { name: contact.name || "", email: contact.email || "" };
  workflow.lastResult = result.ok ? result.reason : `Failed: ${result.reason}`;
  if (result.ok && !workflow.firedForContacts?.some((id) => String(id) === String(contact._id))) {
    workflow.firedForContacts.push(contact._id);
  }
  await workflow.save();
};

// Either fires a workflow's action immediately, or - if its condition is a
// real wait (e.g. "Wait 24 hours") - schedules a task for later instead of
// lying about respecting the condition.
const scheduleOrFire = async (workflow, contact, actorId) => {
  if (workflow.firedForContacts?.some((id) => String(id) === String(contact._id))) {
    return; // already fired (or already scheduled+fired) for this contact
  }

  const waitMs = parseWaitMs(workflow.condition);

  if (waitMs > 0) {
    try {
      await AutomationTask.create({
        automation: workflow._id,
        contact: contact._id,
        dueAt: new Date(Date.now() + waitMs),
        status: "pending",
      });
    } catch (error) {
      // Duplicate task (unique index on automation+contact) just means it's
      // already queued - not an error worth surfacing.
      if (!String(error.message).includes("duplicate key")) {
        console.error(`Failed to schedule automation task for "${workflow.name}":`, error.message);
      }
    }
    return;
  }

  const result = await runAction(workflow, contact, actorId);
  await recordRun(workflow, contact, result);
};

// --- Trigger entry points -------------------------------------------------

// Fired synchronously inside the request that creates a contact (manual add
// or bulk import). Always runs in the correct tenant context because it's
// called from within an authenticated request.
export const runNewContactAutomations = async (contact, actorId) => {
  try {
    const workflows = await Automation.find({ trigger: "New contact added", active: true });
    for (const workflow of workflows) {
      await scheduleOrFire(workflow, contact, actorId);
    }
  } catch (error) {
    console.error("runNewContactAutomations failed:", error.message);
  }
};

// Fired from the click-tracking endpoint, which already resolves the
// correct tenant context via the userId in the tracking URL before calling
// this (see trackingController.js -> runInTenantContext).
export const runClickedLinkAutomations = async (recipientEmail, actorId) => {
  try {
    if (!recipientEmail) return;
    const workflows = await Automation.find({ trigger: "Clicked link", active: true });
    if (!workflows.length) return;

    const contact = await Contact.findOne({ email: String(recipientEmail).toLowerCase().trim() });
    if (!contact) return; // click came from someone not saved as a contact

    for (const workflow of workflows) {
      await scheduleOrFire(workflow, contact, actorId);
    }
  } catch (error) {
    console.error("runClickedLinkAutomations failed:", error.message);
  }
};

// --- Background sweeps (called by the scheduler for every tenant) --------

// Processes any AutomationTask whose wait window has elapsed - this is what
// actually makes "Wait 24 hours" / "Wait 48 hours" real.
export const processDueAutomationTasks = async (actorId) => {
  const dueTasks = await AutomationTask.find({ status: "pending", dueAt: { $lte: new Date() } }).limit(200);

  for (const task of dueTasks) {
    try {
      const [workflow, contact] = await Promise.all([
        Automation.findById(task.automation),
        Contact.findById(task.contact),
      ]);

      if (!workflow || !contact || !workflow.active) {
        task.status = "failed";
        task.result = !workflow ? "Workflow deleted" : !contact ? "Contact deleted" : "Workflow paused";
        await task.save();
        continue;
      }

      const result = await runAction(workflow, contact, actorId);
      await recordRun(workflow, contact, result);
      task.status = result.ok ? "completed" : "failed";
      task.result = result.reason;
      await task.save();
    } catch (error) {
      console.error("processDueAutomationTasks: failed processing a task:", error.message);
      task.status = "failed";
      task.result = error.message;
      await task.save().catch(() => {});
    }
  }
};

// "Contact becomes inactive": any active workflow with this trigger fires
// for contacts currently marked Inactive that haven't already been fired
// for.
export const sweepInactiveContacts = async (actorId) => {
  const workflows = await Automation.find({ trigger: "Contact becomes inactive", active: true });
  if (!workflows.length) return;

  const inactiveContacts = await Contact.find({ status: "Inactive" }).limit(500);
  for (const workflow of workflows) {
    for (const contact of inactiveContacts) {
      await scheduleOrFire(workflow, contact, actorId);
    }
  }
};

// "Campaign not opened": any active workflow with this trigger fires for
// recipients of a sent campaign who still haven't opened it once the
// workflow's wait window (default 48h) has elapsed.
export const sweepUnopenedCampaigns = async (actorId) => {
  const workflows = await Automation.find({ trigger: "Campaign not opened", active: true });
  if (!workflows.length) return;

  for (const workflow of workflows) {
    const waitMs = parseWaitMs(workflow.condition) || 48 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - waitMs);

    const staleRecipients = await CampaignRecipient.find({
      status: "sent",
      sentAt: { $lte: cutoff },
      openedAt: null,
    }).limit(500);

    for (const recipient of staleRecipients) {
      const contact = await Contact.findOne({ email: recipient.email });
      if (!contact) continue;
      await scheduleOrFire(workflow, contact, actorId);
    }
  }
};
