// List of jobs the student has applied to
// GET /api/v1/applications/my
// Shows current status badge per application
// Shows AI match score per application
// Shows applicationCode per application
// Withdraw button calls DELETE /api/v1/applications/:id/withdraw
// Click application to view full detail on ApplicationDetailPage
// Job seeker only
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { applicationsAPI } from "../services/api";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge";

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

  return (
    <section style={{ maxWidth: 1000, margin: "0 auto", padding: "6rem 1.5rem 3rem" }}>
      <p className="nexus-eyebrow">Job Seeker</p>
      <h1 style={{ margin: "0.25rem 0 1rem" }}>My applications</h1>
      {error && <p style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</p>}
      {loading ? (
        <p>Loading applications...</p>
      ) : applications.length === 0 ? (
        <div className="nexus-glass-panel">
          <h2>No applications yet</h2>
          <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 1rem" }}>Apply to jobs to track them here.</p>
          <Link className="nexus-btn primary" to="/jobs">Browse jobs</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {applications.map((application) => {
            const job = application.job || {};
            return (
              <article key={application._id} className="nexus-glass-panel" style={{ padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{job.title || "Deleted job"}</h2>
                    <p style={{ color: "var(--text-secondary)", margin: "0.25rem 0" }}>
                      {[job.company, job.location?.city, job.type].filter(Boolean).join(" | ")}
                    </p>
                    {application.applicationCode && (
                      <p style={{ color: "var(--text-tertiary)", fontSize: "0.8rem" }}>Code: {application.applicationCode}</p>
                    )}
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
                  {job._id && <Link className="nexus-btn secondary" to={`/jobs/${job._id}`}>View job</Link>}
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
    </section>
  );
}