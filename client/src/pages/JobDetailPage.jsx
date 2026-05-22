/**
 * JobDetailPage — /jobs/:id
 * Dark terminal aesthetic — matches JobListPage exactly
 * Same bg (#030303), teal (#00e5cc), JetBrains Mono, corner accents
 *
 * ✅ GET /api/v1/jobs/:id
 * ✅ Category badge (CATEGORY_COLORS from JobCard)
 * ✅ Apply modal with coverLetter textarea → POST /api/v1/jobs/:id/apply
 * ✅ Already-applied → replace Apply button with ApplicationStatusBadge
 * ✅ SaveJobButton
 * ✅ BONUS: ✨ Generate Cover Letter → POST /api/v1/jobs/:id/cover-letter-suggestion
 */

import { useState, useEffect, useRef, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { jobsAPI, applicationsAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { CATEGORY_COLORS } from "../components/JobCard";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge";
import ReportButton from "../components/ReportButton";
import Modal from "../components/Modal";

// ── Design tokens (identical to JobListPage) ─────────────────────────────────
const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";
const BG   = "#030303";

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtLocation = (loc) => {
  if (!loc) return "Remote";
  if (typeof loc === "string") return loc;
  return [loc.city, loc.country].filter(Boolean).join(", ") || "—";
};

const fmtSalary = (s) => {
  if (!s) return null;
  const cur = s.currency || "EGP";
  if (s.min && s.max) return `${s.min.toLocaleString()} – ${s.max.toLocaleString()} ${cur}`;
  if (s.min) return `${s.min.toLocaleString()}+ ${cur}`;
  return null;
};

const daysLeft = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
};

// ── Thin corner accent (reused from JobListPage card style) ───────────────────
const CornerAccents = ({ hovered }) => (
  <>
    <div style={{
      position: "absolute", top: -1, left: -1, width: 20, height: 20,
      borderTop: `1px solid ${hovered ? TEAL : "rgba(0,229,204,0.3)"}`,
      borderLeft: `1px solid ${hovered ? TEAL : "rgba(0,229,204,0.3)"}`,
      transition: "border-color 0.25s",
    }} />
    <div style={{
      position: "absolute", bottom: -1, right: -1, width: 20, height: 20,
      borderBottom: `1px solid ${hovered ? TEAL : "rgba(0,229,204,0.3)"}`,
      borderRight: `1px solid ${hovered ? TEAL : "rgba(0,229,204,0.3)"}`,
      transition: "border-color 0.25s",
    }} />
  </>
);

// ── Dark section card ─────────────────────────────────────────────────────────
const DarkSection = ({ children, style }) => (
  <div style={{
    border: "1px solid rgba(0,229,204,0.12)",
    background: "rgba(0,229,204,0.02)",
    position: "relative",
    padding: "1.75rem",
    ...style,
  }}>
    <CornerAccents />
    {children}
  </div>
);

// ── Section label (same as JobListPage filter label style) ────────────────────
const Label = ({ children }) => (
  <p style={{
    fontFamily: MONO, fontSize: "9px", letterSpacing: "3px",
    color: `rgba(0,229,204,0.5)`, textTransform: "uppercase",
    marginBottom: "1rem", marginTop: 0,
  }}>
    {children}
  </p>
);

// ── Stat box ──────────────────────────────────────────────────────────────────
const StatBox = ({ value, label, danger }) => (
  <div style={{
    borderBottom: "1px solid rgba(0,229,204,0.07)",
    padding: "1rem 0",
  }}>
    <div style={{
      fontFamily: MONO, fontSize: "28px", fontWeight: 700, lineHeight: 1,
      color: danger ? "#ef4444" : "#fff",
      fontFeatureSettings: '"tnum"',
    }}>
      {value}
    </div>
    <div style={{
      fontFamily: MONO, fontSize: "9px", letterSpacing: "2px",
      textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
      marginTop: "4px",
    }}>
      {label}
    </div>
  </div>
);

// ── Info row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    borderBottom: "1px solid rgba(0,229,204,0.07)", padding: "0.75rem 0", gap: "1rem",
  }}>
    <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
      {label}
    </span>
    <span style={{ fontFamily: MONO, fontSize: "11px", fontWeight: 600, color: "#fff", textAlign: "right" }}>
      {value}
    </span>
  </div>
);

// ── Hiring stage pipeline ─────────────────────────────────────────────────────
const STAGE_LABELS = {
  pending: "Applied", screening: "Screening", interview: "Interview",
  offer: "Offer", contract_sent: "Contract", accepted: "Accepted",
};

const StagePipeline = ({ stages }) => (
  <div style={{ display: "flex", alignItems: "flex-start", overflowX: "auto", paddingBottom: "0.5rem" }}>
    {stages.map((stage, i) => (
      <div key={stage} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 72, position: "relative" }}>
        {/* connector line */}
        {i < stages.length - 1 && (
          <div style={{
            position: "absolute", top: 14, left: "calc(50% + 14px)",
            width: "calc(100% - 28px)", height: "1px",
            background: "rgba(0,229,204,0.2)",
          }} />
        )}
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `1px solid rgba(0,229,204,0.4)`,
          background: "transparent", color: TEAL,
          fontFamily: MONO, fontSize: "10px", fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", zIndex: 2,
        }}>
          {i + 1}
        </div>
        <div style={{
          marginTop: "6px", fontFamily: MONO, fontSize: "8px",
          letterSpacing: "1px", textTransform: "uppercase",
          color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.3,
        }}>
          {STAGE_LABELS[stage] || stage}
        </div>
      </div>
    ))}
  </div>
);

// ── Dark skeleton ─────────────────────────────────────────────────────────────
const DarkSkeleton = () => (
  <div style={{ minHeight: "100vh", background: BG, padding: "4rem 6%" }}>
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      {[["60%", 18], ["35%", 12], ["100%", 200], ["80%", 14], ["50%", 14]]
        .map(([w, h], i) => (
          <div key={i} style={{
            height: h, width: w, background: "rgba(255,255,255,0.04)",
            marginBottom: "1.25rem", borderRadius: 2, position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, transparent 0%, rgba(0,229,204,0.03) 50%, transparent 100%)",
              animation: "shimmer 1.8s ease-in-out infinite",
            }} />
          </div>
        ))}
    </div>
    <style>{`@keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }`}</style>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  const isJobSeeker = user?.role === "jobSeeker";

  // scroll
  const scrollbarRef      = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const pctRef            = useRef(null);

  // data
  const [job,     setJob]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // apply
  const [myApplication, setMyApplication] = useState(null);
  const [isSaved,       setIsSaved]        = useState(false);
  const [applyOpen,     setApplyOpen]      = useState(false);
  const [coverLetter,   setCoverLetter]    = useState("");
  const [applyLoading,  setApplyLoading]   = useState(false);
  const [applyError,    setApplyError]     = useState(null);

  // CV upload
  const [cvMode,        setCvMode]         = useState("disk"); // "disk" | "cloud"
  const [cvFile,        setCvFile]         = useState(null);
  const [cvUrl,         setCvUrl]          = useState("");
  const [cvUploading,   setCvUploading]    = useState(false);
  const [cvUploaded,    setCvUploaded]     = useState(false);
  const [cvError,       setCvError]        = useState(null);

  // AI cover letter
  const [aiOpen,    setAiOpen]    = useState(false);
  const [aiText,    setAiText]    = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError,   setAiError]   = useState(null);

  // save button hover
  const [saveHovered, setSaveHovered] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // ── Lenis smooth scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof history !== "undefined") history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
    let raf;
    const tick = (time) => {
      lenis.raf(time);
      const scrollY = window.scrollY;
      const totalH  = document.documentElement.scrollHeight - window.innerHeight;
      const pct     = totalH > 0 ? scrollY / totalH : 0;
      if (pctRef.current) pctRef.current.textContent = (pct * 100).toFixed(1) + "%";
      if (scrollbarRef.current && scrollbarTrackRef.current) {
        const trackH = scrollbarTrackRef.current.offsetHeight - scrollbarRef.current.offsetHeight;
        scrollbarRef.current.style.transform = `translateY(${pct * Math.max(trackH, 0)}px)`;
        scrollbarTrackRef.current.style.opacity = pct > 0.005 ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { lenis.destroy(); cancelAnimationFrame(raf); };
  }, []);

  // ── Fetch job ──────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    jobsAPI.getJobById(id)
      .then(res => {
        const data = res.data.job || res.data;
        setJob(data);
      })
      .catch(err => setError(err.response?.data?.message || "Failed to load job."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (isAuthenticated && isJobSeeker) {
      jobsAPI.getSavedJobs()
        .then(res => {
          const savedList = res.data.jobs || [];
          setIsSaved(savedList.some(j => (typeof j === 'string' ? j : j._id) === id));
        }).catch(() => {});

      applicationsAPI.getMyApplications()
        .then(res => {
          const apps = res.data.applications || res.data || [];
          const myApp = apps.find(a => (a.job?._id || a.job) === id);
          if (myApp) setMyApplication(myApp);
        }).catch(() => {});
    }
  }, [id, isAuthenticated, isJobSeeker]);

  // ── CV upload ──────────────────────────────────────────────────────────────
  const handleUploadCv = async () => {
    setCvError(null);
    if (cvMode === "disk" && !cvFile) { setCvError("Please select a file."); return; }
    if (cvMode === "cloud" && !cvUrl.trim()) { setCvError("Please enter a URL."); return; }
    setCvUploading(true);
    try {
      const { documentsAPI } = await import("../services/api");
      if (cvMode === "disk") {
        const fd = new FormData();
        fd.append("file", cvFile);
        fd.append("type", "cv");
        await documentsAPI.uploadDocument(fd);
      } else {
        const fd = new FormData();
        fd.append("fileUrl", cvUrl.trim());
        fd.append("type", "cv");
        await documentsAPI.uploadDocument(fd);
      }
      setCvUploaded(true);
    } catch (err) {
      setCvError(err.response?.data?.message || "Upload failed. Try again.");
    } finally {
      setCvUploading(false);
    }
  };

  // ── Apply ──────────────────────────────────────────────────────────────────
  const handleApply = async () => {
    if (job.requiresCv && !cvUploaded) { setApplyError("Please upload your CV first."); return; }
    setApplyLoading(true);
    setApplyError(null);
    try {
      const res = await jobsAPI.applyToJob(id, { coverLetter });
      const app = res.data.application || res.data;
      setMyApplication({ status: app.status || "pending" });
      setApplyOpen(false);
      setCoverLetter("");
      setCvFile(null); setCvUrl(""); setCvUploaded(false);
    } catch (err) {
      setApplyError(err.response?.data?.message || "Failed to submit.");
    } finally {
      setApplyLoading(false);
    }
  };

  // ── Save toggle ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (saveLoading || (job?.status !== "open" && !isSaved)) return;
    setSaveLoading(true);
    try {
      const res = await jobsAPI.saveJob(id);
      setIsSaved(res.data.saved);
    } catch { /* silent */ }
    finally { setSaveLoading(false); }
  };

  // ── AI cover letter ────────────────────────────────────────────────────────
  const handleGenerateCL = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiText("");
    setAiOpen(true);
    try {
      const res = await jobsAPI.coverLetterSuggestion(id);
      setAiText(res.data.suggestion || "");
    } catch (err) {
      setAiError(err.response?.data?.message || "AI service unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  const useDraft = () => {
    setCoverLetter(aiText);
    setAiOpen(false);
    setApplyOpen(true);
  };

  // ── Early returns ──────────────────────────────────────────────────────────
  if (loading) return <DarkSkeleton />;

  if (error) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}>
      <p style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "2px", color: "#ef4444", textTransform: "uppercase" }}>
        ERROR: {error}
      </p>
      <button
        onClick={() => navigate("/jobs")}
        style={darkBtn}
      >
        ← BACK TO JOBS
      </button>
    </div>
  );

  if (!job) return null;

  const category   = job.category || "Other";
  const catColors  = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
  const salaryStr  = fmtSalary(job.salary);
  const location   = fmtLocation(job.location);
  const days       = daysLeft(job.applicationDeadline);
  const isOpen     = job.status === "open";
  const isApplied  = myApplication !== null;
  const canSave    = isOpen || isSaved;

  return (
    <>
      <div style={{ minHeight: "100vh", background: BG, position: "relative", zIndex: 1 }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{ padding: "6.75rem 6% 0", maxWidth: 1280, margin: "0 auto" }}>
          {/* breadcrumb */}
          <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "2px", color: "rgba(0,229,204,0.45)", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            <Link
              to="/jobs"
              style={{ color: "rgba(0,229,204,0.45)", textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.color = TEAL}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(0,229,204,0.45)"}
            >
              ← SYS.LISTINGS
            </Link>
            <span style={{ margin: "0 0.5rem", opacity: 0.3 }}>/</span>
            <span style={{ color: TEAL }}>{job.title?.toUpperCase()}</span>
          </p>

          {/* title row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <h1 style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: "clamp(1.75rem,4vw,3rem)",
                fontWeight: 700, color: "#fff",
                letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0,
              }}>
                {job.title}
              </h1>
              <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "2px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", marginTop: "0.5rem" }}>
                {job.company}
              </p>
            </div>

            {/* category badge */}
            <span style={{
              fontFamily: MONO, fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase",
              padding: "6px 14px", border: "1px solid rgba(0,229,204,0.25)", color: TEAL,
              whiteSpace: "nowrap", alignSelf: "flex-start",
              background: "rgba(0,229,204,0.04)",
            }}>
              {category}
              {job.aiCategoryConfidence != null && (
                <span style={{ opacity: 0.5, marginLeft: "0.4rem" }}>
                  {Math.round(job.aiCategoryConfidence * 100)}%
                </span>
              )}
            </span>
          </div>

          {/* meta row */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
            {[
              ["📍", location],
              ["💼", job.type],
              job.workplaceType && ["🏠", job.workplaceType.replace("_", "-")],
              salaryStr && ["💰", salaryStr],
              days != null && ["⏳", days === 0 ? "DEADLINE PASSED" : `${days}d LEFT`],
            ].filter(Boolean).map(([icon, val]) => (
              <span key={val} style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                {icon} {val}
              </span>
            ))}

            {/* open / closed pill */}
            <span style={{
              fontFamily: MONO, fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase",
              padding: "3px 10px",
              border: `1px solid ${isOpen ? "rgba(74,222,128,0.35)" : "rgba(239,68,68,0.35)"}`,
              color: isOpen ? "#4ade80" : "#ef4444",
            }}>
              {job.status}
            </span>
          </div>

          {/* action row */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem", flexWrap: "wrap", alignItems: "center" }}>

            {isAuthenticated && isJobSeeker && (
              isApplied ? (
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "2px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                      STATUS:
                    </span>
                    <ApplicationStatusBadge status={myApplication.status} />
                  </div>
                  {myApplication.status !== "rejected" && (
                    <Link
                      to={`/conversations/${id}?role=recruiter&job=${encodeURIComponent(job.title || "")}&name=${encodeURIComponent(job.company || "")}`}
                      style={{
                        ...darkBtn,
                        textDecoration: "none",
                        color: TEAL,
                        borderColor: "rgba(0,229,204,0.45)",
                        background: "rgba(0,229,204,0.06)",
                      }}
                    >
                      ✉️ Message recruiter
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <button
                    style={{
                      ...darkBtn,
                      background: isOpen ? "rgba(0,229,204,0.12)" : "transparent",
                      color: isOpen ? TEAL : "rgba(255,255,255,0.25)",
                      borderColor: isOpen ? "rgba(0,229,204,0.4)" : "rgba(255,255,255,0.1)",
                      cursor: isOpen ? "pointer" : "not-allowed",
                    }}
                    disabled={!isOpen}
                    onClick={() => setApplyOpen(true)}
                  >
                    {isOpen ? "APPLY NOW" : "APPLICATIONS CLOSED"}
                  </button>

                  {isOpen && (
                    <button style={aiBtn} onClick={handleGenerateCL}>
                      ✨ GENERATE COVER LETTER
                    </button>
                  )}
                </>
              )
            )}

{/* save */}
            {isAuthenticated && isJobSeeker && (
              <button
                style={{
                  ...darkBtn,
                  background: isSaved ? "rgba(0,229,204,0.08)" : "transparent",
                  borderColor: isSaved ? TEAL : "rgba(255,255,255,0.12)",
                  color: isSaved ? TEAL : "rgba(255,255,255,0.4)",
                  cursor: canSave ? "pointer" : "not-allowed",
                  opacity: canSave ? 1 : 0.4,
                }}
                onMouseEnter={() => setSaveHovered(true)}
                onMouseLeave={() => setSaveHovered(false)}
                disabled={!canSave || saveLoading}
                onClick={handleSave}
              >
                {saveLoading ? "..." : isSaved ? "🔖 SAVED" : "🏷️ SAVE"}
              </button>
            )}

            <ReportButton targetModel="JobPost" targetId={id} />
          </div>

          <div style={{ height: "1px", background: "linear-gradient(to right, rgba(0,229,204,0.3), transparent)", marginTop: "2rem" }} />
        </div>

        {/* ── Two-column body ─────────────────────────────────── */}
        <div className="jd-two-col" style={{
          maxWidth: 1280, margin: "0 auto",
          padding: "2.5rem 6% 6rem",
          display: "grid",
          gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)",
          gap: "1.5rem",
          alignItems: "start",
        }}>

          {/* ── Left column ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Description */}
            <DarkSection>
              <Label>About this role</Label>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: "15px", lineHeight: "26px", color: "rgba(255,255,255,0.65)", whiteSpace: "pre-line", margin: 0 }}>
                {job.description}
              </p>
            </DarkSection>

            {/* Requirements */}
            {job.requirements?.length > 0 && (
              <DarkSection>
                <Label>What you'll need</Label>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {job.requirements.map((r, i) => (
                    <li key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                      <span style={{ fontFamily: MONO, fontSize: "9px", color: TEAL, marginTop: "4px", flexShrink: 0 }}>▸</span>
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{r}</span>
                    </li>
                  ))}
                </ul>
              </DarkSection>
            )}

            {/* Perks */}
            {job.perks?.length > 0 && (
              <DarkSection>
                <Label>Perks & benefits</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {job.perks.map((p, i) => (
                    <span key={i} style={{
                      fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase",
                      padding: "5px 12px", border: "1px solid rgba(0,229,204,0.2)",
                      color: "rgba(0,229,204,0.7)", background: "rgba(0,229,204,0.04)",
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              </DarkSection>
            )}

            {/* Hiring stages */}
            {job.hiringStages?.length > 0 && (
              <DarkSection>
                <Label>Hiring process</Label>
                <StagePipeline stages={job.hiringStages} />
              </DarkSection>
            )}
          </div>

          {/* ── Right sidebar ─── */}
          <div style={{ position: "sticky", top: "5.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* At a glance */}
            <DarkSection>
              <Label>At a glance</Label>
              {salaryStr    && <InfoRow label="Salary"     value={salaryStr} />}
              <InfoRow label="Location"   value={location} />
              {job.workplaceType && <InfoRow label="Workplace" value={job.workplaceType.replace("_", "-")} />}
              <InfoRow label="Type"       value={job.type} />
              {job.experience?.minYears && <InfoRow label="Experience" value={`${job.experience.minYears}+ yrs`} />}
              {job.requiredEducation && job.requiredEducation !== "none" && (
                <InfoRow label="Education" value={job.requiredEducation} />
              )}
              {job.totalSlots && <InfoRow label="Open slots" value={String(job.totalSlots)} />}
            </DarkSection>

            {/* Activity stats */}
            <DarkSection>
              <Label>Activity</Label>
              {job.viewCount != null     && <StatBox value={job.viewCount.toLocaleString()}     label="Total views" />}
              {job.applicantCount != null && <StatBox value={job.applicantCount}                label="Applicants so far" />}
              {job.totalSlots != null    && <StatBox value={job.totalSlots}                     label="Open positions" />}
              {days != null && (
                <StatBox
                  value={days === 0 ? "—" : days}
                  label={days === 0 ? "Deadline passed" : days === 1 ? "Day left to apply" : "Days left to apply"}
                  danger={days <= 7}
                />
              )}
            </DarkSection>
          </div>
        </div>
      </div>

      {/* ── Custom scrollbar (identical to JobListPage) ────────── */}
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

      {/* ── Progress HUD ────────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: "2rem", right: "2rem", zIndex: 60, pointerEvents: "none",
        fontFamily: MONO, fontSize: "9px", letterSpacing: "0.14em",
        color: "rgba(140,230,240,0.38)", textTransform: "uppercase", textAlign: "right",
      }}>
        PROGRESS: <strong ref={pctRef} style={{ color: TEAL }}>0.0%</strong>
      </div>

      {/* ── Apply Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={applyOpen}
        onClose={() => { setApplyOpen(false); setApplyError(null); setCvFile(null); setCvUrl(""); setCvUploaded(false); setCvError(null); }}
        onConfirm={handleApply}
        title={`Apply to ${job.title}`}
        confirmText={applyLoading ? "Submitting…" : "Submit Application"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* ── CV upload section (shown first when required) ── */}
          {job.requiresCv && (
            <div style={{
              border: `1px solid ${cvUploaded ? "rgba(0,229,204,0.4)" : "rgba(255,180,0,0.35)"}`,
              borderRadius: 6,
              padding: "1rem",
              background: cvUploaded ? "rgba(0,229,204,0.04)" : "rgba(255,180,0,0.04)",
            }}>
              <p style={{ fontFamily: MONO, fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", color: cvUploaded ? TEAL : "#f59e0b", margin: "0 0 0.75rem" }}>
                {cvUploaded ? "✓ CV uploaded — ready to apply" : "⚠ This job requires a CV"}
              </p>

              {!cvUploaded && (
                <>
                  {/* Mode tabs */}
                  <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    {["disk", "cloud"].map(m => (
                      <button key={m} type="button" onClick={() => { setCvMode(m); setCvError(null); }} style={{
                        fontFamily: MONO, fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase",
                        padding: "0.3rem 0.75rem", borderRadius: 3, cursor: "pointer",
                        border: `1px solid ${cvMode === m ? TEAL : "rgba(255,255,255,0.15)"}`,
                        background: cvMode === m ? "rgba(0,229,204,0.1)" : "transparent",
                        color: cvMode === m ? TEAL : "rgba(255,255,255,0.5)",
                      }}>
                        {m === "disk" ? "📁 From Disk" : "☁️ Cloud Link"}
                      </button>
                    ))}
                  </div>

                  {cvMode === "disk" ? (
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={e => { setCvFile(e.target.files[0]); setCvError(null); }}
                      style={{ fontSize: "13px", color: "var(--text-primary)", width: "100%" }}
                    />
                  ) : (
                    <input
                      type="url"
                      placeholder="https://drive.google.com/... or Dropbox link"
                      value={cvUrl}
                      onChange={e => { setCvUrl(e.target.value); setCvError(null); }}
                      style={{
                        width: "100%", boxSizing: "border-box", padding: "0.55rem 0.75rem",
                        borderRadius: 4, border: "1px solid rgba(255,255,255,0.12)",
                        background: "rgba(0,0,0,0.25)", color: "var(--text-primary)",
                        fontFamily: "'Inter',sans-serif", fontSize: "13px", outline: "none",
                      }}
                    />
                  )}

                  {cvError && <p style={{ fontFamily: MONO, fontSize: "11px", color: "#ef4444", margin: "0.5rem 0 0" }}>{cvError}</p>}

                  <button type="button" onClick={handleUploadCv} disabled={cvUploading} style={{
                    marginTop: "0.65rem", background: TEAL, color: "#030303",
                    fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", padding: "0.5rem 1.1rem",
                    border: "none", borderRadius: 3, cursor: cvUploading ? "not-allowed" : "pointer",
                    opacity: cvUploading ? 0.6 : 1,
                  }}>
                    {cvUploading ? "Uploading…" : "Upload CV"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Cover letter section ── */}
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: "20px", margin: 0 }}>
            Your profile (name, bio, skills) is shared automatically.
            {job.requiresCoverLetter ? " ⚠️ A cover letter is required." : " A cover letter is optional but recommended."}
          </p>

          <button
            style={{ ...aiBtn, fontSize: "11px", padding: "0.45rem 0.875rem", alignSelf: "flex-start" }}
            onClick={handleGenerateCL}
            disabled={aiLoading}
          >
            {aiLoading ? "✨ Generating…" : "✨ Generate with AI"}
          </button>

          <textarea
            value={coverLetter}
            onChange={e => { setCoverLetter(e.target.value); if (applyError) setApplyError(null); }}
            placeholder="Write a cover letter, or use the AI button above…"
            rows={5}
            disabled={applyLoading}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "0.75rem", borderRadius: 4,
              border: "1px solid var(--border-glass)",
              background: "rgba(0,0,0,0.25)",
              color: "var(--text-primary)",
              fontFamily: "'Inter',sans-serif", fontSize: "14px", lineHeight: "22px",
              resize: "vertical", outline: "none",
            }}
          />

          {applyError && (
            <p style={{ fontFamily: MONO, fontSize: "11px", color: "#ef4444", margin: 0 }}>
              {applyError}
            </p>
          )}
        </div>
      </Modal>

      {/* ── AI Cover Letter Modal ────────────────────────────────── */}
      <Modal
        isOpen={aiOpen}
        onClose={() => { setAiOpen(false); setAiError(null); }}
        title="✨ AI Cover Letter Suggestion"
        onConfirm={aiText && !aiLoading ? useDraft : undefined}
        confirmText="Use This Draft →"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {aiLoading && (
            <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                border: `2px solid rgba(0,229,204,0.15)`,
                borderTop: `2px solid ${TEAL}`,
                animation: "spin 0.7s linear infinite",
                margin: "0 auto 0.75rem",
              }} />
              <p style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "2px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                GENERATING…
              </p>
            </div>
          )}
          {aiError && (
            <p style={{ fontFamily: MONO, fontSize: "11px", color: "#ef4444", margin: 0 }}>
              {aiError.includes("bio or extracted skills") ? (
                <>
                  Your profile has no bio or skills yet.{" "}
                  <a href="/profile" style={{ color: "#00e5cc", textDecoration: "underline" }}>
                    Update your profile
                  </a>{" "}
                  first, then try again.
                </>
              ) : <>ERROR: {aiError}</>}
            </p>
          )}
          {aiText && !aiLoading && (
            <>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                Generated from your profile bio + this job. Edit before using.
              </p>
              <textarea
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                rows={10}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "0.75rem", borderRadius: 4,
                  border: "1px solid var(--border-glass)",
                  background: "rgba(0,0,0,0.25)",
                  color: "var(--text-primary)",
                  fontFamily: "'Inter',sans-serif", fontSize: "13px", lineHeight: "21px",
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </>
          )}
        </div>
      </Modal>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        html.lenis { height: auto; }
        html.lenis body { height: auto; }
        body { background: #000 !important; }
        @media (max-width: 900px) {
          .jd-two-col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .jd-two-col { padding-left: 1rem !important; padding-right: 1rem !important; }
        }
      `}</style>
    </>
  );
};

// ── Shared button styles ──────────────────────────────────────────────────────
const darkBtn = {
  background: "rgba(0,229,204,0.12)",
  border: "1px solid rgba(0,229,204,0.35)",
  color: TEAL,
  fontFamily: MONO,
  fontSize: "0.68rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "0.7rem 1.25rem",
  minHeight: "46px",
  borderRadius: "4px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
};

const aiBtn = {
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(234,242,255,0.62)",
  fontFamily: MONO,
  fontSize: "0.68rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "0.7rem 1.25rem",
  minHeight: "46px",
  borderRadius: "4px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
};

export default JobDetailPage;
