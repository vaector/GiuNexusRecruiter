import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { applicationsAPI } from "../services/api";
import ApplicationStatusBadge from "../components/ApplicationStatusBadge";
import StageHistory from "../components/StageHistory";
import PageLoader from "../components/PageLoader";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    applicationsAPI.getApplication(id)
      .then(({ data }) => {
        setApplication(data.application || data);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load application."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <PageLoader />;

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: "#030303", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem" }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", letterSpacing: "2px", color: "#ef4444", textTransform: "uppercase" }}>
          ERROR: {error}
        </p>
        <Link to="/applications/my" className="nexus-btn primary">← Back to Applications</Link>
      </div>
    );
  }

  if (!application) return null;

  const messageParams = new URLSearchParams();
  messageParams.set("role", "recruiter");
  if (application.job?.title) messageParams.set("job", application.job.title);
  const canMessage = application.job?._id && application.status !== "rejected";

  return (
    <div style={{ minHeight: "100vh", background: "#030303", position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "6rem 6% 4rem" }}>
        <Link to="/applications/my" className="nexus-body-sm" style={{ color: "rgba(0,229,204,0.45)", textDecoration: "none", display: "inline-block", marginBottom: "1.5rem" }}>
          ← BACK TO APPLICATIONS
        </Link>

        <div className="nexus-glass-panel" style={{ marginBottom: "1.5rem" }}>
          <p className="nexus-eyebrow" style={{ marginBottom: "0.5rem" }}>Application Detail</p>
          <h1 style={{ fontFamily: "'Inter',sans-serif", fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "1rem" }}>
            {application.job?.title || "Job Application"}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: "2px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              STATUS:
            </span>
            <ApplicationStatusBadge status={application.status} />
          </div>

          {canMessage && (
            <Link
              to={`/conversations/${application.job._id}?${messageParams.toString()}`}
              className="nexus-btn secondary"
              style={{ marginBottom: "1.5rem" }}
            >
              Message recruiter
            </Link>
          )}

          {application.coverLetter && (
            <div style={{ marginBottom: "1.5rem" }}>
              <p className="nexus-eyebrow" style={{ marginBottom: "0.5rem" }}>Cover Letter</p>
              <p style={{ fontSize: "14px", lineHeight: "1.7", color: "rgba(255,255,255,0.6)", whiteSpace: "pre-line" }}>
                {application.coverLetter}
              </p>
            </div>
          )}

          {application.stageHistory?.length > 0 && (
            <div>
              <p className="nexus-eyebrow" style={{ marginBottom: "0.75rem" }}>Stage History</p>
              <StageHistory history={application.stageHistory} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
