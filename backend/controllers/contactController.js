import fs from "fs";
import xlsx from "xlsx";
import mammoth from "mammoth";
import Contact from "../models/Contact.js";
import ContactList from "../models/ContactList.js";
import SmsLog from "../models/SmsLog.js";
import { recordActivity } from "./activityController.js";
import { sendSms } from "../services/smsService.js";
import Notification from "../models/Notification.js";
import { toClientNotification } from "../services/dashboardService.js";
import { sendRealTimeNotification } from "../services/socketService.js";
import { clearSeedDataForTenant } from "../services/seedCleanupService.js";
import { runNewContactAutomations } from "../services/automationEngine.js";

const canSeeGlobalWorkspace = (req) => ["Admin", "Manager"].includes(req.user?.role);

const buildContactFilter = (search = "") => {
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  return filter;
};

const scopeContactFilter = (req, filter = {}) =>
  canSeeGlobalWorkspace(req)
    ? filter
    : { ...filter, addedBy: req.user?._id };

const scopeContactListFilter = (req, filter = {}) =>
  canSeeGlobalWorkspace(req)
    ? filter
    : {
        ...filter,
        $or: [{ createdBy: req.user?._id }, { createdBy: null }, { createdBy: { $exists: false } }],
      };

const scopeOwnedContactListFilter = (req, filter = {}) =>
  canSeeGlobalWorkspace(req) ? filter : { ...filter, createdBy: req.user?._id };

const normalizeContactIds = (contactIds = []) =>
  [...new Set((Array.isArray(contactIds) ? contactIds : [contactIds]).filter(Boolean).map(String))];

const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const contactStatusOptions = ["Lead", "Prospect", "Customer", "Inactive"];

const normalizeContactStatus = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  return contactStatusOptions.find((status) => status.toLowerCase() === normalized) || "Lead";
};

const normalizeHeaderKey = (value = "") => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const headerAliases = {
  name: ["name", "fullname", "contactname", "customername"],
  email: ["email", "emailaddress", "mail", "mailid"],
  phone: ["phone", "phonenumber", "mobile", "mobilenumber", "contactnumber", "whatsapp"],
  city: ["city", "location", "address", "place"],
  status: ["status", "type", "stage"],
};

const detectContactField = (value = "") => {
  const normalized = normalizeHeaderKey(value);
  return Object.entries(headerAliases).find(([, aliases]) => aliases.includes(normalized))?.[0] || "";
};

const looksLikePhone = (value = "") => /^[0-9+\s().-]{7,}$/.test(String(value || "").trim());

const parseSpreadsheetContacts = (sheet) => {
  const matrix = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const firstRowIndex = matrix.findIndex((row) => row.some((cell) => String(cell ?? "").trim()));

  if (firstRowIndex === -1) {
    return [];
  }

  const firstRow = matrix[firstRowIndex];
  const headerFields = firstRow.map(detectContactField).filter(Boolean);
  const hasHeaderRow = headerFields.length >= 2 || headerFields.includes("email");
  const headerMap = {};

  if (hasHeaderRow) {
    firstRow.forEach((cell, index) => {
      const field = detectContactField(cell);
      if (field && headerMap[field] === undefined) {
        headerMap[field] = index;
      }
    });
  }

  const defaultIndexes = { name: 0, email: 1, phone: 2, city: 3, status: 4 };
  const dataRows = matrix.slice(firstRowIndex + (hasHeaderRow ? 1 : 0));

  return dataRows.flatMap((row) => {
    const values = row.map((cell) => String(cell ?? "").trim());

    if (!values.some(Boolean)) {
      return [];
    }

    const readField = (field) => {
      const index = headerMap[field] ?? defaultIndexes[field];
      return String(row[index] ?? "").trim();
    };

    const emailCell = values.find((value) => emailPattern.test(value)) || "";
    const email = (readField("email").match(emailPattern)?.[0] || emailCell.match(emailPattern)?.[0] || "").toLowerCase();

    if (!email) {
      return [];
    }

    let name = readField("name");
    let phone = readField("phone");
    let city = readField("city");
    let status = normalizeContactStatus(readField("status"));

    if (!hasHeaderRow) {
      const emailIndex = values.findIndex((value) => emailPattern.test(value));
      const statusValue = values.find((value) => contactStatusOptions.some((statusOption) => statusOption.toLowerCase() === value.toLowerCase()));
      const phoneValue = values.find(looksLikePhone);
      const nameValue = values.find((value, index) =>
        value &&
        index !== emailIndex &&
        !emailPattern.test(value) &&
        !looksLikePhone(value) &&
        !contactStatusOptions.some((statusOption) => statusOption.toLowerCase() === value.toLowerCase())
      );

      if (!name || emailPattern.test(name)) name = nameValue || "";
      if (!phone) phone = phoneValue || "";
      if (!city) {
        city = values.find((value) =>
          value &&
          value !== name &&
          value !== phone &&
          value.toLowerCase() !== email &&
          !emailPattern.test(value) &&
          !looksLikePhone(value) &&
          !contactStatusOptions.some((statusOption) => statusOption.toLowerCase() === value.toLowerCase())
        ) || "";
      }
      if (statusValue) status = normalizeContactStatus(statusValue);
    }

    if (!name) {
      name = email.split("@")[0];
    }

    return [{ name, email, phone, city, status }];
  });
};

const extractPdfText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: dataBuffer });

  try {
    const result = await parser.getText();
    return result.text || "";
  } finally {
    await parser.destroy();
  }
};

const toClientContactList = (list) => ({
  _id: String(list._id),
  id: String(list._id),
  name: list.name,
  description: list.description || "",
  color: list.color || "#2563eb",
  contacts: list.contacts || [],
  contactCount: list.contacts?.length || 0,
  emails: (list.contacts || []).map((contact) => contact.email).filter(Boolean),
  createdAt: list.createdAt,
  updatedAt: list.updatedAt,
});

const syncLeadAccountForContact = async () => null;

export const getContacts = async (req, res, next) => {
  try {
    const { search = "" } = req.query;
    const filter = buildContactFilter(search);

    const contacts = await Contact.find(scopeContactFilter(req, filter)).sort({ createdAt: -1 }).lean();
    res.json({ success: true, contacts });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, city, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }

    if (req.user?.role !== "Admin") {
      const contactLimit = req.user?.plan?.contactLimit || 1000;
      const currentCount = await Contact.countDocuments(scopeContactFilter(req));
      if (currentCount >= contactLimit) {
        return res.status(403).json({
          success: false,
          message: `Plan contact limit reached. Used ${currentCount}/${contactLimit} contacts.`,
        });
      }
    }

    const contact = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "",
      city: city?.trim() || "",
      status: status || "Lead",
      addedBy: req.user?._id,
    });

    // A real contact now exists - drop the demo/seed data for this workspace.
    await clearSeedDataForTenant();

    await runNewContactAutomations(contact, req.user?._id);

    try {
      const notif = await Notification.create({
        type: "Lead Generated",
        title: "New Lead Generated",
        desc: `New lead created: ${contact.name} (${contact.email}) in ${contact.city || "Unknown City"}.`,
        recipient: req.user?._id,
        read: false,
        isRead: false
      });
      sendRealTimeNotification(req.user?._id, toClientNotification(notif));
    } catch (err) {
      console.error("Failed to create real-time notification on contact creation:", err);
    }

    await recordActivity({
      action: "contact.created",
      entityType: "Contact",
      entityId: contact._id,
      actor: req.user?._id,
      message: `${contact.name} was added to contacts`,
      metadata: { email: contact.email, status: contact.status, city: contact.city },
    });

    const leadAccount = await syncLeadAccountForContact(contact);
    if (leadAccount?.user && !leadAccount.protected) {
      await recordActivity({
        action: leadAccount.created ? "lead.account_created" : "lead.account_synced",
        entityType: "User",
        entityId: leadAccount.user._id,
        actor: req.user?._id,
        message: `${contact.email} was assigned Lead dashboard access`,
        metadata: { email: contact.email, contactId: contact._id },
      });
    }

    res.status(201).json({ success: true, contact });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (req, res, next) => {
  try {
    const { name, email, phone, city, status } = req.body;

    const contact = await Contact.findOneAndUpdate(
      scopeContactFilter(req, { _id: req.params.id }),
      { name, email, phone, city, status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    await recordActivity({
      action: "contact.updated",
      entityType: "Contact",
      entityId: contact._id,
      actor: req.user?._id,
      message: `${contact.name} was updated`,
      metadata: { email: contact.email, status: contact.status, city: contact.city },
    });

    const leadAccount = await syncLeadAccountForContact(contact);
    if (leadAccount?.user && !leadAccount.protected) {
      await recordActivity({
        action: leadAccount.created ? "lead.account_created" : "lead.account_synced",
        entityType: "User",
        entityId: leadAccount.user._id,
        actor: req.user?._id,
        message: `${contact.email} was assigned Lead dashboard access`,
        metadata: { email: contact.email, contactId: contact._id },
      });
    }

    res.json({ success: true, contact });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOneAndDelete(scopeContactFilter(req, { _id: req.params.id }));

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    await ContactList.updateMany({ contacts: contact._id }, { $pull: { contacts: contact._id } });

    await recordActivity({
      action: "contact.deleted",
      entityType: "Contact",
      entityId: contact._id,
      actor: req.user?._id,
      message: `${contact.name} was deleted from contacts`,
      metadata: { email: contact.email, status: contact.status, city: contact.city },
    });

    res.json({ success: true, message: "Contact deleted" });
  } catch (error) {
    next(error);
  }
};

export const getContactStats = async (req, res, next) => {
  try {
    const filter = scopeContactFilter(req);
    const [total, active, leads, customers] = await Promise.all([
      Contact.countDocuments(filter),
      Contact.countDocuments({ ...filter, status: { $in: ["Customer", "Prospect"] } }),
      Contact.countDocuments({ ...filter, status: "Lead" }),
      Contact.countDocuments({ ...filter, status: "Customer" }),
    ]);

    res.json({ success: true, stats: { total, active, leads, customers } });
  } catch (error) {
    next(error);
  }
};

export const getContactLists = async (req, res, next) => {
  try {
    const lists = await ContactList.find(scopeContactListFilter(req))
      .populate("contacts", "name email phone city status createdAt")
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, lists: lists.map(toClientContactList) });
  } catch (error) {
    next(error);
  }
};

export const createContactList = async (req, res, next) => {
  try {
    const { name, description = "", color = "#2563eb", contactIds = [] } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Folder name is required" });
    }

    const list = await ContactList.create({
      name: name.trim(),
      description: description.trim(),
      color,
      contacts: normalizeContactIds(contactIds),
      createdBy: req.user?._id,
    });

    // A real folder now exists - drop the demo/seed data for this workspace.
    await clearSeedDataForTenant();

    await recordActivity({
      action: "contact_list.created",
      entityType: "ContactList",
      entityId: list._id,
      actor: req.user?._id,
      message: `${list.name} contact folder was created`,
      metadata: { contactCount: list.contacts.length },
    });

    const populated = await ContactList.findById(list._id)
      .populate("contacts", "name email phone city status createdAt")
      .lean();

    res.status(201).json({ success: true, list: toClientContactList(populated) });
  } catch (error) {
    next(error);
  }
};

export const updateContactList = async (req, res, next) => {
  try {
    const { name, description, color, contactIds } = req.body;
    const update = {};

    if (name !== undefined) update.name = name.trim();
    if (description !== undefined) update.description = description.trim();
    if (color !== undefined) update.color = color;
    if (contactIds !== undefined) update.contacts = normalizeContactIds(contactIds);

    const list = await ContactList.findOneAndUpdate(scopeOwnedContactListFilter(req, { _id: req.params.listId }), update, {
      new: true,
      runValidators: true,
    })
      .populate("contacts", "name email phone city status createdAt")
      .lean();

    if (!list) {
      return res.status(404).json({ success: false, message: "Contact folder not found" });
    }

    res.json({ success: true, list: toClientContactList(list) });
  } catch (error) {
    next(error);
  }
};

export const deleteContactList = async (req, res, next) => {
  try {
    const list = await ContactList.findOneAndDelete(scopeOwnedContactListFilter(req, { _id: req.params.listId }));

    if (!list) {
      return res.status(404).json({ success: false, message: "Contact folder not found" });
    }

    res.json({ success: true, message: "Contact folder deleted" });
  } catch (error) {
    next(error);
  }
};

export const addContactsToList = async (req, res, next) => {
  try {
    const contactIds = normalizeContactIds(req.body.contactIds);

    if (contactIds.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one contact" });
    }

    const list = await ContactList.findOneAndUpdate(
      scopeOwnedContactListFilter(req, { _id: req.params.listId }),
      { $addToSet: { contacts: { $each: contactIds } } },
      { new: true }
    )
      .populate("contacts", "name email phone city status createdAt")
      .lean();

    if (!list) {
      return res.status(404).json({ success: false, message: "Contact folder not found" });
    }

    res.json({ success: true, list: toClientContactList(list) });
  } catch (error) {
    next(error);
  }
};

export const removeContactsFromList = async (req, res, next) => {
  try {
    const contactIds = normalizeContactIds(req.body.contactIds);

    const list = await ContactList.findOneAndUpdate(
      scopeOwnedContactListFilter(req, { _id: req.params.listId }),
      { $pull: { contacts: { $in: contactIds } } },
      { new: true }
    )
      .populate("contacts", "name email phone city status createdAt")
      .lean();

    if (!list) {
      return res.status(404).json({ success: false, message: "Contact folder not found" });
    }

    res.json({ success: true, list: toClientContactList(list) });
  } catch (error) {
    next(error);
  }
};

export const sendSmsToContact = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "SMS message is required" });
    }

    const contact = await Contact.findOne(scopeContactFilter(req, { _id: req.params.id }));

    if (!contact) {
      return res.status(404).json({ success: false, message: "Contact not found" });
    }

    if (!contact.phone) {
      return res.status(400).json({ success: false, message: "Contact does not have a phone number" });
    }

    try {
      const result = await sendSms({ to: contact.phone, message: message.trim() });
      const log = await SmsLog.create({
        contact: contact._id,
        phone: contact.phone,
        message: message.trim(),
        status: result.mock ? "mock" : "sent",
        provider: result.provider,
        providerMessageId: result.messageId || "",
        sentBy: req.user?._id,
      });

      try {
        const notif = await Notification.create({
          type: "System Alert",
          title: result.mock ? "SMS Sent (Mock Mode)" : "SMS Sent Successfully",
          desc: `SMS delivery recorded for ${contact.name} (${contact.phone}).`,
          recipient: req.user?._id,
          read: false,
          isRead: false
        });
        sendRealTimeNotification(req.user?._id, toClientNotification(notif));
      } catch (err) {
        console.error("Failed to create real-time notification on SMS send:", err);
      }

      await recordActivity({
        action: "sms.sent",
        entityType: "Contact",
        entityId: contact._id,
        actor: req.user?._id,
        message: `SMS sent to ${contact.name}`,
        metadata: { provider: result.provider, status: log.status },
      });

      res.json({
        success: true,
        message: result.mock ? "SMS logged in mock mode. Check backend terminal." : "SMS sent successfully.",
        log,
      });
    } catch (error) {
      try {
        const notif = await Notification.create({
          type: "System Alert",
          title: "SMS Delivery Failed",
          desc: `Failed to send SMS to ${contact.name} (${contact.phone}): ${error.message}`,
          recipient: req.user?._id,
          read: false,
          isRead: false
        });
        sendRealTimeNotification(req.user?._id, toClientNotification(notif));
      } catch (err) {
        console.error("Failed to create failure notification:", err);
      }

      await SmsLog.create({
        contact: contact._id,
        phone: contact.phone,
        message: message.trim(),
        status: "failed",
        provider: process.env.SMS_PROVIDER || "mock",
        error: error.message,
        sentBy: req.user?._id,
      });

      res.status(500).json({
        success: false,
        message: "SMS failed to send.",
        detail: error.message,
      });
    }
  } catch (error) {
    next(error);
  }
};

export const sendBulkSmsToContacts = async (req, res, next) => {
  try {
    const { message, search = "" } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "SMS message is required" });
    }

    const contacts = await Contact.find(
      scopeContactFilter(req, {
        ...buildContactFilter(search),
        phone: { $exists: true, $ne: "" },
      })
    ).lean();

    if (contacts.length === 0) {
      return res.status(400).json({ success: false, message: "No contacts with phone numbers found" });
    }

    const results = [];

    for (const contact of contacts) {
      try {
        const result = await sendSms({ to: contact.phone, message: message.trim() });
        const log = await SmsLog.create({
          contact: contact._id,
          phone: contact.phone,
          message: message.trim(),
          status: result.mock ? "mock" : "sent",
          provider: result.provider,
          providerMessageId: result.messageId || "",
          sentBy: req.user?._id,
        });
        results.push({ contact: contact._id, success: true, log });
      } catch (error) {
        const log = await SmsLog.create({
          contact: contact._id,
          phone: contact.phone,
          message: message.trim(),
          status: "failed",
          provider: process.env.SMS_PROVIDER || "mock",
          error: error.message,
          sentBy: req.user?._id,
        });
        results.push({ contact: contact._id, success: false, error: error.message, log });
      }
    }

    const sent = results.filter((result) => result.success).length;
    const failed = results.length - sent;
    const firstError = results.find((result) => !result.success)?.error;

    await recordActivity({
      action: "sms.bulk_sent",
      entityType: "Contact",
      actor: req.user?._id,
      message: `Bulk SMS completed for ${results.length} contacts`,
      metadata: { sent, failed, search },
    });

    res.json({
      success: failed === 0,
      message: firstError
        ? `SMS complete: ${sent} sent, ${failed} failed. Reason: ${firstError}`
        : `SMS complete: ${sent} sent, ${failed} failed.`,
      sent,
      failed,
      total: results.length,
      results,
    });
  } catch (error) {
    next(error);
  }
};

export const importFileContacts = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, message: "Please upload a file" });
    }

    const ext = file.originalname.split(".").pop().toLowerCase();
    let contacts = [];

    if (ext === "xlsx" || ext === "xls" || ext === "csv") {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      contacts = parseSpreadsheetContacts(sheet);
    } else if (ext === "docx") {
      const result = await mammoth.extractRawText({ path: file.path });
      const text = result.value;
      contacts = parseTextContacts(text);
    } else if (ext === "pdf") {
      const text = await extractPdfText(file.path);
      contacts = parseTextContacts(text);
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ success: false, message: "Unsupported file type. Use CSV, Excel, Word, or PDF." });
    }

    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error("Failed to delete temp upload file:", err);
    }

    if (contacts.length === 0) {
      return res.status(400).json({ success: false, message: "No contacts containing email addresses found in the file." });
    }

    if (req.user?.role !== "Admin") {
      const contactLimit = req.user?.plan?.contactLimit || 1000;
      const currentCount = await Contact.countDocuments(scopeContactFilter(req));
      if (currentCount + contacts.length > contactLimit) {
        return res.status(403).json({
          success: false,
          message: `Plan contact limit would be exceeded. Importing ${contacts.length} would put you at ${currentCount + contacts.length}/${contactLimit} contacts.`,
        });
      }
    }

    const inserted = [];
    const skipped = [];

    for (const contactData of contacts) {
      const normalizedEmail = contactData.email.toLowerCase().trim();
      const existing = await Contact.findOne(scopeContactFilter(req, { email: normalizedEmail }));

      if (existing) {
        skipped.push(contactData.email);
        continue;
      }

      const newContact = await Contact.create({
        name: contactData.name,
        email: normalizedEmail,
        phone: contactData.phone || "",
        city: contactData.city || "",
        status: contactData.status || "Lead",
        addedBy: req.user?._id,
      });

      inserted.push(newContact);
      await syncLeadAccountForContact(newContact);

      // Cap automation firing on bulk imports so importing hundreds of
      // contacts doesn't send hundreds of emails synchronously in one
      // request. The rest are still imported normally, just without
      // triggering "New contact added" workflows.
      if (inserted.length <= 25) {
        await runNewContactAutomations(newContact, req.user?._id);
      }
    }

    await recordActivity({
      action: "contact.bulk_import",
      entityType: "Contact",
      actor: req.user?._id,
      message: `Imported ${inserted.length} contacts from bulk file (${file.originalname})`,
      metadata: { total: contacts.length, imported: inserted.length, skipped: skipped.length },
    });

    if (inserted.length > 0) {
      // Real contacts were imported - drop the demo/seed data for this workspace.
      await clearSeedDataForTenant();
    }

    res.json({
      success: true,
      message: `Successfully imported ${inserted.length} contacts. ${skipped.length} duplicates skipped.`,
      importedCount: inserted.length,
      skippedCount: skipped.length,
      contacts: inserted,
    });
  } catch (error) {
    next(error);
  }
};

const parseTextContacts = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const parsed = [];

  for (const line of lines) {
    const emailMatch = line.match(emailPattern);
    if (emailMatch) {
      const email = emailMatch[0].toLowerCase();
      const parts = line.split(/[,\t|;]/).map((p) => p.trim());
      let name = "";
      let phone = "";
      let city = "";
      let status = "Lead";

      if (parts.length > 0) {
        const emailIndex = parts.findIndex((p) => p.toLowerCase() === email);
        const nonEmailParts = parts.filter((_, idx) => idx !== emailIndex);

        if (nonEmailParts.length > 0) {
          name = nonEmailParts[0];
        }
        if (nonEmailParts.length > 1) {
          if (/^[0-9+\s.-]+$/.test(nonEmailParts[1]) && nonEmailParts[1].length > 5) {
            phone = nonEmailParts[1];
          } else {
            city = nonEmailParts[1];
          }
        }
        if (nonEmailParts.length > 2) {
          if (!phone && /^[0-9+\s.-]+$/.test(nonEmailParts[2])) {
            phone = nonEmailParts[2];
          } else if (!city) {
            city = nonEmailParts[2];
          }
        }

        for (const part of parts) {
          const normalizedStatus = normalizeContactStatus(part);
          if (normalizedStatus !== "Lead" || part.trim().toLowerCase() === "lead") {
            status = normalizedStatus;
          }
        }
      }

      if (!name) {
        name = email.split("@")[0];
      }

      parsed.push({ name, email, phone, city, status });
    }
  }

  return parsed;
};
