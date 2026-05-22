import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import { jobsAPI } from "../services/api";
import TreeShader from "../shadersZ/TreeShader.jsx";

export default function RecruiterDashboard() {
  const { user } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    jobsAPI.getMyJobs()
      .then(({ data }) => {
        // handle both array and object response shapes
        const jobList = Array.isArray(data) ? data : 
                        Array.isArray(data.data) ? data.data : 
                        Array.isArray(data.jobs) ? data.jobs : [];
        setJobs(jobList);
      })
      .catch((err) => setError(err.response?.data?.message || "Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <TreeShader />
      <div style={{ ...styles.page, position: "relative", zIndex: 1 }}>

        {/* Pending banner */}
        {user?.status === "pending" && (
          <div style={styles.banner}>
            ⚠️ Your account is pending admin approval. You cannot post jobs yet.
          </div>
        )}

        <div style={styles.header}>
          <h1 style={styles.title}>My Job Posts</h1>
          {user?.status === "approved" && (
            <Link to="/recruiter/jobs/create" style={styles.createBtn}>
              + Post a Job
            </Link>
          )}
        </div>

        {error && <p style={styles.error}>{error}</p>}

        {jobs.length === 0 && !error ? (
          <p style={styles.empty}>You haven't posted any jobs yet.</p>
        ) : (
          <div style={styles.grid}>
            {jobs.map((job) => (
              <div key={job._id} style={styles.card}>
                <div style={styles.cardTop}>
                  <h2 style={styles.jobTitle}>{job.title}</h2>
                  <span style={styles.statusBadge(job.status)}>{job.status}</span>
                </div>
                <p style={styles.meta}>
                {job.company} · {typeof job.location === 'object' ? `${job.location.city}, ${job.location.country}` : job.location} · {job.type}
                </p>
                {job.category && (
                  <span style={styles.categoryBadge(job.category)}>{job.category}</span>
                )}
                <div style={styles.cardBottom}>
                  <span style={styles.applicantCount}>
                    👥 {job.applicantCount ?? 0} applicant{job.applicantCount !== 1 ? "s" : ""}
                  </span>
                  <div style={styles.actions}>
                    <Link to={`/recruiter/applicants/${job._id}`} style={styles.viewBtn}>
                      View Applicants
                    </Link>
                    <Link to={`/recruiter/jobs/${job._id}/edit`} style={styles.editBtn}>
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const CATEGORY_COLORS = {
  Frontend: "#16a34a",
  Backend: "#2563eb",
  "AI/ML": "#9333ea",
  DevOps: "#0d9488",
  "Data Engineering": "#ea580c",
  Other: "#6b7280",
};

const styles = {
  page: { maxWidth: 900, margin: "0 auto", padding: "32px 16px", paddingTop: 80 },
  banner: {
    background: "rgba(254, 249, 195, 0.15)",
    border: "1px solid rgba(251, 191, 36, 0.4)",
    backdropFilter: "blur(8px)",
    color: "#fde68a",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    margin: 0,
    color: "#000",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "6px 14px",
    borderRadius: 8,
  },
  createBtn: {
    background: "rgba(37, 99, 235, 0.8)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 600,
  },
  error: { color: "#f87171", marginBottom: 16 },
  empty: { color: "rgba(255,255,255,0.6)", fontSize: 16 },
  grid: { display: "flex", flexDirection: "column", gap: 16 },
  card: {
    background: "rgba(2, 3, 10, 0.75)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 20,
    backdropFilter: "blur(12px)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  jobTitle: { fontSize: 18, fontWeight: 700, margin: 0, color: "#fff" },
  statusBadge: (status) => ({
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    background: status === "open" ? "rgba(220,252,231,0.15)" : "rgba(243,244,246,0.1)",
    color: status === "open" ? "#86efac" : "rgba(255,255,255,0.5)",
    border: `1px solid ${status === "open" ? "rgba(134,239,172,0.3)" : "rgba(255,255,255,0.1)"}`,
  }),
  meta: { color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "0 0 10px" },
  categoryBadge: (cat) => ({
    display: "inline-block",
    fontSize: 12,
    fontWeight: 600,
    padding: "3px 10px",
    borderRadius: 20,
    color: "#fff",
    background: CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.Other,
    marginBottom: 12,
  }),
  cardBottom: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  applicantCount: { fontSize: 14, color: "rgba(255,255,255,0.7)" },
  actions: { display: "flex", gap: 8 },
  viewBtn: {
    background: "rgba(37, 99, 235, 0.8)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    padding: "7px 14px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  },
  editBtn: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "rgba(255,255,255,0.8)",
    padding: "7px 14px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 14,
  },
};