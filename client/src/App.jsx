import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";

import HomePage from "./pages/HomePage";
// import LoginPage from "./pages/LoginPage";
// import RegisterPage from "./pages/RegisterPage";
// import ForgotPasswordPage from "./pages/ForgotPasswordPage";
// import ResetPasswordPage from "./pages/ResetPasswordPage";
// import JobListPage from "./pages/JobListPage";
// import JobDetailPage from "./pages/JobDetailPage";

// import ProfilePage from "./pages/ProfilePage";
// import EditProfilePage from "./pages/EditProfilePage";
// import ChangePasswordPage from "./pages/ChangePasswordPage";
// import RecommendedJobsPage from "./pages/RecommendedJobsPage";
// import SavedJobsPage from "./pages/SavedJobsPage";
// import MyApplicationsPage from "./pages/MyApplicationsPage";

// import RecruiterDashboard from "./pages/RecruiterDashboard";
// import CreateJobPage from "./pages/CreateJobPage";
// import EditJobPage from "./pages/EditJobPage";
// import ApplicantsPage from "./pages/ApplicantsPage";

// import AdminDashboard from "./pages/AdminDashboard";
// import AdminRecruitersPage from "./pages/AdminRecruitersPage";
// import AdminJobsPage from "./pages/AdminJobsPage";
// import AdminUsersPage from "./pages/AdminUsersPage";

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      {/* <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/jobs" element={<JobListPage />} />
      <Route path="/jobs/:id" element={<JobDetailPage />} /> */}

      {/* Private (any authenticated user) */}
      {/* <Route element={<PrivateRoute />}>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/profile/change-password" element={<ChangePasswordPage />} />
        <Route path="/jobs/recommended" element={<RecommendedJobsPage />} />
        <Route path="/jobs/saved" element={<SavedJobsPage />} />
        <Route path="/applications/my" element={<MyApplicationsPage />} />
      </Route> */}

      {/* Recruiter only */}
      {/* <Route element={<RoleRoute roles={["recruiter"]} />}>
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/recruiter/jobs/create" element={<CreateJobPage />} />
        <Route path="/recruiter/jobs/:id/edit" element={<EditJobPage />} />
        <Route path="/recruiter/applicants/:jobId" element={<ApplicantsPage />} />
      </Route> */}

      {/* Admin only */}
      {/* <Route element={<RoleRoute roles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/recruiters" element={<AdminRecruitersPage />} />
        <Route path="/admin/jobs" element={<AdminJobsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
      </Route> */}
    </Routes>
  </BrowserRouter>
);

export default App;
