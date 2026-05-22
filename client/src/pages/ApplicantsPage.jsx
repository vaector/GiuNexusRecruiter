import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { jobsAPI, applicationsAPI } from "../services/api";
import Spinner from "../components/Spinner";
import LineShader from "../shadersZ/LineShader.jsx";

const STATUS_OPTIONS = ["pending", "shortlisted", "rejected"];

const STATUS_STYLE = {
  pending:     { background: "#fef9c3", color: "#92400e" },
  shortlisted: { background: "#dcfce7", color: "#15803d" },
  rejected:    { background: "#fee2e2", color: "#b91c1c" },
};

export default function ApplicantsPage() {
  const { jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    jobsAPI.getApplicants(jobId)
      .then(({ data }) => {
        const appList = Array.isArray(data) ? data :
                        Array.isArray(data.data) ? data.data :
                        Array.isArray(data.applications) ? data.applications : [];
        setApplicants(appList);
        setJobTitle(data.jobTitle ?? data.job?.title ?? "");
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load applicants"))
      .finally(() => setLoading(false));
  }, [jobId]);

  async function handleStatusChange(applicationId, newStatus) {
    setApplicants((prev) =>
      prev.map((a) => a._id === applicationId ? { ...a, status: newStatus } : a)
    );
    setUpdating(applicationId);
    try {
      await applicationsAPI.updateApplicationStatus(applicationId, newStatus);
    } catch {
      setApplicants((prev) =>
        prev.map((a) => a._id === applicationId ? { ...a, status: a.status } : a)
      );
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <LineShader />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "32px 16px" }}>

        <Link to="/recruiter/dashboard" style={styles.back}>← Back to Dashboard</Link>

        <h1 style={styles.title}>
          Applicants {jobTitle ? `— ${jobTitle}` : ""}
        </h1>

        {error && <p style={styles.error}>{error}</p>}

        {applicants.length === 0 && !error ? (
          <p style={styles.empty}>No one has applied to this job yet.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Name", "Email", "Skills", "Cover Letter", "Status"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {applicants.map((app) => (
                  <tr key={app._id} style={styles.tr}>
                    <td style={styles.td}>{app.applicant?.name ?? "—"}</td>
                    <td style={styles.td}>{app.applicant?.email ?? "—"}</td>
                    <td style={styles.td}>
                      <div style={styles.chips}>
                        {(app.applicant?.skills ?? []).length === 0
                          ? <span style={styles.noSkills}>None listed</span>
                          : app.applicant.skills.map((s) => (
                              <span key={s} style={styles.chip}>{s}</span>
                            ))}
                      </div>
                    </td>
                    <td style={styles.td}>
                      {app.coverLetter
                        ? <span style={styles.coverSnippet} title={app.coverLetter}>
                            {app.coverLetter.slice(0, 60)}…
                          </span>
                        : <span style={styles.noSkills}>—</span>}
                    </td>
                    <td style={styles.td}>
                      <select
                        value={app.status}
                        disabled={updating === app._id}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                        style={styles.select(app.status)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  back: {
    color: "rgba(255,255,255,0.6)",
    textDecoration: "none",
    fontSize: 14,
    display: "inline-block",
    marginBottom: 16,
    marginTop: 70,
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "6px 14px",
    borderRadius: 8,
    backdropFilter: "blur(8px)",
    background: "rgba(255,255,255,0.05)",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 24,
    color: "#fff",
  },
  error: { color: "#f87171" },
  empty: { color: "rgba(255,255,255,0.6)" },
  tableWrapper: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    background: "rgba(2, 3, 10, 0.75)",
    backdropFilter: "blur(12px)",
    borderRadius: 12,
    overflow: "hidden",
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    fontWeight: 700,
    color: "#fff",
    fontSize: 13,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.07)" },
  td: { padding: "12px 16px", verticalAlign: "top", color: "rgba(255,255,255,0.85)" },
  chips: { display: "flex", flexWrap: "wrap", gap: 4 },
  chip: {
    background: "rgba(109, 40, 217, 0.4)",
    color: "#c4b5fd",
    borderRadius: 20,
    padding: "2px 8px",
    fontSize: 12,
    fontWeight: 500,
    border: "1px solid rgba(167,139,250,0.3)",
  },
  noSkills: { color: "rgba(255,255,255,0.3)", fontSize: 13 },
  coverSnippet: { color: "rgba(255,255,255,0.7)", cursor: "help" },
  select: (status) => ({
    border: "none",
    borderRadius: 20,
    padding: "4px 10px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 13,
    ...STATUS_STYLE[status],
  }),
};
