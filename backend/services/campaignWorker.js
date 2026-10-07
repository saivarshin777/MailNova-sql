import Campaign from "../models/Campaign.js";
import CampaignRecipient from "../models/CampaignRecipient.js";
import EmailLog from "../models/EmailLog.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { enqueueCampaignEmail } from "./emailQueueService.js";
import { prepareTrackedEmail } from "./emailTrackingService.js";
import { tenantStorage } from "../config/tenantDb.js";
import crypto from "crypto";

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

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value);

export const processCampaign = async (campaign) => {
  try {
    campaign.sendStatus = "sending";
    campaign.status = "Running";
    await campaign.save();

    console.log(`[Worker] Started processing campaign: ${campaign.name} (${campaign._id})`);

    const trackingBaseUrl = campaign.trackingBaseUrl || process.env.TRACKING_BASE_URL || "http://localhost:5000";
    const finalRecipients = campaign.recipients;
    const senderUser = campaign.createdBy ? await User.findById(campaign.createdBy).lean() : null;

    let recipientRecords = await CampaignRecipient.find({ campaign: campaign._id });
    if (recipientRecords.length === 0) {
      recipientRecords = await createRecipientRecords(campaign._id, finalRecipients);
    }

    const acceptedRecipients = [];
    const failedRecipients = [];
    const providerMessageIds = [];

    for (const recipient of recipientRecords) {
      if (recipient.status === "sent") {
        acceptedRecipients.push(recipient.email);
        if (recipient.providerMessageId) providerMessageIds.push(recipient.providerMessageId);
        continue;
      }

      try {
        const trackedEmail = prepareTrackedEmail({
          htmlContent: campaign.htmlContent,
          campaignId: campaign._id,
          baseUrl: trackingBaseUrl,
          recipientToken: recipient.token,
          userId: campaign.createdBy ? campaign.createdBy.toString() : "",
        });

        const emailResult = await enqueueCampaignEmail({
          recipients: [recipient.email],
          subject: campaign.subject,
          htmlContent: trackedEmail.htmlContent,
          textContent: campaign.textContent,
          attachments: trackedEmail.attachments,
          senderName: senderUser?.senderName || senderUser?.name || "",
          replyTo: senderUser?.replyTo || senderUser?.email || "",
        });

        acceptedRecipients.push(recipient.email);
        if (emailResult.messageId) providerMessageIds.push(emailResult.messageId);
        
        recipient.status = "sent";
        recipient.sentAt = new Date();
        recipient.deliveredAt = new Date();
        recipient.providerMessageId = emailResult.messageId || "";
        await recipient.save();
      } catch (recipientError) {
        failedRecipients.push(recipient.email);
        recipient.status = "failed";
        recipient.error = recipientError.message;
        await recipient.save();
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (!acceptedRecipients.length) {
      throw new Error(failedRecipients.length ? "All recipient sends failed." : "No campaign emails were accepted.");
    }

    campaign.sendStatus = "sent";
    campaign.status = "Completed";
    campaign.sendError = failedRecipients.length ? `${failedRecipients.length} recipient sends failed.` : "";
    campaign.emailsSent = finalRecipients.length;
    campaign.delivered = acceptedRecipients.length;
    campaign.opened = 0;
    campaign.clicked = 0;
    await campaign.save();

    await EmailLog.create({
      campaign: campaign._id,
      recipients: acceptedRecipients,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      textContent: campaign.textContent,
      status: "sent",
      providerMessageId: providerMessageIds.join(","),
      error: failedRecipients.length ? `Failed recipients: ${failedRecipients.join(", ")}` : "",
    });

    await Notification.create({
      type: "campaign",
      recipient: campaign.createdBy,
      title: "Campaign sent successfully",
      desc: `${campaign.name} was sent to ${formatNumber(finalRecipients.length)} recipient${finalRecipients.length === 1 ? "" : "s"}.`,
      time: "Just now",
      read: false,
    });

    console.log(`[Worker] Completed processing campaign: ${campaign.name}`);
  } catch (error) {
    console.error(`[Worker] Error processing campaign ${campaign._id}:`, error.message);

    campaign.sendStatus = "failed";
    campaign.status = "Failed";
    campaign.sendError = error.message;
    campaign.emailsSent = 0;
    campaign.delivered = 0;
    campaign.opened = 0;
    campaign.clicked = 0;
    await campaign.save();

    await EmailLog.create({
      campaign: campaign._id,
      recipients: campaign.recipients,
      subject: campaign.subject,
      htmlContent: campaign.htmlContent,
      textContent: campaign.textContent,
      status: "failed",
      error: error.message,
    });

    await Notification.create({
      type: "campaign",
      recipient: campaign.createdBy,
      title: "Campaign email failed",
      desc: `${campaign.name} could not be sent: ${error.message}`,
      time: "Just now",
      read: false,
    });
  }
};

export const startCampaignWorker = () => {
  console.log("[Worker] Background Campaign queue worker started.");
  
  setInterval(async () => {
    try {
      const users = await User.find().lean();
      
      for (const user of users) {
        await tenantStorage.run({ tenantId: user._id.toString() }, async () => {
          const pendingCampaigns = await Campaign.find({
            sendStatus: "pending",
            $or: [
              { scheduledFor: null },
              { scheduledFor: { $lte: new Date() } }
            ]
          });

          for (const campaign of pendingCampaigns) {
            await processCampaign(campaign);
          }
        });
      }
    } catch (error) {
      console.error("[Worker] Loop error:", error.message);
    }
  }, 10000);
};
