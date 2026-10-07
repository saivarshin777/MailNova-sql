import { sendCampaignEmail } from "./mailService.js";

export const enqueueCampaignEmail = async (payload) => {
  // Queue-ready boundary: replace this inline adapter with BullMQ/Redis in production.
  // The controller already calls this async boundary instead of sending mail directly.
  if (process.env.EMAIL_QUEUE_PROVIDER === "bullmq") {
    console.warn("EMAIL_QUEUE_PROVIDER=bullmq is configured, but BullMQ dependencies are not installed in this bundle.");
  }

  return sendCampaignEmail(payload);
};
