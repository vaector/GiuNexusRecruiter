import React, { useState, useEffect, useRef, useCallback } from "react";
import { adminAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";

const ACTION_GROUPS = [
  { key: "all", label: "ALL" },
  { key: "user", label: "USER" },
  { key: "job", label: "JOB" },
  { key: "application", label: "APPLICATION" },
  { key: "recruiter", label: "RECRUITER" },
  { key: "report", label: "REPORT" },
  { key: "admin", label: "ADMIN" },
];

const ACTION_MAP = {
  USER_CREATED: { group: "user", label: "Created", color: "#00e5cc" },
  USER_BANNED: { group: "user", label: "Banned", color: "#ff003c" },
  USER_DELETED: { group: "user", label: "Deleted", color: "#ff003c" },
  USER_PASSWORD_RESET: { group: "user", label: "Password Reset", color: "#f0c040" },
  JOB_CREATED: { group: "job", label: "Created", color: "#00e5cc" },
  JOB_APPROVED: { group: "job", label: "Approved", color: "#00e5cc" },
  JOB_REJECTED: { group: "job", label: "Rejected", color: "#ff003c" },
  JOB_CLOSED: { group: "job", label: "Closed", color: "#f0c040" },
  JOB_DELETED: { group: "job", label: "Deleted", color: "#ff003c" },
  JOB_AUTO_CLOSED: { group: "job", label: "Auto-Closed", color: "#f0c040" },
  APPLICATION_CREATED: { group: "application", label: "Created", color: "#a78bfa" },
  APPLICATION_SHORTLISTED: { group: "application", label: "Shortlisted", color: "#00e5cc" },
  APPLICATION_REJECTED: { group: "application", label: "Rejected", color: "#ff003c" },
  APPLICATION_WITHDRAWN: { group: "application", label: "Withdrawn", color: "#f0c040" },
  RECRUITER_APPROVED: { group: "recruiter", label: "Approved", color: "#00e5cc" },
  RECRUITER_REJECTED: { group: "recruiter", label: "Rejected", color: "#ff003c" },
  REPORT_REVIEWED: { group: "report", label: "Reviewed", color: "#5b9cf6" },
  REPORT_DISMISSED: { group: "report", label: "Dismissed", color: "#f0c040" },
  REPORT_ACTIONED: { group: "report", label: "Actioned", color: "#00e5cc" },
  ADMIN_PASSWORD_RESET: { group: "admin", label: "Admin Pass Reset", color: "#f0c040" },
};

const MODEL_ICONS = {
  User: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  JobPost: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Application: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Report: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1 1 3 1 3-2 5-2 3 2 5 2 3-1 3-1V3s-1 1-3 1-3-2-5-2-3 2-5 2-3-1-3-1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
};

const ROLE_COLORS = {
  admin: "#00e5cc",
  recruiter: "#a78bfa",
  jobSeeker: "#5b9cf6",
  system: "rgba(140,230,240,0.5)",
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const fmtTime = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const fmtRelative = (d) => {
  if (!d) return "";
  const diff = Math.max(0, Date.now() - new Date(d).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};

export default function AdminAuditLogsPage() {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [activeGroup, setActiveGroup] = useState("all");
  const [filterAction, setFilterAction] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterTargetModel, setFilterTargetModel] = useState("");
  const [filterActorName, setFilterActorName] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [hoveredId, setHoveredId] = useState(null);
  const spotlightRef = useRef(null);
  const listRef = useRef(null);
  const scrollTrackRef = useRef(null);
  const scrollThumbRef = useRef(null);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = { page: p, limit: 25 };
      if (filterAction) params.action = filterAction;
      if (filterRole) params.actorRole = filterRole;
      if (filterTargetModel) params.targetModel = filterTargetModel;
      if (filterActorName) params.actorName = filterActorName;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await adminAPI.getAuditLogs(params);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [filterAction, filterRole, filterTargetModel, filterActorName, dateFrom, dateTo]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") return;
    fetchLogs(1);
  }, [isAuthenticated, user, fetchLogs]);

  useEffect(() => {
    document.body.style.background = "#030303";
    return () => { document.body.style.background = ""; };
  }, []);

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
  }, [logs]);

  const filteredLogs =
    activeGroup === "all"
      ? logs
      : logs.filter((l) => {
          const meta = ACTION_MAP[l.action];
          return meta && meta.group === activeGroup;
        });

  const applyFilters = () => fetchLogs(1);

  const clearFilters = () => {
    setFilterAction("");
    setFilterRole("");
    setFilterTargetModel("");
    setFilterActorName("");
    setDateFrom("");
    setDateTo("");
  };

  const inputStyle = {
    width: "100%",
    padding: "0.55rem 0.75rem",
    borderRadius: "2px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(6,12,24,0.6)",
    color: "#eaf2ff",
    fontSize: "0.78rem",
    fontFamily: "'JetBrains Mono','Fira Code',monospace",
    letterSpacing: "0.03em",
    outline: "none",
    transition: "border-color 0.18s ease, box-shadow 0.18s ease",
  };

  const labelStyle = {
    fontFamily: "'JetBrains Mono','Fira Code',monospace",
    fontSize: "0.6rem",
    fontWeight: 500,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "rgba(234,242,255,0.45)",
    marginBottom: "0.35rem",
    display: "block",
  };

  const groupCount = (key) => {
    if (key === "all") return total;
    return logs.filter((l) => {
      const meta = ACTION_MAP[l.action];
      return meta && meta.group === key;
    }).length;
  };

  return (
    <div
      ref={spotlightRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#030303",
        color: "#eaf2ff",
        fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes auditFadeIn {
          from { opacity: 0; transform: translateY(6px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes auditSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes bellPulse {
          0%, 100% { box-shadow: 0 0 3px rgba(0,229,204,0.3); }
          50% { box-shadow: 0 0 8px rgba(0,229,204,0.6); }
        }
        .audit-input:focus {
          border-color: rgba(0,229,204,0.5) !important;
          box-shadow: 0 0 0 2px rgba(0,229,204,0.15) !important;
        }
        .audit-input::placeholder {
          color: rgba(234,242,255,0.25);
        }
        .audit-log-row {
          animation: auditFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

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
        TOTAL: <strong style={{ color: "#00e5cc" }}>{total}</strong>
        <br />
        PAGE: <strong style={{ color: "#00e5cc" }}>{page}/{pages}</strong>
      </div>

      {/* Main content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "1100px",
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
              ADMIN / SECURITY
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
              AUDIT LOGS
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "0.35rem" }}>
            {total > 0 && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "0.55rem",
                  fontWeight: 700,
                  background: "#00e5cc",
                  color: "#050a14",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "2px",
                  boxShadow: "0 0 6px rgba(0,229,204,0.4)",
                  letterSpacing: "0.06em",
                  animation: "bellPulse 2s ease-in-out infinite",
                }}
              >
                {total} ENTRIES
              </span>
            )}
          </div>
        </div>

        {/* Filters glass panel */}
        <div
          style={{
            background: "rgba(6,12,24,0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,229,204,0.12)",
            borderRadius: "4px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(0,229,204,0.2)",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "0.6rem",
              fontWeight: 500,
              letterSpacing: "0.14em",
              color: "rgba(0,229,204,0.6)",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            FILTERS
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <div>
              <label style={labelStyle}>Action</label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="audit-input"
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  appearance: "none",
                  paddingRight: "1.5rem",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(234,242,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.6rem center",
                }}
              >
                <option value="">All Actions</option>
                {Object.entries(ACTION_MAP).map(([key, meta]) => (
                  <option key={key} value={key}>{key.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Actor Role</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="audit-input"
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  appearance: "none",
                  paddingRight: "1.5rem",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(234,242,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.6rem center",
                }}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="recruiter">Recruiter</option>
                <option value="jobSeeker">Job Seeker</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Model</label>
              <select
                value={filterTargetModel}
                onChange={(e) => setFilterTargetModel(e.target.value)}
                className="audit-input"
                style={{
                  ...inputStyle,
                  cursor: "pointer",
                  appearance: "none",
                  paddingRight: "1.5rem",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(234,242,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.6rem center",
                }}
              >
                <option value="">All Models</option>
                <option value="User">User</option>
                <option value="JobPost">JobPost</option>
                <option value="Application">Application</option>
                <option value="Report">Report</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Actor Name</label>
              <input
                type="text"
                value={filterActorName}
                onChange={(e) => setFilterActorName(e.target.value)}
                placeholder="Search name..."
                className="audit-input"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="audit-input"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="audit-input"
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button
              onClick={applyFilters}
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.68rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.45rem 1rem",
                borderRadius: "2px",
                border: "1px solid rgba(0,229,204,0.3)",
                background: "rgba(0,229,204,0.1)",
                color: "#00e5cc",
                cursor: "pointer",
                transition: "all 0.18s ease",
                boxShadow: "0 0 6px rgba(0,229,204,0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,229,204,0.2)";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(0,229,204,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(0,229,204,0.1)";
                e.currentTarget.style.boxShadow = "0 0 6px rgba(0,229,204,0.1)";
              }}
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.68rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.45rem 0.75rem",
                borderRadius: "2px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: "rgba(234,242,255,0.45)",
                cursor: "pointer",
                transition: "all 0.18s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.color = "rgba(234,242,255,0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "rgba(234,242,255,0.45)";
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Action group tabs */}
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
          {ACTION_GROUPS.map((g) => {
            const isActive = activeGroup === g.key;
            const count = groupCount(g.key);
            return (
              <button
                key={g.key}
                onClick={() => setActiveGroup(g.key)}
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
                  background: isActive ? "rgba(0,229,204,0.1)" : "transparent",
                  color: isActive ? "#00e5cc" : "rgba(234,242,255,0.45)",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  boxShadow: isActive ? "0 0 6px rgba(0,229,204,0.1)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                {g.label}
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

        {/* Log list */}
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
              maxHeight: "calc(100vh - 480px)",
              overflowY: "auto",
              paddingRight: "1rem",
              overscrollBehavior: "contain",
            }}
          >
            {loading ? (
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
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    border: "2px solid rgba(0,229,204,0.2)",
                    borderTopColor: "#00e5cc",
                    borderRadius: "50%",
                    animation: "auditSpin 0.8s linear infinite",
                  }}
                />
                <div
                  style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: "0.68rem",
                    letterSpacing: "0.14em",
                    color: "rgba(234,242,255,0.3)",
                    textTransform: "uppercase",
                  }}
                >
                  LOADING...
                </div>
              </div>
            ) : error ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4rem 0",
                  gap: "0.75rem",
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff003c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div style={{ color: "#ff003c", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  ERROR
                </div>
                <div style={{ color: "rgba(234,242,255,0.3)", fontSize: "0.82rem" }}>
                  {error}
                </div>
              </div>
            ) : filteredLogs.length === 0 ? (
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
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
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
                  NO AUDIT LOGS
                </div>
                <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.2)" }}>
                  No entries match your current filters.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {filteredLogs.map((log, idx) => {
                  const meta = ACTION_MAP[log.action] || { group: "admin", label: log.action, color: "rgba(234,242,255,0.5)" };
                  const modelIcon = MODEL_ICONS[log.targetModel] || MODEL_ICONS.User;
                  const roleColor = ROLE_COLORS[log.actorRole] || ROLE_COLORS.system;
                  const isHovered = hoveredId === log._id;
                  const actorName = log.actor?.name || log.actor?.email || "System";
                  const actorEmail = log.actor?.email || "";

                  return (
                    <div
                      key={log._id}
                      className="audit-log-row"
                      onMouseEnter={() => setHoveredId(log._id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        padding: "0.85rem 1rem",
                        background: isHovered
                          ? "rgba(0,229,204,0.04)"
                          : "rgba(6,12,24,0.4)",
                        borderLeft: `2px solid ${meta.color}`,
                        cursor: "default",
                        transition: "background 0.18s ease, box-shadow 0.18s ease",
                        borderRadius: "2px",
                        boxShadow: isHovered
                          ? `inset 2px 0 0 ${meta.color}40, 0 0 12px rgba(0,229,204,0.04)`
                          : "none",
                        animationDelay: `${idx * 20}ms`,
                      }}
                    >
                      {/* Model icon */}
                      <div
                        style={{
                          flexShrink: 0,
                          width: "32px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "2px",
                          background: `${meta.color}10`,
                          border: `1px solid ${meta.color}20`,
                          color: meta.color,
                          marginTop: "2px",
                        }}
                      >
                        {modelIcon}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            marginBottom: "0.25rem",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono','Fira Code',monospace",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: "#eaf2ff",
                            }}
                          >
                            {actorName}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono','Fira Code',monospace",
                              fontSize: "0.55rem",
                              fontWeight: 500,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              padding: "0.1rem 0.35rem",
                              borderRadius: "2px",
                              background: `${roleColor}15`,
                              border: `1px solid ${roleColor}30`,
                              color: roleColor,
                            }}
                          >
                            {log.actorRole}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono','Fira Code',monospace",
                              fontSize: "0.55rem",
                              fontWeight: 500,
                              letterSpacing: "0.06em",
                              padding: "0.1rem 0.35rem",
                              borderRadius: "2px",
                              background: `${meta.color}15`,
                              border: `1px solid ${meta.color}30`,
                              color: meta.color,
                            }}
                          >
                            {meta.label}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono','Fira Code',monospace",
                              fontSize: "0.55rem",
                              color: "rgba(234,242,255,0.25)",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {log.targetModel}
                          </span>
                        </div>

                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: isHovered ? "#eaf2ff" : "rgba(234,242,255,0.6)",
                            lineHeight: 1.5,
                            transition: "color 0.18s ease",
                          }}
                        >
                          <span style={{ color: meta.color, fontWeight: 500 }}>{log.action.replace(/_/g, " ")}</span>
                          {log.targetModel && log.targetId && (
                            <span style={{ color: "rgba(234,242,255,0.35)" }}>
                              {" "}
                              on {log.targetModel}{" "}
                              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem" }}>
                                {typeof log.targetId === "object" ? log.targetId._id || log.targetId.toString().slice(0, 8) : String(log.targetId).slice(0, 8)}
                              </span>
                            </span>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <span style={{ color: "rgba(234,242,255,0.25)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.68rem" }}>
                              {" "}
                              {log.metadata.from && log.metadata.to
                                ? `(${log.metadata.from} → ${log.metadata.to})`
                                : log.metadata.jobTitle
                                ? `— ${log.metadata.jobTitle}`
                                : log.metadata.title
                                ? `— ${log.metadata.title}`
                                : log.metadata.email
                                ? `— ${log.metadata.email}`
                                : ""}
                            </span>
                          )}
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
                            marginTop: "0.2rem",
                          }}
                        >
                          <span>{fmtDate(log.performedAt)}</span>
                          <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                          <span style={{ color: "rgba(0,229,204,0.5)" }}>{fmtTime(log.performedAt)}</span>
                          <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                          <span style={{ color: "rgba(0,229,204,0.5)" }}>{fmtRelative(log.performedAt)}</span>
                          {log.ipAddress && (
                            <>
                              <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                              <span>IP: {log.ipAddress}</span>
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

        {/* Pagination */}
        {pages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              marginTop: "2rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              onClick={() => fetchLogs(page - 1)}
              disabled={page <= 1}
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.68rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.4rem 0.75rem",
                borderRadius: "2px",
                border: page <= 1
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: page <= 1 ? "rgba(234,242,255,0.15)" : "rgba(234,242,255,0.45)",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                transition: "all 0.18s ease",
              }}
            >
              Prev
            </button>
            <div
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.06em",
                color: "rgba(234,242,255,0.6)",
              }}
            >
              <span style={{ color: "#00e5cc", fontWeight: 600 }}>{page}</span>
              <span style={{ color: "rgba(234,242,255,0.25)" }}> / </span>
              <span>{pages}</span>
            </div>
            <button
              onClick={() => fetchLogs(page + 1)}
              disabled={page >= pages}
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.68rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "0.4rem 0.75rem",
                borderRadius: "2px",
                border: page >= pages
                  ? "1px solid rgba(255,255,255,0.04)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: page >= pages ? "rgba(234,242,255,0.15)" : "rgba(234,242,255,0.45)",
                cursor: page >= pages ? "not-allowed" : "pointer",
                transition: "all 0.18s ease",
              }}
            >
              Next
            </button>
          </div>
        )}

        {/* Bottom divider */}
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
            END.AUDIT_LOGS
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
            FILTERED: {ACTION_GROUPS.find((g) => g.key === activeGroup)?.label || "ALL"}
          </span>
        </div>
      </div>
    </div>
  );
}