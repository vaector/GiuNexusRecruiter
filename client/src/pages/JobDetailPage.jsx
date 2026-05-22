import { useState, useEffect, useContext, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api, { jobsAPI, applicationsAPI } from "../services/api";
import { CATEGORY_COLORS } from "../components/JobCard";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge";
import Modal from "../components/Modal";
import BorderGlow from "../components/BorderGlow";
import CountUp from "../components/CountUp";
import Spinner from "../components/Spinner";
import "./JobDetailPage.css";

const FAKE_JOB = {
  _id: "69fe3248eb47ca24eb2964ed",
  title: "Senior Backend Engineer",
  company: "Stellar Labs",
  description:
    "We're building next-generation distributed infrastructure for AI training workloads. Join a small, senior team where every engineer owns end-to-end systems and ships to production weekly.\n\nYou'll work on our core orchestration engine — a Node.js service that schedules tens of thousands of GPU hours daily across multiple cloud providers.",
  requirements: [
    "5+ years of backend experience with Node.js and TypeScript",
    "Strong MongoDB skills — schema design, indexing, aggregation pipelines",
    "Production experience with Kubernetes and container orchestration",
    "Comfort designing distributed systems and message queues",
    "Bachelor's degree in Computer Science or equivalent",
  ],
  location: { city: "Cairo", country: "Egypt" },
  type: "full-time",
  salary: { min: 80000, max: 120000, currency: "EGP", period: "monthly", isPublic: true },
  category: "Backend",
  aiCategoryConfidence: 0.94,
  totalSlots: 3,
  applicantCount: 47,
  status: "open",
  applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
  viewCount: 1247,
  isRemote: true,
  workplaceType: "hybrid",
  perks: ["Health insurance", "Remote-friendly", "Annual learning budget", "Quarterly bonuses"],
  hiringStages: ["pending", "screening", "interview", "offer", "contract_sent", "accepted"],
  requiresCv: true,
  requiresCoverLetter: false,
  experience: { minYears: 5 },
  requiredEducation: "bachelor",
  requiredEducationField: "Computer Science",
  createdBy: { _id: "000000000000000000000001", name: "Mohamed Ali" },
  isSaved: false,
};

const EDUCATION_LABELS = {
  none: "None required",
  high_school: "High School",
  bachelor: "Bachelor's",
  master: "Master's",
  phd: "PhD",
};

const STAGE_LABELS = {
  pending: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  contract_sent: "Contract",
  accepted: "Accepted",
};

const formatLocation = (loc) => {
  if (!loc) return "Remote";
  const parts = [loc.city, loc.country].filter(Boolean);
  return parts.join(", ");
};

const formatSalary = (sal) => {
  if (!sal || !sal.isPublic || !sal.min) return null;
  const period = sal.period === "monthly" ? "/mo" : sal.period === "yearly" ? "/yr" : "";
  return { min: sal.min, max: sal.max, currency: sal.currency || "EGP", period };
};

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [applicationStatus, setApplicationStatus] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverError, setCoverError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    // ─── FAKE DATA MODE ───────────────────────────────────────
    // Switch to real API by uncommenting the block below and
    // removing the two lines under "FAKE DATA MODE".
    // ──────────────────────────────────────────────────────────
    setJob(FAKE_JOB);
    setLoading(false);

    // ─── REAL API (uncomment when backend is stable) ──────────
    // let cancelled = false;
    // const isSeeker = isAuthenticated && user?.role === "jobSeeker";
    // const fetchApps = isSeeker
    //   ? applicationsAPI.getMyApplications().catch(() => null)
    //   : Promise.resolve(null);
    // const fetchSaved = isSeeker
    //   ? jobsAPI.getSavedJobs().catch(() => null)
    //   : Promise.resolve(null);
    // Promise.all([jobsAPI.getJobById(id), fetchApps, fetchSaved])
    //   .then(([jobRes, appsRes, savedRes]) => {
    //     if (cancelled) return;
    //     setJob(jobRes.data.job);
    //     if (appsRes) {
    //       const match = appsRes.data.applications.find((a) => a.job?._id === id);
    //       if (match) setApplicationStatus(match.status);
    //     }
    //     if (savedRes) {
    //       setSaved(savedRes.data.jobs.some((j) => j._id === id));
    //     }
    //     setLoading(false);
    //   })
    //   .catch((err) => {
    //     if (cancelled) return;
    //     if (err.response?.status === 404) setNotFound(true);
    //     else setLoadError(err.response?.data?.message || "Failed to load job. Please try again.");
    //     setLoading(false);
    //   });
    // return () => { cancelled = true; };
    // ─────────────────────────────────────────────────────────
  }, [id]);

  const categoryColors = useMemo(
    () => (job ? CATEGORY_COLORS[job.category] || CATEGORY_COLORS.Other : {}),
    [job?.category]
  );
  const salary = useMemo(() => (job ? formatSalary(job.salary) : null), [job?.salary]);
  const daysUntilDeadline = useMemo(() => {
    if (!job?.applicationDeadline) return 0;
    const diff = new Date(job.applicationDeadline) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [job?.applicationDeadline]);

  const isClosed = job ? job.status !== "open" || daysUntilDeadline === 0 : false;
  const alreadyApplied = applicationStatus !== null;
  const isJobSeeker = user?.role === "jobSeeker";
  const isOwner = !!(job?.createdBy?._id && job.createdBy._id === user?._id);

  const handleOpenApplyModal = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/jobs/${id}` } });
      return;
    }
    setCoverError("");
    setShowApplyModal(true);
  };

  const handleCloseApplyModal = () => {
    if (submitting) return;
    setShowApplyModal(false);
    setCoverError("");
  };

  const handleSubmitApply = async () => {
    if (job.requiresCoverLetter && !coverLetter.trim()) {
      setCoverError("This job requires a cover letter.");
      return;
    }
    setSubmitting(true);
    try {
      await jobsAPI.applyToJob(job._id, coverLetter.trim() ? { coverLetter } : {});
      setApplicationStatus("pending");
      setShowApplyModal(false);
      setCoverLetter("");
    } catch (err) {
      const msg = err.response?.data?.message || "";
      if (msg.toLowerCase().includes("already")) {
        applicationsAPI
          .getMyApplications()
          .then((res) => {
            const match = res.data.applications.find((a) => a.job?._id === id);
            if (match) setApplicationStatus(match.status);
            else setApplicationStatus("pending");
          })
          .catch(() => setApplicationStatus("pending"));
        setShowApplyModal(false);
        setCoverLetter("");
      } else if (msg.toLowerCase().includes("closed")) {
        setCoverError("No longer accepting applications.");
      } else {
        setCoverError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/jobs/${id}` } });
      return;
    }
    if (isClosed && !saved) return;
    setSaving(true);
    try {
      const res = await jobsAPI.saveJob(job._id);
      setSaved(res.data.saved);
    } catch {
      // silently ignore — server is source of truth, state unchanged
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setGenerating(true);
    try {
      const res = await api.post(`/jobs/${job._id}/cover-letter`);
      setCoverLetter(res.data.coverLetter);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "";
      if (status === 400 && msg) {
        setCoverError(msg);
      } else {
        // AI endpoint not connected yet — generate a template draft
        const skills = Array.isArray(user?.skills)
          ? user.skills
              .slice(0, 3)
              .map((s) => (typeof s === "string" ? s : s?.name))
              .filter(Boolean)
              .join(", ")
          : "";
        setCoverLetter(
          `Dear ${job.company} hiring team,\n\nI'm writing to express my strong interest in the ${job.title} role.${
            skills ? ` My background includes ${skills}, which aligns well with this position.` : ""
          }\n\nI'm excited about the opportunity to contribute to your team and would welcome the chance to discuss how my experience can support your goals.\n\nBest regards,\n${user?.name || "Applicant"}`
        );
      }
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="jd-page" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <h2>Job not found</h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
          This job may have been removed or the link is invalid.
        </p>
        <Link to="/jobs">← Back to jobs</Link>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="jd-page" style={{ textAlign: "center", padding: "4rem 1rem" }}>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1rem" }}>{loadError}</p>
        <button className="jd-apply-btn" onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="jd-page">
      {/* Breadcrumb */}
      <nav className="jd-breadcrumb">
        <Link to="/jobs">← Back to jobs</Link>
      </nav>

      {/* Hero card with BorderGlow */}
      <BorderGlow
        glowColor="19 100 60"
        backgroundColor="#201515"
        colors={["#ff4f00", "#ffb38a", "#fffefb"]}
        borderRadius={20}
        glowRadius={50}
        glowIntensity={1.2}
        animated
      >
        <div className="jd-hero-content">
          <div className="jd-hero-row">
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 className="jd-hero-title">{job.title}</h1>
              <div className="jd-hero-company">{job.company}</div>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: "var(--rounded-pill)",
                fontSize: 13,
                fontWeight: 600,
                background: categoryColors.bg,
                color: categoryColors.color,
                whiteSpace: "nowrap",
              }}
            >
              {job.category}
              {job.aiCategoryConfidence != null && (
                <span style={{ opacity: 0.65, fontWeight: 500 }}>
                  · {Math.round(job.aiCategoryConfidence * 100)}%
                </span>
              )}
            </span>
          </div>

          <div className="jd-hero-meta">
            <span>📍 {formatLocation(job.location)}</span>
            <span>💼 {job.type}</span>
            <span>🏢 {job.workplaceType}</span>
            {job.experience?.minYears && <span>⏱ {job.experience.minYears}+ years</span>}
          </div>

          <div className="jd-hero-actions">
            {alreadyApplied ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, color: "rgba(255,254,251,0.65)" }}>
                  Application status
                </span>
                <ApplicationStatusBadge status={applicationStatus} />
              </div>
            ) : isOwner ? (
              <div style={{ fontSize: 13, color: "rgba(255,254,251,0.65)" }}>
                You posted this job ·{" "}
                <Link
                  to={`/recruiter/jobs/${job._id}/edit`}
                  style={{ color: "var(--color-accent)", textDecoration: "none" }}
                >
                  Edit
                </Link>
              </div>
            ) : (
              <button
                className="jd-apply-btn"
                onClick={handleOpenApplyModal}
                disabled={isAuthenticated && (!isJobSeeker || isClosed)}
                style={
                  isAuthenticated && (!isJobSeeker || isClosed)
                    ? { opacity: 0.5, cursor: "not-allowed" }
                    : undefined
                }
              >
                {!isAuthenticated
                  ? "Sign in to apply"
                  : !isJobSeeker
                    ? "Job seekers only"
                    : isClosed
                      ? "Applications closed"
                      : "Apply now"}
              </button>
            )}

            {isJobSeeker && (
              <button
                className={`jd-save-btn ${saved ? "saved" : ""}`}
                onClick={handleToggleSave}
                disabled={saving || (isClosed && !saved)}
                title={isClosed && !saved ? "Cannot save a closed job" : ""}
              >
                {saved ? "🔖 Saved" : "🏷️ Save"}
              </button>
            )}
          </div>
        </div>
      </BorderGlow>

      {/* Two-column grid */}
      <div className="jd-grid">
        {/* ─── Left column ─── */}
        <div>
          <section className="jd-section">
            <div className="jd-section-title">About this role</div>
            <p className="jd-description">{job.description}</p>
          </section>

          <section className="jd-section">
            <div className="jd-section-title">What you'll need</div>
            <ul className="jd-list">
              {job.requirements.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </section>

          {job.perks && job.perks.length > 0 && (
            <section className="jd-section">
              <div className="jd-section-title">Perks & benefits</div>
              <div className="jd-perks">
                {job.perks.map((perk, i) => (
                  <span key={i} className="jd-perk">
                    {perk}
                  </span>
                ))}
              </div>
            </section>
          )}

          {job.hiringStages && job.hiringStages.length > 0 && (
            <section className="jd-section">
              <div className="jd-section-title">Hiring process</div>
              <div className="jd-stages">
                {job.hiringStages.map((stage, i) => (
                  <div key={stage} className="jd-stage">
                    <div className="jd-stage-dot">{i + 1}</div>
                    <div className="jd-stage-label">{STAGE_LABELS[stage] || stage}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ─── Right sidebar ─── */}
        <aside className="jd-aside">
          <section className="jd-section">
            <div className="jd-section-title">At a glance</div>
            {salary && (
              <div className="jd-info-row">
                <span className="jd-info-label">Salary</span>
                <span className="jd-info-value">
                  <CountUp from={0} to={salary.min} separator="," duration={1.2} />
                  {salary.max && (
                    <>
                      {" – "}
                      <CountUp from={0} to={salary.max} separator="," duration={1.4} />
                    </>
                  )}{" "}
                  {salary.currency}
                  {salary.period}
                </span>
              </div>
            )}
            <div className="jd-info-row">
              <span className="jd-info-label">Location</span>
              <span className="jd-info-value">{formatLocation(job.location)}</span>
            </div>
            <div className="jd-info-row">
              <span className="jd-info-label">Workplace</span>
              <span className="jd-info-value" style={{ textTransform: "capitalize" }}>
                {job.workplaceType}
              </span>
            </div>
            <div className="jd-info-row">
              <span className="jd-info-label">Employment</span>
              <span className="jd-info-value" style={{ textTransform: "capitalize" }}>
                {job.type}
              </span>
            </div>
            {job.experience?.minYears && (
              <div className="jd-info-row">
                <span className="jd-info-label">Experience</span>
                <span className="jd-info-value">{job.experience.minYears}+ years</span>
              </div>
            )}
            {job.requiredEducation && job.requiredEducation !== "none" && (
              <div className="jd-info-row">
                <span className="jd-info-label">Education</span>
                <span className="jd-info-value">
                  {EDUCATION_LABELS[job.requiredEducation]}
                  {job.requiredEducationField && (
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 400,
                        color: "var(--color-text-muted)",
                      }}
                    >
                      in {job.requiredEducationField}
                    </div>
                  )}
                </span>
              </div>
            )}
          </section>

          <section className="jd-section">
            <div className="jd-section-title">Activity</div>
            <div className="jd-stat">
              <div className="jd-stat-value">
                <CountUp from={0} to={job.viewCount} separator="," duration={1.5} />
              </div>
              <div className="jd-stat-label">Total views</div>
            </div>
            <div className="jd-stat">
              <div className="jd-stat-value">
                <CountUp from={0} to={job.applicantCount} duration={1.2} />
              </div>
              <div className="jd-stat-label">Applicants so far</div>
            </div>
            <div className="jd-stat">
              <div className="jd-stat-value">
                <CountUp from={0} to={job.totalSlots} duration={1} />
              </div>
              <div className="jd-stat-label">Open positions</div>
            </div>
            <div className="jd-stat">
              <div
                className="jd-stat-value"
                style={{
                  color: daysUntilDeadline <= 7 ? "#dc2626" : "var(--color-ink)",
                }}
              >
                <CountUp from={0} to={daysUntilDeadline} duration={1.3} />
              </div>
              <div className="jd-stat-label">
                {daysUntilDeadline === 0
                  ? "Deadline passed"
                  : daysUntilDeadline === 1
                    ? "Day left to apply"
                    : "Days left to apply"}
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Apply Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={handleCloseApplyModal}
        title={`Apply to ${job.title}`}
        onConfirm={handleSubmitApply}
        confirmText={submitting ? "Submitting…" : "Submit application"}
        confirmDisabled={submitting}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <p style={{ fontSize: 14, lineHeight: "20px", color: "var(--color-text-muted)" }}>
            Your profile (name, bio, skills, CV) is shared automatically.
            {job.requiresCoverLetter
              ? " A cover letter is required for this role."
              : " A cover letter is optional but recommended."}
          </p>

          <div>
            <button
              type="button"
              className="jd-ai-btn"
              onClick={handleGenerateCoverLetter}
              disabled={generating}
              title="Use AI to draft a starting point — you can edit before submitting"
            >
              {generating ? "✨ Generating…" : "✨ Generate cover letter with AI"}
            </button>
          </div>

          <textarea
            className="jd-apply-textarea"
            placeholder="Write a brief cover letter, or skip this field…"
            value={coverLetter}
            onChange={(e) => {
              setCoverLetter(e.target.value);
              if (coverError) setCoverError("");
            }}
            disabled={submitting || generating}
          />

          {coverError && (
            <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
              {coverError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default JobDetailPage;
