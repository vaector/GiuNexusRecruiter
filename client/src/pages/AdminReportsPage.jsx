import { useState, useEffect, useRef, useCallback } from "react";
import { reportsAPI } from "../services/api";
import PageLoader from "../components/PageLoader";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

const STATUS_TABS = [
  { key: "all", label: "ALL" },
  { key: "open", label: "OPEN" },
  { key: "reviewed", label: "REVIEWED" },
  { key: "dismissed", label: "DISMISSED" },
  { key: "actioned", label: "ACTIONED" },
];

const TARGET_TABS = [
  { key: "", label: "ALL TYPES" },
  { key: "JobPost", label: "JOBS" },
  { key: "User", label: "USERS" },
];

const REASON_LABELS = {
  spam: "Spam",
  misleading: "Misleading",
  inappropriate: "Inappropriate",
  fake_company: "Fake Company",
  harassment: "Harassment",
  other: "Other",
};

const STATUS_COLORS = {
  open: { color: "#f0c040", bg: "rgba(240,192,64,0.1)", border: "rgba(240,192,64,0.3)" },
  reviewed: { color: "#5b9cf6", bg: "rgba(91,156,246,0.1)", border: "rgba(91,156,246,0.3)" },
  dismissed: { color: "rgba(234,242,255,0.3)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" },
  actioned: { color: "#00e5cc", bg: "rgba(0,229,204,0.1)", border: "rgba(0,229,204,0.3)" },
};

const relativeTime = (d) => {
  if (!d) return "";
  const diff = Math.max(0, Date.now() - new Date(d).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
};

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [reviewingId, setReviewingId] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [reviewError, setReviewError] = useState("");
  const spotlightRef = useRef(null);

  const fetchReports = useCallback(async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const params = { page: p, limit: 20 };
      if (statusFilter !== "all") params.status = statusFilter;
      if (targetFilter) params.targetModel = targetFilter;
      const res = await reportsAPI.getReports(params);
      setReports(res.data.reports || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
      setPage(p);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, targetFilter]);

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

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

  const handleReview = async (id, status) => {
    setReviewingId(id);
    setReviewError("");
    try {
      await reportsAPI.reviewReport(id, { status, adminNote: adminNote.trim() || undefined });
      setAdminNote("");
      await fetchReports(page);
    } catch (err) {
      setReviewError(err.response?.data?.message || "Failed to update report.");
    } finally {
      setReviewingId(null);
    }
  };

  const openCount = reports.filter((r) => r.status === "open").length;

  const glassPanel = {
    background: "rgba(6, 12, 24, 0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(0, 229, 204, 0.12)",
    borderRadius: "4px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2)",
  };

  return (
    <div
      ref={spotlightRef}
      style={{ position: "relative", minHeight: "100vh", background: "#030303", color: "#eaf2ff", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}
    >
      {/* Grain */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.045, pointerEvents: "none", zIndex: 9998, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      {/* Vignette */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)", pointerEvents: "none", zIndex: 9997 }} />
      {/* Spotlight */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(0,229,204,0.03), transparent 60%)", pointerEvents: "none", zIndex: 1 }} />

      {/* HUD */}
      <div style={{ position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 60, pointerEvents: "none", fontFamily: MONO, fontSize: "9px", letterSpacing: "0.14em", color: "rgba(140,230,240,0.38)", textTransform: "uppercase", textAlign: "right" }}>
        OPEN: <strong style={{ color: openCount > 0 ? "#f0c040" : "rgba(140,230,240,0.38)" }}>{openCount}</strong>
        <br />
        TOTAL: <strong style={{ color: TEAL }}>{total}</strong>
      </div>

      {/* Main content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: "960px", margin: "0 auto", padding: "100px 1.5rem 4rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.18em", color: "rgba(0,229,204,0.6)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              ADMIN
            </div>
            <h1 style={{ fontFamily: "'Syncopate','Inter',system-ui,sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 600, color: "#eaf2ff", letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0 }}>
              REPORTS
            </h1>
            <p style={{ fontSize: "0.9rem", color: "rgba(234,242,255,0.45)", lineHeight: 1.7, marginTop: "0.5rem" }}>
              Review and manage user-submitted reports. Dismiss or action reports.
            </p>
          </div>
          {openCount > 0 && (
            <span style={{
              fontFamily: MONO, fontSize: "0.55rem", fontWeight: 700,
              background: "#f0c040", color: "#050a14",
              padding: "0.2rem 0.55rem", borderRadius: "2px",
              boxShadow: "0 0 6px rgba(240,192,64,0.4)", letterSpacing: "0.06em",
            }}>
              {openCount} OPEN
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                style={{
                  fontFamily: MONO, fontSize: "0.68rem", fontWeight: isActive ? 600 : 400, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "0.4rem 0.75rem", borderRadius: "2px",
                  border: isActive ? "1px solid rgba(0,229,204,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  background: isActive ? "rgba(0,229,204,0.1)" : "transparent",
                  color: isActive ? TEAL : "rgba(234,242,255,0.45)",
                  cursor: "pointer", transition: "all 0.18s ease",
                  boxShadow: isActive ? "0 0 6px rgba(0,229,204,0.1)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
          <span style={{ width: "1px", background: "rgba(255,255,255,0.06)", margin: "0 0.25rem" }} />
          {TARGET_TABS.map((tab) => {
            const isActive = targetFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setTargetFilter(tab.key)}
                style={{
                  fontFamily: MONO, fontSize: "0.68rem", fontWeight: isActive ? 600 : 400, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "0.4rem 0.75rem", borderRadius: "2px",
                  border: isActive ? "1px solid rgba(0,229,204,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  background: isActive ? "rgba(0,229,204,0.1)" : "transparent",
                  color: isActive ? TEAL : "rgba(234,242,255,0.45)",
                  cursor: "pointer", transition: "all 0.18s ease",
                  boxShadow: isActive ? "0 0 6px rgba(0,229,204,0.1)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div role="alert" aria-live="assertive" style={{ ...glassPanel, padding: "0.85rem 1rem", marginBottom: "1rem", borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em" }}>
            {error}
          </div>
        )}

        {reviewError && (
          <div role="alert" style={{ ...glassPanel, padding: "0.85rem 1rem", marginBottom: "1rem", borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em" }}>
            {reviewError}
          </div>
        )}

        {/* Loading */}
        {loading ? <PageLoader /> : reports.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", gap: "1rem" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1 1 3 1 3-2 5-2 3 2 5 2 3-1 3-1V3s-1 1-3 1-3-2-5-2-3 2-5 2-3-1-3-1z" /><line x1="4" y1="22" x2="4" y2="15" />
            </svg>
            <div style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(234,242,255,0.3)", textTransform: "uppercase" }}>
              NO REPORTS
            </div>
            <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.2)" }}>
              {statusFilter !== "all" ? "No reports match the current filter." : "All clear. No reports have been submitted yet."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {reports.map((r) => {
              const isHovered = hoveredId === r._id;
              const sc = STATUS_COLORS[r.status] || STATUS_COLORS.open;
              const isOpen = r.status === "open";
              const isReviewing = reviewingId === r._id;
              return (
                <div
                  key={r._id}
                  onMouseEnter={() => setHoveredId(r._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    ...glassPanel,
                    padding: "1rem 1.25rem",
                    background: isHovered ? "rgba(0,229,204,0.04)" : "rgba(6, 12, 24, 0.92)",
                    borderLeft: `2px solid ${sc.border}`,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    transition: "background 0.18s ease, box-shadow 0.18s ease",
                    boxShadow: isHovered ? `inset 2px 0 0 ${sc.border}` : "none",
                  }}
                >
                  {/* Top row: type icon, reporter info, status badge, time */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "2px",
                        background: `${sc.color}10`, border: `1px solid ${sc.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: sc.color, flexShrink: 0,
                      }}>
                        {r.targetModel === "JobPost" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "#eaf2ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {r.reporter?.name || "Unknown"}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0.1rem 0.3rem", borderRadius: "2px", background: r.reporter?.role === "admin" ? "rgba(0,229,204,0.1)" : "rgba(91,156,246,0.1)", color: r.reporter?.role === "admin" ? TEAL : "#5b9cf6", border: `1px solid ${r.reporter?.role === "admin" ? "rgba(0,229,204,0.2)" : "rgba(91,156,246,0.2)"}` }}>
                            {r.reporter?.role || "user"}
                          </span>
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.03em", color: "rgba(234,242,255,0.3)" }}>
                          {r.reporter?.email}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <span style={{
                        fontFamily: MONO, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                        padding: "0.15rem 0.4rem", borderRadius: "2px",
                        color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
                      }}>
                        {r.status}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.03em", color: "rgba(234,242,255,0.3)" }}>
                        {relativeTime(r.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Target + reason */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(0,229,204,0.6)" }}>
                      {r.targetModel === "JobPost" ? "JOB" : "USER"}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: "rgba(234,242,255,0.3)" }}>·</span>
                    <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: "rgba(234,242,255,0.4)", wordBreak: "break-all" }}>
                      {r.targetId}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: "0.6rem", color: "rgba(234,242,255,0.3)" }}>·</span>
                    <span style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.05em", padding: "0.1rem 0.4rem", borderRadius: "2px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(234,242,255,0.6)", textTransform: "uppercase" }}>
                      {REASON_LABELS[r.reason] || r.reason}
                    </span>
                  </div>

                  {/* Details */}
                  {r.details && (
                    <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.45)", lineHeight: 1.5, fontStyle: "italic", paddingLeft: "0.5rem", borderLeft: "2px solid rgba(255,255,255,0.06)" }}>
                      &ldquo;{r.details}&rdquo;
                    </div>
                  )}

                  {/* Reviewed info */}
                  {r.status !== "open" && r.reviewedBy && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.03em", color: "rgba(234,242,255,0.3)" }}>
                      <span>Reviewed by {r.reviewedBy?.name || "admin"}</span>
                      {r.reviewedAt && (
                        <>
                          <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                          <span style={{ color: "rgba(0,229,204,0.5)" }}>{formatDate(r.reviewedAt)}</span>
                        </>
                      )}
                      {r.adminNote && (
                        <>
                          <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                          <span style={{ color: "rgba(234,242,255,0.5)" }}>Note: {r.adminNote}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions for open reports */}
                  {isOpen && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem", marginTop: "0.15rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <input
                          type="text"
                          placeholder="Admin note (optional)"
                          value={isReviewing ? adminNote : ""}
                          onChange={(e) => setAdminNote(e.target.value)}
                          disabled={!isReviewing}
                          style={{
                            flex: 1, minWidth: "180px",
                            background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px",
                            color: "#eaf2ff", fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.82rem",
                            padding: "0.4rem 0.65rem", outline: "none", transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = "rgba(0,229,204,0.5)"; e.target.style.boxShadow = "0 0 8px rgba(0,229,204,0.25)"; }}
                          onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                        />
                        <button
                          onClick={() => handleReview(r._id, "actioned")}
                          disabled={reviewingId === r._id}
                          style={{
                            fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
                            padding: "0.35rem 0.65rem", borderRadius: "2px",
                            border: "1px solid rgba(0,229,204,0.4)", background: "rgba(0,229,204,0.08)",
                            color: TEAL, cursor: reviewingId === r._id ? "wait" : "pointer",
                            transition: "all 0.18s ease",
                          }}
                        >
                          {reviewingId === r._id ? "..." : "ACTION"}
                        </button>
                        <button
                          onClick={() => handleReview(r._id, "dismissed")}
                          disabled={reviewingId === r._id}
                          style={{
                            fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
                            padding: "0.35rem 0.65rem", borderRadius: "2px",
                            border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)",
                            color: "#ef4444", cursor: reviewingId === r._id ? "wait" : "pointer",
                            transition: "all 0.18s ease",
                          }}
                        >
                          {reviewingId === r._id ? "..." : "DISMISS"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1.5rem", marginTop: "2rem" }}>
            <button
              onClick={() => { const p = Math.max(1, page - 1); fetchReports(p); }}
              disabled={page === 1}
              style={{
                background: "transparent", border: `1px solid ${page === 1 ? "rgba(255,255,255,0.1)" : "rgba(0,229,204,0.4)"}`,
                color: page === 1 ? "rgba(255,255,255,0.2)" : TEAL,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
                padding: "0.6rem 1.25rem", cursor: page === 1 ? "not-allowed" : "pointer", transition: "all 0.2s",
              }}
            >
              PREV
            </button>
            <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "2px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              PAGE <strong style={{ color: TEAL }}>{page}</strong> / {pages}
            </span>
            <button
              onClick={() => { const p = Math.min(pages, page + 1); fetchReports(p); }}
              disabled={page >= pages}
              style={{
                background: "transparent", border: `1px solid ${page >= pages ? "rgba(255,255,255,0.1)" : "rgba(0,229,204,0.4)"}`,
                color: page >= pages ? "rgba(255,255,255,0.2)" : TEAL,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase",
                padding: "0.6rem 1.25rem", cursor: page >= pages ? "not-allowed" : "pointer", transition: "all 0.2s",
              }}
            >
              NEXT
            </button>
          </div>
        )}

        {/* Bottom divider */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            END.REPORTS
          </span>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            FILTER: <strong style={{ color: TEAL }}>{statusFilter.toUpperCase()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}