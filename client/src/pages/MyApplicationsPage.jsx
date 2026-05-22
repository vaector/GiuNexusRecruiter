import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { applicationsAPI } from "../services/api";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge";
import PageLoader from "../components/PageLoader";

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [withdrawingId, setWithdrawingId] = useState(null);

  const loadApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await applicationsAPI.getMyApplications();
      setApplications(res.data.applications || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const withdraw = async (id) => {
    setWithdrawingId(id);
    setError("");
    try {
      await applicationsAPI.withdrawApplication(id);
      setApplications((items) => items.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to withdraw application.");
    } finally {
      setWithdrawingId(null);
    }
  };

  const buildMessageUrl = (application) => {
    const job = application.job || {};
    const params = new URLSearchParams();
    params.set("role", "recruiter");
    if (job.title) params.set("job", job.title);
    return `/conversations/${job._id}?${params.toString()}`;
  };

  return (
    <ApplicationsShell>
      <div className="ma-header">
        <p className="nexus-eyebrow">Job Seeker</p>
        <h1>My applications</h1>
        <p>Track every role you have applied for and monitor your progress.</p>
      </div>

      {error && <div className="ma-error">{error}</div>}

      {loading ? <PageLoader /> : applications.length === 0 ? (
        <section className="ma-state-card">
          <p className="nexus-eyebrow">No Applications</p>
          <h2>No applications yet</h2>
          <p>Apply to jobs to track them here.</p>
          <Link className="nexus-btn primary ma-state-action" to="/jobs">Browse jobs</Link>
        </section>
      ) : (
        <div className="ma-grid">
          {applications.map((application) => {
            const job = application.job || {};
            return (
              <article className="ma-card" key={application._id}>
                <div className="ma-card-top">
                  <div>
                    <h2>
                      <Link to={`/applications/${application._id}`}>{job.title || "Deleted job"}</Link>
                    </h2>
                    <p>{[job.company, job.location?.city, job.type].filter(Boolean).join(" | ")}</p>
                    {application.applicationCode && (
                      <span className="ma-code">Code: {application.applicationCode}</span>
                    )}
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                <div className="ma-actions">
                  {job._id && <Link className="nexus-btn secondary" to={`/jobs/${job._id}`}>View job</Link>}
                  {job._id && application.status !== "rejected" && (
                    <Link className="nexus-btn secondary" to={buildMessageUrl(application)}>
                      Message recruiter
                    </Link>
                  )}
                  <Link className="nexus-btn secondary" to={`/documents/${application._id}`}>Documents</Link>
                  <button
                    className="nexus-btn danger"
                    type="button"
                    disabled={withdrawingId === application._id}
                    onClick={() => withdraw(application._id)}
                  >
                    {withdrawingId === application._id ? "Withdrawing..." : "Withdraw"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </ApplicationsShell>
  );
}

const ApplicationsShell = ({ children }) => (
  <main className="ma-page">
    <div className="ma-bg-grid" aria-hidden="true" />
    <div className="ma-vignette" aria-hidden="true" />
    <div className="ma-grain" aria-hidden="true" />
    <div className="ma-container">{children}</div>

    <style>{`
      .ma-page {
        min-height: calc(100vh - 64px);
        position: relative;
        overflow: hidden;
        padding: clamp(6rem, 11vh, 7.5rem) clamp(1rem, 4vw, 3rem) clamp(3rem, 7vh, 5rem);
        background:
          linear-gradient(135deg, rgba(0, 229, 204, 0.08), transparent 34%),
          radial-gradient(circle at 78% 16%, rgba(0, 229, 204, 0.12), transparent 28%),
          var(--bg-base);
      }

      .ma-bg-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
        opacity: 0.35;
      }

      .ma-grain {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        opacity: 0.05;
        pointer-events: none;
        z-index: 0;
      }

      .ma-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%);
        pointer-events: none;
        z-index: 0;
      }

      .ma-container {
        width: min(1180px, 100%);
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }

      .ma-header {
        margin-bottom: 1.5rem;
      }

      .ma-header h1 {
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

      .ma-header p:not(.nexus-eyebrow),
      .ma-state-card p:not(.nexus-eyebrow) {
        max-width: 680px;
        margin-top: 0.9rem;
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1.7;
      }

      .ma-error {
        margin-bottom: 1rem;
        border: 1px solid rgba(255, 78, 110, 0.35);
        border-radius: var(--rounded-md);
        background: rgba(255, 78, 110, 0.08);
        color: #ff8ca3;
        padding: 0.85rem 1rem;
        font-size: 0.86rem;
        line-height: 1.45;
      }

      .ma-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 1rem;
      }

      .ma-card,
      .ma-state-card {
        border: 1px solid var(--border-glow);
        border-radius: var(--rounded-md);
        background: var(--bg-surface-solid);
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48), 0 0 1px rgba(0, 229, 204, 0.3);
        padding: clamp(1.25rem, 3vw, 1.5rem);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
      }

      .ma-card {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .ma-card-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .ma-card h2 {
        margin-bottom: 0.45rem;
        font-family: var(--font-display);
        font-size: 1rem;
        line-height: 1.3;
        text-transform: uppercase;
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }

      .ma-card h2 a {
        color: var(--text-primary);
      }

      .ma-card h2 a:hover {
        color: var(--accent);
      }

      .ma-card-top p {
        color: var(--text-muted);
        font-size: 0.92rem;
      }

      .ma-code {
        display: inline-flex;
        align-items: center;
        margin-top: 0.35rem;
        border: 1px solid var(--border-glass);
        border-radius: var(--rounded-pill);
        background: rgba(255, 255, 255, 0.035);
        color: var(--text-tertiary);
        padding: 0.2rem 0.55rem;
        font-family: var(--font-mono);
        font-size: 0.62rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }

      .ma-actions {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding-top: 0.25rem;
      }

      .ma-actions .nexus-btn {
        min-height: 38px;
      }

      .ma-state-card {
        width: min(620px, 100%);
        margin: 0 auto;
        text-align: center;
      }

      .ma-state-card h2 {
        margin-top: 0.7rem;
        font-family: var(--font-display);
        font-size: clamp(1.35rem, 3vw, 1.8rem);
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0;
      }

      .ma-state-action {
        min-height: 46px;
        margin-top: 1.4rem;
      }

      @media (max-width: 620px) {
        .ma-page {
          padding: 5.5rem 1rem 2rem;
        }

        .ma-header h1 {
          font-size: clamp(1.5rem, 9vw, 2.1rem);
          line-height: 1.12;
        }

        .ma-actions .nexus-btn {
          width: 100%;
        }
      }
    `}</style>
  </main>
);
