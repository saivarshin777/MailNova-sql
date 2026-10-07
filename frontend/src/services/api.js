import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Without this, an expired/invalid token just makes every request fail
// silently and the app looks broken. Send the user back to login instead.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.assign("/login?sessionExpired=1");
      }
    }
    return Promise.reject(error);
  }
);

export const dashboardApi = {
  getDashboard: () => API.get("/dashboard"),
  getAnalytics: (range = "All Time") =>
    API.get("/dashboard/analytics", {
      params: { range },
    }),
  getCampaigns: (query = "") =>
    API.get("/campaigns", {
      params: query ? { q: query } : {},
    }),
  createCampaign: (campaign) => API.post("/campaigns", campaign),
  deleteCampaign: (campaignId) => API.delete(`/campaigns/${campaignId}`),
  getNotifications: () => API.get("/notifications"),
  markNotificationRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => API.patch("/notifications/read-all"),
  simulateNotification: (payload) => API.post("/notifications/simulate", payload),
  getTemplates: () => API.get("/templates"),
  createTemplate: (template) => API.post("/templates", template),
  updateTemplate: (id, template) => API.put(`/templates/${id}`, template),
  deleteTemplate: (id) => API.delete(`/templates/${id}`),
  getActivityLogs: () => API.get("/activity"),
};

export const leadApi = {
  getOverview: () => API.get("/lead"),
};

export const authApi = {
  register: (payload) => API.post("/auth/register", payload),
  login: (payload) => API.post("/auth/login", payload),
  verifyOtp: (payload) => API.post("/auth/verify-otp", payload),
  resendOtp: (payload) => API.post("/auth/resend-otp", payload),
  forgotPassword: (payload) => API.post("/auth/forgot-password", payload),
  resetPassword: (token, payload) => API.post(`/auth/reset-password/${token}`, payload),
  updateProfile: (payload) => API.put("/auth/profile", payload),
  updatePassword: (payload) => API.put("/auth/password", payload),
  updatePlan: (payload) => API.put("/auth/plan", payload),
};

export const contactApi = {
  getContacts: (search = "") =>
    API.get("/contacts", {
      params: search ? { search } : {},
    }),
  getContactLists: () => API.get("/contacts/lists"),
  createContactList: (payload) => API.post("/contacts/lists", payload),
  updateContactList: (id, payload) => API.put(`/contacts/lists/${id}`, payload),
  deleteContactList: (id) => API.delete(`/contacts/lists/${id}`),
  addContactsToList: (id, payload) => API.post(`/contacts/lists/${id}/contacts`, payload),
  removeContactsFromList: (id, payload) =>
    API.delete(`/contacts/lists/${id}/contacts`, { data: payload }),
  createContact: (payload) => API.post("/contacts", payload),
  updateContact: (id, payload) => API.put(`/contacts/${id}`, payload),
  deleteContact: (id) => API.delete(`/contacts/${id}`),
  importFile: (formData) =>
    API.post("/contacts/import-file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getStats: () => API.get("/contacts/stats"),
  sendSms: (id, payload) => API.post(`/contacts/${id}/sms`, payload),
  sendBulkSms: (payload) => API.post("/contacts/sms", payload),
};

export const paymentApi = {
  getConfig: () => API.get("/payments/config"),
  createOrder: (planName) => API.post("/payments/create-order", { planName }),
  verify: (payload) => API.post("/payments/verify", payload),
};

export const adminApi = {
  getOverview: () => API.get("/admin/overview"),
  getUsers: () => API.get("/admin/users"),
  updateUserRole: (id, role) => API.patch(`/admin/users/${id}/role`, { role }),
  updateUserStatus: (id, status) => API.patch(`/admin/users/${id}/status`, { status }),
  updateUserPlan: (id, plan) => API.patch(`/admin/users/${id}/plan`, { plan }),
  getLogs: () => API.get("/admin/logs"),
};

export const automationApi = {
  getAutomations: () => API.get("/automations"),
  createAutomation: (payload) => API.post("/automations", payload),
  updateAutomation: (id, payload) => API.put(`/automations/${id}`, payload),
  toggleAutomation: (id) => API.patch(`/automations/${id}/toggle`),
  deleteAutomation: (id) => API.delete(`/automations/${id}`),
};

export default API;
