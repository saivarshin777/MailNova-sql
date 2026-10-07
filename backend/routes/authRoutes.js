import bcrypt from "bcryptjs";
import crypto from "crypto";
import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import Campaign from "../models/Campaign.js";
import Contact from "../models/Contact.js";
import OTP from "../models/OTP.js";
import Template from "../models/Template.js";
import User from "../models/User.js";
import { recordActivity } from "../controllers/activityController.js";
import { seedUserTenantData } from "../seed/seedData.js";
import { tenantStorage } from "../config/tenantDb.js";
import {
  loginRateLimiter,
  otpVerifyRateLimiter,
  otpResendRateLimiter,
  passwordResetRateLimiter
} from "../middleware/rateLimitMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
let transporter;
const shouldExposeDevOtp = () => process.env.HIDE_DEV_OTP !== "true";
const shouldSendAuthEmail = () => process.env.AUTH_EMAIL_DELIVERY === "true";
const ownerEmail = (process.env.OWNER_EMAIL || process.env.SEED_ADMIN_EMAIL || process.env.EMAIL_USER || "owner@mailnova.local")
  .toLowerCase()
  .trim();
const ownerName = process.env.OWNER_NAME || "Admin";
const isOwnerAccount = (user) => user?.email?.toLowerCase?.().trim() === ownerEmail;
const canSyncLeadRole = () => false;
const sessionRoleFor = (user) => (isOwnerAccount(user) ? "Admin" : user.role);
const publicSessionUser = (user) => ({
  id: user._id,
  name: isOwnerAccount(user) ? ownerName : user.name,
  email: user.email,
  role: sessionRoleFor(user),
  status: isOwnerAccount(user) ? "Active" : user.status,
  plan: user.plan,
  isOwner: isOwnerAccount(user),
  phone: user.phone || "",
  senderName: user.senderName || "MailNova Workspace",
  replyTo: user.replyTo || user.email,
});
const issueSessionToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: sessionRoleFor(user),
      isOwner: isOwnerAccount(user),
    },
    process.env.JWT_SECRET || "mailnova-dev-secret",
    { expiresIn: "7d" }
  );

const getEmailConfig = () => ({
  host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
  port: Number(process.env.SMTP_PORT || process.env.EMAIL_PORT || 587),
  secure:
    process.env.SMTP_SECURE === "true" ||
    process.env.EMAIL_SECURE === "true" ||
    String(process.env.SMTP_PORT || process.env.EMAIL_PORT) === "465",
  user: process.env.SMTP_USER || process.env.EMAIL_USER,
  pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
  from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.EMAIL_USER,
});

const getTransporter = () => {
  const config = getEmailConfig();

  if (!config.host || !config.user || !config.pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return transporter;
};

const sendEmail = async ({ email, subject, message, html }) => {
  if (!shouldSendAuthEmail()) {
    console.log(`\nAUTH EMAIL SKIPPED\nTo: ${email}\nSubject: ${subject}\n${message}\n`);
    return { mock: true, skipped: true };
  }

  const transport = getTransporter();
  const config = getEmailConfig();

  if (!transport) {
    console.log(`\nMOCK EMAIL\nTo: ${email}\nSubject: ${subject}\n${message}\n`);
    return { mock: true };
  }

  await transport.sendMail({
    from: config.from || config.user,
    to: email,
    subject,
    text: message,
    html,
  });

  return { mock: false };
};

const buildOtpHtml = (otp, heading, subheading) => `
  <div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #e5e7eb;border-radius:8px;max-width:480px;margin:0 auto;background:#fff;">
    <div style="text-align:center;margin-bottom:20px;">
      <h2 style="color:#ea580c;margin:0;font-size:24px;font-weight:bold;">MailNova</h2>
      <p style="color:#6b7280;font-size:14px;margin:5px 0 0 0;">${subheading}</p>
    </div>
    <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0;" />
    <p style="font-size:15px;color:#4b5563;line-height:1.5;">${heading}</p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:28px;font-weight:bold;letter-spacing:5px;text-align:center;padding:15px;margin:25px 0;color:#ea580c;">
      ${otp}
    </div>
    <p style="font-size:13px;color:#9ca3af;line-height:1.4;">This code expires in <strong>5 minutes</strong>. If you did not request this, please ignore.</p>
    <hr style="border:0;border-top:1px solid #e5e7eb;margin:25px 0;" />
    <p style="font-size:11px;color:#9ca3af;text-align:center;margin:0;">Automated security email - do not reply.</p>
  </div>
`;

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const createOtp = async (email) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const hashed = hashOtp(otp);
  await OTP.deleteMany({ email });
  await OTP.create({ email, otp: hashed, attempts: 0 });
  return otp;
};

router.post("/register-otp", loginRateLimiter, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Please fill in all fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(400).json({ success: false, message: "An account with that email already exists" });
    }

    const otp = await createOtp(normalizedEmail);
    const subject = "MailNova - Your Registration Verification Code";
    const message = `Your 6-digit verification code to register is: ${otp}. It is valid for 5 minutes.`;
    const html = buildOtpHtml(otp, "To complete your registration, use the security code below:", "Registration Verification");

    try {
      const result = await sendEmail({ email: normalizedEmail, subject, message, html });
      const exposeDevOtp = shouldExposeDevOtp();
      
      return res.json({
        success: true,
        message: exposeDevOtp
          ? `Demo OTP: ${otp}`
          : result.mock
          ? "OTP generated and printed to server terminal."
          : "Verification OTP sent to your email. Please verify.",
        ...(exposeDevOtp ? { devOtp: otp } : {}),
      });
    } catch (error) {
      await OTP.deleteMany({ email: normalizedEmail });
      if (shouldExposeDevOtp()) {
        return res.json({
          success: true,
          message: `SMTP failed, but demo OTP is available: ${otp}`,
          devOtp: otp,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Could not send OTP email. Check SMTP settings in your .env file.",
        detail: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: "Please fill in all fields including the OTP code" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(400).json({ success: false, message: "An account with that email already exists" });
    }

    const otpRecord = await OTP.findOne({ email: normalizedEmail });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request a new code." });
    }

    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "Too many failed verification attempts. Please request a new code." });
    }

    const hashedOtp = hashOtp(otp.trim());
    if (otpRecord.otp !== hashedOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ success: false, message: `Invalid verification code. Remaining attempts: ${3 - otpRecord.attempts}` });
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "User",
    });

    try {
      await seedUserTenantData(user._id.toString());
    } catch (seedErr) {
      console.error(`Failed to seed tenant database for user ${user._id}:`, seedErr.message);
    }

    await recordActivity({
      action: "auth.registered",
      entityType: "User",
      entityId: user._id,
      actor: user._id,
      message: `${user.email} registered as ${user.role}`,
      metadata: { email: user.email, role: user.role },
    });

    res.status(201).json({ success: true, message: "Registration successful! You can now log in." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "An account with that email already exists" });
    }
    next(error);
  }
});

router.post("/login", loginRateLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please enter email and password" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      await recordActivity({
        action: "auth.login_failed",
        entityType: "User",
        message: `Failed login attempt for ${normalizedEmail}`,
        metadata: { email: normalizedEmail, reason: "invalid_credentials" },
      });
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    if (user.status === "Suspended") {
      await recordActivity({
        action: "auth.login_blocked",
        entityType: "User",
        entityId: user._id,
        actor: user._id,
        message: `${user.email} login blocked because account is suspended`,
        metadata: { email: user.email, status: user.status },
      });
      return res.status(403).json({ success: false, message: "This account has been suspended by an admin" });
    }

    const otp = await createOtp(user.email);
    const subject = "MailNova - Your Login Verification Code";
    const message = `Your 6-digit verification code is: ${otp}. It is valid for 5 minutes.`;
    const html = buildOtpHtml(otp, "To complete your login, use the security code below:", "Two-Step Verification");

    try {
      const result = await sendEmail({ email: user.email, subject, message, html });
      const exposeDevOtp = shouldExposeDevOtp();
      await recordActivity({
        action: "auth.otp_sent",
        entityType: "User",
        entityId: user._id,
        actor: user._id,
        message: `OTP generated for ${user.email}`,
        metadata: { email: user.email, mock: Boolean(result.mock) },
      });
      return res.json({
        success: true,
        message: exposeDevOtp
          ? `Demo OTP: ${otp}`
          : result.mock
          ? "OTP generated and printed to server terminal."
          : "OTP sent to your email. Please verify.",
        ...(exposeDevOtp ? { devOtp: otp } : {}),
      });
    } catch (error) {
      await OTP.deleteMany({ email: user.email });
      if (shouldExposeDevOtp()) {
        return res.json({
          success: true,
          message: `SMTP failed, but demo OTP is available: ${otp}`,
          devOtp: otp,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Could not send OTP email. Check SMTP settings in your .env file.",
        detail: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/verify-otp", otpVerifyRateLimiter, async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await OTP.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      await recordActivity({
        action: "auth.otp_failed",
        entityType: "User",
        message: `No active OTP found for ${normalizedEmail}`,
        metadata: { email: normalizedEmail },
      });
      return res.status(400).json({ success: false, message: "Invalid or expired OTP. Please request a new one." });
    }

    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, message: "Too many failed verification attempts. Please request a new code." });
    }

    const hashedOtp = hashOtp(otp.trim());
    if (otpRecord.otp !== hashedOtp) {
      otpRecord.attempts += 1;
      await otpRecord.save();

      await recordActivity({
        action: "auth.otp_failed",
        entityType: "User",
        message: `Invalid OTP attempt for ${normalizedEmail} (Attempt ${otpRecord.attempts}/3)`,
        metadata: { email: normalizedEmail, attempts: otpRecord.attempts },
      });
      return res.status(400).json({ success: false, message: `Invalid verification code. Remaining attempts: ${3 - otpRecord.attempts}` });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found" });
    }

    if (canSyncLeadRole(user)) {
      const matchingLead = await Contact.findOne({ email: normalizedEmail, status: "Lead" }).lean();
      if (matchingLead && user.role !== "Lead") {
        user.role = "Lead";
        user.status = "Active";
        await user.save();
      }
    }

    await OTP.deleteOne({ _id: otpRecord._id });

    let campaignsCount = 0;
    let contactsCount = 0;
    let templatesCount = 0;
    try {
      await tenantStorage.run({ tenantId: user._id.toString() }, async () => {
        campaignsCount = await Campaign.countDocuments({});
        contactsCount = await Contact.countDocuments({});
        templatesCount = await Template.countDocuments({});
      });
    } catch (err) {
      console.error(`Failed to gather work stats on login for user ${user._id}:`, err.message);
    }

    user.lastLogin = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    user.workDoneAtLogin = {
      campaigns: campaignsCount,
      contacts: contactsCount,
      templates: templatesCount,
      lastLoginAt: new Date()
    };
    await user.save();

    await recordActivity({
      action: "auth.login_success",
      entityType: "User",
      entityId: user._id,
      actor: user._id,
      message: `${user.email} completed OTP login`,
      metadata: { email: user.email, role: user.role },
    });

    const token = issueSessionToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: publicSessionUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/resend-otp", otpResendRateLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with that email" });
    }

    const otp = await createOtp(user.email);
    const subject = "MailNova - New Verification Code";
    const message = `Your new verification code is: ${otp}. It is valid for 5 minutes.`;
    const html = buildOtpHtml(otp, "You requested a new code. Use it to complete your login:", "New Verification Code");

    try {
      const result = await sendEmail({ email: user.email, subject, message, html });
      const exposeDevOtp = shouldExposeDevOtp();
      return res.json({
        success: true,
        message: exposeDevOtp
          ? `Demo OTP: ${otp}`
          : result.mock
          ? "New OTP generated and printed to server terminal."
          : "New OTP sent to your email.",
        ...(exposeDevOtp ? { devOtp: otp } : {}),
      });
    } catch (error) {
      await OTP.deleteMany({ email: user.email });
      if (shouldExposeDevOtp()) {
        return res.json({
          success: true,
          message: `SMTP failed, but demo OTP is available: ${otp}`,
          devOtp: otp,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Could not resend OTP. Check your SMTP settings.",
        detail: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/forgot-password", passwordResetRateLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide your email" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({ success: true, message: "If that email is registered, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;
    const subject = "MailNova - Password Reset Request";
    const message = `Reset your password here: ${resetUrl}\n\nThis link expires in 30 minutes.`;
    const html = `
      <div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #e5e7eb;border-radius:8px;max-width:480px;margin:0 auto;background:#fff;">
        <h2 style="color:#ea580c;text-align:center;">MailNova Password Reset</h2>
        <p style="color:#4b5563;">Click the button below to set a new password. This link expires in <strong>30 minutes</strong>.</p>
        <div style="text-align:center;margin:25px 0;">
          <a href="${resetUrl}" style="background:#ea580c;color:#fff;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;font-size:15px;display:inline-block;">Reset Password</a>
        </div>
        <p style="font-size:13px;color:#6b7280;">If the button does not work, copy this link:<br/><span style="word-break:break-all;color:#2563eb;">${resetUrl}</span></p>
      </div>
    `;

    try {
      const result = await sendEmail({ email: user.email, subject, message, html });
      if (result.mock) console.log(`Password reset URL: ${resetUrl}`);
      return res.json({
        success: true,
        message: result.mock
          ? "Reset link generated and printed to server terminal."
          : "Password reset link sent to your email.",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({
        success: false,
        message: "Could not send reset email. Check your SMTP settings.",
        detail: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password/:token", passwordResetRateLimiter, async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Please provide a new password" });
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Reset link is invalid or has expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Password updated successfully. You can now log in." });
  } catch (error) {
    next(error);
  }
});

router.put("/profile", protect, async (req, res, next) => {
  try {
    const { name, email, phone = "", senderName = "", replyTo = "" } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (isOwnerAccount(user) && normalizedEmail !== user.email) {
      return res.status(400).json({
        success: false,
        message: "Owner login email is controlled by OWNER_EMAIL in backend/.env. Save name, phone, sender, or reply-to here.",
      });
    }

    if (normalizedEmail !== user.email) {
      const existing = await User.findOne({ email: normalizedEmail });
      if (existing) {
        return res.status(400).json({ success: false, message: "Email is already taken" });
      }
    }

    user.name = name.trim();
    user.email = normalizedEmail;
    user.phone = String(phone || "").trim();
    user.senderName = String(senderName || "MailNova Workspace").trim();
    user.replyTo = String(replyTo || normalizedEmail).toLowerCase().trim();
    await user.save();

    await recordActivity({
      action: "auth.profile_updated",
      entityType: "User",
      entityId: user._id,
      actor: user._id,
      message: `${user.email} updated profile settings`,
      metadata: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        senderName: user.senderName,
        replyTo: user.replyTo,
      },
    });

    const token = issueSessionToken(user);

    res.json({
      success: true,
      message: "Profile updated successfully",
      token,
      user: publicSessionUser(user),
    });
  } catch (error) {
    next(error);
  }
});

router.put("/password", protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await recordActivity({
      action: "auth.password_updated",
      entityType: "User",
      entityId: user._id,
      actor: user._id,
      message: `${user.email} updated their password`,
      metadata: { email: user.email },
    });

    res.json({ success: true, message: "Password updated successfully. Use the new password next time you log in." });
  } catch (error) {
    next(error);
  }
});

router.put("/plan", protect, async (req, res, next) => {
  try {
    const { planName } = req.body;
    if (!planName || !["Free", "Pro", "Enterprise"].includes(planName)) {
      return res.status(400).json({ success: false, message: "Invalid plan name" });
    }

    // This endpoint used to let anyone set their own plan to Pro or Enterprise
    // for free, with no payment involved - it just wrote whatever planName the
    // browser sent straight onto the user record. Paid plans now only activate
    // through a verified Razorpay payment (POST /api/payments/create-order then
    // /verify), or an admin override (PATCH /api/admin/users/:id/plan). This
    // route stays open only for self-service downgrade back to Free.
    if (planName !== "Free") {
      return res.status(400).json({
        success: false,
        message: "Paid plans require checkout. Use the upgrade flow to pay via Razorpay.",
      });
    }

    req.user.plan = {
      name: "Free",
      sendLimit: 5000,
      contactLimit: 1000,
      billingStatus: "Trial",
    };
    await req.user.save();

    await recordActivity({
      action: "auth.plan_updated",
      entityType: "User",
      entityId: req.user._id,
      actor: req.user._id,
      message: `${req.user.email} updated plan to ${planName}`,
      metadata: { plan: planName, sendLimit: 5000, contactLimit: 1000 },
    });

    const token = issueSessionToken(req.user);

    res.json({
      success: true,
      message: "Plan upgraded successfully",
      token,
      user: publicSessionUser(req.user),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
