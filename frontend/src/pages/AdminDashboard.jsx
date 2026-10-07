import { useState, useEffect } from "react";
import "../App.css";
import Sidebar from "../Sidebar";

import Navbar from "../components/Navbar";
import StatsCards from "../components/StatsCards";
import AdvancedAnalytics from "../components/AdvancedAnalytics";
import PerformanceChart from "../components/PerformanceChart";
import ChannelChart from "../components/ChannelChart";
import AnalyticsCards from "../components/AnalyticsCards";
import ProgressSection from "../components/ProgressSection";
import Notifications from "../components/Notifications";
import { useNotifications } from "../context/NotificationContext";
import TopPerformers from "../components/TopPerformers";
import Footer from "../components/Footer";
import Schedule from "../components/Schedule";
import ContactGrowth from "../components/ContactGrowth";
import EmailUsage from "../components/EmailUsage";
import TemplateStudio from "../components/TemplateStudio";
import AutomationWorkflows from "../components/AutomationWorkflows";
import CampaignWizard from "../components/CampaignWizard";
import CommandPalette from "../components/CommandPalette";
import QuickActionCards from "../components/QuickActionCards";
import ToastStack from "../components/ToastStack";
import { adminApi, authApi, contactApi, dashboardApi, paymentApi } from "../services/api";
import { getStoredUser, isOwnerUser } from "../utils/auth.js";
import { getStoredTheme, setStoredTheme } from "../utils/theme.js";
import { parseCsvLine } from "../utils/csv.js";
import {
  FaMobileAlt,
  FaDesktop,
  FaTabletAlt,
  FaArrowUp,
  FaArrowLeft,
  FaGlobeAsia,
  FaEnvelope,
  FaEnvelopeOpenText,
  FaLink,
  FaExclamationTriangle,
  FaUserPlus,
  FaBullhorn,
  FaUsers,
  FaChartLine,
  FaCheckCircle,
  FaUserSlash,
  FaBell,
  FaCog,
  FaSearch,
  FaDownload,
  FaEye,
  FaEdit,
  FaTrash,
  FaMapMarkerAlt,
  FaPhone,
  FaSms,
  FaUserCircle,
  FaBolt,
  FaKeyboard,
  FaUserShield,
  FaCreditCard,
  FaServer,
  FaClipboardList,
  FaShieldAlt,
  FaSlidersH,
  FaLock,
  FaKey,
  FaPalette,
  FaPaperPlane,
  FaTimes,
  FaWhatsapp,
  FaFileImport,
} from "react-icons/fa";

function AdminDashboard()  {
 const [darkMode, setDarkMode] = useState(getStoredTheme());
const [activePage, setActivePage] = useState("Dashboard");
const [sidebarOpen, setSidebarOpen] = useState(true);
const [showCompose, setShowCompose] = useState(false);
const [showAddContact, setShowAddContact] = useState(false);
const [showImportContacts, setShowImportContacts] = useState(false);
const [csvFile, setCsvFile] = useState(null);
const [importingContacts, setImportingContacts] = useState(false);
const [contacts, setContacts] = useState([]);
const [contactLists, setContactLists] = useState([]);
const [activeContactListId, setActiveContactListId] = useState("all");
const [selectedContactIds, setSelectedContactIds] = useState([]);
const [newListName, setNewListName] = useState("");
const [newListDescription, setNewListDescription] = useState("");
const [newListColor, setNewListColor] = useState("#0f766e");
const [selectedContact, setSelectedContact] = useState(null);
const [name, setName] = useState("");
const [email, setEmail] = useState("");
const [phone, setPhone] = useState("");
const [city, setCity] = useState("");
const [status, setStatus] = useState("Lead");
const [page, setPage] = useState("dashboard");
const [searchTerm, setSearchTerm] = useState("");
const [dashboardData, setDashboardData] = useState(null);
const [analyticsData, setAnalyticsData] = useState(null);
const [analyticsRange, setAnalyticsRange] = useState("All Time");
const [analyticsLoading, setAnalyticsLoading] = useState(true);
const [campaignSearch, setCampaignSearch] = useState("");
const [searchedCampaigns, setSearchedCampaigns] = useState([]);
const [showAllSearchResults, setShowAllSearchResults] = useState(false);
const [showAllTopCampaigns, setShowAllTopCampaigns] = useState(false);
const [showAllAdminUsers, setShowAllAdminUsers] = useState(false);
const [showAllPlanUsers, setShowAllPlanUsers] = useState(false);
const [showAllAdminLogs, setShowAllAdminLogs] = useState(false);
const [showAllAdminContacts, setShowAllAdminContacts] = useState(false);
const [showAllContactFolders, setShowAllContactFolders] = useState(false);
const [showAdminSegments, setShowAdminSegments] = useState(false);
const [showDemoAdminUsers, setShowDemoAdminUsers] = useState(false);
const [campaignName, setCampaignName] = useState("");
const [campaignSubject, setCampaignSubject] = useState("");
const [campaignContent, setCampaignContent] = useState("");
const [campaignRecipients, setCampaignRecipients] = useState("");
const [selectedCampaignListId, setSelectedCampaignListId] = useState("");
const [campaignError, setCampaignError] = useState("");
const [apiError, setApiError] = useState("");
const { notifications, markAsRead: handleMarkNotificationRead, markAllAsRead: handleMarkAllNotificationsRead } = useNotifications();
const [templates, setTemplates] = useState([]);
const [selectedTemplateId, setSelectedTemplateId] = useState("");
const [templateDraft, setTemplateDraft] = useState(null);
const [templateError, setTemplateError] = useState("");
const [showSmsComposer, setShowSmsComposer] = useState(false);
const [smsTarget, setSmsTarget] = useState(null);
const [smsReturnPage, setSmsReturnPage] = useState("SMS Campaign");
const [smsMessage, setSmsMessage] = useState("");
const [sendingSms, setSendingSms] = useState(false);
const [commandOpen, setCommandOpen] = useState(false);
const [toasts, setToasts] = useState([]);
const [segmentFilter, setSegmentFilter] = useState("all");
const [locationFilter, setLocationFilter] = useState("all");
const [engagementFilter, setEngagementFilter] = useState("all");
const [adminOverview, setAdminOverview] = useState(null);
const [adminUsers, setAdminUsers] = useState([]);
const [adminLogs, setAdminLogs] = useState([]);
const [adminError, setAdminError] = useState("");
const [paymentConfig, setPaymentConfig] = useState(null);
const currentUser = getStoredUser();
const [settingsDraft, setSettingsDraft] = useState(() => ({
  name: currentUser?.name || "",
  email: currentUser?.email || "",
  phone: currentUser?.phone || "",
  senderName: currentUser?.senderName || "MailNova Workspace",
  replyTo: currentUser?.replyTo || currentUser?.email || "",
}));
const [passwordDraft, setPasswordDraft] = useState({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const [savingSettings, setSavingSettings] = useState(false);
const [savingPassword, setSavingPassword] = useState(false);
const roleOptions = ["Admin", "User"];
const isProtectedOwner = isOwnerUser;
const currentUserIsOwner = isProtectedOwner(currentUser);
const isLikelyDemoUser = (user) => {
  if (!user || isProtectedOwner(user)) return false;
  const source = `${user.name || ""} ${user.email || ""}`.toLowerCase();
  return [
    "test",
    "demo",
    "dummy",
    "john",
    "doe",
    "jjthompson",
    "ananya",
    "deepika",
    "example.com",
  ].some((marker) => source.includes(marker));
};
const getContactId = (contact) => String(contact?._id || contact?.id || contact || "");
const showToast = (title, message = "", type = "info") => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  setToasts((current) => [...current, { id, title, message, type }].slice(-4));
  window.setTimeout(() => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, 5200);
};
const dismissToast = (id) => {
  setToasts((current) => current.filter((toast) => toast.id !== id));
};
const activeContactList =
  activeContactListId === "all"
    ? null
    : contactLists.find((list) => list._id === activeContactListId || list.id === activeContactListId);
const activeContactListIds = new Set(
  (activeContactList?.contacts || []).map((contact) => getContactId(contact))
);
const scopedContacts = activeContactList
  ? contacts.filter((contact) => activeContactListIds.has(getContactId(contact)))
  : contacts;
const contactStats = {
  total: contacts.length,
  active: contacts.filter((contact) =>
    ["Customer", "Prospect"].includes(contact.status)
  ).length,
  newSubscribers: contacts.filter((contact) => {
    if (!contact.createdAt) return false;
    const created = new Date(contact.createdAt).getTime();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return created >= thirtyDaysAgo;
  }).length,
  inactive: contacts.filter((contact) => contact.status === "Inactive").length,
};
const uniqueLocations = [
  ...new Set(contacts.map((contact) => contact.city).filter(Boolean)),
].sort();
const segmentedContacts = scopedContacts.filter((contact) => {
  const created = contact.createdAt ? new Date(contact.createdAt).getTime() : 0;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const segmentMatches =
    segmentFilter === "all" ||
    (segmentFilter === "active" && ["Customer", "Prospect"].includes(contact.status)) ||
    (segmentFilter === "inactive" && contact.status === "Inactive") ||
    (segmentFilter === "recent" && created >= thirtyDaysAgo) ||
    (segmentFilter === "high-engagement" && contact.status === "Customer") ||
    (segmentFilter === "leads" && contact.status === "Lead");
  const locationMatches = locationFilter === "all" || contact.city === locationFilter;
  const engagementMatches =
    engagementFilter === "all" ||
    (engagementFilter === "opened" && ["Customer", "Prospect"].includes(contact.status)) ||
    (engagementFilter === "clicked" && contact.status === "Customer") ||
    (engagementFilter === "not-opened" && ["Lead", "Inactive"].includes(contact.status));

  return segmentMatches && locationMatches && engagementMatches;
});
const visibleContacts = segmentedContacts.filter((contact) => {
  const query = searchTerm.toLowerCase();
  return (
    contact.name?.toLowerCase().includes(query) ||
    contact.email?.toLowerCase().includes(query) ||
    contact.city?.toLowerCase().includes(query) ||
    contact.phone?.toLowerCase().includes(query)
  );
});
const displayAdminUsers = showDemoAdminUsers ? adminUsers : adminUsers.filter((user) => !isLikelyDemoUser(user));
const hiddenDemoUserCount = Math.max(adminUsers.length - displayAdminUsers.length, 0);
const visibleAdminDirectoryUsers = showAllAdminUsers ? displayAdminUsers : displayAdminUsers.slice(0, 8);
const visibleAdminPlanUsers = showAllPlanUsers ? displayAdminUsers : displayAdminUsers.slice(0, 8);
const visibleAdminLogs = showAllAdminLogs ? adminLogs : adminLogs.slice(0, 8);
const visibleAdminContacts = showAllAdminContacts ? visibleContacts : visibleContacts.slice(0, 10);
const visibleContactFolders = showAllContactFolders ? contactLists : contactLists.slice(0, 4);
useEffect(() => {
  setStoredTheme(darkMode);
  if (darkMode) {
    document.body.style.backgroundColor = "#111827";
    document.body.style.color = "#ffffff";
  } else {
    document.body.style.backgroundColor = "#f8fafc";
    document.body.style.color = "#000000";
  }
}, [darkMode]);

useEffect(() => {
  const handleShortcut = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      setCommandOpen((current) => !current);
    }
  };

  window.addEventListener("keydown", handleShortcut);
  return () => window.removeEventListener("keydown", handleShortcut);
}, []);

useEffect(() => {
  const handleOpenDetail = () => {
    setActivePage("Notifications");
  };
  window.addEventListener("openNotificationDetail", handleOpenDetail);
  return () => window.removeEventListener("openNotificationDetail", handleOpenDetail);
}, []);
const loadContacts = async () => {
  try {
    const response = await contactApi.getContacts();
    const list = response.data.contacts || [];
    setContacts(list);
    setSelectedContact(list[0] || null);
  } catch (error) {
    console.error("Failed to load contacts:", error);
    setContacts([]);
  }
};

const loadContactLists = async () => {
  try {
    const response = await contactApi.getContactLists();
    const lists = response.data.lists || [];
    setContactLists(lists);

    if (
      activeContactListId !== "all" &&
      !lists.some((list) => list._id === activeContactListId || list.id === activeContactListId)
    ) {
      setActiveContactListId("all");
    }
  } catch (error) {
    console.error("Failed to load contact folders:", error);
    setContactLists([]);
  }
};

useEffect(() => {
  loadContacts();
  const interval = setInterval(loadContacts, 10000);
  return () => clearInterval(interval);
}, []);

useEffect(() => {
  loadContactLists();
  const interval = setInterval(loadContactLists, 10000);
  return () => clearInterval(interval);
}, []);

const handleAddContact = async (newContact) => {
  try {
    const response = await contactApi.createContact(newContact);
    if (response.data.success) {
      await loadContacts();
      await loadContactLists();
      setSelectedContact(response.data.contact);
      showToast("Contact saved", `${newContact.name} was added to the audience.`, "success");
    }
  } catch (error) {
    console.error("Failed to add contact:", error);
    showToast("Contact save failed", error.response?.data?.message || "Failed to save contact", "error");
    return;
  }

  setName("");
  setEmail("");
  setPhone("");
  setCity("");
  setStatus("Lead");

  setShowAddContact(false);
  setActivePage("Contacts");
};

const handleDeleteContact = async (contact) => {
  if (!contact?._id) return;

  try {
    await contactApi.deleteContact(contact._id);
    await loadContacts();
    await loadContactLists();
    showToast("Contact deleted", `${contact.name || "Contact"} was removed.`, "success");
  } catch (error) {
    console.error("Failed to delete contact:", error);
    showToast("Delete failed", error.response?.data?.message || "Failed to delete contact", "error");
  }
};

const handleImportCsv = async () => {
  if (!csvFile) {
    showToast("No file selected", "Please choose a CSV file first.", "warning");
    return;
  }

  // This used to parse the CSV in the browser and create contacts one by
  // one with contactApi.createContact() - any single bad row (a status
  // value that didn't match the exact enum casing, a stray blank line,
  // an existing duplicate) silently failed with just a console.error and
  // no feedback, so imports could quietly do nothing. This now reuses the
  // same backend bulk endpoint (/api/contacts/import-file) that already
  // works correctly on the user dashboard - it does real header-aware
  // parsing, dedupes existing emails instead of erroring on them, and
  // reports exactly how many were imported vs skipped.
  setImportingContacts(true);
  try {
    const formData = new FormData();
    formData.append("file", csvFile);
    const response = await contactApi.importFile(formData);

    await loadContacts();
    await loadContactLists();
    setShowImportContacts(false);
    setCsvFile(null);
    setActivePage("Contacts");
    showToast(
      "Import complete",
      response.data?.message || "Contacts imported successfully.",
      "success"
    );
  } catch (err) {
    console.error("Failed to import contacts:", err);
    showToast(
      "Import failed",
      err.response?.data?.message || "Could not import this file. Check the format and try again.",
      "error"
    );
  } finally {
    setImportingContacts(false);
  }
};

const toggleContactSelection = (contactId) => {
  setSelectedContactIds((current) =>
    current.includes(contactId)
      ? current.filter((id) => id !== contactId)
      : [...current, contactId]
  );
};

const selectAllVisibleContacts = () => {
  const visibleIds = visibleContacts.map((contact) => getContactId(contact));
  setSelectedContactIds((current) => {
    const allSelected = visibleIds.every((id) => current.includes(id));
    return allSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])];
  });
};

const resetContactFolderForm = () => {
  setNewListName("");
  setNewListDescription("");
  setNewListColor("#0f766e");
};

const handleCreateContactList = async () => {
  if (!newListName.trim()) {
    showToast("Folder name required", "Please enter a folder name.", "warning");
    return;
  }

  try {
    const response = await contactApi.createContactList({
      name: newListName,
      description: newListDescription,
      color: newListColor,
      contactIds: selectedContactIds,
    });
    await loadContactLists();
    setActiveContactListId(response.data.list._id);
    setSelectedContactIds([]);
    resetContactFolderForm();
    showToast("Contact folder created", `${response.data.list.name} is ready for campaigns.`, "success");
  } catch (error) {
    console.error("Failed to create contact folder:", error);
    showToast("Folder create failed", error.response?.data?.message || "Could not create contact folder.", "error");
  }
};

const handleAddSelectedToList = async (listId) => {
  if (selectedContactIds.length === 0) {
    showToast("Select contacts first", "Choose one or more contacts before adding them to a folder.", "warning");
    return;
  }

  try {
    await contactApi.addContactsToList(listId, { contactIds: selectedContactIds });
    await loadContactLists();
    setSelectedContactIds([]);
    showToast("Folder updated", "Selected contacts were added to the folder.", "success");
  } catch (error) {
    console.error("Failed to add contacts to folder:", error);
    showToast("Folder update failed", error.response?.data?.message || "Could not update contact folder.", "error");
  }
};

const handleRemoveSelectedFromList = async () => {
  if (!activeContactList || selectedContactIds.length === 0) return;

  try {
    await contactApi.removeContactsFromList(activeContactList._id, {
      contactIds: selectedContactIds,
    });
    await loadContactLists();
    setSelectedContactIds([]);
    showToast("Contacts removed", `Selected contacts were removed from ${activeContactList.name}.`, "success");
  } catch (error) {
    console.error("Failed to remove contacts from folder:", error);
    showToast("Remove failed", error.response?.data?.message || "Could not remove contacts from folder.", "error");
  }
};

const handleDeleteContactList = async (listId) => {
  if (!window.confirm("Delete this contact folder? Contacts will stay in your directory.")) return;

  try {
    await contactApi.deleteContactList(listId);
    await loadContactLists();
    setActiveContactListId("all");
    setSelectedContactIds([]);
    showToast("Contact folder deleted", "Contacts remain available in the full directory.", "success");
  } catch (error) {
    console.error("Failed to delete contact folder:", error);
    showToast("Folder delete failed", error.response?.data?.message || "Could not delete contact folder.", "error");
  }
};

const applyContactListToCampaign = (list) => {
  setSelectedCampaignListId(list._id || list.id);
  setCampaignRecipients("");
  setActivePage("Compose Campaign");
  setShowCompose(false);
};

const openSmsComposer = (contact = null) => {
  setSmsTarget(contact);
  setSmsMessage("");
  setSmsReturnPage(activePage && activePage !== "Compose SMS" ? activePage : "SMS Campaign");
  setShowSmsComposer(false);
  setActivePage("Compose SMS");
};

const handleSendSms = async () => {
  if (!smsMessage.trim()) {
    showToast("SMS message required", "Please enter an SMS message.", "warning");
    return;
  }

  setSendingSms(true);

  try {
    const response = smsTarget?._id
      ? await contactApi.sendSms(smsTarget._id, { message: smsMessage })
      : await contactApi.sendBulkSms({ message: smsMessage, search: searchTerm });

    showToast("SMS request completed", response.data.message || "SMS request completed.", "success");
    setShowSmsComposer(false);
    setSmsMessage("");
    setSmsTarget(null);
    setActivePage(smsReturnPage || "SMS Campaign");
  } catch (error) {
    console.error("Failed to send SMS:", error);
    showToast("SMS failed", error.response?.data?.message || "Failed to send SMS.", "error");
  } finally {
    setSendingSms(false);
  }
};

const loadDashboard = async () => {
  try {
    const [dashboardResponse, analyticsResponse] = await Promise.all([
      dashboardApi.getDashboard(),
      dashboardApi.getAnalytics(analyticsRange),
    ]);
    setDashboardData(dashboardResponse.data);
    setAnalyticsData(analyticsResponse.data);
    setAnalyticsLoading(false);
    setSearchedCampaigns(dashboardResponse.data.campaigns);
    setApiError("");
  } catch (error) {
    console.error(error);
    setApiError("Backend is not running. Start it with npm run backend.");
    setAnalyticsLoading(false);
  }
};

const loadAdminPanel = async () => {
  try {
    const [overviewResponse, usersResponse, logsResponse] = await Promise.all([
      adminApi.getOverview(),
      adminApi.getUsers(),
      adminApi.getLogs(),
    ]);

    setAdminOverview(overviewResponse.data);
    setAdminUsers(usersResponse.data.users || []);
    setAdminLogs(logsResponse.data.logs || []);
    setAdminError("");
  } catch (error) {
    console.error(error);
    setAdminError("Admin APIs are unavailable. Start the backend or login with an Admin account.");
  }

  try {
    const configResponse = await paymentApi.getConfig();
    setPaymentConfig(configResponse.data);
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  loadDashboard();
  const interval = setInterval(loadDashboard, 10000);
  return () => clearInterval(interval);
}, [analyticsRange]);

useEffect(() => {
  loadAdminPanel();
  const interval = setInterval(loadAdminPanel, 15000);
  return () => clearInterval(interval);
}, []);

const loadTemplates = async () => {
  try {
    const response = await dashboardApi.getTemplates();
    const list = response.data || [];
    setTemplates(list);
    if (!templateDraft && list.length) {
      setSelectedTemplateId(list[0]._id);
      setTemplateDraft(list[0]);
    }
    setTemplateError("");
  } catch (error) {
    console.error(error);
    setTemplateError("Could not load templates. Please make sure the backend is running.");
  }
};

useEffect(() => {
  loadTemplates();
  const interval = setInterval(loadTemplates, 10000);
  return () => clearInterval(interval);
}, []);

const campaigns = dashboardData?.campaigns || [];
const topCampaigns = dashboardData?.topCampaigns || campaigns;
const campaignResults = campaignSearch ? searchedCampaigns : campaigns;
const visibleCampaignResults = showAllSearchResults
  ? campaignResults
  : campaignResults.slice(0, 3);
const campaignStatusText = (campaign) => String(campaign?.status || campaign?.sendStatus || "").toLowerCase();
const draftCampaigns = campaigns.filter((campaign) => campaignStatusText(campaign) === "draft");
const sentCampaigns = campaigns.filter((campaign) => campaignStatusText(campaign) !== "draft");
const savedTemplates = templates.filter((template) => template.createdBy);
const phoneReadyContacts = contacts.filter((contact) => contact.phone);
const smsMissingPhoneCount = Math.max(contacts.length - phoneReadyContacts.length, 0);
const smsReadinessRate = contacts.length ? Math.round((phoneReadyContacts.length / contacts.length) * 100) : 0;
const smsStatusRows = ["Lead", "Prospect", "Customer", "Inactive"].map((status) => {
  const total = contacts.filter((contact) => contact.status === status).length;
  const phoneReady = contacts.filter((contact) => contact.status === status && contact.phone).length;
  return {
    status,
    total,
    phoneReady,
    missing: Math.max(total - phoneReady, 0),
    readiness: total ? Math.round((phoneReady / total) * 100) : 0,
  };
});
const emailTotals = campaigns.reduce(
  (totals, campaign) => ({
    sent: totals.sent + Number(campaign.emailsSent || 0),
    delivered: totals.delivered + Number(campaign.delivered || 0),
    opened: totals.opened + Number(campaign.opened || 0),
    clicked: totals.clicked + Number(campaign.clicked || 0),
    unread: totals.unread + Number(
      campaign.unread ?? Math.max((campaign.delivered || campaign.emailsSent || 0) - (campaign.opened || 0), 0)
    ),
  }),
  { sent: 0, delivered: 0, opened: 0, clicked: 0, unread: 0 }
);
const emailOpenRate = emailTotals.sent ? Math.round((emailTotals.opened / emailTotals.sent) * 100) : 0;
const emailClickRate = emailTotals.sent ? Math.round((emailTotals.clicked / emailTotals.sent) * 100) : 0;
const activityIconByKind = {
  sent: <FaEnvelope />,
  open: <FaEnvelopeOpenText />,
  click: <FaLink />,
  warning: <FaExclamationTriangle />,
  user: <FaUserPlus />,
};
const activities = (dashboardData?.recentActivity || []).map((activity) => ({
  ...activity,
  icon: activityIconByKind[activity.kind] || <FaBullhorn />,
}));
const visibleActivities = activities;
const notificationSummary = dashboardData?.notificationsSummary || {
  total: notifications.length,
  unread: notifications.filter((item) => !item.read).length,
  read: notifications.filter((item) => item.read).length,
  campaignAlerts: notifications.filter((item) => item.type === "campaign").length,
  systemUpdates: notifications.filter((item) => item.type === "system").length,
};
const adminMonitoring = adminOverview?.monitoring || {};
const adminPlans = adminOverview?.plans || [];
const adminRoleBreakdown = adminOverview?.users?.roles || [];
const adminStatusBreakdown = adminOverview?.users?.statuses || [];
const formatLogTime = (value) =>
  value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Just now";

const handleAdminRoleChange = async (userId, role) => {
  const targetUser = adminUsers.find((user) => String(user._id || user.id) === String(userId));
  if (isProtectedOwner(targetUser)) {
    showToast("Protected owner", "Varshini P cannot be demoted or reassigned.", "warning");
    return;
  }

  if ((role === "Admin" || targetUser?.role === "Admin") && !currentUserIsOwner) {
    showToast("Owner approval required", "Only Varshini P can grant or retrieve admin rights.", "warning");
    return;
  }

  try {
    await adminApi.updateUserRole(userId, role);
    await loadAdminPanel();
    showToast("Role updated", "User access was changed successfully.", "success");
  } catch (error) {
    console.error(error);
    showToast("Role update failed", error.response?.data?.message || "Could not update role.", "error");
  }
};

const handleAdminStatusChange = async (userId, status) => {
  const targetUser = adminUsers.find((user) => String(user._id || user.id) === String(userId));
  if (isProtectedOwner(targetUser)) {
    showToast("Protected owner", "Varshini P cannot be suspended.", "warning");
    return;
  }

  if (targetUser?.role === "Admin" && !currentUserIsOwner) {
    showToast("Owner approval required", "Only Varshini P can suspend or reactivate admin accounts.", "warning");
    return;
  }

  try {
    await adminApi.updateUserStatus(userId, status);
    await loadAdminPanel();
    showToast("Status updated", `User account is now ${status}.`, "success");
  } catch (error) {
    console.error(error);
    showToast("Status update failed", error.response?.data?.message || "Could not update account status.", "error");
  }
};

const handleAdminPlanChange = async (userId, plan) => {
  const targetUser = adminUsers.find((user) => String(user._id || user.id) === String(userId));
  if (isProtectedOwner(targetUser)) {
    showToast("Protected owner", "Varshini P cannot be modified from plan controls.", "warning");
    return;
  }

  try {
    await adminApi.updateUserPlan(userId, plan);
    await loadAdminPanel();
    showToast("Plan updated", `User plan changed to ${plan}.`, "success");
  } catch (error) {
    console.error(error);
    showToast("Plan update failed", error.response?.data?.message || "Could not update plan.", "error");
  }
};

const handleCampaignSearch = async (event) => {
  event?.preventDefault();
  try {
    const response = await dashboardApi.getCampaigns(campaignSearch);
    setSearchedCampaigns(response.data);
    setShowAllSearchResults(false);
  } catch (error) {
    console.error(error);
    const query = campaignSearch.toLowerCase();
    setSearchedCampaigns(
      campaigns.filter((campaign) =>
        [campaign.name, campaign.subject, campaign.status].some((field) =>
          String(field).toLowerCase().includes(query)
        )
      )
    );
    setShowAllSearchResults(false);
  }
};

const resetCampaignForm = () => {
  setCampaignName("");
  setCampaignSubject("");
  setCampaignContent("");
  setCampaignRecipients("");
  setSelectedCampaignListId("");
  setCampaignError("");
};

const openCampaignWizard = () => {
  setActivePage("Compose Campaign");
  setShowCompose(false);
};

const openAddContact = () => {
  setActivePage("Create Contact");
  setShowAddContact(false);
};

const openImportContacts = () => {
  setActivePage("Import Contacts");
  setShowImportContacts(false);
};

const selectedTemplate = savedTemplates.find((template) => template._id === selectedTemplateId) || null;
const selectedCampaignList =
  contactLists.find((list) => list._id === selectedCampaignListId || list.id === selectedCampaignListId) || null;

const applyTemplateToCampaign = (template = templateDraft) => {
  if (!template) return;
  setSelectedTemplateId(template._id || selectedTemplateId);
  setCampaignSubject(template.subject || campaignSubject);
  if (!campaignContent.trim()) {
    setCampaignContent("Write the message that should replace {{content}} in this template.");
  }
  setActivePage("Compose Campaign");
  setShowCompose(false);
};

const handleDeleteTemplate = async (template) => {
  if (!template?._id) return;
  if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
  try {
    await dashboardApi.deleteTemplate(template._id);
    setTemplates((current) => current.filter((item) => item._id !== template._id));
    showToast("Template deleted", `${template.name} was removed.`, "success");
  } catch (error) {
    console.error(error);
    showToast("Could not delete template", error.response?.data?.message || "Please try again.", "error");
  }
};

const handleCreateCampaign = async (status = "Running", options = {}) => {
  if (!campaignName.trim() || !campaignSubject.trim()) {
    setCampaignError("Campaign name and email subject are required.");
    return;
  }

  try {
    const response = await dashboardApi.createCampaign({
      name: campaignName,
      subject: campaignSubject,
      content: campaignContent,
      recipients: campaignRecipients,
      contactListId: selectedCampaignListId,
      templateId: selectedTemplateId,
      htmlContent: selectedTemplate?.htmlContent,
      textContent: selectedTemplate?.textContent,
      templateBackground: selectedTemplate?.background,
      templateAccentColor: selectedTemplate?.accentColor,
      status,
      scheduledFor: status === "Draft" ? null : options.scheduledFor || null,
    });
    await loadDashboard();
    await handleCampaignSearch();
    resetCampaignForm();
    setShowCompose(false);
    setActivePage(status === "Draft" ? "Saved Drafts" : "Email Campaign");
    const sendStatus = response.data?.campaign?.sendStatus;
    const sendError = response.data?.campaign?.sendError;
    showToast(
      status === "Draft"
        ? "Campaign draft saved"
        : sendStatus === "failed"
        ? "Campaign saved with send issue"
        : "Campaign sent successfully",
      status === "Draft"
        ? "You can continue editing this campaign later."
        : sendStatus === "failed"
        ? sendError
        : "Campaign performance will appear in analytics after delivery.",
      sendStatus === "failed" ? "warning" : "success"
    );
  } catch (error) {
    console.error(error);
    const message =
      error.response?.data?.error ||
        error.response?.data?.message ||
        "Could not save campaign. Please make sure the backend is running.";
    setCampaignError(message);
    showToast("Campaign save failed", message, "error");
  }
};

const handleUseDraft = (campaign) => {
  setCampaignName(campaign.name || "");
  setCampaignSubject(campaign.subject || "");
  setCampaignContent(campaign.content || campaign.textContent || "");
  setCampaignRecipients(Array.isArray(campaign.recipients) ? campaign.recipients.join(", ") : "");
  setSelectedCampaignListId(campaign.contactListId || "");
  setSelectedTemplateId(campaign.templateId || "");
  setCampaignError("");
  setActivePage("Compose Campaign");
  setShowCompose(false);
  showToast("Draft opened", `${campaign.name || "Draft"} is ready to edit and send.`, "success");
};

const handleSendDraftCopy = async (campaign) => {
  try {
    const response = await dashboardApi.createCampaign({
      name: campaign.name || "Draft Campaign",
      subject: campaign.subject || "Campaign update",
      content: campaign.content || campaign.textContent || "",
      recipients: Array.isArray(campaign.recipients) ? campaign.recipients.join(",") : "",
      contactListId: campaign.contactListId || "",
      templateId: campaign.templateId || "",
      status: "Running",
    });
    await loadDashboard();
    await handleCampaignSearch();
    showToast(
      "Draft sent",
      response.data?.campaign?.sendStatus === "failed"
        ? response.data?.campaign?.sendError || "The draft copy was saved but delivery failed."
        : "A live campaign was created from that draft.",
      response.data?.campaign?.sendStatus === "failed" ? "warning" : "success"
    );
  } catch (error) {
    console.error(error);
    showToast("Draft send failed", error.response?.data?.message || "Could not send this draft.", "error");
  }
};

const handleDeleteDraft = async (campaign) => {
  const id = campaign?.id || campaign?._id;
  if (!id) return;
  if (!window.confirm(`Delete draft "${campaign.name}"? This cannot be undone.`)) return;
  try {
    await dashboardApi.deleteCampaign(id);
    await loadDashboard();
    await handleCampaignSearch();
    showToast("Draft deleted", `${campaign.name} was removed.`, "success");
  } catch (error) {
    console.error(error);
    showToast("Could not delete draft", error.response?.data?.message || "Please try again.", "error");
  }
};

const renderCloseButton = (targetPage = "Campaigns", label = "Back") => (
  <button type="button" className="page-close-btn" onClick={() => setActivePage(targetPage)}>
    <FaArrowLeft />
    <span>{label}</span>
    <FaTimes />
  </button>
);

const saveAdminSettings = async () => {
  setSavingSettings(true);
  try {
    const response = await authApi.updateProfile(settingsDraft);
    if (response.data.success) {
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      setSettingsDraft((current) => ({
        ...current,
        name: response.data.user.name || current.name,
        email: response.data.user.email || current.email,
        phone: response.data.user.phone || "",
        senderName: response.data.user.senderName || "MailNova Workspace",
        replyTo: response.data.user.replyTo || response.data.user.email || "",
      }));
      showToast("Profile saved", "Your admin settings were saved to the database.", "success");
    }
  } catch (error) {
    console.error(error);
    showToast("Save failed", error.response?.data?.message || "Could not save settings.", "error");
  } finally {
    setSavingSettings(false);
  }
};

const updateAdminPassword = async () => {
  if (!passwordDraft.currentPassword || !passwordDraft.newPassword) {
    showToast("Password required", "Enter your current password and a new password.", "warning");
    return;
  }

  if (passwordDraft.newPassword !== passwordDraft.confirmPassword) {
    showToast("Passwords do not match", "Confirm the new password before saving.", "warning");
    return;
  }

  setSavingPassword(true);
  try {
    const response = await authApi.updatePassword({
      currentPassword: passwordDraft.currentPassword,
      newPassword: passwordDraft.newPassword,
    });
    setPasswordDraft({ currentPassword: "", newPassword: "", confirmPassword: "" });
    showToast("Password updated", response.data?.message || "Use the new password next time you log in.", "success");
  } catch (error) {
    console.error(error);
    showToast("Password update failed", error.response?.data?.message || "Could not update password.", "error");
  } finally {
    setSavingPassword(false);
  }
};



  return (
   <div className={`layout ${darkMode ? "dark-mode" : ""} ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}>
     <Sidebar
       activePage={activePage}
       setActivePage={setActivePage}
       open={sidebarOpen}
       setOpen={setSidebarOpen}
     />
<div className="main">
  <div className="main-content-container">
    <Navbar
    darkMode={darkMode}
    setDarkMode={setDarkMode}
    campaignSearch={campaignSearch}
    setCampaignSearch={setCampaignSearch}
    onCampaignSearch={(event) => {
      handleCampaignSearch(event);
      setActivePage("Campaigns");
    }}
    onNotificationsClick={() => setActivePage("Notifications")}
    unreadNotifications={notificationSummary.unread}
  />

  <div className="workspace-strip">
    <div className="breadcrumbs">
      <span>MailNova Pro</span>
      <strong>{activePage}</strong>
    </div>
    <button type="button" className="command-trigger" onClick={() => setCommandOpen(true)}>
      <FaKeyboard />
      Command Palette
      <span>Ctrl K</span>
    </button>
  </div>

  <ToastStack toasts={toasts} onDismiss={dismissToast} />
  <CommandPalette
    open={commandOpen}
    onClose={() => setCommandOpen(false)}
    setActivePage={setActivePage}
    openCompose={openCampaignWizard}
    openAddContact={openAddContact}
  />

{adminError && (
  <div className="info-banner error-banner">
    {adminError}
  </div>
)}

<section className="dashboard-stage" key={activePage}>
{activePage === "Users" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Admin Only</span>
        <h1>Manage Users</h1>
        <p>
          View every registered account, change roles, suspend access, and keep ownership separate from normal workspaces.
        </p>
      </div>
      <button type="button" className="compose-btn" onClick={loadAdminPanel}>
        Refresh Users
      </button>
    </div>

    <div className="stats-grid role-stats-grid">
      <div className="card">
        <h3>Total Users</h3>
        <p>{adminOverview?.users?.total || adminUsers.length}</p>
        <span>All platform accounts</span>
      </div>
      <div className="card green">
        <h3>Active</h3>
        <p>
          {adminStatusBreakdown.find((item) => item._id === "Active")?.count ||
            adminUsers.filter((user) => user.status !== "Suspended").length}
        </p>
        <span>Allowed to login</span>
      </div>
      <div className="card purple">
        <h3>Admins</h3>
        <p>
          {adminRoleBreakdown.find((item) => item._id === "Admin")?.count ||
            adminUsers.filter((user) => user.role === "Admin").length}
        </p>
        <span>Control-room access</span>
      </div>
      <div className="card orange">
        <h3>Suspended</h3>
        <p>
          {adminStatusBreakdown.find((item) => item._id === "Suspended")?.count ||
            adminUsers.filter((user) => user.status === "Suspended").length}
        </p>
        <span>Blocked accounts</span>
      </div>
    </div>

    <div className="performers">
      <div className="section-header">
        <h3>Account Directory</h3>
        <div className="campaign-header-actions">
          <span className="segment-count">
            {displayAdminUsers.length} visible{hiddenDemoUserCount ? `, ${hiddenDemoUserCount} test hidden` : ""}
          </span>
          {hiddenDemoUserCount > 0 && (
            <button type="button" className="subtle-action-btn" onClick={() => setShowDemoAdminUsers((current) => !current)}>
              {showDemoAdminUsers ? "Hide Test Records" : "Show Test Records"}
            </button>
          )}
          {displayAdminUsers.length > 8 && (
            <button type="button" className="subtle-action-btn" onClick={() => setShowAllAdminUsers((current) => !current)}>
              {showAllAdminUsers ? "Show Less" : "Show All"}
            </button>
          )}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {visibleAdminDirectoryUsers.map((user) => {
            const userId = String(user._id || user.id);
            const isCurrentUser = userId === String(currentUser?.id || currentUser?._id);
            const isOwner = isProtectedOwner(user);
            const roleIsAdminControlled = user.role === "Admin" || isOwner;
            const roleSelectDisabled = isOwner || (!currentUserIsOwner && roleIsAdminControlled);
            const statusSelectDisabled = isOwner || (!currentUserIsOwner && user.role === "Admin");
            const planSelectDisabled = isOwner;
            const availableRoleOptions = [
              ...new Set([
                isOwner ? "Admin" : user.role || "User",
                ...(currentUserIsOwner
                  ? roleOptions
                  : roleOptions.filter((role) => role !== "Admin" || user.role === "Admin")),
              ]),
            ];

            return (
              <tr key={userId}>
                <td className="campaign-name">
                  {isOwner ? "Varshini P" : user.name}
                  {isCurrentUser ? " (you)" : ""}
                  {isOwner && <span className="owner-badge">Protected owner</span>}
                </td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={isOwner ? "Admin" : user.role || "User"}
                    onChange={(event) => handleAdminRoleChange(userId, event.target.value)}
                    disabled={roleSelectDisabled}
                    title={
                      isOwner
                        ? "Varshini P cannot be demoted or reassigned"
                        : !currentUserIsOwner && roleIsAdminControlled
                        ? "Only Varshini P can grant or retrieve admin rights"
                        : "Change role"
                    }
                  >
                    {availableRoleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={user.plan?.name || "Free"}
                    onChange={(event) => handleAdminPlanChange(userId, event.target.value)}
                    disabled={planSelectDisabled}
                  >
                    {["Free", "Pro", "Enterprise"].map((planName) => (
                      <option key={planName} value={planName}>
                        {planName}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={isOwner ? "Active" : user.status || "Active"}
                    onChange={(event) => handleAdminStatusChange(userId, event.target.value)}
                    disabled={statusSelectDisabled}
                  >
                    {["Active", "Suspended"].map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{formatLogTime(user.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </>
)}

{activePage === "Plans" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Admin Only</span>
        <h1>Plans, payments, and access</h1>
        <p>
          Enable Free, Pro, and Enterprise access from admin controls, then connect Razorpay orders and webhooks when payment keys are configured.
        </p>
      </div>
      <div className="campaign-header-actions">
        <button type="button" className="template-btn" onClick={() => setActivePage("Users")}>
          Manage Users
        </button>
        <button type="button" className="compose-btn" onClick={loadAdminPanel}>
          Refresh Plans
        </button>
      </div>
    </div>

    <div className="quick-actions-grid role-actions-grid">
      {adminPlans.map((plan) => (
        <div className="quick-action-card" key={plan.name}>
          <span className="users-icon">
            <FaCreditCard />
          </span>
          <strong>{plan.name}</strong>
          <p>{plan.users} users. {plan.contactLimit}. {plan.sendLimit}.</p>
          <div className="status-badge role-plan-badge">{plan.billingStatus}</div>
        </div>
      ))}
    </div>

    <div className="settings-grid">
      <div className="settings-card">
        <h3>Razorpay Payment Setup</h3>
        <div className="user-form-grid">
          <label>
            Razorpay Key ID
            <input
              value={paymentConfig?.configured ? paymentConfig.keyId : ""}
              placeholder="Set RAZORPAY_KEY_ID in backend/.env"
              readOnly
            />
          </label>
          <label>
            Webhook Secret
            <input
              value={paymentConfig?.webhookConfigured ? "Configured (hidden)" : ""}
              placeholder="Set RAZORPAY_WEBHOOK_SECRET in backend/.env"
              readOnly
            />
          </label>
          <label>
            Currency
            <input value={paymentConfig?.currency || "INR"} readOnly />
          </label>
        </div>
        <div className="readiness-list">
          <span>
            Checkout status: {paymentConfig?.configured ? "Live - Razorpay keys are set" : "Not configured - add keys to backend/.env"}
          </span>
          <span>
            Webhook status: {paymentConfig?.webhookConfigured ? "Live - webhook signature verification is active" : "Not configured - set RAZORPAY_WEBHOOK_SECRET"}
          </span>
          <span>Admin can still override any user's plan immediately through the user table below</span>
          <span>Order creation and payment signature verification run entirely on the backend, never in the browser</span>
          <span>Webhook confirmation updates billingStatus automatically and is idempotent against repeat deliveries</span>
        </div>
      </div>
      <div className="settings-card">
        <h3>Payment Flow</h3>
        <div className="readiness-list">
          <span>User chooses plan or admin assigns plan</span>
          <span>Backend creates Razorpay order with plan price and user id</span>
          <span>Razorpay checkout collects payment</span>
          <span>Webhook verifies signature and marks billing Active</span>
          <span>Admin can override access when offline payment or manual approval is needed</span>
        </div>
      </div>
    </div>

    <div className="performers">
      <div className="section-header">
        <div>
          <h3>Grant Access Through Plans</h3>
          <p>Change a user plan here to unlock limits immediately.</p>
        </div>
        <div className="campaign-header-actions">
          <span className="segment-count">{displayAdminUsers.length} visible users</span>
          {displayAdminUsers.length > 8 && (
            <button type="button" className="subtle-action-btn" onClick={() => setShowAllPlanUsers((current) => !current)}>
              {showAllPlanUsers ? "Show Less" : "Show All"}
            </button>
          )}
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Current Plan</th>
              <th>Billing</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleAdminPlanUsers.map((user) => {
              const userId = String(user._id || user.id);
              const isOwner = isProtectedOwner(user);
              return (
                <tr key={`plan-${userId}`}>
                  <td>
                    <strong className="campaign-name">{isOwner ? "Varshini P" : user.name}</strong>
                    <small>{user.email}</small>
                  </td>
                  <td>{isOwner ? "Admin" : user.role || "User"}</td>
                  <td>
                    <select
                      value={user.plan?.name || "Free"}
                      onChange={(event) => handleAdminPlanChange(userId, event.target.value)}
                      disabled={isOwner}
                    >
                      {["Free", "Pro", "Enterprise"].map((planName) => (
                        <option key={planName} value={planName}>
                          {planName}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className="status-badge role-plan-badge">{user.plan?.billingStatus || "Trial"}</span>
                  </td>
                  <td>
                    <span className={user.status === "Suspended" ? "status-badge paused" : "status-badge"}>
                      {isOwner ? "Active" : user.status || "Active"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </>
)}

{activePage === "Monitoring" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Admin Only</span>
        <h1>System Monitoring</h1>
        <p>
          Platform health, SMTP mode, failed campaigns, queue state, and operational signals for administrators.
        </p>
      </div>
      <button type="button" className="compose-btn" onClick={loadAdminPanel}>
        Refresh Health
      </button>
    </div>

    <div className="stats-grid role-stats-grid">
      <div className="card">
        <h3>Campaigns</h3>
        <p>{adminMonitoring.campaigns || campaigns.length}</p>
        <span>Across the platform</span>
      </div>
      <div className="card green">
        <h3>Running</h3>
        <p>{adminMonitoring.runningCampaigns || 0}</p>
        <span>Currently active</span>
      </div>
      <div className="card purple">
        <h3>Failed</h3>
        <p>{adminMonitoring.failedCampaigns || 0}</p>
        <span>Needs admin review</span>
      </div>
      <div className="card orange">
        <h3>Unread Alerts</h3>
        <p>{adminMonitoring.unreadNotifications || notificationSummary.unread}</p>
        <span>Platform notifications</span>
      </div>
    </div>

    <div className="settings-grid">
      <div className="settings-card">
        <h3><FaServer /> Delivery Infrastructure</h3>
        <div className="readiness-list">
          <span>API Status: {adminMonitoring.apiStatus || "Operational"}</span>
          <span>SMTP Status: {adminMonitoring.smtpStatus || "Mock email mode"}</span>
          <span>Email Queue: {adminMonitoring.queueStatus || "inline"}</span>
          <span>Scheduled Jobs: Ready for cron worker connection</span>
          {dashboardData?.trackingConfig && !dashboardData.trackingConfig.isPublic ? (
            <span style={{ color: "#d97706" }}>⚠ Local tracking (Gmail pixels require public URL)</span>
          ) : (
            <span style={{ color: "#14b8a6" }}>✓ Tracking URL is public & active</span>
          )}
        </div>
      </div>
      <div className="settings-card">
        <h3><FaChartLine /> Platform Volume</h3>
        <div className="readiness-list">
          <span>{adminMonitoring.contacts || contacts.length} total contacts</span>
          <span>{adminMonitoring.lists || contactLists.length} audience folders</span>
          <span>{adminMonitoring.templates || templates.length} saved templates</span>
          <span>{campaigns.reduce((total, campaign) => total + (campaign.emailsSent || 0), 0).toLocaleString()} emails tracked</span>
        </div>
      </div>
    </div>
  </>
)}

{activePage === "System Logs" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Admin Only</span>
        <h1>System Logs</h1>
        <p>
          Audit admin actions, campaign changes, contact operations, and login-related security activity.
        </p>
      </div>
      <button type="button" className="compose-btn" onClick={loadAdminPanel}>
        Refresh Logs
      </button>
    </div>

    <div className="performers">
      <div className="section-header">
        <h3>Audit Trail</h3>
        <div className="campaign-header-actions">
          <span className="segment-count">{adminLogs.length} events</span>
          {adminLogs.length > 8 && (
            <button type="button" className="subtle-action-btn" onClick={() => setShowAllAdminLogs((current) => !current)}>
              {showAllAdminLogs ? "Show Less" : "Show All"}
            </button>
          )}
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Actor</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>
          {visibleAdminLogs.map((log) => (
            <tr key={log._id}>
              <td>{formatLogTime(log.createdAt)}</td>
              <td className="campaign-name">{log.action}</td>
              <td>{log.entityType}</td>
              <td>{log.actor?.email || "System"}</td>
              <td>{log.message || "No details recorded"}</td>
            </tr>
          ))}
          {adminLogs.length === 0 && (
            <tr>
              <td colSpan="5">
                <div className="empty-state compact-empty">
                  <FaClipboardList />
                  <strong>No audit events yet</strong>
                  <p>Admin actions will appear here after users, roles, campaigns, or contacts are changed.</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </>
)}

{activePage === "Security" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Admin Only</span>
        <h1>Security and Permissions</h1>
        <p>
          Keep the dashboard simple: Admin manages platform access, while User accounts work inside the campaign workspace.
        </p>
      </div>
    </div>

    <div className="settings-grid">
      <div className="settings-card">
        <h3><FaShieldAlt /> Permission Matrix</h3>
        <div className="role-grid">
          {[
            ["Admin", "Manage users, roles, plans, platform monitoring, logs, and global views."],
            ["User", "Use personal campaigns, contacts, templates, automations, analytics, and settings."],
          ].map(([role, detail]) => (
            <div className="role-card" key={role}>
              <strong>{role}</strong>
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="settings-card">
        <h3><FaLock /> Session and Rate Limits</h3>
        <div className="readiness-list">
          <span>JWT authentication required for dashboard APIs</span>
          <span>Suspended accounts are blocked in auth middleware</span>
          <span>Admin APIs require Admin role</span>
          <span>Rate limit policy placeholder ready for production middleware</span>
        </div>
      </div>
    </div>
  </>
)}

{activePage === "Platform Settings" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Admin Only</span>
        <h1>Platform Settings</h1>
        <p>
          System-wide sending, SMTP, notification, domain, and deliverability settings belong here, not in user workspaces.
        </p>
      </div>
    </div>

    <div className="settings-grid">
      <div className="settings-card">
        <h3><FaSlidersH /> Delivery Settings</h3>
        <div className="readiness-list">
          <span>SMTP provider: {adminMonitoring.smtpStatus || "Mock email mode"}</span>
          <span>Email queue mode: {adminMonitoring.queueStatus || "inline"}</span>
          <span>Global send limit: controlled by platform plan</span>
          <span>Bounce and failed campaign monitoring enabled</span>
        </div>
      </div>
      <div className="settings-card">
        <h3><FaKey /> Domain and Access</h3>
        <div className="readiness-list">
          <span>DKIM, SPF, and domain verification placeholders</span>
          <span>App-wide notification rules</span>
          <span>Admin-only deployment and health controls</span>
          <span>Default registration role: User</span>
        </div>
      </div>
    </div>
  </>
)}

 
{activePage === "Campaigns" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Campaign Center</span>
        <h1>Campaigns dashboard</h1>
        <p>Choose Email, SMS, or WhatsApp first. Each channel opens as its own page with its own tools and reporting.</p>
      </div>
      <div className="campaign-header-actions">
        <button type="button" className="template-btn" onClick={() => setActivePage("Saved Templates")}>
          Saved Templates
        </button>
        <button type="button" className="compose-btn" onClick={() => setActivePage("Email Campaign")}>
          <FaEnvelope />
          Email Campaign
        </button>
      </div>
    </div>

    <div className="campaign-channel-grid">
      {[
        [FaEnvelope, "Email Campaign", "Email analytics, compose, saved drafts, and saved templates.", `${sentCampaigns.length} live campaigns`, () => setActivePage("Email Campaign")],
        [FaSms, "SMS Campaign", "SMS analytics, composer, charts, and phone-ready contacts.", `${phoneReadyContacts.length} phone-ready contacts`, () => setActivePage("SMS Campaign")],
        [FaWhatsapp, "WhatsApp Campaign", "Reserved for WhatsApp provider and template approval.", "Coming soon", () => setActivePage("WhatsApp Campaign")],
      ].map(([Icon, title, text, meta, action]) => (
        <button type="button" className={`campaign-channel-card ${title.includes("WhatsApp") ? "coming-soon" : ""}`} key={title} onClick={action}>
          <span className="users-icon">
            <Icon />
          </span>
          <strong>{title}</strong>
          <p>{text}</p>
          <em>{meta}</em>
        </button>
      ))}
    </div>

    <div className="stats-grid role-stats-grid">
      <div className="card">
        <h3>Email Sent</h3>
        <p>{emailTotals.sent.toLocaleString()}</p>
        <span>{emailOpenRate}% open rate &middot; {emailClickRate}% click rate</span>
      </div>
      <div className="card green">
        <h3>Drafts</h3>
        <p>{draftCampaigns.length}</p>
        <span>Saved campaign drafts</span>
      </div>
      <div className="card purple">
        <h3>Saved Templates</h3>
        <p>{savedTemplates.length}</p>
        <span>User/admin saved templates only</span>
      </div>
      <div className="card orange">
        <h3>SMS Readiness</h3>
        <p>{smsReadinessRate}%</p>
        <span>{smsMissingPhoneCount} contacts missing phone</span>
      </div>
    </div>

    <div className="flow-note-panel">
      <strong>Admin campaign flow</strong>
      <p>Campaigns is now only the channel dashboard. Open Email or SMS to see the detailed dashboards, tables, graphs, composer, drafts, and templates.</p>
    </div>
  </>
)}

{activePage === "Email Campaign" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Email Campaign</span>
        <h1>Email campaign dashboard</h1>
        <p>
          Email analytics, campaign search, compose flow, saved templates, and campaign activity.
        </p>
      </div>

      <div className="campaign-header-actions">
    <button
      className="template-btn"
      onClick={() => setActivePage("Saved Templates")}
    >
      Saved Templates
    </button>

    <button
      className="template-btn"
      onClick={() => setActivePage("Saved Drafts")}
    >
      Saved Drafts
    </button>

    <button
      className="compose-btn"
      onClick={openCampaignWizard}
      style={{
        background: "#0f766e",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
      }}
    >
      + Compose Campaign
    </button>
      </div>
    </div>

{apiError && (
  <div
    style={{
      background: "#fef3c7",
      color: "#92400e",
      padding: "10px 14px",
      borderRadius: "8px",
      marginBottom: "15px",
      fontWeight: "600",
    }}
  >
    {apiError}
  </div>
)}

<div className="chart-box">
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "15px",
      marginBottom: "10px",
    }}
  >
    <h3>Campaign Search Results</h3>

    {campaignResults.length > 3 && (
      <button
        onClick={() => setShowAllSearchResults((current) => !current)}
        style={{
          background: "#f3f4f6",
          border: "none",
          padding: "10px 14px",
          borderRadius: "10px",
          cursor: "pointer",
          fontWeight: "600",
          color: "#374151",
        }}
      >
        {showAllSearchResults ? "Show Less" : "View All"}
      </button>
    )}
  </div>

  {campaignResults.length === 0 && (
    <p style={{ marginTop: "15px", color: "#64748b" }}>No campaigns found.</p>
  )}

  {visibleCampaignResults.map((campaign) => {
    const readCount = Number(campaign.opened || 0);
    const unreadMailCount = Number(
      campaign.unread ?? Math.max((campaign.delivered || campaign.emailsSent || 0) - readCount, 0)
    );

    return (
      <div
        key={campaign.id}
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "15px",
          padding: "14px 0",
          borderBottom: "1px solid #eee",
        }}
      >
        <div>
          <h4 style={{ margin: 0 }}>{campaign.name}</h4>
          <p style={{ margin: "5px 0", color: "#64748b" }}>{campaign.subject}</p>
          <small style={{ color: "#0f766e", fontWeight: "700" }}>
            Owner: {campaign.owner?.name || campaign.owner?.email || "System / seed data"}
          </small>
        </div>

        <div style={{ textAlign: "right" }}>
          <strong>{campaign.emailsSent.toLocaleString()} sent</strong>
          <p style={{ margin: "5px 0", color: "#16a34a" }}>
            {campaign.emailsSent ? Math.round((readCount / campaign.emailsSent) * 100) : 0}% open rate
          </p>
          <small style={{ color: "#0f766e", fontWeight: "700" }}>
            Read/Open: {readCount.toLocaleString()} · Unread: {unreadMailCount.toLocaleString()}
          </small>
          {campaign.sendStatus && (
            <small
              style={{
                display: "block",
                color: campaign.sendStatus === "failed" ? "#ef4444" : "#64748b",
                fontWeight: "600",
                marginTop: "4px",
              }}
            >
              Email: {campaign.sendStatus}
            </small>
          )}
        </div>
      </div>
    );
  })}
</div>

     {showCompose && (
      <CampaignWizard
        campaignName={campaignName}
        campaignSubject={campaignSubject}
        campaignContent={campaignContent}
        campaignRecipients={campaignRecipients}
        contactLists={contactLists}
        templates={savedTemplates}
        selectedCampaignList={selectedCampaignList}
        selectedCampaignListId={selectedCampaignListId}
        selectedTemplate={selectedTemplate}
        selectedTemplateId={selectedTemplateId}
        campaignError={campaignError}
        setCampaignName={setCampaignName}
        setCampaignSubject={setCampaignSubject}
        setCampaignContent={setCampaignContent}
        setCampaignRecipients={setCampaignRecipients}
        setSelectedCampaignListId={setSelectedCampaignListId}
        setSelectedTemplateId={setSelectedTemplateId}
        onClose={() => {
          resetCampaignForm();
          setShowCompose(false);
        }}
        onDraft={() => handleCreateCampaign("Draft")}
        onSend={(options) => handleCreateCampaign("Running", options)}
        onManageFolder={() => setActivePage("Contacts")}
        onOpenTemplates={() => setActivePage("Saved Templates")}
        showToast={showToast}
      />
    )}

    <StatsCards darkMode={darkMode} stats={dashboardData?.stats} />

    <div className="charts">
      <PerformanceChart data={dashboardData?.performance} />
    </div>

    <TopPerformers
      campaigns={topCampaigns}
      showAll={showAllTopCampaigns}
      onViewAll={() => setShowAllTopCampaigns((current) => !current)}
    />

<div className="chart-box">
  <h3>Recent Campaign Activity</h3>

  {!visibleActivities.length && (
    <div className="empty-state compact-empty">
      <FaEnvelope />
      <strong>No campaign activity yet</strong>
      <p>Send a campaign to see delivery and engagement events here.</p>
    </div>
  )}

  {visibleActivities.map((item, i) => (
    <div
      key={i}
      style={{
        display: "flex",
        gap: "10px",
        padding: "10px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <span style={{ color: item.color }}>
        {item.icon}
      </span>

      <span>{item.text}</span>
    </div>
  ))}
</div>
  </>
)}

{activePage === "Compose Campaign" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Compose Campaign</span>
        <h1>Email campaign composer</h1>
        <p>Create a campaign, choose contacts, use a saved template, save a draft, or send from one focused page.</p>
      </div>
      <div className="campaign-header-actions">
        <button type="button" className="template-btn" onClick={() => setActivePage("Saved Templates")}>
          Saved Templates
        </button>
        {renderCloseButton("Email Campaign")}
      </div>
    </div>

    <CampaignWizard
      campaignName={campaignName}
      campaignSubject={campaignSubject}
      campaignContent={campaignContent}
      campaignRecipients={campaignRecipients}
      contactLists={contactLists}
      templates={savedTemplates}
      selectedCampaignList={selectedCampaignList}
      selectedCampaignListId={selectedCampaignListId}
      selectedTemplate={selectedTemplate}
      selectedTemplateId={selectedTemplateId}
      campaignError={campaignError}
      setCampaignName={setCampaignName}
      setCampaignSubject={setCampaignSubject}
      setCampaignContent={setCampaignContent}
      setCampaignRecipients={setCampaignRecipients}
      setSelectedCampaignListId={setSelectedCampaignListId}
      setSelectedTemplateId={setSelectedTemplateId}
      onClose={() => {
        resetCampaignForm();
        setActivePage("Email Campaign");
      }}
      onDraft={() => handleCreateCampaign("Draft")}
      onSend={(options) => handleCreateCampaign("Running", options)}
      onManageFolder={() => setActivePage("Contacts")}
      onOpenTemplates={() => setActivePage("Saved Templates")}
      showToast={showToast}
    />
  </>
)}

{activePage === "Saved Drafts" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Drafts</span>
        <h1>Saved campaign drafts</h1>
        <p>Open a draft into the composer, edit it, then save again or send a live copy.</p>
      </div>
      <div className="campaign-header-actions">
        <button type="button" className="compose-btn" onClick={openCampaignWizard}>
          New Draft
        </button>
        {renderCloseButton("Email Campaign")}
      </div>
    </div>

    <div className="performers">
      <div className="section-header">
        <div>
          <h3>Draft Inbox</h3>
          <p>{draftCampaigns.length} saved drafts</p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Draft</th>
              <th>Audience</th>
              <th>Template</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {draftCampaigns.map((campaign) => (
              <tr key={campaign.id || campaign._id || campaign.name}>
                <td>
                  <strong className="campaign-name">{campaign.name}</strong>
                  <small>{campaign.subject}</small>
                </td>
                <td>
                  {campaign.contactListName ||
                    `${Array.isArray(campaign.recipients) ? campaign.recipients.length : 0} manual recipients`}
                </td>
                <td>{campaign.templateName || "Saved template / basic"}</td>
                <td>{campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : "Recently"}</td>
                <td>
                  <div className="row-actions text-actions">
                    <button type="button" onClick={() => handleUseDraft(campaign)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleSendDraftCopy(campaign)}>
                      Send Copy
                    </button>
                    <button type="button" className="danger-text" onClick={() => handleDeleteDraft(campaign)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!draftCampaigns.length && (
              <tr>
                <td colSpan="5">
                  <div className="empty-state compact-empty">
                    <FaEnvelope />
                    <strong>No saved drafts</strong>
                    <p>Save a campaign as draft and it will appear here.</p>
                    <button type="button" className="compose-btn" onClick={openCampaignWizard}>
                      Compose Draft
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </>
)}

{activePage === "SMS Campaign" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">SMS Campaign</span>
        <h1>SMS campaign dashboard</h1>
        <p>Review phone-ready contacts and segment readiness. Compose opens as a separate focused page.</p>
      </div>
      <div className="campaign-header-actions">
        <button type="button" className="compose-btn" onClick={() => openSmsComposer(null)}>
          <FaSms />
          Compose SMS
        </button>
        {renderCloseButton("Campaigns")}
      </div>
    </div>

    <div className="stats-grid role-stats-grid">
      <div className="card">
        <h3>Total Contacts</h3>
        <p>{contacts.length.toLocaleString()}</p>
        <span>Audience records</span>
      </div>
      <div className="card green">
        <h3>Phone Ready</h3>
        <p>{phoneReadyContacts.length.toLocaleString()}</p>
        <span>Can receive SMS</span>
      </div>
      <div className="card purple">
        <h3>Selected Target</h3>
        <p>{smsTarget ? "1" : phoneReadyContacts.length.toLocaleString()}</p>
        <span>{smsTarget ? smsTarget.name : "Bulk phone-ready audience"}</span>
      </div>
      <div className="card orange">
        <h3>Readiness</h3>
        <p>{smsReadinessRate}%</p>
        <span>{smsMissingPhoneCount.toLocaleString()} contacts missing phone</span>
      </div>
    </div>

    <div className="sms-dashboard-grid">
      <div className="chart-box">
        <div className="section-header">
          <div>
            <h3>SMS Audience Readiness</h3>
            <p>Phone-number coverage before sending</p>
          </div>
          <FaSms color="var(--mn-primary)" />
        </div>
        <div className="sms-bar-chart">
          {[
            ["Total contacts", contacts.length, contacts.length],
            ["Phone ready", phoneReadyContacts.length, contacts.length],
            ["Missing phone", smsMissingPhoneCount, contacts.length],
          ].map(([label, value, max]) => (
            <div className="sms-bar-row" key={label}>
              <div>
                <strong>{label}</strong>
                <span>{Number(value).toLocaleString()}</span>
              </div>
              <div className="sms-bar-track">
                <span style={{ width: `${max ? Math.max((value / max) * 100, 4) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-box">
        <div className="section-header">
          <div>
            <h3>SMS Segment Table</h3>
            <p>Readiness by contact status</p>
          </div>
        </div>
        <div className="table-scroll compact-table">
          <table>
            <thead>
              <tr>
                <th>Segment</th>
                <th>Total</th>
                <th>Phone Ready</th>
                <th>Ready %</th>
              </tr>
            </thead>
            <tbody>
              {smsStatusRows.map((row) => (
                <tr key={row.status}>
                  <td className="campaign-name">{row.status}</td>
                  <td>{row.total.toLocaleString()}</td>
                  <td>{row.phoneReady.toLocaleString()}</td>
                  <td>{row.readiness}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div className="settings-grid">
      <div className="settings-card">
        <h3>SMS Send Flow</h3>
        <div className="readiness-list">
          <span>Dashboard shows readiness only.</span>
          <span>Compose SMS opens as a separate page.</span>
          <span>Contact SMS icons preselect that contact automatically.</span>
        </div>
        <button type="button" className="compose-btn" onClick={() => openSmsComposer(null)}>
          <FaPaperPlane />
          Compose SMS
        </button>
      </div>

      <div className="settings-card">
        <h3>Phone-ready contacts</h3>
        <div className="table-scroll compact-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {phoneReadyContacts.slice(0, 8).map((contact) => (
                <tr key={contact._id || contact.email}>
                  <td className="campaign-name">{contact.name}</td>
                  <td>{contact.phone}</td>
                  <td>{contact.status || "Active"}</td>
                </tr>
              ))}
              {!phoneReadyContacts.length && (
                <tr>
                  <td colSpan="3">
                    <div className="empty-state compact-empty">
                      <FaSms />
                      <strong>No phone-ready contacts</strong>
                      <p>Add phone numbers in Contacts before sending SMS.</p>
                      <button type="button" className="compose-btn" onClick={openAddContact}>
                        Add Contact
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
)}

{activePage === "Compose SMS" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Compose SMS</span>
        <h1>{smsTarget ? `SMS to ${smsTarget.name}` : "Compose SMS"}</h1>
        <p>Choose a target, write the message, and send from one focused page.</p>
      </div>
      <div className="campaign-header-actions">
        <button type="button" className="template-btn" onClick={() => setSmsMessage("")}>
          Clear
        </button>
        {renderCloseButton(smsReturnPage || "SMS Campaign")}
      </div>
    </div>

    <div className="compose-sms-layout">
      <div className="settings-card user-form-card page-form-card">
        <h3>Message</h3>
        <div className="user-form-grid">
          <label>
            Target
            <select
              value={smsTarget?._id || smsTarget?.email || "bulk"}
              onChange={(event) => {
                const value = event.target.value;
                setSmsTarget(
                  value === "bulk"
                    ? null
                    : contacts.find((contact) => String(contact._id || contact.email) === value) || null
                );
              }}
            >
              <option value="bulk">All phone-ready contacts</option>
              {phoneReadyContacts.map((contact) => (
                <option key={contact._id || contact.email} value={contact._id || contact.email}>
                  {contact.name} - {contact.phone}
                </option>
              ))}
            </select>
          </label>
        </div>
        <textarea
          placeholder="Type your SMS message..."
          value={smsMessage}
          onChange={(event) => setSmsMessage(event.target.value.slice(0, 320))}
          rows={7}
        />
        <div className="compose-sms-footer">
          <span>{smsMessage.length}/320 characters</span>
          <button type="button" className="compose-btn" onClick={handleSendSms} disabled={sendingSms || !smsMessage.trim()}>
            <FaPaperPlane />
            {sendingSms ? "Sending..." : smsTarget ? "Send SMS" : "Send Bulk SMS"}
          </button>
        </div>
      </div>

      <div className="settings-card">
        <h3>SMS Summary</h3>
        <div className="readiness-list">
          <span>Target: {smsTarget ? smsTarget.name : "All phone-ready contacts"}</span>
          <span>Estimated recipients: {smsTarget ? 1 : phoneReadyContacts.length}</span>
          <span>Phone readiness: {smsReadinessRate}%</span>
          <span>Missing phone numbers: {smsMissingPhoneCount.toLocaleString()}</span>
        </div>
        {!phoneReadyContacts.length && (
          <div className="empty-state compact-empty">
            <FaSms />
            <strong>No phone-ready contacts</strong>
            <p>Add phone numbers before sending SMS.</p>
            <button type="button" className="compose-btn" onClick={openAddContact}>
              Add Contact
            </button>
          </div>
        )}
      </div>
    </div>
  </>
)}

{activePage === "WhatsApp Campaign" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">WhatsApp Campaign</span>
        <h1>WhatsApp campaigns</h1>
        <p>WhatsApp provider setup, business templates, and approval workflow will be added here.</p>
      </div>
      {renderCloseButton("Campaigns")}
    </div>
    <div className="coming-soon-panel">
      <FaWhatsapp />
      <strong>Coming soon</strong>
      <p>WhatsApp is visible in Campaigns now, but sending is locked until provider setup is connected.</p>
    </div>
  </>
)}

{activePage === "Templates" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Templates</span>
        <h1>Template center</h1>
        <p>Build a template or open only the templates saved by users and admins.</p>
      </div>
      {renderCloseButton("Campaigns")}
    </div>

    <div className="campaign-channel-grid">
      {[
        [FaPalette, "Template Builder", "Create and edit reusable email templates.", `${savedTemplates.length} saved`, () => { setTemplateDraft(null); setActivePage("Template Builder"); }],
        [FaEnvelopeOpenText, "Saved Templates", "Use templates saved from the builder.", `${savedTemplates.length} templates`, () => setActivePage("Saved Templates")],
        [FaPaperPlane, "Compose Campaign", "Start a campaign using a saved template.", "Email flow", openCampaignWizard],
      ].map(([Icon, title, text, meta, action]) => (
        <button type="button" className="campaign-channel-card" key={title} onClick={action}>
          <span className="users-icon">
            <Icon />
          </span>
          <strong>{title}</strong>
          <p>{text}</p>
          <em>{meta}</em>
        </button>
      ))}
    </div>
  </>
)}

{activePage === "Saved Templates" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Saved Templates</span>
        <h1>Saved email templates</h1>
        <p>Only templates saved from the builder appear here. Built-in starter layouts are not mixed into this list.</p>
      </div>
      <div className="campaign-header-actions">
        <button type="button" className="template-btn" onClick={() => { setTemplateDraft(null); setActivePage("Template Builder"); }}>
          Build Template
        </button>
        {renderCloseButton("Email Campaign")}
      </div>
    </div>

    <div className="saved-template-grid">
      {savedTemplates.map((template) => (
        <div className="saved-template-card" key={template._id || template.name}>
          <div className="saved-template-swatch" style={{ background: template.background || "#f8fafc" }}>
            <span style={{ background: template.accentColor || "#0f766e" }} />
          </div>
          <div>
            <strong>{template.name}</strong>
            <p>{template.subject || "No subject saved"}</p>
            <small>{template.templateType || "Custom"} template</small>
          </div>
          <div className="campaign-header-actions">
            <button
              type="button"
              className="template-btn"
              onClick={() => {
                setSelectedTemplateId(template._id);
                setTemplateDraft(template);
                setActivePage("Template Builder");
              }}
            >
              Edit
            </button>
            <button type="button" className="compose-btn" onClick={() => applyTemplateToCampaign(template)}>
              Use
            </button>
            <button
              type="button"
              className="ghost-danger-btn"
              onClick={() => handleDeleteTemplate(template)}
              title="Delete template"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      {!savedTemplates.length && (
        <div className="empty-state compact-empty">
          <FaPalette />
          <strong>No saved templates</strong>
          <p>Save a template in the builder and it will appear here.</p>
          <button type="button" className="compose-btn" onClick={() => { setTemplateDraft(null); setActivePage("Template Builder"); }}>
            Build Template
          </button>
        </div>
      )}
    </div>
  </>
)}

{activePage === "Template Builder" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Template Studio</span>
        <h1>Template builder</h1>
        <p>
          Maintain reusable email layouts, brand blocks, and content patterns for campaign teams.
        </p>
      </div>
      <div className="campaign-header-actions">
        <button type="button" className="template-btn" onClick={() => setActivePage("Saved Templates")}>
          Saved Templates
        </button>
        {renderCloseButton("Email Campaign")}
      </div>
    </div>

    <div className="template-studio-shell">
      <TemplateStudio
        initialTemplate={templateDraft}
        onUseTemplate={(template) => {
          setTemplates((current) =>
            current.some((item) => item._id === template._id)
              ? current.map((item) => (item._id === template._id ? template : item))
              : [template, ...current]
          );
          setSelectedTemplateId(template._id);
          setTemplateDraft(template);
          setCampaignSubject(template.subject || campaignSubject);
          setCampaignContent((current) =>
            current.trim()
              ? current
              : "Write the campaign message that should replace {{content}} in this template."
          );
          setActivePage("Compose Campaign");
          setShowCompose(false);
          showToast("Template selected", `${template.name} is ready in the campaign builder.`, "success");
        }}
      />
    </div>
  </>
)}

  {/* CONTACTS */}
  {activePage === "Contacts" && (
  <>
    <div className="page-hero compact-hero">
      <div>
        <span className="eyebrow">Audience Management</span>
        <h1>Contacts</h1>
        <p>
          Maintain audience quality, organize folders, and prepare recipient groups for campaign delivery.
        </p>
      </div>

      <div className="campaign-header-actions">
        <button
          className="accent-btn amber-btn"
          onClick={openAddContact}
        >
          + Add Contact
        </button>

        <button
          className="accent-btn dark-btn"
          onClick={openImportContacts}
        >
          Import Contacts
        </button>

        <button
          className="accent-btn green-btn"
          onClick={() => openSmsComposer(null)}
        >
          Send SMS
        </button>
      </div>
    </div>

    <ContactGrowth />
    <div className="contact-stats-grid">
      <div className="chart-box">
        <FaUsers size={30} color="#0f766e" />
        <h4>Total Contacts</h4>
        <h2>{contactStats.total.toLocaleString()}</h2>
      </div>

      <div className="chart-box">
        <FaUserPlus size={30} color="#d97706" />
        <h4>New Subscribers</h4>
        <h2>{contactStats.newSubscribers.toLocaleString()}</h2>
      </div>

      <div className="chart-box">
        <FaCheckCircle size={30} color="#059669" />
        <h4>Active Contacts</h4>
        <h2>{contactStats.active.toLocaleString()}</h2>
      </div>

      <div className="chart-box">
        <FaUserSlash size={30} color="#dc2626" />
        <h4>Inactive</h4>
        <h2>{contactStats.inactive.toLocaleString()}</h2>
      </div>
    </div>

    <div className="contact-workspace">
      <div className="contact-folder-panel">
        <div className="panel-heading">
          <div>
            <h3>Contact Folders</h3>
            <p>Reusable recipient groups for campaigns.</p>
          </div>
          <div className="compact-action-stack">
            <span>{contactLists.length}</span>
            {contactLists.length > 4 && (
              <button type="button" className="subtle-action-btn" onClick={() => setShowAllContactFolders((current) => !current)}>
                {showAllContactFolders ? "Show Less" : "Show All"}
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          className={activeContactListId === "all" ? "contact-folder-card active" : "contact-folder-card"}
          onClick={() => {
            setActiveContactListId("all");
            setSelectedContactIds([]);
          }}
        >
          <span className="folder-dot" style={{ background: "#111827" }} />
          <div>
            <strong>All Contacts</strong>
            <small>{contacts.length} total contacts</small>
          </div>
        </button>

        {visibleContactFolders.map((list) => (
          <div
            key={list._id}
            className={activeContactListId === list._id ? "contact-folder-card active" : "contact-folder-card"}
          >
            <button
              type="button"
              onClick={() => {
                setActiveContactListId(list._id);
                setSelectedContactIds([]);
              }}
            >
              <span className="folder-dot" style={{ background: list.color || "#0f766e" }} />
              <div>
                <strong>{list.name}</strong>
                <small>{list.contactCount || list.contacts?.length || 0} contacts</small>
              </div>
            </button>

            <div className="folder-actions">
              <button type="button" onClick={() => applyContactListToCampaign(list)}>
                Campaign
              </button>
              {selectedContactIds.length > 0 && (
                <button type="button" onClick={() => handleAddSelectedToList(list._id)}>
                  Add Selected
                </button>
              )}
              <button type="button" onClick={() => handleDeleteContactList(list._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="contact-folder-form">
        <div>
          <h3>Create Contact Folder</h3>
          <p>
            Select contacts from the directory, name the folder, then use it directly in Campaigns.
          </p>
        </div>
        <div className="folder-form-grid">
          <input
            type="text"
            placeholder="Folder name, e.g. Enterprise Leads"
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
          />
          <input
            type="text"
            placeholder="Short description"
            value={newListDescription}
            onChange={(event) => setNewListDescription(event.target.value)}
          />
          <input
            type="color"
            value={newListColor}
            onChange={(event) => setNewListColor(event.target.value)}
            aria-label="Folder color"
          />
          <button type="button" className="compose-btn" onClick={handleCreateContactList}>
            Create Folder
          </button>
        </div>
        <div className="selection-toolbar">
          <span>{selectedContactIds.length} selected</span>
          {activeContactList && selectedContactIds.length > 0 && (
            <button type="button" onClick={handleRemoveSelectedFromList}>
              Remove from {activeContactList.name}
            </button>
          )}
          {activeContactList && (
            <button type="button" onClick={() => applyContactListToCampaign(activeContactList)}>
              Use {activeContactList.name} in Campaign
            </button>
          )}
        </div>
      </div>
    </div>

    <div className="chart-box segmentation-panel">
      <div className="section-header">
        <div>
          <h3>Advanced Audience Segmentation</h3>
          <p>Filter contacts by activity, engagement, location, folder, and campaign response signals.</p>
        </div>
        <div className="campaign-header-actions">
          <span className="segment-count">{visibleContacts.length} matched</span>
          <button type="button" className="subtle-action-btn" onClick={() => setShowAdminSegments((current) => !current)}>
            {showAdminSegments ? "Hide Filters" : "Show Filters"}
          </button>
        </div>
      </div>

      {showAdminSegments && (
      <>
      <div className="segment-chip-row">
        {[
          ["all", "All contacts"],
          ["active", "Active users"],
          ["inactive", "Inactive users"],
          ["recent", "Recently added"],
          ["high-engagement", "High engagement"],
          ["leads", "Leads"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            className={segmentFilter === value ? "active" : ""}
            onClick={() => setSegmentFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="segment-filter-grid">
        <label>
          Location
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)}>
            <option value="all">All locations</option>
            {uniqueLocations.map((location) => (
              <option value={location} key={location}>
                {location}
              </option>
            ))}
          </select>
        </label>
        <label>
          Campaign response
          <select value={engagementFilter} onChange={(event) => setEngagementFilter(event.target.value)}>
            <option value="all">All response types</option>
            <option value="opened">Opened equivalent</option>
            <option value="clicked">Clicked equivalent</option>
            <option value="not-opened">Not opened equivalent</option>
          </select>
        </label>
        <label>
          Folder context
          <input value={activeContactList ? activeContactList.name : "All Contacts"} readOnly />
        </label>
      </div>
      </>
      )}
    </div>

    <div className="chart-box">
      <div className="section-header">
        <div>
          <h2
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <FaUsers />
            {activeContactList ? activeContactList.name : "Contact Directory"}
          </h2>
          <p style={{ color: "#64748b", margin: 0 }}>
            {activeContactList
              ? `${visibleAdminContacts.length} of ${visibleContacts.length} contacts in this folder`
              : `${visibleAdminContacts.length} of ${visibleContacts.length} contacts shown`}
          </p>
        </div>
        <button type="button" className="template-btn" onClick={selectAllVisibleContacts}>
          {visibleContacts.every((contact) => selectedContactIds.includes(getContactId(contact))) && visibleContacts.length
            ? "Clear Visible"
            : "Select Visible"}
        </button>
        {visibleContacts.length > 10 && (
          <button type="button" className="subtle-action-btn" onClick={() => setShowAllAdminContacts((current) => !current)}>
            {showAllAdminContacts ? "Show Less" : "Show All"}
          </button>
        )}
      </div>
      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    marginTop: "15px",
  }}
>
  <div
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid #ddd",
    padding: "10px",
    borderRadius: "8px",
    width: "320px",
  }}
>
  <FaSearch color="#64748b" />

 <input
  type="text"
  placeholder="Search contacts..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  style={{
    border: "none",
    outline: "none",
    width: "100%",
  }}
/>
</div>
  {selectedContactIds.length > 0 && (
    <div className="selection-strip">
      <strong>{selectedContactIds.length} selected</strong>
      <span>Select a folder card’s Add Selected button to add these contacts, or create a new folder above.</span>
    </div>
  )}
</div>

      <div className="table-scroll">
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
          <thead>
  <tr
    style={{
      background: "#111827",
      color: "#fff",
    }}
  >
    <th>
      <input
        type="checkbox"
        checked={
          visibleContacts.length > 0 &&
          visibleContacts.every((contact) => selectedContactIds.includes(getContactId(contact)))
        }
        onChange={selectAllVisibleContacts}
      />
    </th>
    <th>Name</th>
    <th>Email</th>
    <th>Phone</th>
    <th>City</th>
    <th>Status</th>
    <th>Action</th>
  </tr>
</thead>
       <tbody>
 {visibleAdminContacts.map((contact, index) => (
    <tr key={contact._id || index}>
      <td>
        <input
          type="checkbox"
          checked={selectedContactIds.includes(getContactId(contact))}
          onChange={() => toggleContactSelection(getContactId(contact))}
        />
      </td>
      <td>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }}
  >
    <FaUserCircle
      size={24}
      color="#0f766e"
    />

    {contact.name}
  </div>
</td>
      <td>{contact.email}</td>
      <td>
  <FaPhone
    style={{
      marginRight: "6px",
      color: "#22c55e",
    }}
  />
  {contact.phone}
</td>
      <td>
  <FaMapMarkerAlt
    style={{
      marginRight: "6px",
      color: "#ef4444",
    }}
  />
  {contact.city}
</td>
      <td>
  <span
    style={{
      background:
        contact.status === "Customer"
          ? "#dcfce7"
          : "#fef3c7",
      color:
        contact.status === "Customer"
          ? "#166534"
          : "#92400e",
      padding: "6px 12px",
      borderRadius: "20px",
      fontWeight: "600",
      fontSize: "12px",
    }}
  >
    {contact.status}
  </span>
</td>
      <td>
  <div
    style={{
      display: "flex",
      gap: "12px",
      justifyContent: "center",
    }}
  >
    <FaEye
      color="#0f766e"
      style={{ cursor: "pointer" }}
    />

    <FaEdit
      color="#f97316"
      style={{ cursor: "pointer" }}
    />

    <FaSms
      color="#22c55e"
      style={{ cursor: "pointer" }}
      onClick={() => openSmsComposer(contact)}
    />

    <FaTrash
      color="#ef4444"
      style={{ cursor: "pointer" }}
      onClick={() =>
        handleDeleteContact(contact)
      }
    />
  </div>
</td>
    </tr>
  ))}
  {visibleContacts.length === 0 && (
    <tr>
      <td colSpan="7">
        <div className="empty-state">
          <FaUsers />
          <strong>No contacts match this segment</strong>
          <p>Adjust filters, choose another folder, or add contacts to build this audience.</p>
          <button type="button" className="compose-btn" onClick={openAddContact}>
            Add Contact
          </button>
        </div>
      </td>
    </tr>
  )}
</tbody>
</table>
      </div>
</div> 
</>
)}

  {activePage === "Create Contact" && (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Create Contact</span>
          <h1>Add a contact</h1>
          <p>Create one audience record on its own page, then return to the same Contacts workspace.</p>
        </div>
        {renderCloseButton("Contacts")}
      </div>

      <div className="settings-card user-form-card page-form-card">
        <div className="user-form-grid">
          <label>
            Full Name
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Email Address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Phone Number
            <input type="text" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </label>
          <label>
            City
            <input type="text" value={city} onChange={(event) => setCity(event.target.value)} />
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {["Lead", "Prospect", "Customer", "Inactive"].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="campaign-header-actions">
          <button
            type="button"
            className="template-btn"
            onClick={() => {
              setName("");
              setEmail("");
              setPhone("");
              setCity("");
              setStatus("Lead");
              setActivePage("Contacts");
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="compose-btn"
            onClick={() =>
              handleAddContact({
                name,
                email,
                phone,
                city,
                status,
              })
            }
          >
            Save Contact
          </button>
        </div>
      </div>
    </>
  )}

  {activePage === "Import Contacts" && (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Import Contacts</span>
          <h1>Import contacts</h1>
          <p>Upload a file on its own page, then return to Contacts after import.</p>
        </div>
        {renderCloseButton("Contacts")}
      </div>

      <div className="settings-card user-form-card page-form-card">
        <h3>Bulk Upload</h3>
        <p>CSV, Excel, Word, or PDF. Columns/labels: name, email, phone, city, status.</p>
        <div
          className="file-upload-zone"
          onClick={() => document.getElementById("admin-csv-import-page").click()}
        >
          <FaFileImport />
          <p>{csvFile ? `Selected: ${csvFile.name}` : "Click to choose a file"}</p>
          <input
            id="admin-csv-import-page"
            type="file"
            accept=".csv,.xlsx,.xls,.docx,.pdf"
            style={{ display: "none" }}
            onChange={(event) => setCsvFile(event.target.files[0])}
          />
        </div>
        <div className="campaign-header-actions">
          <button
            type="button"
            className="template-btn"
            onClick={() => {
              setCsvFile(null);
              setActivePage("Contacts");
            }}
          >
            Cancel
          </button>
          <button type="button" className="compose-btn" onClick={handleImportCsv} disabled={!csvFile || importingContacts}>
            {importingContacts ? "Importing..." : "Import Contacts"}
          </button>
        </div>
      </div>
    </>
  )}

  {activePage === "Automations" && (
    <AutomationWorkflows
      contactLists={contactLists}
      setActivePage={setActivePage}
      showToast={showToast}
    />
  )}
          
            

  {/* ANALYTICS */}
  {activePage === "Analytics" && (
    <AdvancedAnalytics
      analytics={analyticsData}
      loading={analyticsLoading}
      darkMode={darkMode}
      onRangeChange={setAnalyticsRange}
    />
  )}
  {/* NOTIFICATIONS PAGE */}
{activePage === "Notifications" && (
  <>
    {/* Header */}
    <div style={{ marginBottom: "25px" }}>
      <h1>Notification Center</h1>
      <p style={{ color: "#64748b" }}>
        Monitor campaign alerts, system updates and platform health in real time.
      </p>
    </div>
    

    {/* Summary Cards */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: "15px",
        marginBottom: "20px",
      }}
    >
      <div
        className="chart-box"
        style={{
          padding: "15px",
          minHeight: "90px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h2 style={{ margin: "0", fontSize: "28px" }}>
          {notificationSummary.total}
        </h2>

        <p
          style={{
            margin: "4px 0",
            fontSize: "14px",
          }}
        >
          Total Alerts
        </p>

        <small style={{ color: "#22c55e" }}>
          +12% this week
        </small>
      </div>

      <div
        className="chart-box"
        style={{
          padding: "15px",
          minHeight: "90px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h2 style={{ margin: "0", fontSize: "28px" }}>
          {notificationSummary.unread}
        </h2>

        <p
          style={{
            margin: "4px 0",
            fontSize: "14px",
          }}
        >
          Unread
        </p>

        <small style={{ color: "#d97706" }}>
          Needs Attention
        </small>
      </div>

      <div
        className="chart-box"
        style={{
          padding: "15px",
          minHeight: "90px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h2 style={{ margin: "0", fontSize: "28px" }}>
          {notificationSummary.campaignAlerts}
        </h2>

        <p
          style={{
            margin: "4px 0",
            fontSize: "14px",
          }}
        >
          Campaign Alerts
        </p>

        <small style={{ color: "#3b82f6" }}>
          Active
        </small>
      </div>

      <div
        className="chart-box"
        style={{
          padding: "15px",
          minHeight: "90px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h2 style={{ margin: "0", fontSize: "28px" }}>
          {notificationSummary.systemUpdates}
        </h2>

        <p
          style={{
            margin: "4px 0",
            fontSize: "14px",
          }}
        >
          System Updates
        </p>

        <small style={{ color: "#7c3aed" }}>
          Latest
        </small>
      </div>
    </div>

    {/* Notifications & Activity */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
        marginBottom: "20px",
      }}
    >
      <div className="chart-box">
        <h2>Recent Notifications</h2>
        <Notifications
          theme={darkMode}
          notifications={notifications}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />
      </div>

      <div className="chart-box">
        <h2>Recent Activity</h2>

        {visibleActivities.map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 0",
              borderBottom: "1px solid #eee",
            }}
          >
            <span
              style={{
                color: item.color,
                fontSize: "18px",
              }}
            >
              {item.icon}
            </span>

            <div>
              <div>{item.text}</div>

              <small
                style={{
                  color: "#64748b",
                }}
              >
                {item.time}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom Cards */}
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
      }}
    >
      <div className="chart-box">
        <h2>System Health</h2>

        <div className="metric-row">
          <span>Email Server</span>
          <strong style={{ color: "#22c55e" }}>
            Healthy
          </strong>
        </div>

        <div className="metric-row">
          <span>Database</span>
          <strong style={{ color: "#22c55e" }}>
            Online
          </strong>
        </div>

        <div className="metric-row">
          <span>API Services</span>
          <strong style={{ color: "#22c55e" }}>
            Running
          </strong>
        </div>

        <div className="metric-row">
          <span>Backup Status</span>
          <strong style={{ color: "#22c55e" }}>
            Completed
          </strong>
        </div>
      </div>

      <div className="chart-box">
        <h2>Notification Trends</h2>

        <div className="metric-row">
          <span>Campaign Alerts</span>
          <strong>42%</strong>
        </div>

        <div className="metric-row">
          <span>System Updates</span>
          <strong>28%</strong>
        </div>

        <div className="metric-row">
          <span>User Activity</span>
          <strong>20%</strong>
        </div>

        <div className="metric-row">
          <span>Resolved Alerts</span>
          <strong>10%</strong>
        </div>
      </div>
    </div>
  </>
)}

  
  {activePage === "Settings" && (

  <div className="settings-container">
    <h2 className="settings-title">Workspace Settings</h2>

<div className="settings-grid">

  <div className="settings-card">
    <h3>Profile Information</h3>
    <div className="user-form-grid">
      {[
        ["name", "Full Name", "text"],
        ["email", "Email Address", "email"],
        ["phone", "Phone Number", "text"],
        ["senderName", "Sender Name", "text"],
        ["replyTo", "Reply-to Email", "email"],
      ].map(([field, label, type]) => (
        <label key={field}>
          {label}
          <input
            type={type}
            value={settingsDraft[field]}
            onChange={(event) => setSettingsDraft((current) => ({ ...current, [field]: event.target.value }))}
          />
        </label>
      ))}
    </div>

    <button type="button" className="save-btn" onClick={saveAdminSettings} disabled={savingSettings}>
      {savingSettings ? "Saving..." : "Save Profile"}
    </button>
  </div>

  <div className="settings-card">
    <h3>Security & Access</h3>
    <div className="user-form-grid">
      <label>
        Current Password
        <input
          type="password"
          value={passwordDraft.currentPassword}
          onChange={(event) => setPasswordDraft((current) => ({ ...current, currentPassword: event.target.value }))}
        />
      </label>
      <label>
        New Password
        <input
          type="password"
          value={passwordDraft.newPassword}
          onChange={(event) => setPasswordDraft((current) => ({ ...current, newPassword: event.target.value }))}
        />
      </label>
      <label>
        Confirm New Password
        <input
          type="password"
          value={passwordDraft.confirmPassword}
          onChange={(event) => setPasswordDraft((current) => ({ ...current, confirmPassword: event.target.value }))}
        />
      </label>
    </div>

    <button type="button" className="save-btn" onClick={updateAdminPassword} disabled={savingPassword}>
      {savingPassword ? "Updating..." : "Update Password"}
    </button>
  </div>

  <div className="settings-card">
    <h3>Role-based Access</h3>
    <div className="role-grid">
      {[
        ["Admin", "Full control over campaigns, contacts, automations, billing, and settings."],
        ["User", "Workspace access for campaigns, contacts, SMS, templates, analytics, and settings."],
      ].map(([role, detail]) => (
        <div className="role-card" key={role}>
          <strong>{role}</strong>
          <p>{detail}</p>
        </div>
      ))}
    </div>
  </div>

  <div className="settings-card">
    <h3>Production Readiness</h3>
    <div className="readiness-list">
      <span>JWT authentication enabled</span>
      <span>Campaign send rate limits configured</span>
      <span>Backend validation and centralized errors</span>
      <span>Activity logs for key actions</span>
      <span>Queue-ready email delivery architecture</span>
    </div>
  </div>
 </div>

</div>
)}


  {/* DASHBOARD */}
  {activePage === "Dashboard" && (
    <>
        <div className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Admin Control Room</span>
            <h1>Platform Operations Dashboard</h1>
            <p>
              Manage users, roles, subscriptions, global delivery health, audit logs, and campaign operations from one admin-only surface.
            </p>
          </div>
          <button type="button" className="compose-btn" onClick={() => setActivePage("Users")}>
            Manage Users
          </button>
        </div>

        <div className="quick-actions-grid role-actions-grid">
          {[
            [FaUserShield, "Users", "Review accounts, roles, and suspended access."],
            [FaCreditCard, "Plans", "Check plan limits and subscription status."],
            [FaServer, "Monitoring", "Watch SMTP, queues, failed sends, and API health."],
            [FaClipboardList, "System Logs", "Audit admin actions and platform events."],
          ].map(([Icon, title, text]) => (
            <button
              type="button"
              className="quick-action-card"
              key={title}
              onClick={() => setActivePage(title)}
            >
              <span className="users-icon">
                <Icon />
              </span>
              <strong>{title}</strong>
              <p>{text}</p>
            </button>
          ))}
        </div>

        <QuickActionCards
          setActivePage={setActivePage}
          openCompose={openCampaignWizard}
          openAddContact={openAddContact}
        />

        <StatsCards stats={dashboardData?.stats} />

        <div className="stats-grid role-stats-grid">
          <div className="card">
            <h3>Unread Notifications</h3>
            <p>{notificationSummary.unread}</p>
            <span>Needs admin review</span>
          </div>
          <div className="card green">
            <h3>Read Notifications</h3>
            <p>{notificationSummary.read}</p>
            <span>Already reviewed</span>
          </div>
          <div className="card purple">
            <h3>Campaign Alerts</h3>
            <p>{notificationSummary.campaignAlerts}</p>
            <span>Campaign-related items</span>
          </div>
          <div className="card orange">
            <h3>System Updates</h3>
            <p>{notificationSummary.systemUpdates}</p>
            <span>Platform messages</span>
          </div>
        </div>



        <div className="charts">
          <PerformanceChart data={dashboardData?.performance} />
          <ChannelChart />
        </div>

        {/* Progress first */}
        <ProgressSection />

        {/* Analytics below progress */}
        <AnalyticsCards />

        {/* TOP + ACTIVITY */}
        <div className="top-recent-wrapper">

          <TopPerformers
            campaigns={topCampaigns}
            showAll={showAllTopCampaigns}
            onViewAll={() => setShowAllTopCampaigns((current) => !current)}
          />

          <div className="chart-box">

            <div className="section-header">

              <h3>Recent Activity</h3>

              <a href="#">
                View all
              </a>

            </div>

                            {visibleActivities.map(
              (item, i) => (
                <div
                  className="activity-row"
                  key={i}
                >
                  <div className="activity-main">
                    <span
                      style={{
                        fontSize:
                          "18px",
                        color:
                          item.color,
                      }}
                    >
                      {item.icon}
                    </span>

                    <span>
                      {item.text}
                    </span>
                  </div>

                  <span className="activity-time">
                    {item.time}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="growth-usage-wrapper">
          <ContactGrowth />
          <EmailUsage usage={dashboardData?.emailUsage} />
        </div>

        <div className="bottom-wrapper">
          <Notifications
            theme={darkMode}
            notifications={notifications}
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllNotificationsRead}
          />
          <Schedule />
        </div>

        <div className="last-wrapper">
          <Footer />
        </div>
      </>
    )}
</section>

      </div>
    </div>
  </div>
);
}

export default AdminDashboard;
