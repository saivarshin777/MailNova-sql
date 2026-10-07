import express from "express";
import multer from "multer";
import {
  addContactsToList,
  createContact,
  createContactList,
  deleteContact,
  deleteContactList,
  getContacts,
  getContactLists,
  getContactStats,
  importFileContacts,
  removeContactsFromList,
  sendBulkSmsToContacts,
  sendSmsToContact,
  updateContact,
  updateContactList,
} from "../controllers/contactController.js";
import { allowRoles, protect } from "../middleware/authMiddleware.js";
import { smsSendLimiter } from "../middleware/rateLimitMiddleware.js";
import { validateContactPayload } from "../middleware/validationMiddleware.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.use(protect);

router.post("/import-file", allowRoles("Admin", "Manager", "User"), upload.single("file"), importFileContacts);

router.get("/stats", getContactStats);
router.get("/lists", getContactLists);
router.post("/lists", allowRoles("Admin", "Manager", "User"), createContactList);
router.put("/lists/:listId", allowRoles("Admin", "Manager", "User"), updateContactList);
router.delete("/lists/:listId", allowRoles("Admin", "Manager", "User"), deleteContactList);
router.post("/lists/:listId/contacts", allowRoles("Admin", "Manager", "User"), addContactsToList);
router.delete("/lists/:listId/contacts", allowRoles("Admin", "Manager", "User"), removeContactsFromList);
router.post("/sms", allowRoles("Admin", "Manager", "User", "Lead"), smsSendLimiter, sendBulkSmsToContacts);
router.get("/", getContacts);
router.post("/", allowRoles("Admin", "Manager", "User"), validateContactPayload, createContact);
router.post("/:id/sms", allowRoles("Admin", "Manager", "User", "Lead"), smsSendLimiter, sendSmsToContact);
router.put("/:id", allowRoles("Admin", "Manager", "User"), validateContactPayload, updateContact);
router.delete("/:id", allowRoles("Admin", "Manager", "User"), deleteContact);

export default router;
