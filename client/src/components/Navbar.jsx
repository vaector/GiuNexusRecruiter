import { useContext, useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const NAV_COLORS = ["#060c18", "#0a1628"];

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const [cursor, setCursor] = useState({ left: 0, top: 0, opacity: 0, animate: false });

  const panelRef = useRef(null);
  const preLayersRef = useRef(null);
  const openTlRef = useRef(null);
  const closeTweenRef = useRef(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

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

  useLayoutEffect(() => { updateCursor(); }, [location.pathname, isAuthenticated, updateCursor]);

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
    const onPointerEnter = () => { light.setAttribute("z", "500"); nav.dataset.pointerLighting = "true"; };
    const onPointerLeave = () => { light.setAttribute("z", "150"); delete nav.dataset.pointerLighting; };
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

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      const preContainer = preLayersRef.current;
      if (!panel) return;
      let preLayers = [];
      if (preContainer) preLayers = Array.from(preContainer.querySelectorAll(".nav-prelayer"));
      gsap.set([panel, ...preLayers], { xPercent: 100, opacity: 1 });
      if (preContainer) gsap.set(preContainer, { xPercent: 0, opacity: 1 });
    });
    return () => ctx.revert();
  }, []);

  const playOpen = useCallback(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    openTlRef.current?.kill();
    closeTweenRef.current?.kill();
    closeTweenRef.current = null;

    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel) { busyRef.current = false; return; }

    let preLayers = [];
    if (preContainer) preLayers = Array.from(preContainer.querySelectorAll(".nav-prelayer"));

    const itemEls = Array.from(panel.querySelectorAll(".nav-panel-itemLabel"));
    const numberEls = Array.from(panel.querySelectorAll(".nav-panel-list[data-numbering] .nav-panel-item"));

    if (itemEls.length) gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    if (numberEls.length) gsap.set(numberEls, { "--nav-num-opacity": 0 });

    const tl = gsap.timeline({
      onComplete: () => { busyRef.current = false; }
    });

    preLayers.forEach((el, i) => {
      tl.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: "power4.out" }, i * 0.07);
    });
    const lastPreTime = preLayers.length ? (preLayers.length - 1) * 0.07 : 0;
    const panelInsert = lastPreTime + (preLayers.length ? 0.08 : 0);
    tl.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.65, ease: "power4.out" }, panelInsert);

    if (itemEls.length) {
      const itemsStart = panelInsert + 0.1;
      tl.to(itemEls, {
        yPercent: 0, rotate: 0, duration: 1, ease: "power4.out",
        stagger: { each: 0.1, from: "start" }
      }, itemsStart);
      if (numberEls.length) {
        tl.to(numberEls, {
          duration: 0.6, ease: "power2.out", "--nav-num-opacity": 1,
          stagger: { each: 0.08, from: "start" }
        }, itemsStart + 0.1);
      }
    }

    openTlRef.current = tl;
  }, []);

  const playClose = useCallback(() => {
    openTlRef.current?.kill();
    openTlRef.current = null;
    const panel = panelRef.current;
    const preContainer = preLayersRef.current;
    if (!panel) return;
    let preLayers = [];
    if (preContainer) preLayers = Array.from(preContainer.querySelectorAll(".nav-prelayer"));
    const all = [...preLayers, panel];
    closeTweenRef.current?.kill();
    closeTweenRef.current = gsap.to(all, {
      xPercent: 100, duration: 0.32, ease: "power3.in", overwrite: "auto",
      onComplete: () => { busyRef.current = false; }
    });
  }, []);

  useEffect(() => {
    if (menuOpen) {
      playOpen();
    } else {
      playClose();
    }
  }, [menuOpen, playOpen, playClose]);

  const handleLogout = () => { logout(); navigate("/login"); };
  const isActive = (path) => location.pathname === path;

  const getCenterLinks = () => {
    if (!isAuthenticated) return [];
    if (user?.role === "jobSeeker") return [
      { label: "Home", to: "/" },
      { label: "Jobs", to: "/jobs" },
      { label: "Saved", to: "/jobs/saved" },
      { label: "Applications", to: "/applications/my" },
      { label: "Referrals", to: "/referrals" },
      { label: "Profile", to: "/profile" },
    ];
    if (user?.role === "recruiter") return [
      { label: "Dashboard", to: "/recruiter/dashboard" },
      { label: "Post Job", to: "/recruiter/jobs/create" },
      { label: "Messages", to: "/conversations" },
      { label: "Profile", to: "/profile" },
    ];
    if (user?.role === "admin") return [
      { label: "Dashboard", to: "/admin/dashboard" },
      { label: "Users", to: "/admin/users" },
      { label: "Jobs", to: "/admin/jobs" },
      { label: "Recruiters", to: "/admin/recruiters" },
      { label: "Reports", to: "/admin/reports" },
      { label: "Audit Logs", to: "/admin/audit-logs" },
    ];
    return [];
  };

  const getRightLinks = () => {
    if (!isAuthenticated) return [
      { label: "Jobs", to: "/jobs" },
      { label: "Login", to: "/login" },
      { label: "Register", to: "/register" },
    ];
    return [];
  };

  const allMobileLinks = [...getCenterLinks(), ...getRightLinks()];

  const smokeCircles = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const n = i + 1;
      const r = Math.min(90 + n * 3, 255);
      const g = Math.min(33 + n, 255);
      const a = Math.max(1 - n / 80, 0);
      return {
        width: n * 6,
        height: n * 1,
        right: n * 10,
        bottom: n * 10,
        blur: n / 3 + 8,
        originX: n * 4,
        originY: n * 2,
        delay: n / 10,
        r, g, a,
      };
    });
  }, []);

  const renderCenterLinks = () => {
    if (!isAuthenticated) return null;
    if (user?.role === "jobSeeker") return (
      <>
        <NavLink to="/" active={isActive("/")}>Home</NavLink>
        <NavLink to="/jobs" active={isActive("/jobs")}>Jobs</NavLink>
        <NavLink to="/jobs/saved" active={isActive("/jobs/saved")}>Saved</NavLink>
        <NavLink to="/applications/my" active={isActive("/applications/my")}>Applications</NavLink>
        <NavLink to="/referrals" active={isActive("/referrals")}>Referrals</NavLink>
        <NavLink to="/profile" active={isActive("/profile")}>Profile</NavLink>
      </>
    );
    if (user?.role === "recruiter") return (
      <>
        <NavLink to="/recruiter/dashboard" active={isActive("/recruiter/dashboard")}>Dashboard</NavLink>
        <NavLink to="/recruiter/jobs/create" active={isActive("/recruiter/jobs/create")}>Post Job</NavLink>
        <NavLink to="/conversations" active={isActive("/conversations")}>Messages</NavLink>
        <NavLink to="/profile" active={isActive("/profile")}>Profile</NavLink>
      </>
    );
    if (user?.role === "admin") return (
      <>
        <NavLink to="/admin/dashboard" active={isActive("/admin/dashboard")}>Dashboard</NavLink>
        <NavLink to="/admin/users" active={isActive("/admin/users")}>Users</NavLink>
        <NavLink to="/admin/jobs" active={isActive("/admin/jobs")}>Jobs</NavLink>
        <NavLink to="/admin/recruiters" active={isActive("/admin/recruiters")}>Recruiters</NavLink>
        <NavLink to="/admin/reports" active={isActive("/admin/reports")}>Reports</NavLink>
        <NavLink to="/admin/audit-logs" active={isActive("/admin/audit-logs")}>Audit Logs</NavLink>
      </>
    );
  };

  const renderRightActions = () => {
    if (!isAuthenticated) return (
      <>
        <NavLink to="/jobs" active={isActive("/jobs")}>Jobs</NavLink>
        <NavLink to="/login" active={isActive("/login")}>Login</NavLink>
        <NavLink to="/register" active={isActive("/register")}>Register</NavLink>
      </>
    );
    return (
      <>
        <NotificationBell />
        <LogoutBtn onClick={handleLogout} />
      </>
    );
  };

  return (
    <>
      <nav
        ref={navRef}
        className="spotlight-nav"
        style={{
          position: "fixed", top: "1rem", left: "50%", transform: "translateX(-50%)",
          zIndex: 210, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 1.5rem", height: "52px", maxWidth: "920px", width: "calc(100% - 2rem)",
          borderRadius: "9999px",
          background: scrolled ? "rgba(8, 12, 24, 0.75)" : "rgba(8, 12, 24, 0.4)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          border: scrolled ? "1px solid rgba(0, 229, 204, 0.15)" : "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: scrolled ? "0 4px 24px rgba(0, 229, 204, 0.08), 0 1px 2px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.2)",
          transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
          "--spotlight-x": "50%", "--spotlight-y": "50%",
        }}
      >
        <Link to="/" className="nav-logo">GIU Nexus</Link>
        <div className="nav-links-desktop" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          {renderCenterLinks()}
        </div>
        <div className="nav-right-desktop" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          {renderRightActions()}
        </div>
        <div className="nav-cursor" style={{
          position: "absolute", top: cursor.top, left: cursor.left,
          width: "4px", height: "2px", background: "#00e5cc",
          boxShadow: "0 0 6px rgba(0,229,204,0.6), 0 0 12px rgba(0,229,204,0.2)",
          opacity: cursor.opacity,
          transition: cursor.animate ? "left 0.3s cubic-bezier(0.25,0.1,0.25,1), opacity 0.3s ease, top 0.3s ease" : "opacity 0.3s ease",
          pointerEvents: "none", zIndex: 10,
        }} />

        <div
          className={`hamburger${menuOpen ? " active" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          role="button" tabIndex={0}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          <div className="hamburger-container">
            <div className="hamburger-line" />
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>
        </div>
      </nav>

      <div ref={preLayersRef} className="nav-prelayers" aria-hidden="true">
        {NAV_COLORS.map((c, i) => <div key={i} className="nav-prelayer" style={{ background: c }} />)}
      </div>

      <aside ref={panelRef} className="nav-mobile-panel" aria-hidden={!menuOpen}>
        <div className="nav-smoke" aria-hidden="true">
          {smokeCircles.map((c, i) => (
            <div
              key={i}
              className="nav-smoke-circle"
              style={{
                width: `${c.width}px`,
                height: `${c.height}px`,
                right: `${c.right}px`,
                bottom: `${c.bottom}px`,
                filter: `blur(${c.blur}px)`,
                transformOrigin: `${c.originX}px ${c.originY}px`,
                animationDelay: `${c.delay}s`,
                background: `rgba(${c.r}, ${c.g}, 205, ${c.a})`,
              }}
            />
          ))}
        </div>
        <div className="nav-panel-inner">
          <ul className="nav-panel-list" role="list" data-numbering>
            {allMobileLinks.map((it, idx) => (
              <li className="nav-panel-itemWrap" key={it.to + idx}>
                <Link to={it.to} className="nav-panel-item" onClick={() => setMenuOpen(false)} data-index={idx + 1}>
                  <span className="nav-panel-itemLabel">{it.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          {isAuthenticated && (
            <div className="nav-panel-logout">
              <button className="nav-panel-logout-btn" onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</button>
            </div>
          )}
        </div>
      </aside>

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
        .spotlight-nav[data-pointer-lighting]::before { opacity: 1; }
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
          text-shadow: 0 0 12px rgba(255, 255, 255, 0.4), 0 0 24px rgba(0, 229, 204, 0.15);
        }
        .nav-link-active {
          color: #fff !important;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.5), 0 0 20px rgba(0, 229, 204, 0.2) !important;
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

        .hamburger {
          display: none;
          width: 24px;
          height: 18px;
          cursor: pointer;
          position: relative;
          z-index: 220;
          flex-shrink: 0;
        }
        .hamburger-container {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 100%;
          height: 100%;
        }
        .hamburger-line {
          position: relative;
          width: 100%;
          height: 2px;
          overflow: hidden;
          transition: transform 600ms cubic-bezier(0.19, 1, 0.22, 1), opacity 300ms ease;
        }
        .hamburger-line::before,
        .hamburger-line::after {
          position: absolute;
          top: 0;
          content: '';
          width: 100%;
          height: 100%;
          transition: all 900ms cubic-bezier(0.19, 1, 0.22, 1);
        }
        .hamburger-line::before {
          right: 0;
          background-color: #eaf2ff;
        }
        .hamburger-line::after {
          background-color: #eaf2ff;
          left: calc(100% + 8px);
        }
        .hamburger-line:nth-child(1)::before,
        .hamburger-line:nth-child(1)::after { transition-delay: 0s; }
        .hamburger-line:nth-child(2)::before,
        .hamburger-line:nth-child(2)::after { transition-delay: 0.05s; }
        .hamburger-line:nth-child(3)::before,
        .hamburger-line:nth-child(3)::after { transition-delay: 0.1s; }

        @media (hover: hover) {
          .hamburger:not(.active):hover .hamburger-line::before { right: calc(100% + 8px); }
          .hamburger:not(.active):hover .hamburger-line::after { left: 0; }
        }

        .hamburger.active .hamburger-line { overflow: visible; }
        .hamburger.active .hamburger-line::after { opacity: 0; }
        .hamburger.active .hamburger-line:first-of-type { transform: translateY(8px) rotate(45deg); }
        .hamburger.active .hamburger-line:nth-of-type(2) { opacity: 0; transform: scaleX(0); }
        .hamburger.active .hamburger-line:last-of-type { transform: translateY(-8px) rotate(-45deg); }

        .nav-prelayers {
          display: none;
        }

        .nav-prelayer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          width: 100%;
        }

        .nav-mobile-panel {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          height: 100%;
          background: rgba(8, 12, 24, 0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          z-index: 200;
          pointer-events: auto;
          overflow: hidden;
        }

        .nav-panel-inner {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 6em 2em 2em 2em;
          height: 100%;
          overflow-y: auto;
        }

        .nav-panel-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          counter-reset: navItem;
        }

        .nav-panel-itemWrap {
          position: relative;
          overflow: hidden;
          line-height: 1;
        }

        .nav-panel-item {
          position: relative;
          color: #eaf2ff;
          font-weight: 600;
          font-size: 2.4rem;
          cursor: pointer;
          line-height: 1.1;
          letter-spacing: -1px;
          text-transform: uppercase;
          text-decoration: none;
          transition: color 0.25s ease;
          display: inline-block;
          padding-right: 1.4em;
        }
        .nav-panel-item:hover {
          color: #00e5cc;
        }

        .nav-panel-list[data-numbering] {
          counter-reset: navItem;
        }
        .nav-panel-list[data-numbering] .nav-panel-item::after {
          counter-increment: navItem;
          content: counter(navItem, decimal-leading-zero);
          position: absolute;
          top: 0.15em;
          right: 0;
          font-size: 0.85rem;
          font-weight: 400;
          color: #00e5cc;
          letter-spacing: 0;
          pointer-events: none;
          user-select: none;
          opacity: var(--nav-num-opacity, 0);
        }

        .nav-panel-itemLabel {
          display: inline-block;
          will-change: transform;
          transform-origin: 50% 100%;
        }

        .nav-panel-logout {
          margin-top: auto;
          padding-top: 2rem;
        }

        .nav-panel-logout-btn {
          background: transparent;
          color: rgba(234, 242, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.5rem 1.5rem;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 400;
          cursor: pointer;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        }
        .nav-panel-logout-btn:hover {
          border-color: rgba(0, 229, 204, 0.4);
          color: #eaf2ff;
          box-shadow: 0 0 8px rgba(0, 229, 204, 0.15);
        }

        .nav-smoke {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }

        .nav-smoke-circle {
          position: absolute;
          border-radius: 400px;
          border: 2px solid rgba(255, 255, 255, 0.03);
          animation: nav-spin 3s linear infinite;
        }

        @keyframes nav-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .nav-links-desktop { display: flex; }

        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-right-desktop { display: none !important; }
          .hamburger { display: block !important; }
          .nav-mobile-panel { display: block !important; }
          .nav-prelayers { display: block !important; }
          .nav-cursor { display: none !important; }

          .nav-prelayers {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            pointer-events: none;
            z-index: 199;
            opacity: 0;
          }

          .nav-panel-item {
            font-size: 2rem;
          }
        }
      `}</style>
    </>
  );
};

function NavLink({ to, active, children }) {
  return <Link to={to} className={`nav-link ${active ? "nav-link-active" : ""}`}>{children}</Link>;
}

function LogoutBtn({ onClick }) {
  return <button className="nav-logout-btn" onClick={onClick}>Logout</button>;
}

export default Navbar;