import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jobsAPI } from "../services/api";

const RecommendedJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const formatLocation = (location) => {
    if (!location) return "";
    if (typeof location === "string") return location;
    if (typeof location === "object") {
      return [location.city, location.country].filter(Boolean).join(", ");
    }
    return String(location);
  };

  useEffect(() => {
    let isMounted = true;

    const loadRecommendedJobs = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await jobsAPI.getRecommendedJobs();
        const recommendedJobs = Array.isArray(response.data?.jobs) ? response.data.jobs : [];

        if (isMounted) {
          setJobs(
            [...recommendedJobs].sort(
              (firstJob, secondJob) => (secondJob.score || 0) - (firstJob.score || 0)
            )
          );
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.response?.data?.message || "Failed to load recommended jobs.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRecommendedJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <RecommendedShell>
        <section className="recommended-state-card">
          <p className="nexus-eyebrow">Job Seeker</p>
          <h1>Loading matches</h1>
          <p>Your recommended jobs are being ranked by profile similarity.</p>
        </section>
      </RecommendedShell>
    );
  }

  if (error) {
    return (
      <RecommendedShell>
        <section className="recommended-state-card">
          <p className="nexus-eyebrow">Job Seeker</p>
          <h1>Recommendations unavailable</h1>
          <p>{error}</p>
          <Link className="nexus-btn primary recommended-state-action" to="/jobs">
            Browse all jobs
          </Link>
        </section>
      </RecommendedShell>
    );
  }

  return (
    <RecommendedShell>
      <div className="recommended-header">
        <p className="nexus-eyebrow">Job Seeker</p>
        <h1>Recommended jobs for you</h1>
        <p>These jobs are ranked by AI similarity score using your profile skills.</p>
      </div>

      {jobs.length === 0 ? (
        <section className="recommended-empty-card">
          <p className="nexus-eyebrow">No Matches</p>
          <h2>No recommendations yet</h2>
          <p>
            We could not rank any jobs for your profile. Add skills to your profile
            and come back again.
          </p>
          <Link className="nexus-btn primary recommended-state-action" to="/profile">
            View profile
          </Link>
        </section>
      ) : (
        <div className="recommended-grid">
          {jobs.map((job) => {
            const score = typeof job.score === "number" && isFinite(job.score)
              ? Math.round(Math.max(0, Math.min(1, job.score)) * 100)
              : null;
            const location = formatLocation(job.location);

            return (
              <article className="recommended-card" key={job._id}>
                <div className="recommended-card-top">
                  <div>
                    <h2>
                      <Link to={`/jobs/${job._id}`}>{job.title}</Link>
                    </h2>
                    <p>{job.company || "Unknown company"}</p>
                  </div>

                  <span className="recommended-match-pill">
                    {score !== null ? `${score}% match` : "AI match"}
                  </span>
                </div>

                <p className="recommended-description">
                  {job.description || "No description available."}
                </p>

                <div className="recommended-meta">
                  {location ? <span>{location}</span> : null}
                  {job.type ? <span>{job.type}</span> : null}
                  {job.category ? <span>{job.category}</span> : null}
                </div>

                <Link className="nexus-btn secondary recommended-card-link" to={`/jobs/${job._id}`}>
                  View job
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </RecommendedShell>
  );
};

const RecommendedShell = ({ children }) => (
  <main className="recommended-page">
    <div className="recommended-bg-grid" aria-hidden="true" />
    <div className="recommended-container">{children}</div>

    <style>{`
      .recommended-page {
        min-height: calc(100vh - 64px);
        position: relative;
        overflow: hidden;
        padding: clamp(6rem, 11vh, 7.5rem) clamp(1rem, 4vw, 3rem) clamp(3rem, 7vh, 5rem);
        background:
          linear-gradient(135deg, rgba(0, 229, 204, 0.08), transparent 34%),
          radial-gradient(circle at 78% 16%, rgba(0, 229, 204, 0.12), transparent 28%),
          var(--bg-base);
      }

      .recommended-bg-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
        opacity: 0.35;
      }

      .recommended-container {
        width: min(1180px, 100%);
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }

      .recommended-header {
        margin-bottom: 1.5rem;
      }

      .recommended-header h1,
      .recommended-state-card h1 {
        max-width: 820px;
        margin-top: 0.75rem;
        font-family: var(--font-display);
        font-size: clamp(1.85rem, 4vw, 3rem);
        line-height: 1.08;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-primary);
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }

      .recommended-header p:not(.nexus-eyebrow),
      .recommended-state-card p:not(.nexus-eyebrow),
      .recommended-empty-card p:not(.nexus-eyebrow) {
        max-width: 680px;
        margin-top: 0.9rem;
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1.7;
      }

      .recommended-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1rem;
      }

      .recommended-card,
      .recommended-state-card,
      .recommended-empty-card {
        border: 1px solid var(--border-glow);
        border-radius: var(--rounded-md);
        background: var(--bg-surface-solid);
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48), 0 0 1px rgba(0, 229, 204, 0.3);
        padding: clamp(1.25rem, 3vw, 1.5rem);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
      }

      .recommended-card {
        min-height: 320px;
        display: flex;
        flex-direction: column;
        gap: 0.95rem;
      }

      .recommended-card-top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        min-width: 0;
      }

      .recommended-card-top > div {
        min-width: 0;
        flex: 1;
      }

      .recommended-card h2 {
        margin-bottom: 0.45rem;
        font-family: var(--font-display);
        font-size: 1rem;
        line-height: 1.3;
        text-transform: uppercase;
        letter-spacing: 0;
        overflow-wrap: break-word;
        word-break: break-word;
      }

      .recommended-card h2 a {
        color: var(--text-primary);
      }

      .recommended-card-top p {
        color: var(--text-muted);
        font-size: 0.92rem;
      }

      .recommended-match-pill {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--accent-mid);
        border-radius: var(--rounded-pill);
        background: var(--accent-dim);
        color: var(--accent);
        padding: 0.35rem 0.65rem;
        font-family: var(--font-mono);
        font-size: 0.64rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .recommended-description {
        color: var(--text-muted);
        font-size: 0.94rem;
        line-height: 1.65;
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .recommended-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: auto;
      }

      .recommended-meta span {
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
      }

      .recommended-card-link {
        align-self: flex-start;
        margin-top: 0.2rem;
      }

      .recommended-state-card {
        width: min(620px, 100%);
        margin: 0 auto;
        text-align: center;
      }

      .recommended-state-card h1,
      .recommended-state-card p {
        margin-left: auto;
        margin-right: auto;
      }

      .recommended-empty-card {
        width: min(720px, 100%);
      }

      .recommended-empty-card h2 {
        margin-top: 0.7rem;
        font-family: var(--font-display);
        font-size: clamp(1.35rem, 3vw, 1.8rem);
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0;
      }

      .recommended-state-action {
        min-height: 46px;
        margin-top: 1.4rem;
      }

      @media (max-width: 620px) {
        .recommended-page {
          padding: 5.5rem 1rem 2rem;
        }

        .recommended-card-top {
          flex-direction: column;
        }

        .recommended-header h1,
        .recommended-state-card h1 {
          font-size: clamp(1.5rem, 9vw, 2.1rem);
          line-height: 1.12;
        }
      }
    `}</style>
  </main>
);

export default RecommendedJobsPage;
