import crypto from "crypto";

const DATA_IMAGE_REGEX = /src\s*=\s*(["'])data:(image\/(?:png|jpe?g|gif|webp));base64,([^"']+)\1/gi;
const LINK_REGEX = /<a\b([^>]*?)href=(["'])(.*?)\2/gi;

export const getUrlSignature = (url) => {
  const secret = process.env.JWT_SECRET || "mailnova-dev-secret";
  return crypto.createHmac("sha256", secret).update(url).digest("hex");
};

export const getTrackingBaseUrl = (req) => {
  const configured =
    process.env.TRACKING_BASE_URL ||
    process.env.PUBLIC_API_URL ||
    process.env.BACKEND_PUBLIC_URL ||
    process.env.API_PUBLIC_URL;

  if (configured) return configured.replace(/\/$/, "");

  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  return `${protocol}://${req.get("host")}`;
};

export const extractInlineImages = (htmlContent = "") => {
  const attachments = [];
  const html = String(htmlContent).replace(DATA_IMAGE_REGEX, (_match, quote, mimeType, base64) => {
    const index = attachments.length + 1;
    const extension = mimeType.split("/")[1].replace("jpeg", "jpg");
    const cid = `mailnova-image-${Date.now()}-${index}@mailnova`;

    attachments.push({
      filename: `mailnova-image-${index}.${extension}`,
      content: Buffer.from(base64, "base64"),
      contentType: mimeType,
      cid,
    });

    return `src=${quote}cid:${cid}${quote}`;
  });

  return { html, attachments };
};

const shouldTrackUrl = (url = "") => {
  const normalized = String(url).trim().toLowerCase();
  return (
    normalized &&
    !normalized.startsWith("mailto:") &&
    !normalized.startsWith("tel:") &&
    !normalized.startsWith("cid:") &&
    !normalized.startsWith("data:")
  );
};

const trackingPath = ({ kind, campaignId, recipientToken, userId }) => {
  const userSegment = userId ? `/${userId}` : "";
  return recipientToken
    ? `/api/track/${kind}${userSegment}/${campaignId}/${recipientToken}${kind === "open" ? ".gif" : ""}`
    : `/api/track/${kind}${userSegment}/${campaignId}${kind === "open" ? ".gif" : ""}`;
};

export const addTrackingToHtml = ({ htmlContent = "", campaignId, baseUrl, recipientToken = "", userId = "" }) => {
  const trackingBase = String(baseUrl || "").replace(/\/$/, "");

  const linkedHtml = String(htmlContent).replace(LINK_REGEX, (match, beforeHref, quote, url) => {
    if (!shouldTrackUrl(url)) return match;

    const sig = getUrlSignature(url);
    const trackedUrl = `${trackingBase}${trackingPath({
      kind: "click",
      campaignId,
      recipientToken,
      userId,
    })}?url=${encodeURIComponent(url)}&sig=${sig}`;
    return `<a${beforeHref}href=${quote}${trackedUrl}${quote}`;
  });

  const pixel = `<img src="${trackingBase}${trackingPath({
    kind: "open",
    campaignId,
    recipientToken,
    userId,
  })}" width="1" height="1" alt="" style="display:none!important;width:1px;height:1px;opacity:0;border:0;" />`;

  if (/<\/body>/i.test(linkedHtml)) {
    return linkedHtml.replace(/<\/body>/i, `${pixel}</body>`);
  }

  return `${linkedHtml}${pixel}`;
};

export const prepareTrackedEmail = ({ htmlContent, campaignId, baseUrl, recipientToken = "", userId = "" }) => {
  const trackedHtml = addTrackingToHtml({ htmlContent, campaignId, baseUrl, recipientToken, userId });
  const { html, attachments } = extractInlineImages(trackedHtml);

  return {
    htmlContent: html,
    attachments,
  };
};
