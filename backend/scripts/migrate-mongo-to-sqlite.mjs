#!/usr/bin/env node
/**
 * One-off helper: copy your EXISTING MongoDB data into the new SQL database.
 * Skip this if you are starting fresh.
 *
 *   npm install mongodb --no-save
 *   MONGO_URI="mongodb://127.0.0.1:27017/mailnova" npm run migrate:mongo
 *
 * Reads the main database (users, payments, activity logs) and every per-user
 * database named mailnova_user_<userId>, and writes them into the SQL tables.
 * Original ObjectIds are kept as the primary keys, so every reference
 * (createdBy, campaign, contacts[], ...) stays valid. Safe to re-run: rows that
 * already exist are skipped.
 */
import "../config/env.js";
import { MongoClient } from "mongodb";
import { connectDB, disconnectDB } from "../config/db.js";
import { tenantStorage } from "../db/context.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import ActivityLog from "../models/ActivityLog.js";
import Contact from "../models/Contact.js";
import ContactList from "../models/ContactList.js";
import Template from "../models/Template.js";
import Campaign from "../models/Campaign.js";
import CampaignRecipient from "../models/CampaignRecipient.js";
import EmailLog from "../models/EmailLog.js";
import SmsLog from "../models/SmsLog.js";
import Notification from "../models/Notification.js";
import Automation from "../models/Automation.js";
import AutomationTask from "../models/AutomationTask.js";

const MONGO_URI = process.env.MONGO_URI || process.argv[2];
if (!MONGO_URI) {
  console.error("Set MONGO_URI (or pass it as the first argument).");
  process.exit(1);
}

const GLOBAL = [
  ["users", User],
  ["payments", Payment],
  ["activitylogs", ActivityLog],
];
const TENANT = [
  ["contacts", Contact],
  ["contactlists", ContactList],
  ["templates", Template],
  ["campaigns", Campaign],
  ["campaignrecipients", CampaignRecipient],
  ["emaillogs", EmailLog],
  ["smslogs", SmsLog],
  ["notifications", Notification],
  ["automations", Automation],
  ["automationtasks", AutomationTask],
];

const totals = {};
const problems = [];

const copy = async (label, collection, Model) => {
  const docs = await collection.find().toArray();
  for (const doc of docs) {
    const { __v, ...data } = doc;
    try {
      await Model.create(data, { timestamps: false }); // keeps original _id / createdAt / updatedAt
      totals[Model.modelName] = (totals[Model.modelName] || 0) + 1;
    } catch (error) {
      if (error.code === 11000) continue; // already migrated
      problems.push(`${label} ${doc._id}: ${error.message}`);
    }
  }
};

const dbNameFromUri = (uri) => (uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/) || [])[1] || "mailnova";

const main = async () => {
  await connectDB();
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const mainDb = client.db(dbNameFromUri(MONGO_URI));

  for (const [name, Model] of GLOBAL) await copy(`main.${name}`, mainDb.collection(name), Model);

  // Rows written to the main DB when no tenant was active (kept as "no tenant").
  for (const [name, Model] of TENANT) await copy(`main.${name}`, mainDb.collection(name), Model);

  const { databases } = await client.db().admin().listDatabases();
  const tenantDbs = databases.map((d) => d.name).filter((n) => n.startsWith("mailnova_user_"));
  for (const dbName of tenantDbs) {
    const tenantId = dbName.replace("mailnova_user_", "");
    await tenantStorage.run({ tenantId }, async () => {
      for (const [name, Model] of TENANT) await copy(`${dbName}.${name}`, client.db(dbName).collection(name), Model);
    });
  }

  await client.close();
  disconnectDB();

  console.log("Copied rows:");
  console.table(totals);
  if (problems.length) {
    console.warn(`\n${problems.length} document(s) could not be copied:`);
    problems.slice(0, 50).forEach((p) => console.warn(" - " + p));
  } else {
    console.log("No problems.");
  }
};

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
