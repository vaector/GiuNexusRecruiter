import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";
import GuestRoute from "./components/GuestRoute";
import ChatWidget from "./components/ChatWidget";
import PageLoader from "./components/PageLoader";

const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const VerifyOtpPage = lazy(() => import("./pages/VerifyOtpPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));
const ChangePasswordPage = lazy(() => import("./pages/ChangePasswordPage"));
const JobListPage = lazy(() => import("./pages/JobListPage"));
const JobDetailPage = lazy(() => import("./pages/JobDetailPage"));
const RecommendedJobsPage = lazy(() => import("./pages/RecommendedJobsPage"));
const SavedJobsPage = lazy(() => import("./pages/SavedJobsPage"));
const ApplicantsPage = lazy(() => import("./pages/ApplicantsPage"));
const MyApplicationsPage = lazy(() => import("./pages/MyApplicationsPage"));
const ApplicationDetailPage = lazy(() => import("./pages/ApplicationDetailPage"));
const RecruiterDashboard = lazy(() => import("./pages/RecruiterDashboard"));
const CreateJobPage = lazy(() => import("./pages/CreateJobPage"));
const EditJobPage = lazy(() => import("./pages/EditJobPage"));
const JobAnalyticsPage = lazy(() => import("./pages/JobAnalyticsPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminJobsPage = lazy(() => import("./pages/AdminJobsPage"));
const PendingRecruitersPage = lazy(() => import("./pages/PendingRecruitersPage"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage"));
const AdminApplicationsPage = lazy(() => import("./pages/AdminApplicationsPage"));
const AdminReferralsPage = lazy(() => import("./pages/AdminReferralsPage"));
const AdminReportsPage = lazy(() => import("./pages/AdminReportsPage"));
const AdminAuditLogsPage = lazy(() => import("./pages/AdminAuditLogsPage"));
const AdminRequestLogsPage = lazy(() => import("./pages/AdminRequestLogsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ConversationsPage = lazy(() => import("./pages/ConversationsPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ReferralsPage = lazy(() => import("./pages/ReferralsPage"));
const DocumentsPage = lazy(() => import("./pages/DocumentsPage"));
const SavedSearchesPage = lazy(() => import("./pages/SavedSearchesPage"));
const TotpSetupPage = lazy(() => import("./pages/TotpSetupPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const PrivacyPage = lazy(() => import("./pages/PublicInfoPage").then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./pages/PublicInfoPage").then(m => ({ default: m.TermsPage })));
const ContactPage = lazy(() => import("./pages/PublicInfoPage").then(m => ({ default: m.ContactPage })));

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-otp" element={<VerifyOtpPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/jobs" element={<JobListPage />} />
              <Route path="/jobs/:id" element={<JobDetailPage />} />

              <Route path="/jobs/recommended" element={<RoleRoute allowedRoles={["jobSeeker"]}><RecommendedJobsPage /></RoleRoute>} />
              <Route path="/jobs/saved" element={<RoleRoute allowedRoles={["jobSeeker"]}><SavedJobsPage /></RoleRoute>} />
              <Route path="/applications/my" element={<RoleRoute allowedRoles={["jobSeeker"]}><MyApplicationsPage /></RoleRoute>} />
              <Route path="/saved-searches" element={<RoleRoute allowedRoles={["jobSeeker"]}><SavedSearchesPage /></RoleRoute>} />
              <Route path="/profile" element={<RoleRoute allowedRoles={["jobSeeker"]}><ProfilePage /></RoleRoute>} />

              <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
              <Route path="/profile/change-password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} />
              <Route path="/profile/totp-setup" element={<PrivateRoute><TotpSetupPage /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
              <Route path="/referrals" element={<PrivateRoute><ReferralsPage /></PrivateRoute>} />
              <Route path="/conversations" element={<PrivateRoute><ConversationsPage /></PrivateRoute>} />
              <Route path="/conversations/:jobId" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />

              <Route path="/applications/:id" element={<PrivateRoute><ApplicationDetailPage /></PrivateRoute>} />
              <Route path="/documents/:applicationId" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />

              <Route path="/recruiter/dashboard" element={<RoleRoute allowedRoles={["recruiter"]}><RecruiterDashboard /></RoleRoute>} />
              <Route path="/recruiter/jobs" element={<RoleRoute allowedRoles={["recruiter"]}><RecruiterDashboard /></RoleRoute>} />
              <Route path="/recruiter/jobs/create" element={<RoleRoute allowedRoles={["recruiter"]}><CreateJobPage /></RoleRoute>} />
              <Route path="/recruiter/jobs/:id/edit" element={<RoleRoute allowedRoles={["recruiter"]}><EditJobPage /></RoleRoute>} />
              <Route path="/recruiter/jobs/:id/analytics" element={<RoleRoute allowedRoles={["recruiter"]}><JobAnalyticsPage /></RoleRoute>} />
              <Route path="/recruiter/applicants/:jobId" element={<RoleRoute allowedRoles={["recruiter"]}><ApplicantsPage /></RoleRoute>} />

              <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} />
              <Route path="/admin/recruiters" element={<RoleRoute allowedRoles={["admin"]}><PendingRecruitersPage /></RoleRoute>} />
              <Route path="/admin/jobs" element={<RoleRoute allowedRoles={["admin"]}><AdminJobsPage /></RoleRoute>} />
              <Route path="/admin/users" element={<RoleRoute allowedRoles={["admin"]}><AdminUsersPage /></RoleRoute>} />
              <Route path="/admin/applications" element={<RoleRoute allowedRoles={["admin"]}><AdminApplicationsPage /></RoleRoute>} />
              <Route path="/admin/referrals" element={<RoleRoute allowedRoles={["admin"]}><AdminReferralsPage /></RoleRoute>} />
              <Route path="/admin/reports" element={<RoleRoute allowedRoles={["admin"]}><AdminReportsPage /></RoleRoute>} />
              <Route path="/admin/conversations" element={<RoleRoute allowedRoles={["admin"]}><ConversationsPage /></RoleRoute>} />
              <Route path="/admin/audit-logs" element={<RoleRoute allowedRoles={["admin"]}><AdminAuditLogsPage /></RoleRoute>} />
              <Route path="/admin/request-logs" element={<RoleRoute allowedRoles={["admin"]}><AdminRequestLogsPage /></RoleRoute>} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </main>
        <ChatWidget />
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
