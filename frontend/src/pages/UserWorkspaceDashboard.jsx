import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaBell,
  FaChartBar,
  FaCheckCircle,
  FaArrowLeft,
  FaDownload,
  FaEnvelope,
  FaEdit,
  FaEye,
  FaFileImport,
  FaHome,
  FaPalette,
  FaPaperPlane,
  FaPlus,
  FaProjectDiagram,
  FaShieldAlt,
  FaTrash,
  FaTimes,
  FaUsers,
  FaCog,
  FaSms,
  FaWhatsapp,
} from "react-icons/fa";
import AdvancedAnalytics from "../components/AdvancedAnalytics.jsx";
import AutomationWorkflows from "../components/AutomationWorkflows.jsx";
import CampaignWizard from "../components/CampaignWizard.jsx";
import Notifications from "../components/Notifications.jsx";
import TemplateStudio from "../components/TemplateStudio.jsx";
import ToastStack from "../components/ToastStack.jsx";
import RoleShell from "../layouts/RoleShell.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { contactApi, dashboardApi, authApi, paymentApi } from "../services/api.js";
import { getStoredUser } from "../utils/auth.js";
import { parseCsvLine } from "../utils/csv.js";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(Number(value || 0));

const emptyContact = {
  name: "",
  email: "",
  phone: "",
  city: "",
  status: "Lead",
};

const campaignStatusText = (campaign) => String(campaign?.status || campaign?.sendStatus || "").toLowerCase();

function UserWorkspaceDashboard() {
  const [currentUser, setCurrentUser] = useState(getStoredUser());
  const user = currentUser;
  const [activePage, setActivePage] = useState("Dashboard");
  const [dashboardData, setDashboardData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState("All Time");
  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [contactLists, setContactLists] = useState([]);
  const [templates, setTemplates] = useState([]);
  const { notifications, markAsRead: handleMarkNotificationRead, markAllAsRead: handleMarkAllNotificationsRead } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [toasts, setToasts] = useState([]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [campaignSearch, setCampaignSearch] = useState("");
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [newContact, setNewContact] = useState(emptyContact);
  const [importText, setImportText] = useState("Asha Rao,asha@example.com,+91 90000 00001,Bangalore,Lead");
  const [viewingContact, setViewingContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showSmsComposer, setShowSmsComposer] = useState(false);
  const [smsTarget, setSmsTarget] = useState(null);
  const [smsReturnPage, setSmsReturnPage] = useState("SMS Campaign");
  const [smsMessage, setSmsMessage] = useState("");
  const [sendingSms, setSendingSms] = useState(false);

  const [campaignName, setCampaignName] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [campaignRecipients, setCampaignRecipients] = useState("");
  const [selectedCampaignListId, setSelectedCampaignListId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateToEdit, setTemplateToEdit] = useState(null);
  const [campaignError, setCampaignError] = useState("");

  const [settingsDraft, setSettingsDraft] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    senderName: user?.senderName || "MailNova Workspace",
    replyTo: user?.replyTo || user?.email || "",
  });
  const [passwordDraft, setPasswordDraft] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const showToast = useCallback((title, message = "", type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, title, message, type }].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const dismissToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const loadWorkspace = useCallback(async () => {
    try {
      const [
        dashboardResponse,
        analyticsResponse,
        campaignsResponse,
        contactResponse,
        listResponse,
        templateResponse,
      ] = await Promise.all([
        dashboardApi.getDashboard(),
        dashboardApi.getAnalytics(analyticsRange),
        dashboardApi.getCampaigns(campaignSearch),
        contactApi.getContacts(),
        contactApi.getContactLists(),
        dashboardApi.getTemplates(),
      ]);

      setDashboardData(dashboardResponse.data);
      setAnalyticsData(analyticsResponse.data);
      setCampaigns(campaignsResponse.data || []);
      setContacts(contactResponse.data.contacts || []);
      setContactLists(listResponse.data.lists || []);
      setTemplates(templateResponse.data || []);
      setApiError("");
    } catch (error) {
      console.error(error);
      setApiError("Backend connection is unavailable. Start the backend to use live workspace data.");
    } finally {
      setLoading(false);
    }
  }, [analyticsRange, campaignSearch]);

  useEffect(() => {
    loadWorkspace();
    const interval = window.setInterval(loadWorkspace, 8000);
    return () => window.clearInterval(interval);
  }, [loadWorkspace]);

  const openSmsComposer = (contact = null) => {
    setSmsTarget(contact);
    setSmsMessage("");
    setSmsReturnPage(activePage && activePage !== "Compose SMS" ? activePage : "SMS Campaign");
    setShowSmsComposer(false);
    setActivePage("Compose SMS");
  };

  useEffect(() => {
    const handleOpenSms = (e) => {
      const contactDetail = e.detail;
      if (contactDetail) {
        const found = contacts.find(c => 
          c.name?.toLowerCase().includes(contactDetail.name?.toLowerCase()) || 
          c.email?.toLowerCase() === contactDetail.email?.toLowerCase()
        );
        setActivePage("Contacts");
        if (found) {
          openSmsComposer(found);
        } else {
          openSmsComposer({
            name: contactDetail.name || "Inquiry Lead",
            phone: contactDetail.phone || "919000000001",
            email: contactDetail.email || ""
          });
        }
      }
    };
    window.addEventListener("openSmsComposerForContact", handleOpenSms);
    return () => window.removeEventListener("openSmsComposerForContact", handleOpenSms);
  }, [contacts]);

  useEffect(() => {
    const handleOpenDetail = () => {
      setActivePage("Notifications");
    };
    window.addEventListener("openNotificationDetail", handleOpenDetail);
    return () => window.removeEventListener("openNotificationDetail", handleOpenDetail);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePage]);

  const navItems = useMemo(() => {
    const items = [
      { name: "Dashboard", icon: FaHome },
      { name: "Campaigns", icon: FaEnvelope },
      { name: "Templates", icon: FaPalette },
      { name: "Contacts", icon: FaUsers },
      { name: "Automations", icon: FaProjectDiagram },
      { name: "Analytics", icon: FaChartBar },
      { name: "Notifications", icon: FaBell },
      { name: "Settings", icon: FaCog },
    ];

    if (user?.role === "Admin") {
      items.push({ name: "Admin Control", icon: FaShieldAlt, to: "/admin" });
    }

    return items;
  }, [user?.role]);

  const stats = dashboardData?.stats || {};
  const metrics = dashboardData?.metrics || {};
  const userPlan = dashboardData?.userPlan || user?.plan || { name: "Free", sendLimit: 5000, contactLimit: 1000, billingStatus: "Trial" };
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const readCount = notifications.filter((notification) => notification.read).length;
  const savedTemplates = templates.filter((template) => template.createdBy);
  const selectedCampaignList =
    contactLists.find((list) => list._id === selectedCampaignListId || list.id === selectedCampaignListId) || null;
  const selectedTemplate = savedTemplates.find((template) => template._id === selectedTemplateId) || null;

  const visibleCampaigns = showAllCampaigns ? campaigns : campaigns.slice(0, 5);
  const visibleContacts = showAllContacts ? contacts : contacts.slice(0, 8);
  const draftCampaigns = campaigns.filter((campaign) => campaignStatusText(campaign) === "draft");
  const sentCampaigns = campaigns.filter((campaign) => campaignStatusText(campaign) !== "draft");
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

  const resetCampaignForm = () => {
    setCampaignName("");
    setCampaignSubject("");
    setCampaignContent("");
    setCampaignRecipients("");
    setSelectedCampaignListId("");
    setSelectedTemplateId("");
    setCampaignError("");
  };

  const openCampaignWizard = () => {
    setActivePage("Compose Campaign");
    setShowCompose(false);
  };

  const openImportContacts = () => {
    setActivePage("Import Contacts");
    setShowImportPanel(false);
  };

  const exportCsv = (name, rows) => {
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateCampaign = async (status = "Running", options = {}) => {
    if (!campaignName.trim() || !campaignSubject.trim()) {
      setCampaignError("Campaign name and subject are required.");
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

      resetCampaignForm();
      setShowCompose(false);
      setActivePage(status === "Draft" ? "Saved Drafts" : "Email Campaign");
      await loadWorkspace();
      showToast(
        status === "Draft" ? "Draft saved" : "Campaign submitted",
        response.data?.campaign?.sendStatus === "failed"
          ? response.data?.campaign?.sendError || "Campaign was saved but delivery failed."
          : "Live metrics will update automatically.",
        response.data?.campaign?.sendStatus === "failed" ? "warning" : "success"
      );
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.error || error.response?.data?.message || "Could not save campaign.";
      setCampaignError(message);
      showToast("Campaign failed", message, "error");
    }
  };

  const handleSaveContact = async (event) => {
    event.preventDefault();
    try {
      await contactApi.createContact(newContact);
      setNewContact(emptyContact);
      setShowContactForm(false);
      setActivePage("Contacts");
      await loadWorkspace();
      showToast("Contact added", "The contact is now available for campaigns.", "success");
    } catch (error) {
      console.error(error);
      showToast("Contact failed", error.response?.data?.message || "Could not save contact.", "error");
    }
  };

  const handleUpdateContact = async (event) => {
    event.preventDefault();
    if (!editingContact?._id) return;
    try {
      await contactApi.updateContact(editingContact._id, {
        name: editingContact.name,
        email: editingContact.email,
        phone: editingContact.phone,
        city: editingContact.city,
        status: editingContact.status,
      });
      setEditingContact(null);
      setActivePage("Contacts");
      await loadWorkspace();
      showToast("Contact updated", "Contact details saved successfully.", "success");
    } catch (error) {
      console.error(error);
      showToast("Update failed", error.response?.data?.message || "Could not update contact.", "error");
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;
    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const response = await contactApi.importFile(formData);
      setUploadFile(null);
      setShowImportPanel(false);
      setActivePage("Contacts");
      await loadWorkspace();
      showToast("Bulk Import Completed", response.data.message || "Contacts imported successfully.", "success");
    } catch (error) {
      console.error(error);
      showToast("Import failed", error.response?.data?.message || "Could not import file.", "error");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleImportContacts = async () => {
    const rows = importText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = parseCsvLine(line);
        const [name = "", email = "", phone = "", city = "", status = "Lead"] = parts;
        return { name, email, phone, city, status };
      })
      .filter((row) => row.name && row.email);

    if (!rows.length) {
      showToast("Import needs data", "Use one contact per line: name,email,phone,city,status.", "warning");
      return;
    }

    try {
      await Promise.all(rows.map((row) => contactApi.createContact(row)));
      setShowImportPanel(false);
      setActivePage("Contacts");
      await loadWorkspace();
      showToast("Contacts imported", `${rows.length} contacts were added.`, "success");
    } catch (error) {
      console.error(error);
      showToast("Import failed", error.response?.data?.message || "Could not import contacts.", "error");
    }
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
        : await contactApi.sendBulkSms({ message: smsMessage });

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

  const handleDeleteContact = async (contact) => {
    if (!contact?._id || !window.confirm(`Delete ${contact.name}?`)) return;

    try {
      await contactApi.deleteContact(contact._id);
      await loadWorkspace();
      showToast("Contact deleted", `${contact.name} was removed.`, "success");
    } catch (error) {
      console.error(error);
      showToast("Delete failed", error.response?.data?.message || "Could not delete contact.", "error");
    }
  };



  const handleUseTemplate = (template) => {
    setTemplates((current) =>
      current.some((item) => item._id === template._id)
        ? current.map((item) => (item._id === template._id ? template : item))
        : [template, ...current]
    );
    setSelectedTemplateId(template._id);
    setCampaignSubject(template.subject || "");
    setCampaignContent((current) => current || "Write the campaign message that should replace {{content}}.");
    setActivePage("Compose Campaign");
    setShowCompose(false);
    showToast("Template selected", `${template.name} is ready in the campaign builder.`, "success");
  };

  const handleDeleteDraft = async (campaign) => {
    const id = campaign?.id || campaign?._id;
    if (!id) return;
    if (!window.confirm(`Delete draft "${campaign.name}"? This cannot be undone.`)) return;
    try {
      await dashboardApi.deleteCampaign(id);
      showToast("Draft deleted", `${campaign.name} was removed.`, "success");
      await loadWorkspace();
    } catch (error) {
      showToast("Could not delete draft", error.response?.data?.message || "Please try again.", "error");
    }
  };

  const handleEditTemplate = (template) => {
    setTemplateToEdit(template);
    setActivePage("Template Builder");
  };

  const handleDeleteTemplate = async (template) => {
    if (!template?._id) return;
    if (!window.confirm(`Delete "${template.name}"? This cannot be undone.`)) return;
    try {
      await dashboardApi.deleteTemplate(template._id);
      showToast("Template deleted", `${template.name} was removed.`, "success");
      await loadWorkspace();
    } catch (error) {
      showToast("Could not delete template", error.response?.data?.message || "Please try again.", "error");
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
      await loadWorkspace();
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

  const renderCloseButton = (targetPage = "Campaigns", label = "Back") => (
    <button type="button" className="page-close-btn" onClick={() => setActivePage(targetPage)}>
      <FaArrowLeft />
      <span>{label}</span>
      <FaTimes />
    </button>
  );

  const saveSettings = async () => {
    try {
      const response = await authApi.updateProfile({
        ...settingsDraft,
      });
      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setCurrentUser(response.data.user);
        setSettingsDraft((current) => ({
          ...current,
          name: response.data.user.name || current.name,
          email: response.data.user.email || current.email,
          phone: response.data.user.phone || "",
          senderName: response.data.user.senderName || "MailNova Workspace",
          replyTo: response.data.user.replyTo || response.data.user.email || "",
        }));
        showToast("Profile Saved", "Workspace preferences have been saved to the backend.", "success");
      }
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || "Could not save profile settings.";
      showToast("Save Failed", message, "error");
    }
  };

  const updatePassword = async () => {
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
      showToast("Password Updated", response.data?.message || "Use the new password next time you log in.", "success");
    } catch (error) {
      console.error(error);
      showToast("Password Failed", error.response?.data?.message || "Could not update password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  // Loads the Razorpay Checkout script if it is not already on the page
  // (it is included in index.html, this is just a safety net).
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const refreshSessionUser = (user, token) => {
    if (token) localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleUpgradePlan = async (planName) => {
    // Free has no payment step - keep the existing self-service downgrade path.
    if (planName === "Free") {
      try {
        const response = await authApi.updatePlan({ planName });
        if (response.data.success) {
          refreshSessionUser(response.data.user, response.data.token);
          setShowUpgradeModal(false);
          showToast("Plan Updated", "Successfully switched to the Free plan.", "success");
          await loadWorkspace();
        }
      } catch (error) {
        console.error(error);
        const message = error.response?.data?.message || "Could not update plan.";
        showToast("Upgrade Failed", message, "error");
      }
      return;
    }

    // Pro / Enterprise: real payment through Razorpay. Order is created on
    // the backend (never in the browser), and the plan is only activated
    // after the backend independently verifies the payment signature.
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        showToast("Checkout Unavailable", "Could not load the payment widget. Check your connection and try again.", "error");
        return;
      }

      const orderResponse = await paymentApi.createOrder(planName);
      const { orderId, amount, currency, keyId } = orderResponse.data;

      const razorpay = new window.Razorpay({
        key: keyId,
        amount,
        currency,
        name: "MailNova",
        description: `${planName} plan subscription`,
        order_id: orderId,
        prefill: {
          name: currentUser?.name || "",
          email: currentUser?.email || "",
        },
        theme: { color: "#ea580c" },
        handler: async (paymentResult) => {
          try {
            const verifyResponse = await paymentApi.verify({
              razorpay_order_id: paymentResult.razorpay_order_id,
              razorpay_payment_id: paymentResult.razorpay_payment_id,
              razorpay_signature: paymentResult.razorpay_signature,
            });
            if (verifyResponse.data.success) {
              const updatedUser = { ...currentUser, plan: verifyResponse.data.plan };
              refreshSessionUser(updatedUser);
              setShowUpgradeModal(false);
              showToast("Payment Successful", `You are now on the ${planName} plan.`, "success");
              await loadWorkspace();
            }
          } catch (error) {
            console.error(error);
            const message = error.response?.data?.message || "Payment could not be verified. Contact support if you were charged.";
            showToast("Verification Failed", message, "error");
          }
        },
        modal: {
          ondismiss: () => {
            showToast("Checkout Closed", "Payment was not completed.", "info");
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        showToast("Payment Failed", response.error?.description || "The payment did not go through.", "error");
      });

      razorpay.open();
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || "Could not start checkout for this plan.";
      showToast("Upgrade Failed", message, "error");
    }
  };

  const renderCampaignTable = () => (
    <div className="performers">
      <div className="section-header">
        <div>
          <h3>My Campaigns</h3>
          <p>{campaigns.length} campaigns synced from backend</p>
        </div>
        <div className="campaign-header-actions">
          <button
            type="button"
            className="template-btn"
            onClick={() =>
              exportCsv("mailnova-campaigns", [
                ["Campaign", "Subject", "Status", "Sent", "Delivered", "Read/Open", "Unread", "Clicked"],
                ...campaigns.map((campaign) => [
                  campaign.name,
                  campaign.subject,
                  campaign.status,
                  campaign.emailsSent,
                  campaign.delivered,
                  campaign.opened,
                  campaign.unread ?? Math.max((campaign.delivered || campaign.emailsSent || 0) - (campaign.opened || 0), 0),
                  campaign.clicked,
                ]),
              ])
            }
          >
            <FaDownload />
            Export
          </button>
          {campaigns.length > 5 && (
            <button type="button" className="subtle-action-btn" onClick={() => setShowAllCampaigns((current) => !current)}>
              {showAllCampaigns ? "Show Less" : "View All"}
            </button>
          )}
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Read/Open</th>
              <th>Unread</th>
              <th>Open Rate</th>
              <th>CTR</th>
              <th>Template</th>
            </tr>
          </thead>
          <tbody>
            {visibleCampaigns.map((campaign) => {
              const readCount = Number(campaign.opened || 0);
              const unreadMailCount = Number(
                campaign.unread ?? Math.max((campaign.delivered || campaign.emailsSent || 0) - readCount, 0)
              );
              const openRate = campaign.emailsSent ? Math.round((readCount / campaign.emailsSent) * 100) : 0;
              const ctr = campaign.emailsSent ? Math.round((campaign.clicked / campaign.emailsSent) * 100) : 0;
              return (
                <tr key={campaign.id || campaign._id || campaign.name}>
                  <td>
                    <strong className="campaign-name">{campaign.name}</strong>
                    <small>{campaign.subject}</small>
                  </td>
                  <td>
                    <span className={`status-badge ${campaign.status === "Draft" ? "paused" : ""}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td>{formatNumber(campaign.emailsSent)}</td>
                  <td className="positive-cell">{formatNumber(readCount)}</td>
                  <td>{formatNumber(unreadMailCount)}</td>
                  <td className="positive-cell">{openRate}%</td>
                  <td>{ctr}%</td>
                  <td>{campaign.templateName || "Basic"}</td>
                </tr>
              );
            })}
            {!visibleCampaigns.length && (
              <tr>
                <td colSpan="8">
                  <div className="empty-state compact-empty">
                    <FaEnvelope />
                    <strong>No campaigns yet</strong>
                    <p>Create your first campaign or save a draft to see it here.</p>
                    <button type="button" className="compose-btn" onClick={openCampaignWizard}>
                      Create Campaign
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <>
      <div className="user-hero">
        <div>
          <span className="eyebrow">User Workspace</span>
          <h1>Campaign workspace for real work</h1>
          <p>
            Launch campaigns, grow contacts, build templates with images, automate follow-ups, and watch live metrics refresh.
          </p>
        </div>
        <div className="campaign-header-actions">
          <button type="button" className="template-btn" onClick={() => setActivePage("Saved Templates")}>
            <FaPalette />
            Open Templates
          </button>
          <button type="button" className="compose-btn" onClick={openCampaignWizard}>
            <FaPaperPlane />
            Create Campaign
          </button>
        </div>
      </div>

      {apiError && <div className="info-banner error-banner">{apiError}</div>}

      <div className="quick-actions-grid role-actions-grid">
        {[
          [FaEnvelope, "Compose Campaign", "Plan audience, template, content, and send setup.", openCampaignWizard],
          [FaFileImport, "Import Contacts", "Paste CSV lines and sync contacts to the backend.", openImportContacts],
          [FaPalette, "Build Template", "Open the professional template builder with image blocks.", () => { setTemplateToEdit(null); setActivePage("Template Builder"); }],
          [FaProjectDiagram, "Build Workflow", "Create welcome, nurture, and non-opener workflows.", () => setActivePage("Automations")],
        ].map(([Icon, title, text, action]) => (
          <button type="button" className="quick-action-card" key={title} onClick={action}>
            <span className="users-icon">
              <Icon />
            </span>
            <strong>{title}</strong>
            <p>{text}</p>
          </button>
        ))}
      </div>

      <div className="stats-grid role-stats-grid">
        <div className="card">
          <h3>Emails Sent</h3>
          <p>{formatNumber(stats.totalEmailsSent || stats.emailsSent)}</p>
          <span>Synced from campaigns</span>
        </div>
        <div className="card green">
          <h3>Delivered</h3>
          <p>{formatNumber(stats.delivered)}</p>
          <span>{metrics.deliveryRate || "0.0"}% delivery rate</span>
        </div>
        <div className="card purple">
          <h3>Contacts</h3>
          <p>{formatNumber(contacts.length)}</p>
          <span>{contactLists.length} folders available</span>
        </div>
        <div className="card orange">
          <h3>Read / Unread</h3>
          <p>{readCount} / {unreadCount}</p>
          <span>Notification state refreshes live</span>
        </div>
      </div>

      <div className="top-recent-wrapper">
        <div className="chart-box">
          <div className="section-header">
            <div>
              <h3>Campaign Flow</h3>
              <p>Open each channel in its own page</p>
            </div>
            <FaEnvelope color="var(--mn-primary)" />
          </div>
          <div className="dashboard-flow-list">
            {[
              [FaEnvelope, "Email Campaign", "Analytics, compose, templates, drafts", () => setActivePage("Email Campaign")],
              [FaSms, "SMS Campaign", "Separate SMS composer and phone-ready audience", () => setActivePage("SMS Campaign")],
              [FaWhatsapp, "WhatsApp Campaign", "Coming soon", () => setActivePage("WhatsApp Campaign")],
            ].map(([Icon, title, text, action]) => (
              <button type="button" key={title} onClick={action}>
                <Icon />
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="chart-box">
          <div className="section-header">
            <div>
              <h3>Workspace Readiness</h3>
              <p>Live status for your setup</p>
            </div>
            <FaCheckCircle color="#14b8a6" />
          </div>
          <div className="readiness-list">
            <span>{savedTemplates.length} saved templates available</span>
            <span>{contacts.length} contacts ready for segmentation</span>
            <span>{campaigns.length} campaigns tracked in analytics</span>
            <span>{loading ? "Refreshing workspace data" : "Realtime polling active every 8 seconds"}</span>
            {dashboardData?.trackingConfig && !dashboardData.trackingConfig.isPublic ? (
              <span style={{ color: "#d97706" }}>⚠ Local tracking (Gmail pixels require public URL)</span>
            ) : (
              <span style={{ color: "#14b8a6" }}>✓ Tracking URL is public & active</span>
            )}
          </div>
        </div>
      </div>

      {/* NEW: Dynamic Workspace Sections Overview for professional attraction */}
      <div className="growth-usage-wrapper" style={{ marginTop: "20px" }}>
        <div className="chart-box">
          <div className="section-header">
            <div>
              <h3>Active Automation Workflows</h3>
              <p>Triggers and follow-up loops</p>
            </div>
            <FaProjectDiagram color="var(--mn-primary)" />
          </div>
          <div className="workflow-board" style={{ display: "grid", gap: "10px", marginTop: "15px" }}>
            <div className="workflow-card" style={{ padding: "12px", background: "var(--mn-surface-muted)", borderRadius: "8px", border: "1px solid var(--mn-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", fontSize: "13px" }}>
                <span>Welcome Series Nurture</span>
                <span className="status-badge">Active</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--mn-muted)", margin: "4px 0" }}>Trigger: User registers to list</p>
              <div style={{ display: "flex", gap: "4px", marginTop: "8px", fontSize: "11px", color: "var(--mn-muted)" }}>
                <span style={{ background: "rgba(15, 118, 110, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>Email 1: Instantly</span>
                <span style={{ background: "rgba(15, 118, 110, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>Email 2: 2 Days</span>
                <span style={{ background: "rgba(15, 118, 110, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>Email 3: 5 Days</span>
              </div>
            </div>

            <div className="workflow-card" style={{ padding: "12px", background: "var(--mn-surface-muted)", borderRadius: "8px", border: "1px solid var(--mn-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", fontSize: "13px" }}>
                <span>Re-engagement Loop</span>
                <span className="status-badge paused">Paused</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--mn-muted)", margin: "4px 0" }}>Trigger: 30 days inactive</p>
            </div>
          </div>
        </div>

        <div className="chart-box">
          <div className="section-header">
            <div>
              <h3>Email Template Studio</h3>
              <p>Quick presets and canvas drafts</p>
            </div>
            <FaPalette color="var(--mn-primary)" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" }}>
            {savedTemplates.slice(0, 4).map((template) => (
              <div key={template._id || template.name} style={{ padding: "10px", border: "1px solid var(--mn-border)", borderRadius: "8px", background: "var(--mn-surface-muted)", textAlign: "center" }}>
                <strong style={{ fontSize: "12px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{template.name}</strong>
                <span style={{ fontSize: "10px", color: "var(--mn-muted)", display: "block", marginBottom: "6px" }}>{template.templateType || "Custom"}</span>
                <button type="button" className="template-btn" onClick={() => handleUseTemplate(template)} style={{ fontSize: "11px", minHeight: "26px", padding: "2px 8px", width: "100%" }}>
                  Use Presets
                </button>
              </div>
            ))}
            {savedTemplates.length === 0 && (
              <div style={{ gridColumn: "span 2", textAlign: "center", padding: "20px", color: "var(--mn-muted)" }}>
                No templates saved yet. Click "Build Template" to start.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bottom-wrapper" style={{ marginTop: "20px" }}>
        <div className="chart-box">
          <div className="section-header">
            <div>
              <h3>Audience Segments</h3>
              <p>Active contact folders</p>
            </div>
            <FaUsers color="var(--mn-primary)" />
          </div>
          <div style={{ display: "grid", gap: "10px", marginTop: "15px" }}>
            {contactLists.map((list) => (
              <div key={list._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", border: "1px solid var(--mn-border)", borderRadius: "8px", background: "var(--mn-surface-muted)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: list.color || "#2563eb" }}></span>
                  <strong style={{ fontSize: "13px" }}>{list.name}</strong>
                </div>
                <span className="status-badge" style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb", borderColor: "rgba(37, 99, 235, 0.15)" }}>
                  {list.contactCount || 0} Contacts
                </span>
              </div>
            ))}
            {contactLists.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--mn-muted)" }}>
                No segments created. Go to Contacts to segment your audience.
              </div>
            )}
          </div>
        </div>

        <div className="chart-box">
          <div className="section-header">
            <div>
              <h3>Recent Notifications</h3>
              <p>Workspace logs and milestones</p>
            </div>
            <FaBell color="var(--mn-primary)" />
          </div>
          <Notifications
            notifications={notifications.slice(0, 3)}
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllNotificationsRead}
          />
        </div>
      </div>
    </>
  );

  const renderCampaigns = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Campaign Center</span>
          <h1>Campaigns dashboard</h1>
          <p>Choose a channel first, then work inside focused pages for analytics, compose, drafts, and templates.</p>
        </div>
        <div className="campaign-header-actions">
          <button type="button" className="template-btn" onClick={() => setActivePage("Saved Drafts")}>
            Saved Drafts
          </button>
          <button type="button" className="compose-btn" onClick={() => setActivePage("Email Campaign")}>
            <FaEnvelope />
            Email Campaign
          </button>
        </div>
      </div>

      <div className="campaign-channel-grid">
        {[
          {
            icon: FaEnvelope,
            title: "Email Campaign",
            text: "Email analytics, compose flow, saved drafts, and templates.",
            action: () => setActivePage("Email Campaign"),
            meta: `${sentCampaigns.length} live campaigns`,
          },
          {
            icon: FaSms,
            title: "SMS Campaign",
            text: "Open a focused SMS page for bulk or one-to-one SMS sends.",
            action: () => setActivePage("SMS Campaign"),
            meta: `${phoneReadyContacts.length} phone-ready contacts`,
          },
          {
            icon: FaWhatsapp,
            title: "WhatsApp Campaign",
            text: "Reserved for WhatsApp campaign setup and approval flow.",
            action: () => setActivePage("WhatsApp Campaign"),
            meta: "Coming soon",
            comingSoon: true,
          },
        ].map(({ icon: Icon, title, text, action, meta, comingSoon }) => (
          <button type="button" className={`campaign-channel-card ${comingSoon ? "coming-soon" : ""}`} key={title} onClick={action}>
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
          <p>{formatNumber(emailTotals.sent)}</p>
          <span>{emailOpenRate}% open rate</span>
        </div>
        <div className="card green">
          <h3>Drafts</h3>
          <p>{formatNumber(draftCampaigns.length)}</p>
          <span>Reusable saved campaigns</span>
        </div>
        <div className="card purple">
          <h3>Templates</h3>
          <p>{formatNumber(savedTemplates.length)}</p>
          <span>Saved email layouts</span>
        </div>
        <div className="card orange">
          <h3>SMS Audience</h3>
          <p>{formatNumber(phoneReadyContacts.length)}</p>
          <span>Contacts with phone numbers</span>
        </div>
      </div>

      <div className="flow-note-panel">
        <strong>Campaign flow</strong>
        <p>Email, SMS, and WhatsApp are separated here. Open a channel to see its own analytics, composer, drafts, and templates.</p>
      </div>
    </>
  );

  const renderEmailCampaign = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Email Campaign</span>
          <h1>Email analytics dashboard</h1>
          <p>Review email performance first, then open compose, templates, or saved drafts as separate pages.</p>
        </div>
        <div className="campaign-header-actions">
          {renderCloseButton("Campaigns")}
          <button type="button" className="compose-btn" onClick={openCampaignWizard}>
            <FaPlus />
            Compose
          </button>
        </div>
      </div>

      <div className="quick-actions-grid role-actions-grid">
        {[
          [FaPaperPlane, "Compose Campaign", "Create, save draft, or send from the guided builder.", openCampaignWizard],
          [FaPalette, "Template Builder", "Design a reusable email layout.", () => { setTemplateToEdit(null); setActivePage("Template Builder"); }],
          [FaPalette, "Saved Templates", "Open saved templates and reuse them in a campaign.", () => setActivePage("Saved Templates")],
          [FaEnvelope, "Saved Drafts", "Continue an unsent campaign or send a draft copy.", () => setActivePage("Saved Drafts")],
        ].map(([Icon, title, text, action]) => (
          <button type="button" className="quick-action-card" key={title} onClick={action}>
            <span className="users-icon">
              <Icon />
            </span>
            <strong>{title}</strong>
            <p>{text}</p>
          </button>
        ))}
      </div>

      <div className="stats-grid role-stats-grid">
        <div className="card">
          <h3>Sent</h3>
          <p>{formatNumber(emailTotals.sent)}</p>
          <span>Email campaigns only</span>
        </div>
        <div className="card green">
          <h3>Delivered</h3>
          <p>{formatNumber(emailTotals.delivered)}</p>
          <span>{emailTotals.sent ? Math.round((emailTotals.delivered / emailTotals.sent) * 100) : 0}% delivery rate</span>
        </div>
        <div className="card purple">
          <h3>Opened / Unread</h3>
          <p>{formatNumber(emailTotals.opened)} / {formatNumber(emailTotals.unread)}</p>
          <span>{emailOpenRate}% open rate</span>
        </div>
        <div className="card orange">
          <h3>Clicks</h3>
          <p>{formatNumber(emailTotals.clicked)}</p>
          <span>{emailClickRate}% click rate</span>
        </div>
      </div>

      <AdvancedAnalytics analytics={analyticsData} loading={loading} darkMode={false} onRangeChange={setAnalyticsRange} />
      {renderCampaignTable()}
    </>
  );

  const renderComposeCampaign = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Compose Campaign</span>
          <h1>Email campaign composer</h1>
          <p>Build the campaign in a focused page, save it as a draft, or send it when ready.</p>
        </div>
        {renderCloseButton("Email Campaign")}
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
  );

  const renderSavedDrafts = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Drafts</span>
          <h1>Saved campaign drafts</h1>
          <p>Open a draft into the composer like Gmail drafts, make edits, then save or send it.</p>
        </div>
        <div className="campaign-header-actions">
          {renderCloseButton("Email Campaign")}
          <button type="button" className="compose-btn" onClick={openCampaignWizard}>
            <FaPlus />
            New Draft
          </button>
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
                  <td>{campaign.contactListName || `${campaign.recipients?.length || 0} manual recipients`}</td>
                  <td>{campaign.templateName || "Basic"}</td>
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
  );

  const renderSmsCampaign = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">SMS Campaign</span>
          <h1>SMS campaign dashboard</h1>
          <p>Review readiness and phone-ready contacts. Compose opens as a separate page so nothing is hidden below.</p>
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
          <h3>Contacts</h3>
          <p>{formatNumber(contacts.length)}</p>
          <span>Total audience</span>
        </div>
        <div className="card green">
          <h3>Phone Ready</h3>
          <p>{formatNumber(phoneReadyContacts.length)}</p>
          <span>Can receive SMS</span>
        </div>
        <div className="card purple">
          <h3>Selected Target</h3>
          <p>{smsTarget ? "1" : formatNumber(contacts.length)}</p>
          <span>{smsTarget ? smsTarget.name : "Bulk SMS"}</span>
        </div>
        <div className="card orange">
          <h3>Readiness</h3>
          <p>{smsReadinessRate}%</p>
          <span>{formatNumber(smsMissingPhoneCount)} contacts missing phone</span>
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
                  <span>{formatNumber(value)}</span>
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
                    <td>{formatNumber(row.total)}</td>
                    <td>{formatNumber(row.phoneReady)}</td>
                    <td>{row.readiness}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flow-note-panel action-note-panel">
        <div>
          <strong>Ready to send SMS?</strong>
          <p>Open Compose SMS to choose a target and write the message on its own page.</p>
        </div>
        <button type="button" className="compose-btn" onClick={() => openSmsComposer(null)}>
          <FaPaperPlane />
          Compose SMS
        </button>
      </div>

      <div className="performers">
        <div className="section-header">
          <h3>Phone-ready contacts</h3>
          <span className="segment-count">{phoneReadyContacts.length} contacts</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {phoneReadyContacts.map((contact) => (
                <tr key={contact._id || contact.email}>
                  <td className="campaign-name">{contact.name}</td>
                  <td>{contact.phone}</td>
                  <td>{contact.email}</td>
                  <td><span className="status-badge">{contact.status}</span></td>
                  <td>
                    <button type="button" className="template-btn" onClick={() => openSmsComposer(contact)}>
                      Send SMS
                    </button>
                  </td>
                </tr>
              ))}
              {!phoneReadyContacts.length && (
                <tr>
                  <td colSpan="5">
                    <div className="empty-state compact-empty">
                      <FaSms />
                      <strong>No phone numbers yet</strong>
                      <p>Add phone numbers in Contacts before sending SMS.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderComposeSms = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Compose SMS</span>
          <h1>{smsTarget ? `SMS to ${smsTarget.name}` : "Compose SMS"}</h1>
          <p>Choose the target, write the message, and send without scrolling through the dashboard.</p>
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
                    {contact.name} ({contact.phone})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <textarea
            placeholder="Type your SMS message here..."
            value={smsMessage}
            onChange={(event) => setSmsMessage(event.target.value.slice(0, 320))}
            rows={7}
          />
          <div className="compose-sms-footer">
            <span>{smsMessage.length}/320 characters</span>
            <button
              type="button"
              className="compose-btn"
              disabled={sendingSms || !smsMessage.trim()}
              onClick={handleSendSms}
            >
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
            <span>Missing phone numbers: {formatNumber(smsMissingPhoneCount)}</span>
          </div>
          {!phoneReadyContacts.length && (
            <div className="empty-state compact-empty">
              <FaSms />
              <strong>No phone-ready contacts</strong>
              <p>Add phone numbers before sending an SMS campaign.</p>
              <button type="button" className="compose-btn" onClick={() => setActivePage("Create Contact")}>
                Add Contact
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderWhatsappCampaign = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">WhatsApp Campaign</span>
          <h1>WhatsApp campaigns</h1>
          <p>WhatsApp will sit inside Campaigns beside Email and SMS after provider approval and template setup.</p>
        </div>
        {renderCloseButton("Campaigns")}
      </div>
      <div className="coming-soon-panel">
        <FaWhatsapp />
        <strong>Coming soon</strong>
        <p>WhatsApp campaign sending is reserved for the next channel integration.</p>
        <button type="button" className="template-btn" onClick={() => setActivePage("Campaigns")}>
          Back to Campaigns
        </button>
      </div>
    </>
  );

  const renderTemplates = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Templates</span>
          <h1>Email template center</h1>
          <p>Open the builder or view saved templates in their own focused pages.</p>
        </div>
        {renderCloseButton("Email Campaign")}
      </div>

      <div className="quick-actions-grid role-actions-grid">
        <button type="button" className="quick-action-card" onClick={() => { setTemplateToEdit(null); setActivePage("Template Builder"); }}>
          <span className="users-icon">
            <FaPalette />
          </span>
          <strong>Template Builder</strong>
          <p>Create a reusable layout with images, colors, and campaign placeholders.</p>
        </button>
        <button type="button" className="quick-action-card" onClick={() => setActivePage("Saved Templates")}>
          <span className="users-icon">
            <FaEnvelope />
          </span>
          <strong>Saved Templates</strong>
          <p>See templates saved from the builder and reuse them in compose.</p>
        </button>
      </div>
    </>
  );

  const renderTemplateBuilder = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Template Builder</span>
          <h1>Create email template</h1>
          <p>Design and save a template. Saved templates are available from the saved templates page.</p>
        </div>
        <div className="campaign-header-actions">
          <button type="button" className="template-btn" onClick={() => setActivePage("Saved Templates")}>
            Saved Templates
          </button>
          {renderCloseButton("Email Campaign")}
        </div>
      </div>
      <div className="template-studio-shell user-template-shell">
        <TemplateStudio onUseTemplate={handleUseTemplate} initialTemplate={templateToEdit} />
      </div>
    </>
  );

  const renderSavedTemplates = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Saved Templates</span>
          <h1>Saved email templates</h1>
          <p>Templates saved from the builder appear here. Reuse one to open the compose page with that template selected.</p>
        </div>
        <div className="campaign-header-actions">
          <button type="button" className="template-btn" onClick={() => { setTemplateToEdit(null); setActivePage("Template Builder"); }}>
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
              <button type="button" className="template-btn" onClick={() => handleEditTemplate(template)}>
                Edit
              </button>
              <button type="button" className="compose-btn" onClick={() => handleUseTemplate(template)}>
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
            <p>Build and save a template to see it here.</p>
            <button type="button" className="compose-btn" onClick={() => { setTemplateToEdit(null); setActivePage("Template Builder"); }}>
              Build Template
            </button>
          </div>
        )}
      </div>
    </>
  );

  const renderContacts = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Audience</span>
          <h1>Contacts</h1>
          <p>Add, import, export, and review contacts that belong to your workspace.</p>
        </div>
        <div className="campaign-header-actions">
          <button type="button" className="template-btn" onClick={openImportContacts}>
            <FaFileImport />
            Import
          </button>
          <button type="button" className="template-btn" onClick={() => openSmsComposer(null)}>
            <FaSms />
            Send SMS
          </button>
          <button type="button" className="compose-btn" onClick={() => {
            setNewContact(emptyContact);
            setActivePage("Create Contact");
          }}>
            <FaPlus />
            Add Contact
          </button>
        </div>
      </div>

      <div className="contact-stats-grid">
        <div className="chart-box">
          <h4>Total Contacts</h4>
          <h2>{formatNumber(contacts.length)}</h2>
        </div>
        <div className="chart-box">
          <h4>Customers</h4>
          <h2>{formatNumber(contacts.filter((contact) => contact.status === "Customer").length)}</h2>
        </div>
        <div className="chart-box">
          <h4>Leads</h4>
          <h2>{formatNumber(contacts.filter((contact) => contact.status === "Lead").length)}</h2>
        </div>
        <div className="chart-box">
          <h4>Folders</h4>
          <h2>{formatNumber(contactLists.length)}</h2>
        </div>
      </div>

      <div className="performers">
        <div className="section-header">
          <h3>Contact Directory</h3>
          <div className="campaign-header-actions">
            <button
              type="button"
              className="template-btn"
              onClick={() =>
                exportCsv("mailnova-contacts", [
                  ["Name", "Email", "Phone", "City", "Status"],
                  ...contacts.map((contact) => [contact.name, contact.email, contact.phone, contact.city, contact.status]),
                ])
              }
            >
              <FaDownload />
              Export
            </button>
            {contacts.length > 8 && (
              <button type="button" className="subtle-action-btn" onClick={() => setShowAllContacts((current) => !current)}>
                {showAllContacts ? "Show Less" : "View All"}
              </button>
            )}
          </div>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleContacts.map((contact) => (
                <tr key={contact._id || contact.email}>
                  <td className="campaign-name">{contact.name}</td>
                  <td>{contact.email}</td>
                  <td>{contact.phone || "Not added"}</td>
                  <td>{contact.city || "Unknown"}</td>
                  <td>
                    <span className={contact.status === "Inactive" ? "status-badge paused" : "status-badge"}>
                      {contact.status}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button type="button" title="View" onClick={() => setViewingContact(contact)}>
                        <FaEye />
                      </button>
                      <button type="button" title="Edit" onClick={() => {
                        setEditingContact(contact);
                        setActivePage("Edit Contact");
                      }}>
                        <FaEdit />
                      </button>
                      <button type="button" title="Send SMS" onClick={() => openSmsComposer(contact)}>
                        <FaSms />
                      </button>
                      <button type="button" title="Delete" onClick={() => handleDeleteContact(contact)}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleContacts.length && (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state compact-empty">
                      <FaUsers />
                      <strong>No contacts yet</strong>
                      <p>Add or import contacts to prepare your audience.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderCreateContact = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Contacts</span>
          <h1>Create contact</h1>
          <p>Add one contact, save it, and return to the contact directory.</p>
        </div>
        {renderCloseButton("Contacts")}
      </div>
      <form className="settings-card user-form-card page-form-card" onSubmit={handleSaveContact}>
        <h3>Contact Details</h3>
        <div className="user-form-grid">
          {["name", "email", "phone", "city"].map((field) => (
            <label key={field}>
              {field}
              <input
                type={field === "email" ? "email" : "text"}
                value={newContact[field]}
                onChange={(event) => setNewContact((current) => ({ ...current, [field]: event.target.value }))}
                required={field === "name" || field === "email"}
              />
            </label>
          ))}
          <label>
            status
            <select
              value={newContact.status}
              onChange={(event) => setNewContact((current) => ({ ...current, status: event.target.value }))}
            >
              {["Lead", "Prospect", "Customer", "Inactive"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="campaign-header-actions">
          <button type="button" className="template-btn" onClick={() => setActivePage("Contacts")}>
            Cancel
          </button>
          <button type="submit" className="compose-btn">
            Save Contact
          </button>
        </div>
      </form>
    </>
  );

  const renderImportContacts = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Contacts</span>
          <h1>Import contacts</h1>
          <p>Paste CSV rows or upload a bulk file, then return to the contact directory after import.</p>
        </div>
        {renderCloseButton("Contacts")}
      </div>

      <div className="settings-grid">
        <div className="settings-card user-form-card">
          <h3>Import CSV Text</h3>
          <p>One contact per line: name,email,phone,city,status</p>
          <textarea rows="9" value={importText} onChange={(event) => setImportText(event.target.value)} />
          <button type="button" className="compose-btn" onClick={handleImportContacts} style={{ marginTop: "10px" }}>
            Import Contacts
          </button>
        </div>

        <div className="settings-card user-form-card">
          <h3>Upload Bulk File</h3>
          <p>Select an Excel, CSV, Word, or PDF file to import contacts in bulk.</p>
          <div
            className="file-upload-zone"
            onClick={() => document.getElementById("bulk-file-input-page").click()}
          >
            <FaFileImport />
            <p>{uploadFile ? `Selected: ${uploadFile.name}` : "Click to upload file"}</p>
            <input
              id="bulk-file-input-page"
              type="file"
              accept=".csv,.xlsx,.xls,.docx,.pdf"
              style={{ display: "none" }}
              onChange={(event) => setUploadFile(event.target.files[0])}
            />
          </div>
          <button
            type="button"
            className="compose-btn"
            onClick={handleFileUpload}
            disabled={!uploadFile || uploadingFile}
            style={{ width: "100%" }}
          >
            {uploadingFile ? "Processing File..." : "Parse & Import Contacts"}
          </button>
        </div>
      </div>
    </>
  );

  const renderEditContact = () => {
    if (!editingContact) {
      return (
        <>
          <div className="page-hero compact-hero">
            <div>
              <span className="eyebrow">Contacts</span>
              <h1>Edit contact</h1>
              <p>Select a contact from the directory to edit.</p>
            </div>
            {renderCloseButton("Contacts")}
          </div>
          <div className="empty-state compact-empty">
            <FaUsers />
            <strong>No contact selected</strong>
            <p>Return to Contacts and choose a contact to edit.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="page-hero compact-hero">
          <div>
            <span className="eyebrow">Contacts</span>
            <h1>Edit contact</h1>
            <p>Update contact details, save, and return to the contact directory.</p>
          </div>
          {renderCloseButton("Contacts")}
        </div>
        <form className="settings-card user-form-card page-form-card" onSubmit={handleUpdateContact}>
          <h3>{editingContact.name || "Contact Details"}</h3>
          <div className="user-form-grid">
            {["name", "email", "phone", "city"].map((field) => (
              <label key={field}>
                {field}
                <input
                  type={field === "email" ? "email" : "text"}
                  value={editingContact[field] || ""}
                  onChange={(event) => setEditingContact((current) => ({ ...current, [field]: event.target.value }))}
                  required={field === "name" || field === "email"}
                />
              </label>
            ))}
            <label>
              status
              <select
                value={editingContact.status || "Lead"}
                onChange={(event) => setEditingContact((current) => ({ ...current, status: event.target.value }))}
              >
                {["Lead", "Prospect", "Customer", "Inactive"].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="campaign-header-actions">
            <button type="button" className="template-btn" onClick={() => {
              setEditingContact(null);
              setActivePage("Contacts");
            }}>
              Cancel
            </button>
            <button type="submit" className="compose-btn">
              Update Contact
            </button>
          </div>
        </form>
      </>
    );
  };

  const renderAnalytics = () => (
    <AdvancedAnalytics analytics={analyticsData} loading={loading} darkMode={false} onRangeChange={setAnalyticsRange} />
  );

  const renderNotifications = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Notifications</span>
          <h1>Workspace notifications</h1>
          <p>Open alerts, mark them read, and review campaign or system updates.</p>
        </div>
        <button type="button" className="template-btn" onClick={handleMarkAllNotificationsRead}>
          Mark All Read
        </button>
      </div>
      <div className="chart-box">
        <Notifications
          notifications={notifications}
          onMarkRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllNotificationsRead}
        />
      </div>
    </>
  );

  const renderSettings = () => (
    <>
      <div className="page-hero compact-hero">
        <div>
          <span className="eyebrow">Workspace Settings</span>
          <h1>Profile and sending preferences</h1>
          <p>Keep sender identity, reply address, and workspace details ready for campaigns.</p>
        </div>
        <button type="button" className="compose-btn" onClick={saveSettings}>
          Save Settings
        </button>
      </div>
      <div className="settings-grid">
        <div className="settings-card user-form-card">
          <h3>Profile</h3>
          <div className="user-form-grid">
            {[
              ["name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["senderName", "Sender name"],
              ["replyTo", "Reply-to email"],
            ].map(([field, label]) => (
              <label key={field}>
                {label}
                <input
                  type={field === "email" || field === "replyTo" ? "email" : "text"}
                  value={settingsDraft[field]}
                  onChange={(event) => setSettingsDraft((current) => ({ ...current, [field]: event.target.value }))}
                />
              </label>
            ))}
          </div>
        </div>
        <div className="settings-card user-form-card">
          <h3>Password</h3>
          <div className="user-form-grid">
            <label>
              Current password
              <input
                type="password"
                value={passwordDraft.currentPassword}
                onChange={(event) => setPasswordDraft((current) => ({ ...current, currentPassword: event.target.value }))}
              />
            </label>
            <label>
              New password
              <input
                type="password"
                value={passwordDraft.newPassword}
                onChange={(event) => setPasswordDraft((current) => ({ ...current, newPassword: event.target.value }))}
              />
            </label>
            <label>
              Confirm new password
              <input
                type="password"
                value={passwordDraft.confirmPassword}
                onChange={(event) => setPasswordDraft((current) => ({ ...current, confirmPassword: event.target.value }))}
              />
            </label>
          </div>
          <button type="button" className="compose-btn" onClick={updatePassword} disabled={savingPassword} style={{ marginTop: "15px" }}>
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
        <div className="settings-card">
          <h3>Plan Usage</h3>
          <div className="readiness-list">
            <span>Current plan: {userPlan.name} ({userPlan.billingStatus})</span>
            <span>Email limit: {formatNumber(userPlan.sendLimit)} sends/month</span>
            <span>Contact limit: {formatNumber(userPlan.contactLimit)} contacts</span>
            <span>{formatNumber(stats.totalCampaigns || campaigns.length)} campaigns in this workspace</span>
            <span>{formatNumber(contacts.length)} contacts available</span>
            <span>{formatNumber(savedTemplates.length)} templates ready</span>
            <span>{formatNumber(stats.totalEmailsSent || 0)} emails sent</span>
          </div>
          <button
            type="button"
            className="compose-btn"
            style={{ marginTop: "15px", width: "100%" }}
            onClick={() => setShowUpgradeModal(true)}
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </>
  );

  const pageContent = {
    Dashboard: renderDashboard,
    Campaigns: renderCampaigns,
    "Email Campaign": renderEmailCampaign,
    "Compose Campaign": renderComposeCampaign,
    "Saved Drafts": renderSavedDrafts,
    "SMS Campaign": renderSmsCampaign,
    "Compose SMS": renderComposeSms,
    "WhatsApp Campaign": renderWhatsappCampaign,
    Templates: renderTemplates,
    "Template Builder": renderTemplateBuilder,
    "Saved Templates": renderSavedTemplates,
    Contacts: renderContacts,
    "Create Contact": renderCreateContact,
    "Import Contacts": renderImportContacts,
    "Edit Contact": renderEditContact,
    Automations: () => (
      <AutomationWorkflows contactLists={contactLists} setActivePage={setActivePage} showToast={showToast} />
    ),
    Analytics: renderAnalytics,
    Notifications: renderNotifications,
    Settings: renderSettings,
  };

  const renderActivePage = pageContent[activePage] || pageContent.Dashboard;

  return (
    <RoleShell
      title={`Good to see you, ${user?.name || "User"}`}
      subtitle="Campaigns, contacts, templates, automations, analytics, and reports."
      eyebrow="Live Workspace"
      user={user}
      navItems={navItems}
      activePage={activePage}
      setActivePage={setActivePage}
      onOpenBilling={() => setShowUpgradeModal(true)}
      searchValue={campaignSearch}
      onSearchChange={setCampaignSearch}
      onSearchSubmit={() => setActivePage("Campaigns")}
    >
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {renderActivePage()}

      {showUpgradeModal && (
        <div className="modal-backdrop" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upgrade Your Plan</h2>
              <button type="button" className="close-btn" onClick={() => setShowUpgradeModal(false)}>&times;</button>
            </div>
            <p className="pricing-subtitle">Select the plan that fits your growing organization.</p>
            <div className="pricing-grid">
              {[
                {
                  name: "Free",
                  price: "$0",
                  period: "forever",
                  features: ["5,000 emails per month", "1,000 contacts limit", "Basic email editor", "Standard support"],
                },
                {
                  name: "Pro",
                  price: "$29",
                  period: "per month",
                  features: ["50,000 emails per month", "10,000 contacts limit", "Professional templates", "Advanced analytics", "24/7 Priority support"],
                  isPopular: true,
                },
                {
                  name: "Enterprise",
                  price: "$149",
                  period: "per month",
                  features: ["500,000 emails per month", "100,000 contacts limit", "Custom sender domains", "Dedicated campaign queue", "Dedicated account manager"],
                },
              ].map((tier) => {
                const isCurrent = currentUser?.plan?.name === tier.name;
                return (
                  <div key={tier.name} className={`pricing-card ${tier.isPopular ? "popular" : ""} ${isCurrent ? "current" : ""}`}>
                    {tier.isPopular && <span className="popular-badge">Most Popular</span>}
                    <h3>{tier.name}</h3>
                    <div className="price-tag">
                      <span className="amount">{tier.price}</span>
                      <span className="period">/{tier.period}</span>
                    </div>
                    <ul className="pricing-features">
                      {tier.features.map((feat) => (
                        <li key={feat}>✓ {feat}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      disabled={isCurrent}
                      className={isCurrent ? "plan-btn current-btn" : tier.isPopular ? "plan-btn popular-btn" : "plan-btn"}
                      onClick={() => handleUpgradePlan(tier.name)}
                    >
                      {isCurrent ? "Current Plan" : "Choose Plan"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {viewingContact && (
        <div className="modal-backdrop" onClick={() => setViewingContact(null)}>
          <div className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h2>Contact Details</h2>
              <button type="button" className="close-btn" onClick={() => setViewingContact(null)}>&times;</button>
            </div>
            <div className="readiness-list" style={{ marginTop: "20px" }}>
              <span><strong>Name:</strong> {viewingContact.name}</span>
              <span><strong>Email:</strong> {viewingContact.email}</span>
              <span><strong>Phone:</strong> {viewingContact.phone || "Not added"}</span>
              <span><strong>City:</strong> {viewingContact.city || "Unknown"}</span>
              <span>
                <strong>Status:</strong>{" "}
                <span className={viewingContact.status === "Inactive" ? "status-badge paused" : "status-badge"}>
                  {viewingContact.status}
                </span>
              </span>
              <span><strong>Created At:</strong> {viewingContact.createdAt ? new Date(viewingContact.createdAt).toLocaleString() : "Just now"}</span>
              <span><strong>Updated At:</strong> {viewingContact.updatedAt ? new Date(viewingContact.updatedAt).toLocaleString() : "Just now"}</span>
            </div>
          </div>
        </div>
      )}

      {editingContact && activePage !== "Edit Contact" && (
        <div className="modal-backdrop" onClick={() => setEditingContact(null)}>
          <form className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleUpdateContact} style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h2>Edit Contact</h2>
              <button type="button" className="close-btn" onClick={() => setEditingContact(null)}>&times;</button>
            </div>
            <div className="user-form-grid" style={{ display: "grid", gap: "12px", marginTop: "20px" }}>
              {["name", "email", "phone", "city"].map((field) => (
                <label key={field} style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "600" }}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                  <input
                    type={field === "email" ? "email" : "text"}
                    value={editingContact[field] || ""}
                    onChange={(event) => setEditingContact((current) => ({ ...current, [field]: event.target.value }))}
                    required={field === "name" || field === "email"}
                    style={{ minHeight: "38px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--mn-border)" }}
                  />
                </label>
              ))}
              <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "13px", fontWeight: "600" }}>
                Status
                <select
                  value={editingContact.status || "Lead"}
                  onChange={(event) => setEditingContact((current) => ({ ...current, status: event.target.value }))}
                  style={{ minHeight: "38px", padding: "0 10px", borderRadius: "6px", border: "1px solid var(--mn-border)" }}
                >
                  {["Lead", "Prospect", "Customer", "Inactive"].map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="compose-btn" style={{ marginTop: "20px", width: "100%" }}>
              Update Contact
            </button>
          </form>
        </div>
      )}

    </RoleShell>
  );
}

export default UserWorkspaceDashboard;
