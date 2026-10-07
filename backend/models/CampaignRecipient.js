import { defineModel } from "../db/orm.js";

const CampaignRecipient = defineModel("CampaignRecipient", {
  table: "campaign_recipients",
  tenant: true,
  fields: {
    campaign: { type: "ref", ref: "Campaign", required: true, index: true },
    email: { type: "string", required: true, lowercase: true, trim: true },
    token: { type: "string", required: true, unique: true },
    status: {
      type: "string",
      enum: ["pending", "sent", "failed", "bounced", "unsubscribed"],
      default: "pending",
    },
    providerMessageId: { type: "string", default: "" },
    error: { type: "string", default: "" },
    sentAt: { type: "date", default: null },
    deliveredAt: { type: "date", default: null },
    openedAt: { type: "date", default: null },
    clickedAt: { type: "date", default: null },
    bouncedAt: { type: "date", default: null },
    opens: { type: "number", default: 0, min: 0 },
    clicks: { type: "number", default: 0, min: 0 },
    lastEventAt: { type: "date", default: null },
    lastUserAgent: { type: "string", default: "" },
    lastIp: { type: "string", default: "" },
    lastClickedUrl: { type: "string", default: "" },
  },
  indexes: [
    { fields: ["campaign", "email"], unique: true },
    { fields: ["campaign", "status"] },
    { fields: ["campaign", "openedAt"] },
    { fields: ["campaign", "clickedAt"] },
  ],
});

export default CampaignRecipient;
