import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jobsAPI } from "../services/api";
import PageLoader from "../components/PageLoader";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

const STAGE_COLORS = {
  pending: { color: "#f0c040", bg: "rgba(240,192,64,0.1)", border: "rgba(240,192,64,0.3)" },
  screening: { color: "#5b9cf6", bg: "rgba(91,156,246,0.1)", border: "rgba(91,156,246,0.3)" },
  interview: { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)" },
  offer: { color: "#00e5cc", bg: "rgba(0,229,204,0.1)", border: "rgba(0,229,204,0.3)" },
  contract_sent: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.3)" },
  accepted: { color: "#22d3ee", bg: "rgba(34,211,238,0.1)", border: "rgba(34,211,238,0.3)" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
};

const STATUS_COLORS = {
  pending: { color: "#f0c040", bg: "rgba(240,192,64,0.1)", border: "rgba(240,192,64,0.3)" },
  shortlisted: { color: "#00e5cc", bg: "rgba(0,229,204,0.1)", border: "rgba(0,229,204,0.3)" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
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
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

const StatCard = ({ label, value, sub, accent }) => (
  <div style={{
    background: "rgba(6, 12, 24, 0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(0, 229, 204, 0.12)", borderRadius: "4px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2)",
    padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem",
  }}>
    <span style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)" }}>
      {label}
    </span>
    <span style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: "2rem", fontWeight: 700, color: accent || "#eaf2ff", lineHeight: 1 }}>
      {value}
    </span>
    {sub && <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.06em", color: "rgba(234,242,255,0.3)" }}>{sub}</span>}
  </div>
);

const BarChart = ({ data, maxVal }) => {
  const max = maxVal || Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {data.map((d) => (
        <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(234,242,255,0.45)", width: "90px", textAlign: "right", flexShrink: 0 }}>
            {d.label}
          </span>
          <div style={{ flex: 1, height: "18px", background: "rgba(255,255,255,0.03)", borderRadius: "2px", position: "relative", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${Math.max((d.value / max) * 100, 0)}%`,
              background: d.color || TEAL, borderRadius: "2px",
              transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              minWidth: d.value > 0 ? "2px" : "0",
            }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: "0.68rem", color: d.color || TEAL, width: "30px", textAlign: "right" }}>
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function JobAnalyticsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const spotlightRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [jobRes, appRes] = await Promise.all([
          jobsAPI.getJobById(id),
          jobsAPI.getApplicants(id),
        ]);
        setJob(jobRes.data.job || jobRes.data);
        setApplications(appRes.data.applications || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load job analytics.");
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

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

  const totalApps = applications.length;
  const statusCounts = { pending: 0, shortlisted: 0, rejected: 0 };
  applications.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

  const stageCounts = {};
  applications.forEach((a) => {
    const lastStage = a.stageHistory && a.stageHistory.length > 0 ? a.stageHistory[a.stageHistory.length - 1].stage : "pending";
    stageCounts[lastStage] = (stageCounts[lastStage] || 0) + 1;
  });

  const appsByDate = {};
  applications.forEach((a) => {
    const day = new Date(a.appliedAt || a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    appsByDate[day] = (appsByDate[day] || 0) + 1;
  });
  const chartData = Object.entries(appsByDate).map(([label, value]) => ({ label, value })).reverse();

  const avgMatchScore = applications.length > 0
    ? Math.round(applications.reduce((sum, a) => sum + (a.aiMatchScore || 0), 0) / applications.length)
    : 0;

  const viewCount = job?.viewCount || 0;
  const applicationRate = viewCount > 0 ? ((totalApps / viewCount) * 100).toFixed(1) : "—";

  const glassPanel = {
    background: "rgba(6, 12, 24, 0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(0, 229, 204, 0.12)",
    borderRadius: "4px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2)",
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div ref={spotlightRef} style={{ minHeight: "100vh", background: "#030303", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ ...glassPanel, padding: "2rem", maxWidth: "480px", borderColor: "rgba(239,68,68,0.3)" }}>
          <div style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em", color: "#ef4444", marginBottom: "0.5rem" }}>ERROR</div>
          <p style={{ color: "rgba(234,242,255,0.6)", fontSize: "0.9rem", lineHeight: 1.6 }}>{error}</p>
          <button onClick={() => navigate(-1)} style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "1rem", padding: "0.5rem 1rem", borderRadius: "2px", border: "1px solid rgba(0,229,204,0.3)", background: "rgba(0,229,204,0.05)", color: TEAL, cursor: "pointer" }}>GO BACK</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={spotlightRef} style={{ position: "relative", minHeight: "100vh", background: "#030303", color: "#eaf2ff", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>
      {/* Grain */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.045, pointerEvents: "none", zIndex: 9998, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      {/* Vignette */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)", pointerEvents: "none", zIndex: 9997 }} />
      {/* Spotlight */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(0,229,204,0.03), transparent 60%)", pointerEvents: "none", zIndex: 1 }} />

      {/* HUD */}
      <div style={{ position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 60, pointerEvents: "none", fontFamily: MONO, fontSize: "9px", letterSpacing: "0.14em", color: "rgba(140,230,240,0.38)", textTransform: "uppercase", textAlign: "right" }}>
        ANALYTICS<br />
        VIEWS: <strong style={{ color: TEAL }}>{viewCount}</strong>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: "960px", margin: "0 auto", padding: "100px 1.5rem 4rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <button onClick={() => navigate(-1)} style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.35rem 0.75rem", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(234,242,255,0.4)", cursor: "pointer", marginBottom: "1rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", transition: "all 0.18s ease" }}>
            ← BACK
          </button>
          <div style={{ fontFamily: MONO, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.18em", color: "rgba(0,229,204,0.6)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            RECRUITER
          </div>
          <h1 style={{ fontFamily: "'Syncopate','Inter',system-ui,sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 600, color: "#eaf2ff", letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0 }}>
            JOB ANALYTICS
          </h1>
          {job && (
            <p style={{ fontSize: "0.9rem", color: "rgba(234,242,255,0.45)", lineHeight: 1.7, marginTop: "0.5rem" }}>
              {job.title} <span style={{ color: "rgba(234,242,255,0.3)" }}>at</span> {job.company}
            </p>
          )}
        </div>

        {job && (
          <>
            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "2rem" }}>
              <StatCard label="TOTAL VIEWS" value={viewCount} sub="Page impressions" />
              <StatCard label="APPLICATIONS" value={totalApps} sub="Total received" accent={TEAL} />
              <StatCard label="CONVERSION" value={applicationRate + (applicationRate !== "—" ? "%" : "")} sub="View-to-apply rate" accent={totalApps > 0 ? TEAL : undefined} />
              <StatCard label="AVG MATCH" value={avgMatchScore + (avgMatchScore > 0 ? "%" : "—")} sub="AI match score" accent={avgMatchScore > 70 ? "#4ade80" : avgMatchScore > 40 ? "#f0c040" : undefined} />
              <StatCard label="PENDING" value={statusCounts.pending || 0} sub="Awaiting review" accent="#f0c040" />
              <StatCard label="SHORTLISTED" value={statusCounts.shortlisted || 0} sub="Moved forward" accent="#00e5cc" />
            </div>

            {/* Job details panel */}
            <div style={{ ...glassPanel, padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "1rem" }}>
                JOB DETAILS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
                {[
                  { label: "STATUS", value: job.status, accent: job.status === "open" ? "#4ade80" : "#ef4444" },
                  { label: "TYPE", value: job.type },
                  { label: "WORKPLACE", value: job.workplaceType?.replace("_", "-") },
                  { label: "CATEGORY", value: job.category || "—" },
                  { label: "SLOTS", value: job.totalSlots || 1 },
                  { label: "LOCATION", value: [job.location?.city, job.location?.country].filter(Boolean).join(", ") || "—" },
                  { label: "DEADLINE", value: job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—" },
                  { label: "CREATED", value: new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", marginBottom: "0.25rem" }}>
                      {item.label}
                    </div>
                    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.9rem", color: item.accent || "#eaf2ff", fontWeight: 500 }}>
                      {item.value || "—"}
                    </div>
                  </div>
                ))}
              </div>
              {job.salary && (job.salary.min || job.salary.amount) && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", marginBottom: "0.25rem" }}>SALARY</div>
                  <div style={{ fontFamily: MONO, fontSize: "1rem", color: TEAL }}>
                    {job.salary.min?.toLocaleString()}{job.salary.max ? ` – ${job.salary.max.toLocaleString()}` : ""} {job.salary.currency || ""}{job.salary.period ? ` / ${job.salary.period}` : ""}
                  </div>
                </div>
              )}
              {job.aiCategoryConfidence != null && (
                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", marginBottom: "0.25rem" }}>AI CATEGORY CONFIDENCE</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: `${job.aiCategoryConfidence * 100}%`, height: "100%", background: TEAL, borderRadius: "2px", transition: "width 0.4s ease" }} />
                    </div>
                    <span style={{ fontFamily: MONO, fontSize: "0.72rem", color: TEAL }}>{Math.round(job.aiCategoryConfidence * 100)}%</span>
                  </div>
                </div>
              )}
              {job.perks && job.perks.length > 0 && (
                <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", marginBottom: "0.5rem" }}>PERKS</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                    {job.perks.map((perk) => (
                      <span key={perk} style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.06em", padding: "0.2rem 0.5rem", borderRadius: "2px", border: "1px solid rgba(0,229,204,0.2)", color: "rgba(0,229,204,0.6)", background: "rgba(0,229,204,0.04)" }}>
                        {perk}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Application status breakdown */}
            <div style={{ ...glassPanel, padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "1rem" }}>
                APPLICATION STATUS
              </div>
              <BarChart data={[
                { label: "PENDING", value: statusCounts.pending || 0, color: "#f0c040" },
                { label: "SHORTLISTED", value: statusCounts.shortlisted || 0, color: "#00e5cc" },
                { label: "REJECTED", value: statusCounts.rejected || 0, color: "#ef4444" },
              ]} />
              {totalApps > 0 && (
                <div style={{ marginTop: "1rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  {Object.entries(statusCounts).filter(([, v]) => v > 0).map(([status, count]) => {
                    const pct = ((count / totalApps) * 100).toFixed(1);
                    const sc = STATUS_COLORS[status] || { color: "#eaf2ff" };
                    return (
                      <span key={status} style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.06em", color: sc.color, textTransform: "uppercase" }}>
                        {status}: {count} ({pct}%)
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hiring stage breakdown */}
            {Object.keys(stageCounts).length > 0 && (
              <div style={{ ...glassPanel, padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "1rem" }}>
                  HIRING STAGES
                </div>
                <BarChart data={Object.entries(stageCounts).map(([stage, count]) => ({
                  label: stage.replace("_", " ").toUpperCase().slice(0, 12),
                  value: count,
                  color: (STAGE_COLORS[stage] || { color: "#eaf2ff" }).color,
                }))} />
              </div>
            )}

            {/* Applications over time */}
            {chartData.length > 0 && (
              <div style={{ ...glassPanel, padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "1rem" }}>
                  APPLICATIONS OVER TIME
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "120px", paddingTop: "0.5rem" }}>
                  {chartData.map((d, i) => {
                    const maxVal = Math.max(...chartData.map((c) => c.value), 1);
                    const pct = (d.value / maxVal) * 100;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem", minWidth: 0 }}>
                        <div style={{ fontFamily: MONO, fontSize: "0.55rem", color: TEAL }}>{d.value}</div>
                        <div style={{ width: "100%", height: `${Math.max(pct, 2)}%`, background: `linear-gradient(to top, ${TEAL}, rgba(0,229,204,0.3))`, borderRadius: "2px", minHeight: "2px", transition: "height 0.4s ease" }} />
                        <div style={{ fontFamily: MONO, fontSize: "0.5rem", color: "rgba(234,242,255,0.3)", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden" }}>
                          {d.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent applicants list */}
            {applications.length > 0 && (
              <div style={{ ...glassPanel, padding: "1.25rem", marginBottom: "1.5rem" }}>
                <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "1rem" }}>
                  RECENT APPLICANTS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {applications.slice(0, 10).map((app) => {
                    const sc = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
                    return (
                      <div
                        key={app._id}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem",
                          padding: "0.7rem 0.85rem", borderLeft: `2px solid ${sc.border}`,
                          background: "transparent", borderRadius: "2px",
                          transition: "background 0.18s ease",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,229,204,0.03)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                          <div style={{
                            width: "28px", height: "28px", borderRadius: "2px",
                            background: "rgba(0,229,204,0.08)", border: "1px solid rgba(0,229,204,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,229,204,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.85rem", fontWeight: 500, color: "#eaf2ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {app.user?.name || "Applicant"}
                            </div>
                            {app.aiMatchScore != null && (
                              <div style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.06em", color: "rgba(234,242,255,0.3)" }}>
                                MATCH: {Math.round(app.aiMatchScore)}%
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                          <span style={{ fontFamily: MONO, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "0.15rem 0.4rem", borderRadius: "2px", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                            {app.status}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: "0.55rem", color: "rgba(234,242,255,0.25)" }}>
                            {relativeTime(app.appliedAt || app.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {applications.length > 10 && (
                  <div style={{ marginTop: "0.75rem", fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.06em", color: "rgba(234,242,255,0.3)", textAlign: "center" }}>
                    SHOWING 10 OF {applications.length} APPLICANTS
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Bottom divider */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            END.ANALYTICS
          </span>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            ID: <strong style={{ color: "rgba(140,230,240,0.38)" }}>{id?.slice(-8)}</strong>
          </span>
        </div>
      </div>

      <style>{`@keyframes jaSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
