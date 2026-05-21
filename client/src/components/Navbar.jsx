import { useContext, useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const [cursor, setCursor] = useState({ left: 0, top: 0, opacity: 0, animate: false });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const updateCursor = useCallback(() => {
    const activeEl = navRef.current?.querySelector(".nav-link-active");
    if (activeEl) {
      const navRect = navRef.current.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setCursor((prev) => ({
        left: elRect.left - navRect.left + elRect.width / 2 - 2,
        top: elRect.bottom - navRect.top + 2,
        opacity: 1,
        animate: prev.opacity === 1,
      }));
    } else {
      setCursor((prev) => ({ ...prev, opacity: 0 }));
    }
  }, []);

  useLayoutEffect(() => {
    updateCursor();
  }, [location.pathname, isAuthenticated, updateCursor]);

  useEffect(() => {
    window.addEventListener("resize", updateCursor);
    return () => window.removeEventListener("resize", updateCursor);
  }, [updateCursor]);

  useEffect(() => {
    const nav = navRef.current;
    const light = document.getElementById("nav-spotlight-light");
    if (!nav || !light) return;

    const onPointerMove = (e) => {
      const r = nav.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      light.setAttribute("x", String(Math.floor(x)));
      light.setAttribute("y", String(Math.floor(y)));
      nav.style.setProperty("--spotlight-x", `${Math.floor(x)}px`);
      nav.style.setProperty("--spotlight-y", `${Math.floor(y)}px`);
    };
    const onPointerEnter = () => {
      light.setAttribute("z", "500");
      nav.dataset.pointerLighting = "true";
    };
    const onPointerLeave = () => {
      light.setAttribute("z", "150");
      delete nav.dataset.pointerLighting;
    };

    light.setAttribute("z", "150");
    nav.addEventListener("pointermove", onPointerMove, { passive: true });
    nav.addEventListener("pointerenter", onPointerEnter);
    nav.addEventListener("pointerleave", onPointerLeave);
    return () => {
      nav.removeEventListener("pointermove", onPointerMove);
      nav.removeEventListener("pointerenter", onPointerEnter);
      nav.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const renderCenterLinks = () => {
    if (!isAuthenticated) {
      return <NavLink to="/jobs" active={isActive("/jobs")}>Browse Jobs</NavLink>;
    }
    if (user?.role === "jobSeeker") {
      return (
        <>
          <NavLink to="/" active={isActive("/")}>Home</NavLink>
          <NavLink to="/jobs" active={isActive("/jobs")}>Jobs</NavLink>
          <NavLink to="/jobs/saved" active={isActive("/jobs/saved")}>Saved</NavLink>
          <NavLink to="/applications/my" active={isActive("/applications/my")}>Applications</NavLink>
          <NavLink to="/referrals" active={isActive("/referrals")}>Referrals</NavLink>
          <NavLink to="/profile" active={isActive("/profile")}>Profile</NavLink>
        </>
      );
    }
    if (user?.role === "recruiter") {
      return (
        <>
          <NavLink to="/recruiter/dashboard" active={isActive("/recruiter/dashboard")}>Dashboard</NavLink>
          <NavLink to="/recruiter/jobs/create" active={isActive("/recruiter/jobs/create")}>Post Job</NavLink>
          <NavLink to="/conversations" active={isActive("/conversations")}>Messages</NavLink>
          <NavLink to="/profile" active={isActive("/profile")}>Profile</NavLink>
        </>
      );
    }
    if (user?.role === "admin") {
      return (
        <>
          <NavLink to="/admin/dashboard" active={isActive("/admin/dashboard")}>Dashboard</NavLink>
          <NavLink to="/admin/users" active={isActive("/admin/users")}>Users</NavLink>
          <NavLink to="/admin/jobs" active={isActive("/admin/jobs")}>Jobs</NavLink>
          <NavLink to="/admin/recruiters" active={isActive("/admin/recruiters")}>Recruiters</NavLink>
          <NavLink to="/admin/reports" active={isActive("/admin/reports")}>Reports</NavLink>
          <NavLink to="/admin/audit-logs" active={isActive("/admin/audit-logs")}>Audit Logs</NavLink>
        </>
      );
    }
  };

  const renderRightActions = () => {
    if (!isAuthenticated) {
      return (
        <>
          <NavLink to="/login" active={isActive("/login")}>Login</NavLink>
          <NavLink to="/register" active={isActive("/register")}>Register</NavLink>
        </>
      );
    }
    return (
      <>
        <NotificationBell />
        <LogoutBtn onClick={handleLogout} />
      </>
    );
  };

  const renderLinks = () => {
    return (
      <>
        {renderCenterLinks()}
        {renderRightActions()}
      </>
    );
  };

  return (
    <>
      <nav
        ref={navRef}
        className="spotlight-nav"
        style={{
          position: "fixed",
          top: "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          height: "52px",
          maxWidth: "920px",
          width: "calc(100% - 2rem)",
          borderRadius: "9999px",
          background: scrolled ? "rgba(8, 12, 24, 0.75)" : "rgba(8, 12, 24, 0.4)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: scrolled
            ? "1px solid rgba(0, 229, 204, 0.15)"
            : "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: scrolled
            ? "0 4px 24px rgba(0, 229, 204, 0.08), 0 1px 2px rgba(0,0,0,0.3)"
            : "0 2px 12px rgba(0,0,0,0.2)",
          transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
          "--spotlight-x": "50%",
          "--spotlight-y": "50%",
        }}
      >
        <Link to="/" className="nav-logo">GIU Nexus</Link>

        <div className="nav-links-desktop" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {renderCenterLinks()}
        </div>

        <div className="nav-right-desktop" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {renderRightActions()}
        </div>

        <div
          className="nav-cursor"
          style={{
            position: "absolute",
            top: cursor.top,
            left: cursor.left,
            width: "4px",
            height: "2px",
            background: "#00e5cc",
            boxShadow: "0 0 6px rgba(0,229,204,0.6), 0 0 12px rgba(0,229,204,0.2)",
            opacity: cursor.opacity,
            transition: cursor.animate
              ? "left 0.3s cubic-bezier(0.25,0.1,0.25,1), opacity 0.3s ease, top 0.3s ease"
              : "opacity 0.3s ease",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />

        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <span className={`bar ${menuOpen ? "bar-top-open" : ""}`} />
          <span className={`bar ${menuOpen ? "bar-mid-open" : ""}`} />
          <span className={`bar ${menuOpen ? "bar-bot-open" : ""}`} />
        </button>
      </nav>

      <div className={`nav-mobile-overlay ${menuOpen ? "open" : ""}`}>
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
          style={{ position: "absolute", top: "1.5rem", right: "1.5rem" }}
        >
          <span className="bar bar-top-open" />
          <span className="bar bar-bot-open" />
        </button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
          {renderLinks()}
        </div>
      </div>

      <style>{`
        .nav-logo {
          font-size: 1rem;
          font-weight: 600;
          color: #eaf2ff;
          text-decoration: none;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: monospace;
          transition: text-shadow 0.3s ease;
          position: relative;
          z-index: 5;
        }
        .nav-logo:hover {
          text-shadow: 0 0 10px rgba(0, 229, 204, 0.5);
        }

        /* ─── Spotlight layers ─── */

        .spotlight-nav::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: radial-gradient(
            280px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
            rgba(255, 255, 255, 0.07),
            transparent 70%
          );
          pointer-events: none;
          z-index: 1;
          filter: url('#nav-spotlight');
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        .spotlight-nav[data-pointer-lighting]::before {
          opacity: 1;
        }

        .spotlight-nav::after {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: 9999px;
          border: 1px solid rgba(234, 242, 255, 0.07);
          background: rgba(234, 242, 255, 0.015);
          pointer-events: none;
          z-index: -1;
          filter: url('#nav-ambience') brightness(1.8);
        }

        /* ─── Links ─── */

        .nav-link {
          position: relative;
          color: rgba(234, 242, 255, 0.45);
          text-decoration: none;
          font-size: 0.72rem;
          font-weight: 400;
          padding: 0.35rem 0.65rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          transition: color 0.25s ease, text-shadow 0.25s ease, opacity 0.25s ease;
          z-index: 5;
        }
        .nav-link:hover {
          color: #fff;
          text-shadow: 0 0 12px rgba(255, 255, 255, 0.4),
                       0 0 24px rgba(0, 229, 204, 0.15);
        }

        .nav-link-active {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.5),
                       0 0 20px rgba(0, 229, 204, 0.2) !important;
        }

        .nav-logout-btn {
          background: transparent;
          color: rgba(234, 242, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.3rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 400;
          cursor: pointer;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: border-color 0.2s ease, color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          position: relative;
          z-index: 5;
        }
        .nav-logout-btn:hover {
          border-color: rgba(0, 229, 204, 0.4);
          color: #eaf2ff;
          transform: scale(1.05);
          box-shadow: 0 0 8px rgba(0, 229, 204, 0.15);
        }

        .nav-hamburger {
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: transparent;
          cursor: pointer;
          gap: 5px;
          transition: border-color 0.2s ease;
          position: relative;
          z-index: 5;
        }
        .nav-hamburger:hover {
          border-color: rgba(0, 229, 204, 0.4);
        }
        .bar {
          width: 16px;
          height: 1.5px;
          background: #eaf2ff;
          transition: transform 0.35s ease, opacity 0.25s ease;
        }
        .bar-top-open { transform: translateY(6.5px) rotate(45deg); }
        .bar-mid-open { opacity: 0; }
        .bar-bot-open { transform: translateY(-6.5px) rotate(-45deg); }

        .nav-mobile-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(4, 8, 18, 0.95);
          backdrop-filter: blur(16px);
          display: none;
          align-items: center;
          justify-content: center;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.35s ease;
        }
        .nav-mobile-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }

        .nav-links-desktop { display: flex; }
        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-right-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-mobile-overlay { display: flex !important; }
          .nav-cursor { display: none !important; }
        }
      `}</style>
    </>
  );
};

function NavLink({ to, active, children }) {
  return (
    <Link to={to} className={`nav-link ${active ? "nav-link-active" : ""}`}>
      {children}
    </Link>
  );
}

function LogoutBtn({ onClick }) {
  return <button className="nav-logout-btn" onClick={onClick}>Logout</button>;
}

export default Navbar;