import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jobsAPI } from "../services/api";

const formatLocation = (location) => {
  if (!location) return "";
  if (typeof location === "string") return location;
  if (typeof location === "object") {
    return [location.city, location.country].filter(Boolean).join(", ");
  }
  return String(location);
};

const formatSalary = (salary) => {
  if (!salary) return "";
  const amount = salary.min ?? salary.amount;
  if (amount == null) return "";
  return `${amount.toLocaleString?.() ?? amount} ${salary.currency || ""}`.trim();
};

const SavedJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSavedJobs = async () => {
      try {
        const { data } = await jobsAPI.getSavedJobs();
        setJobs(data.jobs || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load saved jobs.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSavedJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUnsave = async (jobId) => {
    try {
      setUpdatingId(jobId);
      await jobsAPI.saveJob(jobId);
      setJobs((currentJobs) => currentJobs.filter((job) => job._id !== jobId));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to remove this saved job.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <SavedJobsShell>
        <section className="saved-state-card">
          <p className="nexus-eyebrow">Job Seeker</p>
          <h1>Loading saved jobs</h1>
          <p>Your bookmarked opportunities are being synced.</p>
        </section>
      </SavedJobsShell>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <SavedJobsShell>
        <section className="saved-state-card">
          <p className="nexus-eyebrow">Saved Jobs</p>
          <h1>Saved jobs unavailable</h1>
          <p>{error}</p>
          <Link className="nexus-btn primary saved-state-action" to="/jobs">
            Browse jobs
          </Link>
        </section>
      </SavedJobsShell>
    );
  }

  return (
    <SavedJobsShell>
      <div className="saved-header">
        <p className="nexus-eyebrow">Job Seeker</p>
        <div className="saved-title-row">
          <h1>Saved jobs</h1>
          <span>{jobs.length} saved</span>
        </div>
        <p>Keep track of roles you want to revisit, compare, or apply to later.</p>
      </div>

      {error ? <p className="saved-inline-alert">{error}</p> : null}

      {jobs.length === 0 ? (
        <section className="saved-empty-card">
          <p className="nexus-eyebrow">No Saved Jobs</p>
          <h2>Your saved list is empty</h2>
          <p>Browse open roles and save the ones you want to revisit.</p>
          <Link className="nexus-btn primary saved-state-action" to="/jobs">
            Browse jobs
          </Link>
        </section>
      ) : (
        <div className="saved-grid">
          {jobs.map((job) => {
            const location = formatLocation(job.location);
            const salary = formatSalary(job.salary);

            return (
              <article className="saved-card" key={job._id}>
                <div className="saved-card-top">
                  <div>
                    <h2>
                      <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                    </h2>
                    <p>{job.company || "Unknown company"}</p>
                  </div>

                  <span className={`saved-status ${job.status === "open" ? "open" : "closed"}`}>
                    {job.status || "unknown"}
                  </span>
                </div>

                <p className="saved-description">
                  {job.description || "No description available."}
                </p>

                <div className="saved-meta">
                  {location ? <span>{location}</span> : null}
                  {job.type ? <span>{job.type}</span> : null}
                  {job.category ? <span>{job.category}</span> : null}
                  {salary ? <span>{salary}</span> : null}
                </div>

                <div className="saved-actions">
                  <Link className="nexus-btn secondary" to={`/jobs/${job._id}`}>
                    View job
                  </Link>
                  <button
                    className="nexus-btn primary"
                    type="button"
                    onClick={() => handleUnsave(job._id)}
                    disabled={updatingId === job._id}
                  >
                    {updatingId === job._id ? "Removing..." : "Unsave"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </SavedJobsShell>
  );
};

const SavedJobsShell = ({ children }) => (
  <main className="saved-page">
    <div className="saved-bg-grid" aria-hidden="true" />
    <div className="saved-container">{children}</div>

    <style>{`
      .saved-page {
        min-height: calc(100vh - 64px);
        position: relative;
        overflow-x: hidden;
        padding: clamp(6rem, 11vh, 7.5rem) clamp(1rem, 4vw, 3rem) clamp(3rem, 7vh, 5rem);
        background:
          linear-gradient(135deg, rgba(0, 229, 204, 0.08), transparent 34%),
          radial-gradient(circle at 78% 16%, rgba(0, 229, 204, 0.12), transparent 28%),
          var(--bg-base);
      }

      .saved-bg-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
        opacity: 0.35;
      }

      .saved-container {
        width: min(1180px, 100%);
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }

      .saved-header {
        margin-bottom: 1.5rem;
      }

      .saved-title-row {
        display: flex;
        align-items: baseline;
        gap: 1rem;
        flex-wrap: wrap;
        margin-top: 0.75rem;
      }

      .saved-title-row h1,
      .saved-state-card h1 {
        font-family: var(--font-display);
        font-size: clamp(1.85rem, 4vw, 3rem);
        line-height: 1.08;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-primary);
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }

      .saved-title-row span {
        color: var(--accent);
        font-family: var(--font-mono);
        font-size: 0.68rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .saved-header > p:not(.nexus-eyebrow),
      .saved-state-card p:not(.nexus-eyebrow),
      .saved-empty-card p:not(.nexus-eyebrow) {
        max-width: 680px;
        margin-top: 0.9rem;
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1.7;
      }

      .saved-inline-alert {
        margin-bottom: 1rem;
        border: 1px solid rgba(255, 78, 110, 0.35);
        border-radius: var(--rounded-md);
        background: rgba(255, 78, 110, 0.08);
        color: #ff8ca3;
        padding: 0.85rem 1rem;
        font-size: 0.86rem;
        line-height: 1.45;
      }

      .saved-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
        gap: 1rem;
      }

      .saved-card,
      .saved-state-card,
      .saved-empty-card {
        border: 1px solid var(--border-glow);
        border-radius: var(--rounded-md);
        background: var(--bg-surface-solid);
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48), 0 0 1px rgba(0, 229, 204, 0.3);
        padding: clamp(1.25rem, 3vw, 1.5rem);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
      }

      .saved-card {
        min-height: 330px;
        display: flex;
        flex-direction: column;
        gap: 0.95rem;
        min-width: 0;
      }

      .saved-card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      .saved-card h2 {
        margin-bottom: 0.45rem;
        font-family: var(--font-display);
        font-size: 1rem;
        line-height: 1.3;
        text-transform: uppercase;
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }

      .saved-card h2 a {
        color: var(--text-primary);
      }

      .saved-card-top p {
        color: var(--text-muted);
        font-size: 0.92rem;
        overflow-wrap: anywhere;
      }

      .saved-status {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        border-radius: var(--rounded-pill);
        padding: 0.3rem 0.65rem;
        font-family: var(--font-mono);
        font-size: 0.64rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .saved-status.open {
        border: 1px solid rgba(74, 222, 128, 0.35);
        color: #4ade80;
        background: rgba(74, 222, 128, 0.08);
      }

      .saved-status.closed {
        border: 1px solid rgba(255, 78, 110, 0.35);
        color: #ff8ca3;
        background: rgba(255, 78, 110, 0.08);
      }

      .saved-description {
        color: var(--text-muted);
        font-size: 0.94rem;
        line-height: 1.65;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .saved-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: auto;
      }

      .saved-meta span {
        display: inline-flex;
        align-items: center;
        min-height: 28px;
        border: 1px solid var(--border-glass);
        border-radius: var(--rounded-pill);
        background: rgba(255, 255, 255, 0.035);
        color: var(--text-secondary);
        padding: 0.3rem 0.65rem;
        font-family: var(--font-mono);
        font-size: 0.64rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        max-width: 100%;
        overflow-wrap: anywhere;
      }

      .saved-actions {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding-top: 0.25rem;
      }

      .saved-actions .nexus-btn {
        min-height: 42px;
      }

      .saved-state-card {
        width: min(620px, 100%);
        margin: 0 auto;
        text-align: center;
      }

      .saved-state-card h1,
      .saved-state-card p {
        margin-left: auto;
        margin-right: auto;
      }

      .saved-empty-card {
        width: min(720px, 100%);
      }

      .saved-empty-card h2 {
        margin-top: 0.7rem;
        font-family: var(--font-display);
        font-size: clamp(1.35rem, 3vw, 1.8rem);
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0;
      }

      .saved-state-action {
        min-height: 46px;
        margin-top: 1.4rem;
      }

      @media (max-width: 620px) {
        .saved-page {
          padding: 5.5rem 1rem 2rem;
        }

        .saved-card-top {
          flex-direction: column;
        }

        .saved-actions .nexus-btn {
          width: 100%;
        }

        .saved-title-row h1,
        .saved-state-card h1 {
          font-size: clamp(1.5rem, 9vw, 2.1rem);
          line-height: 1.12;
        }
      }
    `}</style>
  </main>
);

export default SavedJobsPage;
