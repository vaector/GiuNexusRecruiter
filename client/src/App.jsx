import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";
import GuestRoute from "./components/GuestRoute";
import ChatWidget from "./components/ChatWidget";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
// import EditProfilePage from "./pages/EditProfilePage";
// import ChangePasswordPage from "./pages/ChangePasswordPage";
import JobListPage from "./pages/JobListPage";
// import JobDetailPage from "./pages/JobDetailPage";
import RecommendedJobsPage from "./pages/RecommendedJobsPage";
// import SavedJobsPage from "./pages/SavedJobsPage";
// import MyApplicationsPage from "./pages/MyApplicationsPage";
// import ApplicationDetailPage from "./pages/ApplicationDetailPage";
// import RecruiterDashboard from "./pages/RecruiterDashboard";
 import CreateJobPage from "./pages/CreateJobPage";
 import EditJobPage from "./pages/EditJobPage";
// import ApplicantsPage from "./pages/ApplicantsPage";
// import JobAnalyticsPage from "./pages/JobAnalyticsPage";
// import AdminDashboard from "./pages/AdminDashboard";
import PendingRecruitersPage from "./pages/PendingRecruitersPage";
// import AdminJobsPage from "./pages/AdminJobsPage";
// import AdminUsersPage from "./pages/AdminUsersPage";
// import AdminReportsPage from "./pages/AdminReportsPage";
import AdminAuditLogsPage from "./pages/AdminAuditLogsPage";
import AdminRequestLogsPage from "./pages/AdminRequestLogsPage";
import NotificationsPage from "./pages/NotificationsPage";
import ConversationsPage from "./pages/ConversationsPage";
import MessagesPage from "./pages/MessagesPage";
// import ReferralsPage from "./pages/ReferralsPage";
// import DocumentsPage from "./pages/DocumentsPage";
// import SavedSearchesPage from "./pages/SavedSearchesPage";

const App = () => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            {<Route path="/jobs" element={<JobListPage />} />}
            <Route path="/jobs/recommended" element={<RoleRoute allowedRoles={["jobSeeker"]}><RecommendedJobsPage /></RoleRoute>} />
            {/* <Route path="/jobs/saved" element={<RoleRoute allowedRoles={["jobSeeker"]}><SavedJobsPage /></RoleRoute>} /> */}
            {/* <Route path="/jobs/:id" element={<JobDetailPage />} /> */}
            <Route path="/profile" element={<RoleRoute allowedRoles={["jobSeeker"]}><ProfilePage /></RoleRoute>} />
            {/* <Route path="/profile/edit" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} /> */}
            {/* <Route path="/profile/change-password" element={<PrivateRoute><ChangePasswordPage /></PrivateRoute>} /> */}
            <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
            {/* <Route path="/referrals" element={<PrivateRoute><ReferralsPage /></PrivateRoute>} /> */}
            <Route path="/conversations" element={<PrivateRoute><ConversationsPage /></PrivateRoute>} />
            <Route path="/conversations/:jobId" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
            {/* <Route path="/applications/:id" element={<PrivateRoute><ApplicationDetailPage /></PrivateRoute>} /> */}
            {/* <Route path="/documents/:applicationId" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} /> */}
            {/* <Route path="/applications/my" element={<RoleRoute allowedRoles={["jobSeeker"]}><MyApplicationsPage /></RoleRoute>} /> */}
            {/* <Route path="/saved-searches" element={<RoleRoute allowedRoles={["jobSeeker"]}><SavedSearchesPage /></RoleRoute>} /> */}
            {/* <Route path="/recruiter/dashboard" element={<RoleRoute allowedRoles={["recruiter"]}><RecruiterDashboard /></RoleRoute>} /> */}
            { <Route path="/recruiter/jobs/create" element={<RoleRoute allowedRoles={["recruiter"]}><CreateJobPage /></RoleRoute>} /> }
            { <Route path="/recruiter/jobs/:id/edit" element={<RoleRoute allowedRoles={["recruiter"]}><EditJobPage /></RoleRoute>} /> }
            {/* <Route path="/recruiter/applicants/:jobId" element={<RoleRoute allowedRoles={["recruiter"]}><ApplicantsPage /></RoleRoute>} /> */}
            {/* <Route path="/recruiter/jobs/:id/analytics" element={<RoleRoute allowedRoles={["recruiter"]}><JobAnalyticsPage /></RoleRoute>} /> */}
            {/* <Route path="/admin/dashboard" element={<RoleRoute allowedRoles={["admin"]}><AdminDashboard /></RoleRoute>} /> */}
            <Route path="/admin/recruiters" element={<RoleRoute allowedRoles={["admin"]}><PendingRecruitersPage /></RoleRoute>} />
            {/* <Route path="/admin/jobs" element={<RoleRoute allowedRoles={["admin"]}><AdminJobsPage /></RoleRoute>} /> */}
            {/* <Route path="/admin/users" element={<RoleRoute allowedRoles={["admin"]}><AdminUsersPage /></RoleRoute>} /> */}
            {/* <Route path="/admin/reports" element={<RoleRoute allowedRoles={["admin"]}><AdminReportsPage /></RoleRoute>} /> */}
            <Route path="/admin/audit-logs" element={<RoleRoute allowedRoles={["admin"]}><AdminAuditLogsPage /></RoleRoute>} />
            <Route path="/admin/request-logs" element={<RoleRoute allowedRoles={["admin"]}><AdminRequestLogsPage /></RoleRoute>} />
          </Routes>
        </main>
        <ChatWidget />
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;