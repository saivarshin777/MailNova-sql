import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { tenantStorage } from "../config/tenantDb.js";

const ownerEmail = (process.env.OWNER_EMAIL || process.env.SEED_ADMIN_EMAIL || process.env.EMAIL_USER || "owner@mailnova.local")
  .toLowerCase()
  .trim();

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mailnova-dev-secret");

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    if (user.status === "Suspended") {
      return res.status(403).json({ success: false, message: "This account has been suspended by an admin" });
    }

    if (user.email?.toLowerCase().trim() === ownerEmail) {
      user.isOwner = true;
      user.role = "Admin";
      user.status = "Active";
    } else if (user.isOwner) {
      user.isOwner = false;
    }

    req.user = user;
    tenantStorage.run({ tenantId: user._id.toString() }, next);
  } catch (_error) {
    return res.status(401).json({ success: false, message: "Not authorized, invalid token" });
  }
};

export const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
