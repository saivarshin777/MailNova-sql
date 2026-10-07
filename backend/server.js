import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

import "./config/env.js";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import campaignRoutes from "./routes/campaignRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import automationRoutes from "./routes/automationRoutes.js";
import trackingRoutes from "./routes/trackingRoutes.js";
import { razorpayWebhook } from "./controllers/paymentController.js";
import { seedDatabase } from "./seed/seedData.js";
import { startCampaignWorker } from "./services/campaignWorker.js";
import { startAutomationScheduler } from "./services/automationScheduler.js";
import { verifySmtpConnection } from "./services/mailService.js";
import { createServer } from "http";
import { initSocket } from "./services/socketService.js";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is required in production environment");
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
// Razorpay's webhook signature is computed over the exact raw request body,
// so this route must receive a raw Buffer, not the parsed JSON object.
// It has to be registered before the global express.json() below, and it
// deliberately skips `protect` - Razorpay calls it directly with no user
// session, and trust comes entirely from the signature check inside.
app.post("/api/payments/webhook", express.raw({ type: "*/*" }), razorpayWebhook);

app.use(express.json({ limit: "15mb" }));

app.get("/api/health", async (_req, res) => {
  const smtpCheck = await verifySmtpConnection();
  res.json({
    status: "ok",
    database: "connected",
    smtp: smtpCheck.status,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/track", trackingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/lead", leadRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/automations", automationRoutes);
app.use("/api/activity", activityRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || "Internal server error",
  });
});

const startServer = async () => {
  await connectDB();
  await seedDatabase();
  startCampaignWorker();
  startAutomationScheduler();
  verifySmtpConnection();

  const httpServer = createServer(app);
  initSocket(httpServer, process.env.CLIENT_URL || "http://localhost:5173");

  httpServer.listen(PORT, () => {
    console.log(`Dashboard backend running at http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Backend failed to start:", error.message);
  process.exit(1);
});
