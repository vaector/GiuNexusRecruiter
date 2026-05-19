// Top navigation bar
// Shows different links based on auth state and user role
// jobSeeker: Jobs, Saved, Applications, Profile
// recruiter: Dashboard, Post Job, Profile
// admin: Dashboard, Users, Jobs
// unauthenticated: Login, Register
import { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const navStyle = {
    background: "var(--color-surface)",
    borderBottom: "1px solid var(--color-border)",
    padding: "0 2rem",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  };

  const logoStyle = {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "var(--color-accent)",
    textDecoration: "none",
    letterSpacing: "-0.5px",
  };

  const linkStyle = (active) => ({
    color: active ? "var(--color-accent)" : "var(--color-text-muted)",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: active ? 600 : 400,
    padding: "0.4rem 0.75rem",
    borderRadius: "6px",
    transition: "all 0.15s ease",
    background: active ? "var(--color-accent-subtle)" : "transparent",
  });

  const btnStyle = {
    background: "var(--color-accent)",
    color: "#fff",
    border: "none",
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    fontSize: "0.9rem",
    fontWeight: 600,
    cursor: "pointer",
  };

  const [dark, setDark] = useState(false);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  const renderLinks = () => {
    if (!isAuthenticated) {
      return (
        <>
          <Link style={linkStyle(isActive("/jobs"))} to="/jobs">Jobs</Link>
          <Link style={linkStyle(isActive("/login"))} to="/login">Login</Link>
          <Link style={{ ...btnStyle, textDecoration: "none", padding: "0.4rem 1rem" }} to="/register">Register</Link>
        </>
      );
    }

    if (user?.role === "jobSeeker") {
      return (
        <>
          <Link style={linkStyle(isActive("/"))} to="/">Home</Link>
          <Link style={linkStyle(isActive("/jobs"))} to="/jobs">Jobs</Link>
          <Link style={linkStyle(isActive("/jobs/saved"))} to="/jobs/saved">Saved</Link>
          <Link style={linkStyle(isActive("/applications/my"))} to="/applications/my">Applications</Link>
          <Link style={linkStyle(isActive("/referrals"))} to="/referrals">Referrals</Link>
          <Link style={linkStyle(isActive("/profile"))} to="/profile">Profile</Link>
          <NotificationBell />
          <button style={btnStyle} onClick={handleLogout}>Logout</button>
        </>
      );
    }

    if (user?.role === "recruiter") {
      return (
        <>
          <Link style={linkStyle(isActive("/recruiter/dashboard"))} to="/recruiter/dashboard">Dashboard</Link>
          <Link style={linkStyle(isActive("/recruiter/jobs/create"))} to="/recruiter/jobs/create">Post Job</Link>
          <Link style={linkStyle(isActive("/conversations"))} to="/conversations">Messages</Link>
          <Link style={linkStyle(isActive("/profile"))} to="/profile">Profile</Link>
          <NotificationBell />
          <button style={btnStyle} onClick={handleLogout}>Logout</button>
        </>
      );
    }

    if (user?.role === "admin") {
      return (
        <>
          <Link style={linkStyle(isActive("/admin/dashboard"))} to="/admin/dashboard">Dashboard</Link>
          <Link style={linkStyle(isActive("/admin/users"))} to="/admin/users">Users</Link>
          <Link style={linkStyle(isActive("/admin/jobs"))} to="/admin/jobs">Jobs</Link>
          <Link style={linkStyle(isActive("/admin/recruiters"))} to="/admin/recruiters">Recruiters</Link>
          <Link style={linkStyle(isActive("/admin/reports"))} to="/admin/reports">Reports</Link>
          <Link style={linkStyle(isActive("/admin/audit-logs"))} to="/admin/audit-logs">Audit Logs</Link>
          <NotificationBell />
          <button style={btnStyle} onClick={handleLogout}>Logout</button>
        </>
      );
    }
  };

  return (
    <nav style={navStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Link style={logoStyle} to="/">GIU Nexus</Link>
        <button
          onClick={toggleTheme}
          style={{
            background: "none",
            border: "1px solid var(--color-border)",
            borderRadius: "6px",
            padding: "0.4rem 0.75rem",
            cursor: "pointer",
            fontSize: "1rem",
            color: "var(--color-text)",
          }}
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        {renderLinks()}
      </div>
    </nav>
  );
};

export default Navbar;