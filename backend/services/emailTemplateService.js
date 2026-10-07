const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const paragraphs = (content) =>
  escapeHtml(content || "Thank you for being part of our community.")
    .split(/\n{2,}|\n/)
    .filter(Boolean)
    .map((line) => `<p style="margin:0 0 16px;color:#334155;line-height:1.7;font-size:15px;">${line}</p>`)
    .join("");

export const buildProfessionalEmail = ({ campaignName, subject, content }) => {
  const safeCampaignName = escapeHtml(campaignName || "Campaign Update");
  const safeSubject = escapeHtml(subject || "Important update");
  const body = paragraphs(content);

  const htmlContent = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeSubject}</title>
  </head>
  <body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0B1F3A;padding:26px 32px;">
                <div style="font-size:24px;font-weight:800;color:#ffffff;">Mail <span style="color:#FF8C42;">Nova</span></div>
                <div style="margin-top:8px;font-size:13px;color:#cbd5e1;">${safeCampaignName}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 18px;color:#0f172a;font-size:26px;line-height:1.25;">${safeSubject}</h1>
                ${body}
                <div style="margin-top:26px;padding:18px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                  <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
                    We appreciate your continued interest. Our team is committed to sharing timely, relevant, and useful updates with you.
                  </p>
                </div>
                <p style="margin:28px 0 0;color:#334155;font-size:15px;line-height:1.7;">
                  Best regards,<br />
                  <strong>The Mail Nova Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px;line-height:1.5;">
                You are receiving this email because you are included in a Mail Nova campaign audience.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textContent = `${subject}

${content || "Thank you for being part of our community."}

We appreciate your continued interest. Our team is committed to sharing timely, relevant, and useful updates with you.

Best regards,
The Mail Nova Team`;

  return {
    htmlContent,
    textContent,
  };
};
