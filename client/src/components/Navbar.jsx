import { useContext, useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { gsap } from "gsap";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";
import api from "../services/api";

const NAV_COLORS = ["#060c18", "#0a1628"];

const JOB_SEEKER_DROPDOWNS = [
  {
    label: "Discover",
    items: [
      { label: "Browse Jobs", to: "/jobs", icon: "search" },
      { label: "Recommended", to: "/jobs/recommended", icon: "sparkles" },
      { label: "Saved Jobs", to: "/jobs/saved", icon: "bookmark" },
      { label: "Saved Searches", to: "/saved-searches", icon: "filter" },
    ],
  },
  {
    label: "My Career",
    items: [
      { label: "Applications", to: "/applications/my", icon: "clipboard" },
      { label: "Referrals", to: "/referrals", icon: "users" },
      { label: "Profile", to: "/profile", icon: "user" },
      { label: "Edit Profile", to: "/profile/edit", icon: "user" },
      { label: "Security", to: "/profile/totp-setup", icon: "shield" },
    ],
  },
];

const ADMIN_DROPDOWNS = [
  {
    label: "Management",
    items: [
      { label: "Dashboard", to: "/admin/dashboard", icon: "clipboard" },
      { label: "Users", to: "/admin/users", icon: "user" },
      { label: "Recruiters", to: "/admin/recruiters", icon: "users" },
      { label: "Jobs", to: "/admin/jobs", icon: "search" },
      { label: "Applications", to: "/admin/applications", icon: "clipboard" },
      { label: "Referrals", to: "/admin/referrals", icon: "users" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Reports", to: "/admin/reports", icon: "file" },
      { label: "Conversations", to: "/admin/conversations", icon: "users" },
      { label: "Audit Logs", to: "/admin/audit-logs", icon: "bookmark" },
      { label: "Request Logs", to: "/admin/request-logs", icon: "filter" },
    ],
  },
];

const RECRUITER_DROPDOWNS = [
  {
    label: "Hiring",
    items: [
      { label: "Dashboard", to: "/recruiter/dashboard", icon: "clipboard" },
      { label: "Post Job", to: "/recruiter/jobs/create", icon: "sparkles" },
      { label: "My Jobs", to: "/recruiter/jobs", icon: "search" },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Messages", to: "/conversations", icon: "user" },
      { label: "Edit Account", to: "/profile/edit", icon: "user" },
      { label: "Security", to: "/profile/totp-setup", icon: "shield" },
    ],
  },
];

const NAV_ICONS = {
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  sparkles: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 15l1 3 3 1-3 1-1 3-1-3-3 1 3-1 1-3z"/></svg>,
  bookmark: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  filter: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  clipboard: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  users: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  file: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
  user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const relativeTime = (dateStr) => {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
};

const Navbar = () => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const [cursor, setCursor] = useState({ left: 0, top: 0, opacity: 0, animate: false });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownTimeoutRef = useRef(null);
  const notifPanelRef = useRef(null);
  const profilePanelRef = useRef(null);

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
    if (!isAuthenticated) return;
    const fetchNotifs = async () => {
      try {
        const res = await api.get("/notifications?limit=10");
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    fetchNotifs();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (profilePanelRef.current && !profilePanelRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDropdownEnter = (label) => {
    clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(label);
  };

  const handleDropdownLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 150);
  };

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

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const isActive = (path) => location.pathname === path;

  const getCenterLinks = () => {
    if (!isAuthenticated) return [];
    if (user?.role === "jobSeeker") return [];
    if (user?.role === "recruiter") return [
      { label: "Dashboard", to: "/recruiter/dashboard" },
      { label: "Post Job", to: "/recruiter/jobs/create" },
      { label: "My Jobs", to: "/recruiter/jobs" },
      { label: "Messages", to: "/conversations" },
      { label: "Edit Account", to: "/profile/edit" },
      { label: "Security", to: "/profile/totp-setup" },
    ];
    if (user?.role === "admin") return [
      { label: "Dashboard", to: "/admin/dashboard" },
      { label: "Users", to: "/admin/users" },
      { label: "Recruiters", to: "/admin/recruiters" },
      { label: "Jobs", to: "/admin/jobs" },
      { label: "Applications", to: "/admin/applications" },
      { label: "Referrals", to: "/admin/referrals" },
      { label: "Reports", to: "/admin/reports" },
      { label: "Conversations", to: "/admin/conversations" },
      { label: "Audit Logs", to: "/admin/audit-logs" },
      { label: "Request Logs", to: "/admin/request-logs" },
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

  const allMobileLinks = user?.role === "jobSeeker"
    ? [
        { label: "Home", to: "/" },
        { label: "Browse Jobs", to: "/jobs" },
        { label: "Recommended", to: "/jobs/recommended" },
        { label: "Saved Jobs", to: "/jobs/saved" },
        { label: "Saved Searches", to: "/saved-searches" },
        { label: "Applications", to: "/applications/my" },
        { label: "Referrals", to: "/referrals" },
        { label: "Profile", to: "/profile" },
        { label: "Edit Profile", to: "/profile/edit" },
        { label: "Security", to: "/profile/totp-setup" },
      ]
    : [...getCenterLinks(), ...getRightLinks()];

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
        {JOB_SEEKER_DROPDOWNS.map((dropdown) => (
          <div
            key={dropdown.label}
            className="nav-dropdown-wrapper"
            onMouseEnter={() => handleDropdownEnter(dropdown.label)}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              className={`nav-dropdown-trigger ${activeDropdown === dropdown.label ? "active" : ""}`}
              onClick={() => setActiveDropdown(activeDropdown === dropdown.label ? null : dropdown.label)}
            >
              {dropdown.label}
              <svg className="nav-dropdown-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className={`nav-dropdown-menu ${activeDropdown === dropdown.label ? "open" : ""}`}>
              {dropdown.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-dropdown-item"
                  onClick={() => setActiveDropdown(null)}
                >
                  <span className="nav-dropdown-item-icon">{NAV_ICONS[item.icon]}</span>
                  <span className="nav-dropdown-item-label">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </>
    );
    if (user?.role === "recruiter") return (
      <>
        {RECRUITER_DROPDOWNS.map((dropdown) => (
          <div
            key={dropdown.label}
            className="nav-dropdown-wrapper"
            onMouseEnter={() => handleDropdownEnter(dropdown.label)}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              className={`nav-dropdown-trigger ${activeDropdown === dropdown.label ? "active" : ""}`}
              onClick={() => setActiveDropdown(activeDropdown === dropdown.label ? null : dropdown.label)}
            >
              {dropdown.label}
              <svg className="nav-dropdown-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className={`nav-dropdown-menu ${activeDropdown === dropdown.label ? "open" : ""}`}>
              {dropdown.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-dropdown-item"
                  onClick={() => setActiveDropdown(null)}
                >
                  <span className="nav-dropdown-item-icon">{NAV_ICONS[item.icon]}</span>
                  <span className="nav-dropdown-item-label">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </>
    );
    if (user?.role === "admin") return (
      <>
        {ADMIN_DROPDOWNS.map((dropdown) => (
          <div
            key={dropdown.label}
            className="nav-dropdown-wrapper"
            onMouseEnter={() => handleDropdownEnter(dropdown.label)}
            onMouseLeave={handleDropdownLeave}
          >
            <button
              className={`nav-dropdown-trigger ${activeDropdown === dropdown.label ? "active" : ""}`}
              onClick={() => setActiveDropdown(activeDropdown === dropdown.label ? null : dropdown.label)}
            >
              {dropdown.label}
              <svg className="nav-dropdown-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className={`nav-dropdown-menu ${activeDropdown === dropdown.label ? "open" : ""}`}>
              {dropdown.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="nav-dropdown-item"
                  onClick={() => setActiveDropdown(null)}
                >
                  <span className="nav-dropdown-item-icon">{NAV_ICONS[item.icon]}</span>
                  <span className="nav-dropdown-item-label">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
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

    const initials = user?.name
      ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "U";

    return (
      <>
        {(user?.role === "jobSeeker" || user?.role === "admin" || user?.role === "recruiter") && (
          <div className="nav-right-actions" ref={notifPanelRef}>
            <button
              className="nav-notif-bell"
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="nav-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
              )}
            </button>
            <div className={`nav-notif-panel ${notifOpen ? "open" : ""}`} onWheel={(e) => e.stopPropagation()}>
              <div className="nav-notif-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="nav-notif-mark-all" onClick={handleMarkAllRead}>Mark all read</button>
                )}
              </div>
              <div className="nav-notif-list" onWheel={(e) => {
                const el = e.currentTarget;
                const atTop = el.scrollTop <= 0;
                const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
                if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
                  e.preventDefault();
                }
              }}>
                {notifications.length === 0 ? (
                  <div className="nav-notif-empty">No notifications</div>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <div
                      key={n._id}
                      className={`nav-notif-item ${n.read ? "read" : "unread"}`}
                      onClick={() => !n.read && handleMarkRead(n._id)}
                    >
                      <div className="nav-notif-item-text">{n.message || n.title || "Notification"}</div>
                      <div className="nav-notif-item-meta">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                        {n.createdAt && <span className="nav-notif-item-reltime"> · {relativeTime(n.createdAt)}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link to="/notifications" className="nav-notif-view-all" onClick={() => setNotifOpen(false)}>
                View all
              </Link>
            </div>
          </div>
        )}
        <div className="nav-profile-wrapper" ref={profilePanelRef}>
          <button
            className="nav-profile-btn"
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
          >
            <div className="nav-profile-avatar">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
          </button>
          <div className={`nav-profile-panel ${profileOpen ? "open" : ""}`}>
            <div className="nav-profile-info">
              <div className="nav-profile-name">{user?.name || "User"}</div>
              <div className="nav-profile-email">{user?.email || ""}</div>
              <div className="nav-profile-role-badge">{user?.role === "jobSeeker" ? "Job Seeker" : user?.role === "recruiter" ? "Recruiter" : user?.role}</div>
            </div>
            <div className="nav-profile-links">
              {user?.role === "jobSeeker" && (
                <Link to="/profile" className="nav-profile-link" onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Profile
                </Link>
              )}
              {user?.role !== "admin" && (
                <Link to="/profile/edit" className="nav-profile-link" onClick={() => setProfileOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                  </svg>
                  {user?.role === "jobSeeker" ? "Edit Profile" : "Edit Account"}
                </Link>
              )}
              <Link to="/profile/change-password" className="nav-profile-link" onClick={() => setProfileOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Change Password
              </Link>
              <Link to="/profile/totp-setup" className="nav-profile-link" onClick={() => setProfileOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                Security
              </Link>
            </div>
            <div className="nav-profile-divider" />
            <button className="nav-profile-logout" onClick={() => { handleLogout(); setProfileOpen(false); }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
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
          top: scrolled ? "0" : "1rem",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 210,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem",
          height: "52px",
          maxWidth: "920px",
          width: "calc(100% - 2rem)",
          borderRadius: scrolled ? "0 0 12px 12px" : "9999px",
          background: scrolled ? "rgba(8, 12, 24, 0.88)" : "rgba(8, 12, 24, 0.4)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: scrolled ? "none" : "1px solid rgba(255, 255, 255, 0.06)",
          borderBottom: scrolled ? "1px solid rgba(0, 229, 204, 0.15)" : undefined,
          boxShadow: scrolled ? "0 4px 24px rgba(0, 229, 204, 0.08), 0 1px 2px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.2)",
          transition: "top 0.45s cubic-bezier(0.4, 0, 0.2, 1), borderRadius 0.45s cubic-bezier(0.4, 0, 0.2, 1), background 0.45s cubic-bezier(0.4, 0, 0.2, 1), border 0.45s cubic-bezier(0.4, 0, 0.2, 1), boxShadow 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
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

      <aside ref={panelRef} className={`nav-mobile-panel${menuOpen ? " open" : ""}`} aria-hidden={!menuOpen}>
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
          {isAuthenticated && (user?.role === "jobSeeker" || user?.role === "admin" || user?.role === "recruiter") && unreadCount > 0 && (
            <div className="nav-panel-notif-row">
              <Link to="/notifications" className="nav-panel-notif-link" onClick={() => setMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                <span>Notifications</span>
              </Link>
              <span className="nav-panel-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
            </div>
          )}
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
          border-radius: inherit;
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
          border-radius: inherit;
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
          pointer-events: none;
          overflow: hidden;
        }

        .nav-mobile-panel.open {
          pointer-events: auto;
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

        .nav-dropdown-wrapper {
          position: relative;
        }

        .nav-dropdown-trigger {
          position: relative;
          color: rgba(234, 242, 255, 0.45);
          text-decoration: none;
          font-size: 0.72rem;
          font-weight: 400;
          padding: 0.35rem 0.65rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          transition: color 0.25s ease, text-shadow 0.25s ease;
          z-index: 5;
          background: transparent;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-family: inherit;
        }
        .nav-dropdown-trigger:hover,
        .nav-dropdown-trigger.active {
          color: #fff;
          text-shadow: 0 0 12px rgba(255, 255, 255, 0.4), 0 0 24px rgba(0, 229, 204, 0.15);
        }
        .nav-dropdown-arrow {
          transition: transform 0.2s ease;
        }
        .nav-dropdown-trigger.active .nav-dropdown-arrow {
          transform: rotate(180deg);
        }

        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 50%;
          transform: translateX(-50%) translateY(6px) scale(0.97);
          background: rgba(6, 12, 24, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 229, 204, 0.12);
          border-radius: 4px;
          padding: 0.25rem;
          min-width: 200px;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.18s ease;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2);
          z-index: 300;
        }
        .nav-dropdown-menu::before {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 10px;
          height: 10px;
          background: rgba(6, 12, 24, 0.92);
          border-left: 1px solid rgba(0, 229, 204, 0.12);
          border-top: 1px solid rgba(0, 229, 204, 0.12);
        }
        .nav-dropdown-menu.open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateX(-50%) translateY(0) scale(1);
        }

        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.45rem 0.65rem;
          color: rgba(234, 242, 255, 0.55);
          text-decoration: none;
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.08em;
          border-radius: 3px;
          transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        }
        .nav-dropdown-item:hover {
          background: rgba(0, 229, 204, 0.06);
          color: #eaf2ff;
          box-shadow: inset 2px 0 0 rgba(0, 229, 204, 0.5);
        }
        .nav-dropdown-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          opacity: 0.6;
          flex-shrink: 0;
        }
        .nav-dropdown-item:hover .nav-dropdown-item-icon {
          opacity: 1;
          color: #00e5cc;
        }
        .nav-dropdown-item-label {
          letter-spacing: 0.04em;
        }

        .nav-right-actions {
          position: relative;
          display: flex;
          align-items: center;
        }

        .nav-notif-bell {
          position: relative;
          background: none;
          border: none;
          cursor: pointer;
          color: rgba(234, 242, 255, 0.45);
          padding: 0.35rem;
          line-height: 1;
          transition: color 0.2s ease, transform 0.15s ease;
          margin-right: 0.35rem;
        }
        .nav-notif-bell:hover {
          color: #eaf2ff;
          transform: scale(1.1);
        }
        .nav-notif-badge {
          position: absolute;
          top: -2px;
          right: -4px;
          background: #00e5cc;
          color: #050a14;
          font-size: 0.55rem;
          font-weight: 700;
          border-radius: 2px;
          padding: 0.1rem 0.25rem;
          min-width: 14px;
          text-align: center;
          line-height: 1.4;
          box-shadow: 0 0 6px rgba(0, 229, 204, 0.4);
          animation: bellPulse 2s ease-in-out infinite;
        }
        @keyframes bellPulse {
          0%, 100% { box-shadow: 0 0 3px rgba(0, 229, 204, 0.3); }
          50% { box-shadow: 0 0 8px rgba(0, 229, 204, 0.6); }
        }

        .nav-notif-panel {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 320px;
          background: rgba(6, 12, 24, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 229, 204, 0.12);
          border-radius: 4px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(6px) scale(0.97);
          transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.18s ease;
          z-index: 300;
          display: flex;
          flex-direction: column;
          max-height: 420px;
          overscroll-behavior: contain;
        }
        .nav-notif-panel.open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }
        .nav-notif-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.65rem 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          color: #eaf2ff;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .nav-notif-mark-all {
          background: none;
          border: none;
          color: #00e5cc;
          font-size: 0.68rem;
          cursor: pointer;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          transition: background 0.15s ease;
        }
        .nav-notif-mark-all:hover {
          background: rgba(0, 229, 204, 0.1);
        }
        .nav-notif-list {
          max-height: 280px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .nav-notif-list::-webkit-scrollbar {
          width: 4px;
        }
        .nav-notif-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .nav-notif-list::-webkit-scrollbar-thumb {
          background: rgba(0, 229, 204, 0.2);
          border-radius: 2px;
        }
        .nav-notif-list::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 229, 204, 0.4);
        }
        .nav-notif-item {
          padding: 0.6rem 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .nav-notif-item:hover {
          background: rgba(0, 229, 204, 0.04);
        }
        .nav-notif-item.unread {
          border-left: 2px solid rgba(0, 229, 204, 0.4);
          padding-left: calc(0.85rem - 2px);
        }
.nav-notif-item-text {
          color: rgba(234, 242, 255, 0.8);
          font-size: 0.72rem;
          margin-bottom: 0.2rem;
          line-height: 1.45;
        }
        .nav-notif-item-meta {
          display: flex;
          align-items: center;
          gap: 0;
          color: rgba(234, 242, 255, 0.3);
          font-size: 0.6rem;
          letter-spacing: 0.03em;
        }
        .nav-notif-item-reltime {
          color: rgba(0, 229, 204, 0.55);
        }
        .nav-notif-empty {
          padding: 1.5rem 1rem;
          text-align: center;
          color: rgba(234, 242, 255, 0.3);
          font-size: 0.72rem;
          letter-spacing: 0.06em;
        }
        .nav-notif-view-all {
          display: block;
          padding: 0.6rem;
          text-align: center;
          color: #00e5cc;
          text-decoration: none;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          transition: background 0.15s ease;
        }
        .nav-notif-view-all:hover {
          background: rgba(0, 229, 204, 0.06);
        }

        .nav-profile-wrapper {
          position: relative;
        }
        .nav-profile-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .nav-profile-avatar {
          width: 30px;
          height: 30px;
          border-radius: 3px;
          background: rgba(0, 229, 204, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 600;
          color: #00e5cc;
          overflow: hidden;
          border: 1px solid rgba(0, 229, 204, 0.2);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .nav-profile-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .nav-profile-btn:hover .nav-profile-avatar {
          border-color: rgba(0, 229, 204, 0.5);
          box-shadow: 0 0 8px rgba(0, 229, 204, 0.2);
        }

        .nav-profile-panel {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          width: 240px;
          background: rgba(6, 12, 24, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 229, 204, 0.12);
          border-radius: 4px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(6px) scale(0.97);
          transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.18s ease;
          z-index: 300;
          overflow: hidden;
        }
        .nav-profile-panel.open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }
        .nav-profile-info {
          padding: 0.75rem 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .nav-profile-name {
          color: #eaf2ff;
          font-size: 0.82rem;
          font-weight: 600;
          margin-bottom: 0.15rem;
        }
        .nav-profile-email {
          color: rgba(234, 242, 255, 0.4);
          font-size: 0.68rem;
          margin-bottom: 0.4rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nav-profile-role-badge {
          display: inline-block;
          padding: 0.15rem 0.45rem;
          background: rgba(0, 229, 204, 0.1);
          color: #00e5cc;
          font-size: 0.6rem;
          font-weight: 500;
          border-radius: 2px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .nav-profile-links {
          padding: 0.25rem;
        }
        .nav-profile-link {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.45rem 0.65rem;
          color: rgba(234, 242, 255, 0.55);
          text-decoration: none;
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.06em;
          border-radius: 3px;
          transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        }
        .nav-profile-link:hover {
          background: rgba(0, 229, 204, 0.06);
          color: #eaf2ff;
          box-shadow: inset 2px 0 0 rgba(0, 229, 204, 0.5);
        }
        .nav-profile-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
          margin: 0.15rem 0;
        }
        .nav-profile-logout {
          display: flex;
          align-items: center;
          gap: 0.55rem;
          width: 100%;
          padding: 0.45rem 0.65rem;
          background: none;
          border: none;
          color: rgba(234, 242, 255, 0.45);
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.06em;
          cursor: pointer;
          border-radius: 3px;
          transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
        }
        .nav-profile-logout:hover {
          background: rgba(255, 77, 77, 0.06);
          color: #ff4d4d;
          box-shadow: inset 2px 0 0 rgba(255, 77, 77, 0.5);
        }

        .nav-panel-notif-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
          margin-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .nav-panel-notif-link {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: rgba(234, 242, 255, 0.7);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          transition: color 0.2s ease;
        }
        .nav-panel-notif-link:hover {
          color: #00e5cc;
        }
        .nav-panel-notif-badge {
          background: #00e5cc;
          color: #050a14;
          font-size: 0.65rem;
          font-weight: 700;
          border-radius: 2px;
          padding: 0.15rem 0.4rem;
          min-width: 18px;
          text-align: center;
          line-height: 1.3;
        }

        @media (max-width: 768px) {
          .nav-links-desktop { display: none !important; }
          .nav-right-desktop { display: none !important; }
          .nav-dropdown-wrapper { display: none !important; }
          .nav-right-actions { display: none !important; }
          .nav-profile-wrapper { display: none !important; }
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
