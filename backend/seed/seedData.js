import bcrypt from "bcryptjs";
import Campaign from "../models/Campaign.js";
import Contact from "../models/Contact.js";
import ContactList from "../models/ContactList.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

const starterCampaigns = [
  {
    name: "Summer Launch",
    subject: "Introducing our summer collection",
    content: "The launch campaign is live for the full subscriber list.",
    recipients: ["demo@example.com"],
    htmlContent: "<p>The launch campaign is live for the full subscriber list.</p>",
    textContent: "The launch campaign is live for the full subscriber list.",
    sendStatus: "sent",
    status: "Active",
    emailsSent: 45000,
    delivered: 43820,
    opened: 36900,
    clicked: 6840,
    createdAt: new Date("2026-05-26T09:30:00.000Z"),
    updatedAt: new Date("2026-05-26T09:30:00.000Z"),
  },
  {
    name: "Festive Offers",
    subject: "Festive discounts are here",
    content: "Limited period festive offer campaign.",
    recipients: ["demo@example.com"],
    htmlContent: "<p>Limited period festive offer campaign.</p>",
    textContent: "Limited period festive offer campaign.",
    sendStatus: "sent",
    status: "Completed",
    emailsSent: 30500,
    delivered: 29940,
    opened: 23180,
    clicked: 4825,
    createdAt: new Date("2026-05-27T11:20:00.000Z"),
    updatedAt: new Date("2026-05-27T11:20:00.000Z"),
  },
  {
    name: "New Arrivals",
    subject: "Fresh products just dropped",
    content: "A new-arrivals email for active customers.",
    recipients: ["demo@example.com"],
    htmlContent: "<p>A new-arrivals email for active customers.</p>",
    textContent: "A new-arrivals email for active customers.",
    sendStatus: "sent",
    status: "Running",
    emailsSent: 25800,
    delivered: 25250,
    opened: 17800,
    clicked: 3550,
    createdAt: new Date("2026-05-28T14:45:00.000Z"),
    updatedAt: new Date("2026-05-28T14:45:00.000Z"),
  },
];

const starterContacts = [
  {
    name: "Ananya Rao",
    email: "ananya.rao@example.com",
    phone: "+91 98765 43210",
    city: "Bangalore",
    status: "Customer",
    createdAt: new Date("2026-05-20T10:00:00.000Z"),
    updatedAt: new Date("2026-05-20T10:00:00.000Z"),
  },
  {
    name: "Rohan Mehta",
    email: "rohan.mehta@example.com",
    phone: "+91 98765 43211",
    city: "Mumbai",
    status: "Prospect",
    createdAt: new Date("2026-05-24T13:20:00.000Z"),
    updatedAt: new Date("2026-05-24T13:20:00.000Z"),
  },
  {
    name: "Priya Menon",
    email: "priya.menon@example.com",
    phone: "+91 98765 43212",
    city: "Chennai",
    status: "Lead",
    createdAt: new Date("2026-05-26T09:45:00.000Z"),
    updatedAt: new Date("2026-05-26T09:45:00.000Z"),
  },
  {
    name: "Karthik Iyer",
    email: "karthik.iyer@example.com",
    phone: "+91 98765 43213",
    city: "Hyderabad",
    status: "Customer",
    createdAt: new Date("2026-05-29T16:10:00.000Z"),
    updatedAt: new Date("2026-05-29T16:10:00.000Z"),
  },
  {
    name: "Neha Sharma",
    email: "neha.sharma@example.com",
    phone: "+91 98765 43214",
    city: "Bangalore",
    status: "Inactive",
    createdAt: new Date("2026-06-01T11:15:00.000Z"),
    updatedAt: new Date("2026-06-01T11:15:00.000Z"),
  },
];

const starterNotifications = [
  {
    type: "campaign",
    title: "Campaign sent successfully",
    desc: "Summer Launch reached 45,000 recipients",
    time: "2 min ago",
    read: false,
    createdAt: new Date("2026-05-28T15:00:00.000Z"),
    updatedAt: new Date("2026-05-28T15:00:00.000Z"),
  },
  {
    type: "campaign",
    title: "Open rate milestone hit",
    desc: "Summer Launch crossed 82% open rate",
    time: "1 hr ago",
    read: false,
    createdAt: new Date("2026-05-28T14:00:00.000Z"),
    updatedAt: new Date("2026-05-28T14:00:00.000Z"),
  },
  {
    type: "system",
    title: "Automation triggered",
    desc: "Re-engagement Flow sent to 320 contacts",
    time: "Yesterday",
    read: true,
    createdAt: new Date("2026-05-27T12:00:00.000Z"),
    updatedAt: new Date("2026-05-27T12:00:00.000Z"),
  },
];

const starterUsers = [
  {
    name: process.env.OWNER_NAME || "Admin",
    email: process.env.OWNER_EMAIL || process.env.SEED_ADMIN_EMAIL || process.env.EMAIL_USER || "owner@mailnova.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin@12345",
    role: "Admin",
    isOwner: true,
  },
];

const ownerEmail = (process.env.OWNER_EMAIL || process.env.SEED_ADMIN_EMAIL || process.env.EMAIL_USER || "owner@mailnova.local")
  .toLowerCase()
  .trim();

import { tenantStorage } from "../config/tenantDb.js";

const seedUsersIfNeeded = async () => {
  await User.updateMany(
    { email: { $ne: ownerEmail }, isOwner: true },
    { $set: { isOwner: false } }
  );

  for (const user of starterUsers) {
    const email = user.email.toLowerCase();
    const exists = await User.findOne({ email });
    const hashedPassword = await bcrypt.hash(user.password, 10);

    if (!exists) {
      await User.create({
        ...user,
        email,
        password: hashedPassword,
        status: "Active",
        isOwner: Boolean(user.isOwner),
      });
    } else {
      exists.name = user.name;
      exists.role = user.role;
      exists.isOwner = Boolean(user.isOwner);
      exists.status = "Active";
      if (process.env.SYNC_DEMO_USERS === "true") {
        exists.password = hashedPassword;
      }
      await exists.save();
    }
  }
};

export const seedUserTenantData = async (userId) => {
  await tenantStorage.run({ tenantId: userId }, async () => {
    const contactCount = await Contact.countDocuments();
    let seededContacts = [];
    if (contactCount === 0) {
      const contactsToInsert = starterContacts.map(c => ({ ...c, addedBy: userId, isSeedData: true }));
      seededContacts = await Contact.insertMany(contactsToInsert, { timestamps: false });
    } else {
      seededContacts = await Contact.find().lean();
    }

    const contactListCount = await ContactList.countDocuments();
    if (contactListCount === 0 && seededContacts.length > 0) {
      const customers = seededContacts
        .filter((contact) => contact.status === "Customer")
        .map((contact) => contact._id);
      const prospects = seededContacts
        .filter((contact) => ["Lead", "Prospect"].includes(contact.status))
        .map((contact) => contact._id);
      const bangalore = seededContacts
        .filter((contact) => contact.city === "Bangalore")
        .map((contact) => contact._id);

      await ContactList.insertMany([
        {
          name: "Customer Accounts",
          description: "Existing customer contacts ready for retention campaigns.",
          color: "#14b8a6",
          contacts: customers,
          createdBy: userId,
          isSeedData: true,
        },
        {
          name: "Enterprise Prospects",
          description: "Leads and prospects for nurture campaigns.",
          color: "#2563eb",
          contacts: prospects,
          createdBy: userId,
          isSeedData: true,
        },
        {
          name: "Bangalore Audience",
          description: "Regional segment for local offers and events.",
          color: "#f59e0b",
          contacts: bangalore,
          createdBy: userId,
          isSeedData: true,
        },
      ]);
    }

    const campaignCount = await Campaign.countDocuments();
    if (campaignCount === 0) {
      const campaignsToInsert = starterCampaigns.map(c => ({ ...c, createdBy: userId, isSeedData: true }));
      await Campaign.insertMany(campaignsToInsert, { timestamps: false });
    }

    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      const notificationsToInsert = starterNotifications.map(n => ({
        ...n,
        recipient: userId,
        isSeedData: true,
      }));
      await Notification.insertMany(notificationsToInsert, { timestamps: false });
    }
  });
};

export const seedDatabase = async () => {
  await seedUsersIfNeeded();

  const adminUser = await User.findOne({ email: ownerEmail });
  if (adminUser) {
    await seedUserTenantData(adminUser._id.toString());
  }
};
