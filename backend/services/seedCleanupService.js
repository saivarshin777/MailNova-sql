import Campaign from "../models/Campaign.js";
import Contact from "../models/Contact.js";
import ContactList from "../models/ContactList.js";
import Notification from "../models/Notification.js";

// The seed script gives every new workspace a handful of demo campaigns,
// contacts, folders, and notifications so the dashboard doesn't look empty
// on day one (see backend/seed/seedData.js). Those documents are all
// flagged with isSeedData: true.
//
// The moment the signed-in user does something real - sends/saves a real
// campaign, adds a real contact, imports a list, creates a real folder -
// we drop every isSeedData document from that user's own tenant database.
// This runs inside the request's tenantStorage context (set by the
// `protect` middleware), so it only ever touches the acting user's data.
export const clearSeedDataForTenant = async () => {
  try {
    await Promise.all([
      Campaign.deleteMany({ isSeedData: true }),
      Contact.deleteMany({ isSeedData: true }),
      ContactList.deleteMany({ isSeedData: true }),
      Notification.deleteMany({ isSeedData: true }),
    ]);
  } catch (error) {
    // Never let cleanup of demo data break a real user action.
    console.error("Failed to clear seed/demo data for tenant:", error.message);
  }
};
