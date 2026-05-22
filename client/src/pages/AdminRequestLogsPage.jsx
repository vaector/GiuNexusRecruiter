import React, { useState, useEffect, useRef, useCallback } from "react";
import { adminAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import PageLoader from "../components/PageLoader";

const STATUS_COLORS = {
  2: "#00e5cc",
  3: "#5b9cf6",
  4: "#f0c040",
  5: "#ff003c",
};

const METHOD_COLORS = {
  GET: "#00e5cc",
  POST: "#a78bfa",
  PUT: "#5b9cf6",
  PATCH: "#f0c040",
  DELETE: "#ff003c",
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

const getStatusColor = (code) => {
  const group = Math.floor(code / 100);
  return STATUS_COLORS[group] || "rgba(234,242,255,0.5)";
};

const getMethodColor = (method) => METHOD_COLORS[method] || "rgba(234,242,255,0.5)";

const formatMs = (ms) => {
  if (ms < 100) return `${ms}ms`;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

const StatCard = ({ label, value, sub, color, icon }) => (
  <div
    style={{
      background: "rgba(6,12,24,0.92)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(0,229,204,0.12)",
      borderRadius: "4px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(0,229,204,0.2)",
      padding: "1rem 1.25rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: `linear-gradient(90deg, ${color}, transparent)`,
      }}
    />
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {icon && <span style={{ color, opacity: 0.7 }}>{icon}</span>}
      <span
        style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: "0.6rem",
          fontWeight: 500,
          letterSpacing: "0.14em",
          color: "rgba(234,242,255,0.45)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </div>
    <div
      style={{
        fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: "1.8rem",
        fontWeight: 600,
        color: color,
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: "0.6rem",
          letterSpacing: "0.04em",
          color: "rgba(234,242,255,0.3)",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

const BarRow = ({ label, value, max, color, suffix }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
      <span
        style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: "0.68rem",
          fontWeight: 600,
          color,
          minWidth: "60px",
          textAlign: "right",
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
        <div
          style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "3px", transition: "width 0.4s ease" }}
        />
      </div>
      <span
        style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: "0.65rem",
          color: "rgba(234,242,255,0.55)",
          minWidth: "50px",
          textAlign: "right",
        }}
      >
        {suffix ? `${value}${suffix}` : value}
      </span>
    </div>
  );
};

export default function AdminRequestLogsPage() {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterRoute, setFilterRoute] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [filterStatusCode, setFilterStatusCode] = useState("");
  const [filterIsError, setFilterIsError] = useState("");
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
      if (filterRoute) params.route = filterRoute;
      if (filterMethod) params.method = filterMethod;
      if (filterStatusCode) params.statusCode = filterStatusCode;
      if (filterIsError) params.isError = filterIsError;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await adminAPI.getRequestLogs(params);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load request logs");
    } finally {
      setLoading(false);
    }
  }, [filterRoute, filterMethod, filterStatusCode, filterIsError, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await adminAPI.getRequestLogStats(params);
      setStats(res.data.stats || null);
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") return;
    fetchLogs(1);
    fetchStats();
  }, [isAuthenticated, user, fetchLogs, fetchStats]);

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

  const applyFilters = () => {
    fetchLogs(1);
    fetchStats();
  };

  const clearFilters = () => {
    setFilterRoute("");
    setFilterMethod("");
    setFilterStatusCode("");
    setFilterIsError("");
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

  const selectStyle = {
    ...inputStyle,
    cursor: "pointer",
    appearance: "none",
    paddingRight: "1.5rem",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(234,242,255,0.4)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.6rem center",
  };

  const maxMethodCount = stats?.byMethod?.length ? Math.max(...stats.byMethod.map((m) => m.count)) : 0;
  const maxStatusCount = stats?.byStatusCode?.length ? Math.max(...stats.byStatusCode.map((m) => m.count)) : 0;

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
        .rl-input:focus {
          border-color: rgba(0,229,204,0.5) !important;
          box-shadow: 0 0 0 2px rgba(0,229,204,0.15) !important;
        }
        .rl-input::placeholder {
          color: rgba(234,242,255,0.25);
        }
        .rl-log-row {
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
              ADMIN / SYSTEM
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
              REQUEST LOGS
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
            {stats?.aiCallCount > 0 && (
              <span
                style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "0.55rem",
                  fontWeight: 600,
                  background: "rgba(167,139,250,0.15)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  color: "#a78bfa",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "2px",
                  letterSpacing: "0.06em",
                }}
              >
                {stats.aiCallCount} AI CALLS
              </span>
            )}
          </div>
        </div>

        {/* Stats cards */}
        {stats && !statsLoading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <StatCard
              label="Total Requests"
              value={total.toLocaleString()}
              color="#00e5cc"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              }
            />
            <StatCard
              label="AI Service Calls"
              value={stats.aiCallCount?.toLocaleString() || "0"}
              color="#a78bfa"
              sub={total > 0 ? `${((stats.aiCallCount / total) * 100).toFixed(1)}% of total` : ""}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              }
            />
            <StatCard
              label="Avg Response"
              value={stats.slowestRoutes?.length > 0 ? formatMs(Math.round(stats.slowestRoutes.reduce((s, r) => s + r.avgResponseTime, 0) / stats.slowestRoutes.length)) : "-"}
              color="#5b9cf6"
              sub="across top routes"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
            />
            <StatCard
              label="Error Rate"
              value={stats.errorRates?.length > 0 ? `${(stats.errorRates.reduce((s, r) => s + r.errors, 0) / Math.max(stats.errorRates.reduce((s, r) => s + r.total, 0), 1) * 100).toFixed(1)}%` : "0%"}
              color="#ff003c"
              sub="across top routes"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
            />
          </div>
        )}

        {/* Stats detail panels */}
        {stats && !statsLoading && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Methods breakdown */}
            <div
              style={{
                background: "rgba(6,12,24,0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(0,229,204,0.12)",
                borderRadius: "4px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(0,229,204,0.2)",
                padding: "1.25rem",
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
                METHODS
              </div>
              {stats.byMethod?.map((m) => (
                <BarRow
                  key={m._id}
                  label={m._id}
                  value={m.count}
                  max={maxMethodCount}
                  color={getMethodColor(m._id)}
                />
              ))}
              {(!stats.byMethod || stats.byMethod.length === 0) && (
                <div style={{ color: "rgba(234,242,255,0.25)", fontSize: "0.75rem" }}>No data</div>
              )}
            </div>

            {/* Status codes breakdown */}
            <div
              style={{
                background: "rgba(6,12,24,0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(0,229,204,0.12)",
                borderRadius: "4px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(0,229,204,0.2)",
                padding: "1.25rem",
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
                STATUS CODES
              </div>
              {stats.byStatusCode?.map((m) => (
                <BarRow
                  key={m._id}
                  label={m._id}
                  value={m.count}
                  max={maxStatusCount}
                  color={getStatusColor(m._id)}
                />
              ))}
              {(!stats.byStatusCode || stats.byStatusCode.length === 0) && (
                <div style={{ color: "rgba(234,242,255,0.25)", fontSize: "0.75rem" }}>No data</div>
              )}
            </div>

            {/* Slowest routes */}
            <div
              style={{
                background: "rgba(6,12,24,0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(0,229,204,0.12)",
                borderRadius: "4px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(0,229,204,0.2)",
                padding: "1.25rem",
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
                SLOWEST ROUTES
              </div>
              {stats.slowestRoutes?.map((r) => {
                const maxTime = stats.slowestRoutes[0]?.avgResponseTime || 1;
                const pct = (r.avgResponseTime / maxTime) * 100;
                const timerColor = r.avgResponseTime > 1000 ? "#ff003c" : r.avgResponseTime > 500 ? "#f0c040" : "#00e5cc";
                return (
                  <div
                    key={r._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                        fontSize: "0.68rem",
                        color: "rgba(234,242,255,0.6)",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: "1 1 0",
                        direction: "rtl",
                        textAlign: "left",
                      }}
                      title={r._id}
                    >
                      {r._id}
                    </span>
                    <div style={{ flex: "1 1 0", height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: timerColor, borderRadius: "3px", transition: "width 0.4s ease" }} />
                    </div>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                        fontSize: "0.65rem",
                        color: timerColor,
                        fontWeight: 600,
                        minWidth: "55px",
                        textAlign: "right",
                      }}
                    >
                      {formatMs(Math.round(r.avgResponseTime))}
                    </span>
                  </div>
                );
              })}
              {(!stats.slowestRoutes || stats.slowestRoutes.length === 0) && (
                <div style={{ color: "rgba(234,242,255,0.25)", fontSize: "0.75rem" }}>No data</div>
              )}
            </div>

            {/* Error rates */}
            <div
              style={{
                background: "rgba(6,12,24,0.92)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(0,229,204,0.12)",
                borderRadius: "4px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(0,229,204,0.2)",
                padding: "1.25rem",
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
                ERROR RATES (TOP 10)
              </div>
              {stats.errorRates?.map((r) => {
                const pct = r.total > 0 ? (r.errorRate * 100) : 0;
                const errColor = pct > 20 ? "#ff003c" : pct > 5 ? "#f0c040" : "#00e5cc";
                return (
                  <div
                    key={r._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                        fontSize: "0.68rem",
                        color: "rgba(234,242,255,0.6)",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: "1 1 0",
                        direction: "rtl",
                        textAlign: "left",
                      }}
                      title={r._id}
                    >
                      {r._id}
                    </span>
                    <div style={{ flex: "1 1 0", height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: errColor, borderRadius: "3px", transition: "width 0.4s ease" }} />
                    </div>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono','Fira Code',monospace",
                        fontSize: "0.65rem",
                        color: errColor,
                        fontWeight: 600,
                        minWidth: "55px",
                        textAlign: "right",
                      }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
              {(!stats.errorRates || stats.errorRates.length === 0) && (
                <div style={{ color: "rgba(234,242,255,0.25)", fontSize: "0.75rem" }}>No data</div>
              )}
            </div>
          </div>
        )}

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
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <div>
              <label style={labelStyle}>Route</label>
              <input
                type="text"
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
                placeholder="/api/v1/..."
                className="rl-input"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Method</label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="rl-input"
                style={selectStyle}
              >
                <option value="">All Methods</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status Code</label>
              <select
                value={filterStatusCode}
                onChange={(e) => setFilterStatusCode(e.target.value)}
                className="rl-input"
                style={selectStyle}
              >
                <option value="">All Status</option>
                <option value="200">200 OK</option>
                <option value="201">201 Created</option>
                <option value="301">301 Redirect</option>
                <option value="400">400 Bad Request</option>
                <option value="401">401 Unauthorized</option>
                <option value="403">403 Forbidden</option>
                <option value="404">404 Not Found</option>
                <option value="500">500 Server Error</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Errors Only</label>
              <select
                value={filterIsError}
                onChange={(e) => setFilterIsError(e.target.value)}
                className="rl-input"
                style={selectStyle}
              >
                <option value="">All Requests</option>
                <option value="true">Errors Only</option>
                <option value="false">Success Only</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rl-input"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rl-input"
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
            {loading ? <PageLoader /> : error ? (
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
            ) : logs.length === 0 ? (
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
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
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
                  NO REQUEST LOGS
                </div>
                <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.2)" }}>
                  No entries match your current filters.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {logs.map((log, idx) => {
                  const statusColor = getStatusColor(log.statusCode);
                  const methodColor = getMethodColor(log.method);
                  const isHovered = hoveredId === log._id;
                  const actorName = log.user?.name || log.user?.email || log.userRole || "Anonymous";

                  return (
                    <div
                      key={log._id}
                      className="rl-log-row"
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
                        borderLeft: log.isError ? `2px solid #ff003c` : `2px solid ${statusColor}`,
                        cursor: "default",
                        transition: "background 0.18s ease, box-shadow 0.18s ease",
                        borderRadius: "2px",
                        boxShadow: isHovered
                          ? `inset 2px 0 0 ${statusColor}40, 0 0 12px rgba(0,229,204,0.04)`
                          : "none",
                        animationDelay: `${idx * 20}ms`,
                      }}
                    >
                      {/* Method badge */}
                      <div
                        style={{
                          flexShrink: 0,
                          width: "48px",
                          height: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "2px",
                          background: `${methodColor}10`,
                          border: `1px solid ${methodColor}30`,
                          color: methodColor,
                          fontFamily: "'JetBrains Mono','Fira Code',monospace",
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          marginTop: "2px",
                        }}
                      >
                        {log.method}
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
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "300px",
                            }}
                            title={log.route}
                          >
                            {log.route}
                          </span>
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono','Fira Code',monospace",
                              fontSize: "0.55rem",
                              fontWeight: 600,
                              letterSpacing: "0.06em",
                              padding: "0.1rem 0.35rem",
                              borderRadius: "2px",
                              background: `${statusColor}15`,
                              border: `1px solid ${statusColor}30`,
                              color: statusColor,
                            }}
                          >
                            {log.statusCode}
                          </span>
                          {log.isError && (
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                                fontSize: "0.55rem",
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                                padding: "0.1rem 0.35rem",
                                borderRadius: "2px",
                                background: "rgba(255,0,60,0.15)",
                                border: "1px solid rgba(255,0,60,0.3)",
                                color: "#ff003c",
                              }}
                            >
                              ERROR
                            </span>
                          )}
                          {log.aiServiceCalled && (
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                                fontSize: "0.55rem",
                                fontWeight: 600,
                                letterSpacing: "0.06em",
                                padding: "0.1rem 0.35rem",
                                borderRadius: "2px",
                                background: "rgba(167,139,250,0.15)",
                                border: "1px solid rgba(167,139,250,0.3)",
                                color: "#a78bfa",
                              }}
                            >
                              AI
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: isHovered ? "#eaf2ff" : "rgba(234,242,255,0.6)",
                            lineHeight: 1.5,
                            transition: "color 0.18s ease",
                          }}
                        >
                          {log.url && (
                            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem", color: "rgba(234,242,255,0.35)", wordBreak: "break-all" }}>
                              {log.url}
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
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{fmtDate(log.performedAt)}</span>
                          <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                          <span style={{ color: "rgba(0,229,204,0.5)" }}>{fmtTime(log.performedAt)}</span>
                          <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                          <span style={{ color: "rgba(0,229,204,0.5)" }}>{fmtRelative(log.performedAt)}</span>
                          <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                          <span style={{ color: log.responseTimeMs > 1000 ? "#ff003c" : log.responseTimeMs > 500 ? "#f0c040" : "rgba(0,229,204,0.5)" }}>
                            {formatMs(log.responseTimeMs)}
                          </span>
                          {log.mongoQueryCount > 0 && (
                            <>
                              <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                              <span>{log.mongoQueryCount} queries</span>
                            </>
                          )}
                          {log.ipAddress && (
                            <>
                              <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                              <span>IP: {log.ipAddress}</span>
                            </>
                          )}
                          {log.userRole && (
                            <>
                              <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                              <span style={{
                                color: log.userRole === "admin" ? "#00e5cc" : log.userRole === "recruiter" ? "#a78bfa" : "#5b9cf6",
                              }}>
                                {log.userRole}
                              </span>
                            </>
                          )}
                          <span style={{ color: "rgba(234,242,255,0.25)" }}>·</span>
                          <span style={{ color: "rgba(234,242,255,0.35)" }}>{actorName}</span>
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
            END.REQUEST_LOGS
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
            ENTRIES: {total}
          </span>
        </div>
      </div>
    </div>
  );
}