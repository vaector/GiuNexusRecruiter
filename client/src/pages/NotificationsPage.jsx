import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { notificationsAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import PageLoader from "../components/PageLoader";

const CATEGORIES = [
  { key: "all", label: "ALL" },
  { key: "approval", label: "APPROVALS" },
  { key: "application", label: "APPLICATIONS" },
  { key: "message", label: "MESSAGES" },
  { key: "referral", label: "REFERRALS" },
  { key: "job_closure", label: "JOBS" },
];

const CATEGORY_ICONS = {
  approval: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  application: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  message: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  referral: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  job_closure: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
};

const CATEGORY_COLORS = {
  approval: "#00e5cc",
  application: "#a78bfa",
  message: "#5b9cf6",
  referral: "#f0c040",
  job_closure: "#ff003c",
};

function detectCategory(notification) {
  const type = notification.type || notification.category || "";
  const msg = (notification.message || notification.title || "").toLowerCase();
  if (type === "approval" || type === "account_approval") return "approval";
  if (type === "application" || type === "application_status" || type === "application_update") return "application";
  if (type === "message" || type === "new_message") return "message";
  if (type === "referral" || type === "referral_update") return "referral";
  if (type === "job_closure" || type === "job_closed" || type === "job_status") return "job_closure";
  if (msg.includes("approv")) return "approval";
  if (msg.includes("appl")) return "application";
  if (msg.includes("message")) return "message";
  if (msg.includes("referr")) return "referral";
  if (msg.includes("closed") || msg.includes("job")) return "job_closure";
  return "application";
}

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

export default function NotificationsPage() {
  const { isAuthenticated } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const spotlightRef = useRef(null);
  const listRef = useRef(null);
  const scrollTrackRef = useRef(null);
  const scrollThumbRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((n) => detectCategory(n) === activeFilter);

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    const fetchNotifs = async () => {
      try {
        const res = await notificationsAPI.getNotifications({ limit: 100 });
        if (mounted) {
          setNotifications(res.data.notifications || res.data || []);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    fetchNotifs();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  useEffect(() => {
    document.body.style.background = "#030303";
    document.body.style.overflow = "";
    document.documentElement.style.scrollBehavior = "auto";
    return () => { document.body.style.background = ""; };
  }, []);

  useEffect(() => {
    const list = listRef.current;
    const thumb = scrollThumbRef.current;
    const track = scrollTrackRef.current;
    if (!list || !thumb || !track) return;

    const update = () => {
      const scrollable = list.scrollHeight - list.clientHeight;
      const pct = scrollable > 0 ? list.scrollTop / scrollable : 0;
      const trackH = track.offsetHeight - thumb.offsetHeight;
      thumb.style.transform = `translateY(${pct * Math.max(trackH, 0)}px)`;
      track.style.opacity = pct > 0.005 ? "1" : "0";
    };
    list.addEventListener("scroll", update, { passive: true });
    update();
    return () => list.removeEventListener("scroll", update);
  }, [filteredNotifications]);

  useEffect(() => {
    const panel = spotlightRef.current;
    if (!panel) return;
    const onPointerMove = (e) => {
      const r = panel.getBoundingClientRect();
      panel.style.setProperty("--spotlight-x", `${Math.floor(e.clientX - r.left)}px`);
      panel.style.setProperty("--spotlight-y", `${Math.floor(e.clientY - r.top)}px`);
    };
    panel.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => panel.removeEventListener("pointermove", onPointerMove);
  }, []);

  const handleMarkRead = useCallback(async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setMarkingAll(false);
    }
  }, []);

  return (
    <div
      ref={spotlightRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#030303",
        color: "#eaf2ff",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Grain overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.045,
          pointerEvents: "none",
          zIndex: 9998,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)",
          pointerEvents: "none",
          zIndex: 9997,
        }}
      />

      {/* Spotlight follow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(0,229,204,0.03), transparent 60%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* HUD telemetry - top left */}
      {/* <div
        style={{
          position: "fixed",
          top: "1.5rem",
          left: "1.5rem",
          zIndex: 60,
          pointerEvents: "none",
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: "9px",
          letterSpacing: "0.14em",
          color: "rgba(140,230,240,0.38)",
          textTransform: "uppercase",
        }}
      >
        SYS.NOTIFICATIONS
      </div> */}

      {/* HUD telemetry - top right */}
      <div
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 60,
          pointerEvents: "none",
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: "9px",
          letterSpacing: "0.14em",
          color: "rgba(140,230,240,0.38)",
          textTransform: "uppercase",
          textAlign: "right",
        }}
      >
        UNREAD: <strong style={{ color: unreadCount > 0 ? "#00e5cc" : "rgba(140,230,240,0.38)" }}>{unreadCount}</strong>
        <br />
        TOTAL: <strong style={{ color: "#00e5cc" }}>{notifications.length}</strong>
      </div>

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "860px",
          margin: "0 auto",
          padding: "100px 1.5rem 4rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.18em",
                color: "rgba(0,229,204,0.6)",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              INBOX
            </div>
            <h1
              style={{
                fontFamily: "'Syncopate','Inter',system-ui,sans-serif",
                fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                fontWeight: 600,
                color: "#eaf2ff",
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              NOTIFICATIONS
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "0.35rem" }}>
            {unreadCount > 0 && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  background: "#00e5cc",
                  color: "#050a14",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "2px",
                  boxShadow: "0 0 8px rgba(0,229,204,0.4)",
                  letterSpacing: "0.06em",
                }}
              >
                {unreadCount} UNREAD
              </span>
            )}
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "0.68rem",
                  fontWeight: 500,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: markingAll ? "rgba(0,229,204,0.15)" : "transparent",
                  color: markingAll ? "rgba(0,229,204,0.5)" : "#00e5cc",
                  border: "1px solid rgba(0,229,204,0.2)",
                  borderRadius: "2px",
                  padding: "0.35rem 0.75rem",
                  cursor: markingAll ? "wait" : "pointer",
                  transition: "all 0.18s ease",
                }}
              >
                {markingAll ? "MARKING..." : "MARK ALL READ"}
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.4rem",
            marginBottom: "1.5rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeFilter === cat.key;
            const count =
              cat.key === "all"
                ? notifications.length
                : notifications.filter((n) => detectCategory(n) === cat.key).length;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveFilter(cat.key)}
                style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "0.68rem",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "2px",
                  border: isActive
                    ? "1px solid rgba(0,229,204,0.3)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isActive
                    ? "rgba(0,229,204,0.1)"
                    : "transparent",
                  color: isActive
                    ? "#00e5cc"
                    : "rgba(234,242,255,0.45)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  boxShadow: isActive
                    ? "0 0 6px rgba(0,229,204,0.1)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                {cat.label}
                {count > 0 && (
                  <span
                    style={{
                      fontSize: "0.55rem",
                      color: isActive ? "#00e5cc" : "rgba(234,242,255,0.3)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div style={{ position: "relative" }}>
          {/* Custom scrollbar */}
          <div
            ref={scrollTrackRef}
            style={{
              position: "absolute",
              right: "-12px",
              top: 0,
              bottom: 0,
              width: "3px",
              zIndex: 30,
              pointerEvents: "none",
              background: "rgba(255,255,255,0.04)",
              borderRadius: "2px",
              opacity: 0,
              transition: "opacity 0.6s ease",
            }}
          >
            <div
              ref={scrollThumbRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "36px",
                background: "rgba(0,229,204,0.5)",
                borderRadius: "2px",
                boxShadow: "0 0 8px rgba(0,229,204,0.25)",
                willChange: "transform",
              }}
            />
          </div>

          <div
            ref={listRef}
            style={{
              maxHeight: "calc(100vh - 320px)",
              overflowY: "auto",
              paddingRight: "1rem",
              overscrollBehavior: "contain",
            }}
          >
            {/* Scrollbar styling embedded */}
            <style>{`
              .notif-list-scroll::-webkit-scrollbar { width: 4px; }
              .notif-list-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
              .notif-list-scroll::-webkit-scrollbar-thumb { background: rgba(0,229,204,0.2); border-radius: 2px; }
              .notif-list-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,229,204,0.4); }
            `}</style>

            {loading ? <PageLoader /> : filteredNotifications.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4rem 0",
                  gap: "1rem",
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(234,242,255,0.15)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: "0.72rem",
                    letterSpacing: "0.1em",
                    color: "rgba(234,242,255,0.3)",
                    textTransform: "uppercase",
                  }}
                >
                  NO NOTIFICATIONS
                </div>
                <div
                  style={{
                    fontFamily: "'Inter',system-ui,sans-serif",
                    fontSize: "0.82rem",
                    color: "rgba(234,242,255,0.2)",
                  }}
                >
                  {activeFilter === "all"
                    ? "You're all caught up."
                    : `No ${CATEGORIES.find((c) => c.key === activeFilter)?.label.toLowerCase()} notifications.`}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {filteredNotifications.map((n) => {
                  const cat = detectCategory(n);
                  const icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS.application;
                  const color = CATEGORY_COLORS[cat] || "#00e5cc";
                  const isHovered = hoveredId === n._id;
                  return (
                    <div
                      key={n._id}
                      onMouseEnter={() => setHoveredId(n._id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => !n.read && handleMarkRead(n._id)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        padding: "0.85rem 1rem",
                        background: isHovered
                          ? "rgba(0,229,204,0.04)"
                          : n.read
                          ? "transparent"
                          : "rgba(0,229,204,0.02)",
                        borderLeft: n.read
                          ? "2px solid transparent"
                          : `2px solid ${color}`,
                        paddingLeft: n.read ? "calc(1rem - 2px)" : "1rem",
                        cursor: n.read ? "default" : "pointer",
                        transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                        borderRadius: "2px",
                        boxShadow: isHovered
                          ? `inset 2px 0 0 ${color}40, 0 0 12px rgba(0,229,204,0.04)`
                          : "none",
                        position: "relative",
                      }}
                    >
                      {/* Type icon */}
                      <div
                        style={{
                          flexShrink: 0,
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "2px",
                          background: `${color}10`,
                          border: `1px solid ${color}20`,
                          color: color,
                          marginTop: "2px",
                        }}
                      >
                        {icon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.2rem",
                          }}
                        >
                          {!n.read && (
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#00e5cc",
                                boxShadow: "0 0 6px rgba(0,229,204,0.4)",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono','Fira Code',monospace",
                              fontSize: "0.55rem",
                              fontWeight: 500,
                              letterSpacing: "0.12em",
                              textTransform: "uppercase",
                              color: color,
                              opacity: 0.8,
                            }}
                          >
                            {CATEGORIES.find((c) => c.key === cat)?.label}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: n.read ? 400 : 500,
                            color: n.read ? "rgba(234,242,255,0.6)" : "#eaf2ff",
                            lineHeight: 1.5,
                            marginBottom: "0.25rem",
                          }}
                        >
                          {n.message || n.title || "Notification"}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            fontFamily: "'JetBrains Mono','Fira Code',monospace",
                            fontSize: "0.6rem",
                            letterSpacing: "0.03em",
                            color: "rgba(234,242,255,0.3)",
                          }}
                        >
                          <span>
                            {n.createdAt
                              ? new Date(n.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : ""}
                          </span>
                          {n.createdAt && (
                            <>
                              <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                              <span style={{ color: "rgba(0,229,204,0.5)" }}>
                                {relativeTime(n.createdAt)}
                              </span>
                            </>
                          )}
                          {!n.read && (
                            <>
                              <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                              <span style={{ color: "#00e5cc", cursor: "pointer" }}>
                                MARK READ
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom divider with HUD label */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.14em",
              color: "rgba(140,230,240,0.25)",
              textTransform: "uppercase",
            }}
          >
            END.NOTIFICATIONS
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.14em",
              color: "rgba(140,230,240,0.25)",
              textTransform: "uppercase",
            }}
          >
            FILTERED: {CATEGORIES.find((c) => c.key === activeFilter)?.label || activeFilter.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Inline styles */}
      <style>{`
        .notif-list-scroll::-webkit-scrollbar { width: 4px; }
        .notif-list-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
        .notif-list-scroll::-webkit-scrollbar-thumb { background: rgba(0,229,204,0.2); border-radius: 2px; }
        .notif-list-scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,229,204,0.4); }
      `}</style>
    </div>
  );
}