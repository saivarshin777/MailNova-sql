const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateCampaignPayload = (req, res, next) => {
  const { name, subject, recipients, contactListId, status } = req.body;
  const manualRecipients = String(recipients || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const invalidRecipients = manualRecipients.filter((email) => !emailPattern.test(email));

  if (!name?.trim()) {
    return res.status(400).json({ success: false, message: "Campaign name is required" });
  }

  if (!subject?.trim()) {
    return res.status(400).json({ success: false, message: "Email subject is required" });
  }

  if (invalidRecipients.length) {
    return res.status(400).json({
      success: false,
      message: `Invalid recipient email: ${invalidRecipients[0]}`,
    });
  }

  if (status !== "Draft" && !manualRecipients.length && !contactListId) {
    return res.status(400).json({
      success: false,
      message: "Choose a contact folder or provide recipients before sending.",
    });
  }

  next();
};

export const validateContactPayload = (req, res, next) => {
  const { name, email } = req.body;

  if (!name?.trim() || !email?.trim()) {
    return res.status(400).json({ success: false, message: "Name and email are required" });
  }

  if (!emailPattern.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Enter a valid email address" });
  }

  next();
};
