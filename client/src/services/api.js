import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
  resetPassword: (token, password) => api.patch(`/auth/reset-password/${token}`, { password }),
  setupTotp: () => api.post("/auth/setup-totp"),
  verifyMfaOtp: (data) => api.post("/auth/verify-mfa", data),
};

// Profile
export const profileAPI = {
  getMyProfile: () => api.get("/profile"),
  updateMyProfile: (data) =>
    api.patch("/profile", data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined),
  changePassword: (data) => api.patch("/profile/change-password", data),
  extractSkills: () => api.post("/profile/extract-skills"),
  toggleMfa: (data) => api.patch("/profile/mfa", data),
};

// Jobs
export const jobsAPI = {
  getAllJobs: (params) => api.get("/jobs", { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  getMyJobs: () => api.get("/jobs/my-jobs"),
  getSavedJobs: () => api.get("/jobs/saved"),
  getRecommendedJobs: () => api.get("/jobs/recommended"),
  createJob: (data) => api.post("/jobs", data),
  updateJob: (id, data) => api.patch(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  saveJob: (id) => api.post(`/jobs/${id}/save`),
  applyToJob: (id, data) => api.post(`/jobs/${id}/apply`, data),
  getApplicants: (jobId) => api.get(`/jobs/${jobId}/applicants`),
};

// Applications
export const applicationsAPI = {
  getMyApplications: () => api.get("/applications/my"),
  getAllApplications: (params) => api.get("/applications", { params }),
  updateApplicationStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
  updateRecruiterNotes: (id, recruiterNotes) => api.patch(`/applications/${id}/notes`, { recruiterNotes }),
  withdrawApplication: (id) => api.delete(`/applications/${id}/withdraw`),
};

// Users (Admin)
export const usersAPI = {
  getAllUsers: (params) => api.get("/users", { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Admin
export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getAuditLogs: (params) => api.get("/admin/audit-logs", { params }),
  getRequestLogs: (params) => api.get("/admin/request-logs", { params }),
  getRequestLogStats: () => api.get("/admin/request-logs/stats"),
};

// Notifications
export const notificationsAPI = {
  getNotifications: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
};

// Messages
export const messagesAPI = {
  getConversations: (params) => api.get("/conversations", { params }),
  getAdminConversations: (params) => api.get("/conversations/admin", { params }),
  getMessages: (jobId, params) => api.get(`/conversations/${jobId}/messages`, { params }),
  sendMessage: (jobId, data) => api.post(`/conversations/${jobId}/messages`, data),
};

// Referrals
export const referralsAPI = {
  getMyCode: () => api.get("/referrals/my-code"),
  requestReferral: (data) => api.post("/referrals/request", data),
  respondToReferral: (id, status) => api.patch(`/referrals/${id}/respond`, { status }),
  getSentReferrals: (params) => api.get("/referrals/sent", { params }),
  getReceivedReferrals: (params) => api.get("/referrals/received", { params }),
  getAllReferrals: (params) => api.get("/referrals", { params }),
  updateReferralStatus: (id, status) => api.patch(`/referrals/${id}/status`, { status }),
};

// Reports
export const reportsAPI = {
  createReport: (data) => api.post("/reports", data),
  getReports: (params) => api.get("/reports", { params }),
  reviewReport: (id, data) => api.patch(`/reports/${id}/review`, data),
};

// Documents
export const documentsAPI = {
  uploadDocument: (data) =>
    api.post("/documents", data, { headers: { "Content-Type": "multipart/form-data" } }),
  getDocuments: (applicationId) => api.get(`/documents/${applicationId}`),
  signDocument: (id) => api.patch(`/documents/${id}/sign`),
  verifyDocument: (id) => api.get(`/documents/${id}/verify`),
};

// Saved Searches
export const savedSearchesAPI = {
  getSavedSearches: () => api.get("/saved-searches"),
  createSavedSearch: (data) => api.post("/saved-searches", data),
  deleteSavedSearch: (id) => api.delete(`/saved-searches/${id}`),
};


export default api;
