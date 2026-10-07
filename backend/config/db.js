import path from "node:path";
import { fileURLToPath } from "node:url";
import { closeDatabase, getDriverName, openDatabase } from "../db/driver.js";
import { initSchema } from "../db/orm.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODEL_FILES = [
  "User", "OTP", "Payment", "ActivityLog", "Contact", "ContactList", "Template", "Campaign",
  "CampaignRecipient", "EmailLog", "SmsLog", "Notification", "Automation", "AutomationTask",
];

/**
 * Opens the SQL database and creates any missing tables.
 *
 * Default location: backend/data/mailnova.sqlite
 * Override with SQLITE_PATH in backend/.env (relative paths are relative to backend/;
 * use ":memory:" for a throw-away DB).
 */
export const connectDB = async () => {
  const configured = process.env.SQLITE_PATH;
  const file =
    configured === ":memory:"
      ? ":memory:"
      : path.resolve(path.join(__dirname, ".."), configured || path.join("data", "mailnova.sqlite"));

  await openDatabase(file);
  // Make sure every model is registered before the tables are created.
  await Promise.all(MODEL_FILES.map((name) => import(`../models/${name}.js`)));
  initSchema();
  console.log(`SQL database ready (${getDriverName()}): ${file}`);
};

export const disconnectDB = () => closeDatabase();
