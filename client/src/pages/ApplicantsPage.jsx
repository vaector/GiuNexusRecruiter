import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { applicationsAPI, jobsAPI } from "../services/api";

const STAGES = ["pending", "screening", "interview", "offer", "contract_sent", "accepted", "rejected"];
const STATUS_OPTIONS = ["pending", "shortlisted", "rejected"];

const formatLabel = (value) =>
  (value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDate = (date) => {
  if (!date) return "Not recorded";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ApplicantsPage() {
  const { jobId } = useParams();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadApplicants = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await jobsAPI.getApplicants(jobId);
        if (mounted) setApplications(res.data.applications || []);
      } catch (err) {
        if (mounted) {
          setError(err.response?.data?.message || "Failed to load applicants");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadApplicants();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const stats = useMemo(() => {
    const total = applications.length;
    const shortlisted = applications.filter((app) => app.status === "shortlisted").length;
    const rejected = applications.filter((app) => app.status === "rejected").length;
    const pending = total - shortlisted - rejected;
    return { total, pending, shortlisted, rejected };
  }, [applications]);

  const updateApplication = (id, patch) => {
    setApplications((current) =>
      current.map((app) =>
        app._id === id
          ? {
              ...app,
              ...patch,
              user: patch.user ? { ...app.user, ...patch.user } : app.user,
              job: patch.job ? { ...app.job, ...patch.job } : app.job,
            }
          : app
      )
    );
  };

  const handleStatusChange = async (application, status) => {
    setSavingId(application._id);
    setError("");
    setSuccess("");
    try {
      const res = await applicationsAPI.updateApplicationStatus(application._id, status);
      updateApplication(application._id, res.data.application || { status });
      setSuccess("Application status updated");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update application status");
    } finally {
      setSavingId(null);
    }
  };

  const handleNotesBlur = async (application, recruiterNotes) => {
    if ((application.recruiterNotes || "") === recruiterNotes) return;

    setSavingId(application._id);
    setError("");
    setSuccess("");
    try {
      const res = await applicationsAPI.updateRecruiterNotes(application._id, recruiterNotes);
      updateApplication(application._id, res.data.application || { recruiterNotes });
      setSuccess("Recruiter notes saved");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save recruiter notes");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="applicants-page">
      <div className="applicants-shell">
        <div className="applicants-kicker">Recruiting Pipeline</div>
        <div className="applicants-header">
          <div>
            <h1>Applicants</h1>
            <p>Review candidates, update hiring status, and keep recruiter notes per application.</p>
          </div>
          <Link to="/recruiter/jobs" className="applicants-link">Back to Jobs</Link>
        </div>

        <div className="applicants-stats">
          <Stat label="Total" value={stats.total} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Shortlisted" value={stats.shortlisted} />
          <Stat label="Rejected" value={stats.rejected} />
        </div>

        {error && <div className="applicants-alert error">{error}</div>}
        {success && <div className="applicants-alert success">{success}</div>}

        {loading ? (
          <div className="applicants-empty">Loading applicants...</div>
        ) : applications.length === 0 ? (
          <div className="applicants-empty">No applicants for this job yet.</div>
        ) : (
          <div className="applicants-list">
            {applications.map((application) => {
              const candidate = application.user || {};
              const currentStage =
                application.stageHistory?.[application.stageHistory.length - 1]?.stage ||
                application.status;

              return (
                <article key={application._id} className="applicant-row">
                  <div className="applicant-main">
                    <div className="applicant-avatar">
                      {(candidate.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="applicant-info">
                      <div className="applicant-name">{candidate.name || "Unknown applicant"}</div>
                      <div className="applicant-email">{candidate.email || "No email"}</div>
                      <div className="applicant-meta">
                        <span>Applied {formatDate(application.appliedAt)}</span>
                        <span>{application.aiMatchScore ?? "N/A"}% AI match</span>
                      </div>
                      <div className="skill-list">
                        {(candidate.skills || []).slice(0, 6).map((skill) => (
                          <span key={skill}>{skill}</span>
                        ))}
                        {(candidate.skills || []).length === 0 && <span>No skills listed</span>}
                      </div>
                    </div>
                  </div>

                  <div className="applicant-controls">
                    <label>
                      Status
                      <select
                        value={application.status}
                        disabled={savingId === application._id}
                        onChange={(event) => handleStatusChange(application, event.target.value)}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {formatLabel(status)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Recruiter Notes
                      <textarea
                        defaultValue={application.recruiterNotes || ""}
                        maxLength={1000}
                        placeholder="Add private notes for this applicant"
                        disabled={savingId === application._id}
                        onBlur={(event) => handleNotesBlur(application, event.target.value)}
                      />
                    </label>
                  </div>

                  <div className="stage-line" aria-label="Hiring stage">
                    {STAGES.map((stage) => {
                      const reached = (application.stageHistory || []).some((item) => item.stage === stage);
                      const active = stage === currentStage;
                      return (
                        <span
                          key={stage}
                          className={`stage-pill ${reached ? "reached" : ""} ${active ? "active" : ""}`}
                        >
                          {formatLabel(stage)}
                        </span>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .applicants-page {
          min-height: 100vh;
          background: #030303;
          color: #eaf2ff;
          padding: 96px 1.5rem 4rem;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .applicants-shell {
          max-width: 1180px;
          margin: 0 auto;
        }
        .applicants-kicker {
          color: #00e5cc;
          font: 600 0.7rem 'JetBrains Mono', monospace;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 0.65rem;
        }
        .applicants-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .applicants-header h1 {
          margin: 0 0 0.4rem;
          font-size: clamp(1.8rem, 4vw, 3rem);
          letter-spacing: 0;
        }
        .applicants-header p {
          margin: 0;
          color: rgba(234, 242, 255, 0.55);
          max-width: 620px;
          line-height: 1.6;
        }
        .applicants-link {
          color: #00e5cc;
          border: 1px solid rgba(0, 229, 204, 0.22);
          padding: 0.65rem 0.85rem;
          border-radius: 4px;
          text-decoration: none;
          font-size: 0.82rem;
        }
        .applicants-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .stat-card, .applicant-row {
          background: rgba(6, 12, 24, 0.9);
          border: 1px solid rgba(0, 229, 204, 0.12);
          border-radius: 4px;
        }
        .stat-card {
          padding: 1rem;
        }
        .stat-value {
          font-size: 1.7rem;
          font-weight: 700;
          color: #00e5cc;
        }
        .stat-label {
          font-size: 0.7rem;
          color: rgba(234, 242, 255, 0.45);
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .applicants-alert, .applicants-empty {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          background: rgba(255, 255, 255, 0.04);
          color: rgba(234, 242, 255, 0.72);
        }
        .applicants-alert.error {
          color: #ff9aa5;
          border: 1px solid rgba(255, 0, 60, 0.25);
        }
        .applicants-alert.success {
          color: #00e5cc;
          border: 1px solid rgba(0, 229, 204, 0.22);
        }
        .applicants-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .applicant-row {
          padding: 1rem;
          display: grid;
          grid-template-columns: minmax(260px, 1fr) minmax(300px, 420px);
          gap: 1rem;
        }
        .applicant-main {
          display: flex;
          gap: 0.85rem;
          min-width: 0;
        }
        .applicant-avatar {
          width: 42px;
          height: 42px;
          border-radius: 4px;
          display: grid;
          place-items: center;
          background: rgba(0, 229, 204, 0.1);
          color: #00e5cc;
          flex: 0 0 auto;
        }
        .applicant-info {
          min-width: 0;
        }
        .applicant-name {
          font-weight: 700;
          margin-bottom: 0.2rem;
        }
        .applicant-email, .applicant-meta {
          color: rgba(234, 242, 255, 0.45);
          font-size: 0.82rem;
        }
        .applicant-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
          margin: 0.45rem 0;
        }
        .skill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }
        .skill-list span, .stage-pill {
          border-radius: 3px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: rgba(234, 242, 255, 0.6);
          font-size: 0.72rem;
          padding: 0.22rem 0.45rem;
        }
        .applicant-controls {
          display: grid;
          gap: 0.75rem;
        }
        .applicant-controls label {
          display: grid;
          gap: 0.35rem;
          color: rgba(234, 242, 255, 0.55);
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .applicant-controls select,
        .applicant-controls textarea {
          width: 100%;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #eaf2ff;
          border-radius: 4px;
          padding: 0.65rem;
          font: inherit;
          letter-spacing: 0;
          text-transform: none;
        }
        .applicant-controls textarea {
          min-height: 86px;
          resize: vertical;
        }
        .stage-line {
          grid-column: 1 / -1;
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .stage-pill.reached {
          border-color: rgba(0, 229, 204, 0.22);
          color: rgba(0, 229, 204, 0.8);
        }
        .stage-pill.active {
          background: rgba(0, 229, 204, 0.12);
          color: #eaf2ff;
        }
        @media (max-width: 780px) {
          .applicants-stats, .applicant-row {
            grid-template-columns: 1fr;
          }
          .applicants-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}