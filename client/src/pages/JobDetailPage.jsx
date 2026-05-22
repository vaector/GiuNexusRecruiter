import { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Lenis from "lenis";
import { AuthContext } from "../context/AuthContext";
import { jobsAPI, reportsAPI } from "../services/api";
import FluidBackground from "../components/FluidBackground";
import GooeyCursor from "../components/GooeyCursor";
import SaveJobButton from "../components/SaveJobButton";
import { CATEGORY_COLORS } from "../components/JobCard";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

function CornerFrame({ style }) {
  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        border: "1px solid rgba(0,229,204,0.3)",
        maskImage:
          "linear-gradient(#fff,#fff) top left,linear-gradient(#fff,#fff) top right,linear-gradient(#fff,#fff) bottom left,linear-gradient(#fff,#fff) bottom right",
        maskSize: "40px 40px",
        maskRepeat: "no-repeat",
        maskPosition: "top left,top right,bottom left,bottom right",
        WebkitMaskImage:
          "linear-gradient(#fff,#fff),linear-gradient(#fff,#fff),linear-gradient(#fff,#fff),linear-gradient(#fff,#fff)",
        WebkitMaskSize: "40px 40px",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "top left,top right,bottom left,bottom right",
        ...style,
      }}
    />
  );
}

function FadeSection({ children, delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: 0,
        transform: "translateY(32px)",
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Section({ label, num, children }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: TEAL, textTransform: "uppercase" }}>
          [{num}] {label}
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(0,229,204,0.15)" }} />
      </div>
      {children}
    </div>
  );
}

function MetaRow({ label, value, color }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "0.75rem",
    }}>
      <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "2px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "1px", color: color || "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>
        {value}
      </span>
    </div>
  );
}

function getDeadlineLabel(deadline) {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline) - new Date()) / 86400000);
  if (days < 0) return { text: "DEADLINE PASSED", color: "#ef4444" };
  if (days === 0) return { text: "LAST DAY", color: "#f97316" };
  if (days <= 7) return { text: `${days}D REMAINING`, color: "#f97316" };
  return { text: `${days}D REMAINING`, color: TEAL };
}

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const isJobSeeker = isAuthenticated && user?.role === "jobSeeker";

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);

  const heroRef = useRef(null);
  const scrollbarRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const pctRef = useRef(null);

  useEffect(() => {
    jobsAPI.getJobById(id)
      .then(res => setJob(res.data.job))
      .catch(err => setError(err.response?.data?.message || "Failed to load job"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (typeof history !== "undefined") history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
    let raf;
    const tick = (time) => {
      lenis.raf(time);
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const totalH = document.documentElement.scrollHeight - vh;
      const pct = totalH > 0 ? scrollY / totalH : 0;
      if (pctRef.current) pctRef.current.textContent = (pct * 100).toFixed(1) + "%";
      if (scrollbarRef.current && scrollbarTrackRef.current) {
        const trackH = scrollbarTrackRef.current.offsetHeight - scrollbarRef.current.offsetHeight;
        scrollbarRef.current.style.transform = `translateY(${pct * Math.max(trackH, 0)}px)`;
        scrollbarTrackRef.current.style.opacity = pct > 0.005 ? "1" : "0";
      }
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
        heroRef.current.style.opacity = String(Math.max(0, 1 - scrollY / (vh * 0.8)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { lenis.destroy(); cancelAnimationFrame(raf); };
  }, []);

  const handleApply = async () => {
    setApplying(true);
    setApplyError(null);
    try {
      await jobsAPI.applyToJob(id, { coverLetter });
      setApplied(true);
      setApplyOpen(false);
    } catch (err) {
      setApplyError(err.response?.data?.message || "Application failed");
    } finally {
      setApplying(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReporting(true);
    try {
      await reportsAPI.createReport({ targetModel: "Job", targetId: id, reason: reportReason });
      setReportOpen(false);
      setReportReason("");
    } catch (err) {
      console.error("Report failed:", err);
    } finally {
      setReporting(false);
    }
  };

  if (loading) {
    return (
      <>
        <FluidBackground />
        <GooeyCursor />
        <div style={{
          minHeight: "100vh", background: "#030303",
          display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1.25rem",
        }}>
          <div style={{
            width: "40px", height: "40px",
            border: "2px solid rgba(0,229,204,0.15)",
            borderTop: `2px solid ${TEAL}`,
            borderRadius: "50%", animation: "spin 0.8s linear infinite",
          }} />
          <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: "rgba(0,229,204,0.5)", textTransform: "uppercase" }}>
            LOADING JOB DATA
          </span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } body { background: #000 !important; }`}</style>
      </>
    );
  }

  if (error || !job) {
    return (
      <>
        <FluidBackground />
        <GooeyCursor />
        <div style={{ minHeight: "100vh", background: "#030303", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: "#ef4444", marginBottom: "1.5rem", textTransform: "uppercase" }}>
              ERROR // {error || "JOB NOT FOUND"}
            </p>
            <button onClick={() => navigate("/jobs")} style={{
              background: "transparent", border: `1px solid ${TEAL}`, color: TEAL,
              padding: "0.75rem 2rem", fontFamily: MONO, fontSize: "11px",
              letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer",
            }}>
              RETURN TO LISTINGS
            </button>
          </div>
        </div>
        <style>{`body { background: #000 !important; }`}</style>
      </>
    );
  }

  const deadline = getDeadlineLabel(job.applicationDeadline);

  return (
    <>
      <FluidBackground />
      <GooeyCursor />

      {/* ── HERO ── */}
      <section style={{ height: "100vh", position: "relative", background: "rgba(3,3,3,0.9)", overflow: "hidden" }}>
        <CornerFrame style={{ inset: "5%" }} />

        {/* Scan lines */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
          background: "linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.03) 50%)",
          backgroundSize: "100% 4px",
        }} />

        {/* Vignette */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2,
          background: "radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 120%)",
        }} />

        {/* HUD top-left */}
        <div style={{ position: "absolute", top: "2rem", left: "2.5rem", zIndex: 10, pointerEvents: "none", display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>SYS.READY</span>
          <div style={{ width: "60px", height: "1px", background: "rgba(255,255,255,0.15)", position: "relative" }}>
            <span style={{ position: "absolute", right: 0, top: "-2px", width: "5px", height: "5px", background: TEAL }} />
          </div>
          <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em", color: "rgba(0,229,204,0.7)", textTransform: "uppercase" }}>
            JOB_{id?.slice(-6).toUpperCase()}
          </span>
        </div>

        {/* HUD top-right: category */}
        <div style={{ position: "absolute", top: "2rem", right: "2.5rem", zIndex: 10, pointerEvents: "none" }}>
          <span style={{
            fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", textTransform: "uppercase",
            padding: "6px 14px", border: `1px solid ${TEAL}`, color: TEAL,
          }}>
            {job.category || "OTHER"}
          </span>
        </div>

        {/* Parallax hero content */}
        <div ref={heroRef} style={{
          position: "absolute", inset: 0, zIndex: 5,
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "0 8%", willChange: "transform, opacity",
        }}>
          <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: TEAL, textTransform: "uppercase", marginBottom: "1.5rem" }}>
            [{job.type?.toUpperCase()}] — {job.workplaceType?.replace("_", "-").toUpperCase()}
          </p>

          <h1 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(2.5rem, 7vw, 6rem)",
            fontWeight: 700, lineHeight: 1.05,
            color: "#fff", letterSpacing: "-0.02em",
            maxWidth: "800px", marginBottom: "1rem",
          }}>
            {job.title}
          </h1>

          <p style={{ fontFamily: MONO, fontSize: "13px", color: "rgba(255,255,255,0.45)", letterSpacing: "2px", textTransform: "uppercase" }}>
            {job.company}
            {job.location?.city ? ` — ${job.location.city}` : ""}
            {job.location?.country ? `, ${job.location.country}` : ""}
          </p>

          {deadline && (
            <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: deadline.color, marginTop: "1.5rem", textTransform: "uppercase" }}>
              ⏱ {deadline.text}
            </p>
          )}

          {(job.salary?.min != null || job.salary?.amount != null) && (
            <div style={{
              marginTop: "2rem", border: `1px solid rgba(0,229,204,0.25)`,
              padding: "16px 24px", display: "inline-flex", flexDirection: "column",
              gap: "4px", background: "rgba(0,229,204,0.03)", alignSelf: "flex-start", position: "relative",
            }}>
              <div style={{ position: "absolute", top: -1, left: -1, width: 10, height: 10, borderTop: `1px solid rgba(0,229,204,0.5)`, borderLeft: `1px solid rgba(0,229,204,0.5)` }} />
              <div style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderBottom: `1px solid rgba(0,229,204,0.5)`, borderRight: `1px solid rgba(0,229,204,0.5)` }} />
              <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: TEAL, textTransform: "uppercase" }}>COMPENSATION</span>
              <span style={{ fontFamily: MONO, fontSize: "28px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                {job.salary.min != null && job.salary.max != null
                  ? `${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()}`
                  : (job.salary.amount ?? job.salary.min)?.toLocaleString()
                } {job.salary.currency || ""}
              </span>
            </div>
          )}
        </div>

        {/* Scroll cue */}
        <div style={{
          position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)",
          zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px",
        }}>
          <div style={{
            width: "1px", height: "48px",
            background: `linear-gradient(to bottom, ${TEAL}, transparent)`,
            animation: "scrollLine 1.6s ease-in-out infinite",
          }} />
          <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "3px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>SCROLL</span>
        </div>

        {/* HUD bottom-left */}
        <div style={{ position: "absolute", bottom: "2rem", left: "2.5rem", zIndex: 10, pointerEvents: "none" }}>
          <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
            VIEWS: <strong style={{ color: TEAL }}>{job.viewCount ?? 0}</strong>
            {job.aiCategoryConfidence != null && (
              <> &nbsp;|&nbsp; AI CONF: <strong style={{ color: TEAL }}>{Math.round(job.aiCategoryConfidence * 100)}%</strong></>
            )}
          </span>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <div style={{ background: "rgba(3,3,3,0.92)", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 8% 6rem" }}>

          {/* Back link */}
          <FadeSection>
            <Link to="/jobs" style={{
              fontFamily: MONO, fontSize: "10px", letterSpacing: "3px",
              color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
              textDecoration: "none", display: "block",
              alignItems: "center", gap: "8px", marginBottom: "3rem",
            }}>
              <span style={{ color: TEAL }}>←</span> BACK TO LISTINGS
            </Link>
          </FadeSection>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 300px",
            gap: "3rem",
            alignItems: "start",
          }}>

            {/* LEFT — main content */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>

              {job.description && (
                <FadeSection delay={100}>
                  <Section label="JOB OVERVIEW" num="01">
                    <p style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.85, fontSize: "1rem", fontFamily: "'Inter',sans-serif" }}>
                      {job.description}
                    </p>
                  </Section>
                </FadeSection>
              )}

              {job.requirements?.length > 0 && (
                <FadeSection delay={150}>
                  <Section label="REQUIREMENTS" num="02">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {job.requirements.map(req => (
                        <span key={req} style={{
                          fontFamily: MONO, fontSize: "11px", letterSpacing: "1px",
                          padding: "6px 14px", border: `1px solid rgba(0,229,204,0.3)`,
                          color: TEAL, textTransform: "uppercase",
                          background: "rgba(0,229,204,0.04)",
                        }}>
                          {req}
                        </span>
                      ))}
                    </div>
                  </Section>
                </FadeSection>
              )}

              {job.perks?.length > 0 && (
                <FadeSection delay={200}>
                  <Section label="PERKS & BENEFITS" num="03">
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                      {job.perks.map((perk, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span style={{ width: "4px", height: "4px", background: TEAL, flexShrink: 0 }} />
                          <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", fontFamily: "'Inter',sans-serif" }}>{perk}</span>
                        </div>
                      ))}
                    </div>
                  </Section>
                </FadeSection>
              )}

              {job.hiringStages?.length > 0 && (
                <FadeSection delay={250}>
                  <Section label="HIRING PIPELINE" num="04">
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
                      {job.hiringStages.map((stage, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center" }}>
                          <div style={{
                            fontFamily: MONO, fontSize: "10px", letterSpacing: "2px",
                            padding: "8px 16px", border: `1px solid rgba(0,229,204,0.3)`,
                            color: i === 0 ? TEAL : "rgba(255,255,255,0.55)", textTransform: "uppercase",
                            background: i === 0 ? "rgba(0,229,204,0.08)" : "transparent",
                          }}>
                            {String(i + 1).padStart(2, "0")} {stage}
                          </div>
                          {i < job.hiringStages.length - 1 && (
                            <div style={{ width: "20px", height: "1px", background: "rgba(0,229,204,0.25)" }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                </FadeSection>
              )}
            </div>

            {/* RIGHT — sticky panel */}
            <div style={{ position: "sticky", top: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <FadeSection delay={300}>

                {/* Meta panel */}
                <div style={{
                  border: `1px solid rgba(0,229,204,0.2)`,
                  background: "rgba(0,229,204,0.02)",
                  padding: "1.5rem", position: "relative", marginBottom: "1rem",
                }}>
                  <CornerFrame style={{ inset: 0 }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <MetaRow label="STATUS" value={job.status?.toUpperCase()} color={job.status === "open" ? "#4ade80" : "#ef4444"} />
                    <MetaRow label="TYPE" value={job.type?.toUpperCase()} />
                    <MetaRow label="WORKPLACE" value={job.workplaceType?.replace("_", "-").toUpperCase()} />
                    {job.location?.city && (
                      <MetaRow label="LOCATION" value={`${job.location.city}${job.location.country ? ", " + job.location.country : ""}`} />
                    )}
                    {job.applicationDeadline && (
                      <MetaRow
                        label="DEADLINE"
                        value={new Date(job.applicationDeadline).toLocaleDateString()}
                        color={deadline?.color}
                      />
                    )}
                    {job.experienceLevel && <MetaRow label="LEVEL" value={job.experienceLevel?.toUpperCase()} />}
                    {job.isRemote && <MetaRow label="REMOTE" value="YES" color={TEAL} />}
                  </div>
                </div>

                {/* Apply button */}
                {isJobSeeker && job.status === "open" && (
                  applied ? (
                    <div style={{
                      border: "1px solid rgba(74,222,128,0.3)", padding: "1rem",
                      textAlign: "center", background: "rgba(74,222,128,0.05)", marginBottom: "0.5rem",
                    }}>
                      <span style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "2px", color: "#4ade80", textTransform: "uppercase" }}>
                        APPLICATION SUBMITTED
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setApplyOpen(true)}
                      style={{
                        width: "100%", padding: "1rem", background: TEAL, border: "none",
                        color: "#000", fontFamily: MONO, fontSize: "12px", letterSpacing: "3px",
                        textTransform: "uppercase", fontWeight: 700, cursor: "pointer",
                        transition: "opacity 0.2s", marginBottom: "0.5rem",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      APPLY NOW
                    </button>
                  )
                )}

                {/* Save + Report */}
                {isAuthenticated && (
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <SaveJobButton jobId={job._id} jobStatus={job.status} />
                    </div>
                    <button
                      onClick={() => setReportOpen(true)}
                      style={{
                        padding: "0.5rem 1rem", background: "transparent",
                        border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)",
                        fontFamily: MONO, fontSize: "9px", letterSpacing: "2px",
                        textTransform: "uppercase", cursor: "pointer",
                        transition: "border-color 0.2s, color 0.2s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)"; e.currentTarget.style.color = "#ef4444"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
                    >
                      REPORT
                    </button>
                  </div>
                )}
              </FadeSection>
            </div>
          </div>
        </div>
      </div>

      {/* ── APPLY MODAL ── */}
      {applyOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setApplyOpen(false)}
        >
          <div
            style={{
              background: "#0a0a0a", border: `1px solid rgba(0,229,204,0.25)`,
              padding: "2.5rem", width: "100%", maxWidth: "520px", position: "relative",
            }}
            onClick={e => e.stopPropagation()}
          >
            <CornerFrame style={{ inset: 0 }} />
            <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: TEAL, textTransform: "uppercase", marginBottom: "0.5rem" }}>
              APPLICATION
            </p>
            <h2 style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", fontFamily: "'Inter',sans-serif" }}>
              {job.title}
            </h2>
            <label style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "3px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
              COVER LETTER (OPTIONAL)
            </label>
            <textarea
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              rows={6}
              placeholder="Tell us why you're a great fit..."
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                padding: "0.75rem 1rem", fontFamily: "'Inter',sans-serif",
                fontSize: "0.9rem", resize: "vertical", outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={e => e.target.style.borderColor = `rgba(0,229,204,0.4)`}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
            {applyError && (
              <p style={{ fontFamily: MONO, fontSize: "10px", color: "#ef4444", marginTop: "0.75rem", letterSpacing: "1px", textTransform: "uppercase" }}>
                ERROR: {applyError}
              </p>
            )}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button onClick={() => setApplyOpen(false)} style={{
                flex: 1, padding: "0.875rem", background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.45)",
                fontFamily: MONO, fontSize: "10px", letterSpacing: "2px",
                textTransform: "uppercase", cursor: "pointer",
              }}>
                CANCEL
              </button>
              <button onClick={handleApply} disabled={applying} style={{
                flex: 2, padding: "0.875rem", background: TEAL, border: "none",
                color: "#000", fontFamily: MONO, fontSize: "11px", letterSpacing: "3px",
                textTransform: "uppercase", fontWeight: 700,
                cursor: applying ? "not-allowed" : "pointer",
                opacity: applying ? 0.7 : 1, transition: "opacity 0.2s",
              }}>
                {applying ? "SUBMITTING..." : "SUBMIT APPLICATION"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ── */}
      {reportOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setReportOpen(false)}
        >
          <div
            style={{
              background: "#0a0a0a", border: "1px solid rgba(239,68,68,0.25)",
              padding: "2.5rem", width: "100%", maxWidth: "420px", position: "relative",
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: "#ef4444", textTransform: "uppercase", marginBottom: "1rem" }}>
              REPORT JOB LISTING
            </p>
            <textarea
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              rows={4}
              placeholder="Describe the issue..."
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", color: "#fff",
                padding: "0.75rem 1rem", fontFamily: "'Inter',sans-serif",
                fontSize: "0.9rem", resize: "none", outline: "none",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button onClick={() => setReportOpen(false)} style={{
                flex: 1, padding: "0.75rem", background: "transparent",
                border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.45)",
                fontFamily: MONO, fontSize: "10px", letterSpacing: "2px",
                textTransform: "uppercase", cursor: "pointer",
              }}>
                CANCEL
              </button>
              <button onClick={handleReport} disabled={reporting || !reportReason.trim()} style={{
                flex: 2, padding: "0.75rem", background: "#ef4444", border: "none",
                color: "#fff", fontFamily: MONO, fontSize: "10px", letterSpacing: "2px",
                textTransform: "uppercase", fontWeight: 700, cursor: "pointer",
                opacity: reporting || !reportReason.trim() ? 0.5 : 1,
              }}>
                {reporting ? "SENDING..." : "SUBMIT REPORT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom scrollbar */}
      <div ref={scrollbarTrackRef} style={{
        position: "fixed", right: "6px", top: "12%", bottom: "12%",
        width: "3px", zIndex: 60, pointerEvents: "none",
        background: "rgba(255,255,255,0.04)", borderRadius: "2px",
        transition: "opacity 0.6s ease", opacity: 0,
      }}>
        <div ref={scrollbarRef} style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "36px",
          background: "rgba(0,229,204,0.5)", borderRadius: "2px",
          boxShadow: "0 0 8px rgba(0,229,204,0.25)", willChange: "transform",
        }} />
      </div>

      {/* Progress HUD */}
      <div style={{
        position: "fixed", top: "2rem", right: "2rem", zIndex: 60, pointerEvents: "none",
        fontFamily: MONO, fontSize: "9px", letterSpacing: "0.14em",
        color: "rgba(140,230,240,0.38)", textTransform: "uppercase", textAlign: "right",
      }}>
        PROGRESS: <strong ref={pctRef} style={{ color: TEAL }}>0.0%</strong>
      </div>

      <style>{`
        @keyframes scrollLine {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        html.lenis { height: auto; }
        html.lenis body { height: auto; }
        body { background: #000 !important; }
      `}</style>
    </>
  );
}
