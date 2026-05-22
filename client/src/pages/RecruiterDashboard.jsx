import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { jobsAPI } from "../services/api";
import PageLoader from "../components/PageLoader";

export default function RecruiterDashboard() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    jobsAPI.getMyJobs()
      .then(({ data }) => {
        const jobList = Array.isArray(data) ? data :
                        Array.isArray(data.data) ? data.data :
                        Array.isArray(data.jobs) ? data.jobs : [];
        Promise.all(
          jobList.map((job) =>
            jobsAPI.getApplicants(job._id)
              .then(({ data: appData }) => {
                const count = Array.isArray(appData) ? appData.length :
                              Array.isArray(appData.data) ? appData.data.length :
                              Array.isArray(appData.applications) ? appData.applications.length : 0;
                return { ...job, applicantCount: count };
              })
              .catch(() => ({ ...job, applicantCount: 0 }))
          )
        ).then(setJobs);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell>
      {user?.status === "pending" && (
        <div className="rd-banner">
          <span className="rd-banner-text">Your account is pending admin approval. You cannot post jobs yet.</span>
        </div>
      )}

      <div className="rd-header">
        <div>
          <p className="nexus-eyebrow">Recruiter</p>
          <h1>My job posts</h1>
        </div>
        {user?.status === "approved" && (
          <Link className="nexus-btn primary rd-create-btn" to="/recruiter/jobs/create">
            Post a Job
          </Link>
        )}
      </div>

      {error && <div className="rd-error">{error}</div>}

      {loading ? <PageLoader /> : jobs.length === 0 && !error ? (
        <section className="rd-state-card">
          <p className="nexus-eyebrow">No Jobs</p>
          <h2>No jobs posted yet</h2>
          <p>Start hiring by posting your first job listing.</p>
          {user?.status === "approved" && (
            <Link className="nexus-btn primary rd-state-action" to="/recruiter/jobs/create">Post a Job</Link>
          )}
        </section>
      ) : (
        <div className="rd-grid">
          {jobs.map((job) => (
            <article className="rd-card" key={job._id}>
              <div className="rd-card-top">
                <div>
                  <h2>{job.title}</h2>
                  <p className="rd-meta">
                    {job.company} &middot; {typeof job.location === 'object' ? `${job.location.city}, ${job.location.country}` : job.location} &middot; {job.type}
                  </p>
                </div>
                <span className={`rd-status ${job.status === "open" ? "open" : "closed"}`}>
                  {job.status}
                </span>
              </div>

              {job.category && (
                <span className="rd-category">{job.category}</span>
              )}

              <div className="rd-card-bottom">
                <span className="rd-applicant-count">
                  {job.applicantCount ?? 0} applicant{(job.applicantCount ?? 0) !== 1 ? "s" : ""}
                </span>
                <div className="rd-actions">
                  <Link className="nexus-btn secondary" to={`/recruiter/applicants/${job._id}`}>
                    Applicants
                  </Link>
                  <Link className="nexus-btn secondary" to={`/recruiter/jobs/${job._id}/edit`}>
                    Edit
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

const DashboardShell = ({ children }) => (
  <main className="rd-page">
    <div className="rd-bg-grid" aria-hidden="true" />
    <div className="rd-vignette" aria-hidden="true" />
    <div className="rd-grain" aria-hidden="true" />
    <div className="rd-container">{children}</div>

    <style>{`
      .rd-page {
        min-height: calc(100vh - 64px);
        position: relative;
        overflow: hidden;
        padding: clamp(6rem, 11vh, 7.5rem) clamp(1rem, 4vw, 3rem) clamp(3rem, 7vh, 5rem);
        background:
          linear-gradient(135deg, rgba(0, 229, 204, 0.08), transparent 34%),
          radial-gradient(circle at 78% 16%, rgba(0, 229, 204, 0.12), transparent 28%),
          var(--bg-base);
      }

      .rd-bg-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
        opacity: 0.35;
      }

      .rd-grain {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        opacity: 0.05;
        pointer-events: none;
        z-index: 0;
      }

      .rd-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%);
        pointer-events: none;
        z-index: 0;
      }

      .rd-container {
        width: min(1180px, 100%);
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }

      .rd-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
      }

      .rd-header h1 {
        font-family: var(--font-display);
        font-size: clamp(1.85rem, 4vw, 3rem);
        line-height: 1.08;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-primary);
        letter-spacing: 0;
        overflow-wrap: anywhere;
        margin-top: 0.75rem;
      }

      .rd-create-btn {
        min-height: 42px;
      }

      .rd-banner {
        background: rgba(250, 204, 21, 0.08);
        border: 1px solid rgba(250, 204, 21, 0.35);
        border-radius: var(--rounded-md);
        padding: 0.85rem 1rem;
        margin-bottom: 1.5rem;
      }

      .rd-banner-text {
        color: #fde68a;
        font-family: var(--font-mono);
        font-size: 0.72rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .rd-error {
        margin-bottom: 1rem;
        border: 1px solid rgba(255, 78, 110, 0.35);
        border-radius: var(--rounded-md);
        background: rgba(255, 78, 110, 0.08);
        color: #ff8ca3;
        padding: 0.85rem 1rem;
        font-size: 0.86rem;
        line-height: 1.45;
      }

      .rd-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 1rem;
      }

      .rd-card,
      .rd-state-card {
        border: 1px solid var(--border-glow);
        border-radius: var(--rounded-md);
        background: var(--bg-surface-solid);
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48), 0 0 1px rgba(0, 229, 204, 0.3);
        padding: clamp(1.25rem, 3vw, 1.5rem);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
      }

      .rd-card {
        display: flex;
        flex-direction: column;
        gap: 0.95rem;
      }

      .rd-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
      }

      .rd-card h2 {
        margin-bottom: 0.35rem;
        font-family: var(--font-display);
        font-size: 1rem;
        line-height: 1.3;
        text-transform: uppercase;
        letter-spacing: 0;
        overflow-wrap: anywhere;
        color: var(--text-primary);
      }

      .rd-meta {
        color: var(--text-muted);
        font-size: 0.88rem;
        margin: 0;
      }

      .rd-status {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        border-radius: var(--rounded-pill);
        padding: 0.3rem 0.65rem;
        font-family: var(--font-mono);
        font-size: 0.64rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .rd-status.open {
        border: 1px solid rgba(74, 222, 128, 0.35);
        color: #4ade80;
        background: rgba(74, 222, 128, 0.08);
      }

      .rd-status.closed {
        border: 1px solid rgba(255, 78, 110, 0.35);
        color: #ff8ca3;
        background: rgba(255, 78, 110, 0.08);
      }

      .rd-category {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        border: 1px solid var(--accent-dim);
        border-radius: var(--rounded-pill);
        background: var(--accent-dim);
        color: var(--accent);
        padding: 0.25rem 0.65rem;
        font-family: var(--font-mono);
        font-size: 0.64rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        width: fit-content;
      }

      .rd-card-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: auto;
      }

      .rd-applicant-count {
        font-family: var(--font-mono);
        font-size: 0.68rem;
        letter-spacing: 0.06em;
        color: var(--text-muted);
        text-transform: uppercase;
      }

      .rd-actions {
        display: flex;
        gap: 0.5rem;
      }

      .rd-actions .nexus-btn {
        min-height: 36px;
      }

      .rd-state-card {
        width: min(620px, 100%);
        margin: 0 auto;
        text-align: center;
      }

      .rd-state-card h2 {
        margin-top: 0.7rem;
        font-family: var(--font-display);
        font-size: clamp(1.35rem, 3vw, 1.8rem);
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0;
      }

      .rd-state-card p:not(.nexus-eyebrow) {
        max-width: 480px;
        margin: 0.9rem auto 0;
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1.7;
      }

      .rd-state-action {
        min-height: 46px;
        margin-top: 1.4rem;
      }

      @media (max-width: 620px) {
        .rd-page {
          padding: 5.5rem 1rem 2rem;
        }

        .rd-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .rd-header h1 {
          font-size: clamp(1.5rem, 9vw, 2.1rem);
          line-height: 1.12;
        }

        .rd-card-top {
          flex-direction: column;
        }

        .rd-actions .nexus-btn {
          width: 100%;
        }
      }
    `}</style>
  </main>
);
