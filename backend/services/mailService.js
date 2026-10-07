import nodemailer from "nodemailer";

const requiredEmailConfig = ["EMAIL_HOST", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS"];

const getMissingEmailConfig = () =>
  requiredEmailConfig.filter((key) => !process.env[key]);

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const extractEmailAddress = (value = "") => {
  const text = String(value || "").trim();
  const match = text.match(/<([^>]+)>/);
  return (match ? match[1] : text).trim();
};

const cleanAddressName = (value = "") => String(value || "").replace(/"/g, "").trim();

export const getDefaultRecipients = () =>
  (process.env.CAMPAIGN_DEFAULT_RECIPIENTS || "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

export const normalizeRecipients = (recipients) => {
  const unique = (items) => [...new Set(items.map((email) => String(email).trim().toLowerCase()).filter(Boolean))];

  if (Array.isArray(recipients)) {
    return unique(recipients);
  }

  return unique(
    String(recipients || "")
    .split(",")
  );
};

export const sendCampaignEmail = async ({
  recipients,
  subject,
  htmlContent,
  textContent,
  attachments = [],
  senderName = "",
  replyTo = "",
}) => {
  const missing = getMissingEmailConfig();

  if (missing.length) {
    throw new Error(`Missing email configuration: ${missing.join(", ")}`);
  }

  if (!recipients.length) {
    throw new Error("No email recipients were provided.");
  }

  const transporter = createTransporter();
  const configuredFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const cleanSenderName = cleanAddressName(senderName);
  const from = cleanSenderName
    ? { name: cleanSenderName, address: extractEmailAddress(configuredFrom) }
    : configuredFrom;

  const mailOptions = {
    from,
    to: recipients,
    subject,
    html: htmlContent,
    text: textContent,
    attachments,
  };

  if (replyTo) {
    mailOptions.replyTo = replyTo;
  }

  return transporter.sendMail(mailOptions);
};

export const verifySmtpConnection = async () => {
  const missing = getMissingEmailConfig();
  if (missing.length) {
    console.log(`SMTP Status: Mock Mode (Missing environment variables: ${missing.join(", ")})`);
    return { status: "mock", error: `Missing: ${missing.join(", ")}` };
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log(`SMTP Connection: Healthy (Host: ${process.env.EMAIL_HOST}, User: ${process.env.EMAIL_USER})`);
    return { status: "connected" };
  } catch (error) {
    console.error(`SMTP Connection Failed: ${error.message}`);
    return { status: "error", error: error.message };
  }
};
