// Prints the most recent email log (central + per-user) from the SQL database.
// Usage: node backend/get_latest_email.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });

const { connectDB, disconnectDB } = await import("./config/db.js");
const { tenantStorage } = await import("./config/tenantDb.js");
const { default: EmailLog } = await import("./models/EmailLog.js");
const { default: User } = await import("./models/User.js");

const show = (label, log) => {
  console.log(`\n--- ${label} ---`);
  console.log("Subject:", log.subject);
  console.log("HTML Content:\n", log.htmlContent);
  console.log("Text Content:\n", log.textContent);
};

await connectDB();

const central = await EmailLog.findOne().sort({ createdAt: -1 }).lean();
if (central) show("Central Email Log", central);
else console.log("No email logs found in the central database.");

for (const user of await User.find().lean()) {
  const log = await tenantStorage.run({ tenantId: String(user._id) }, () =>
    EmailLog.findOne().sort({ createdAt: -1 }).lean()
  );
  if (log) show(`User ${user.email} Email Log`, log);
}

disconnectDB();
