import { useEffect, useMemo, useState } from "react";
import Modal from "../components/Modal";
import { CATEGORY_COLORS } from "../components/JobCard";
import { jobsAPI } from "../services/api";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

const shellStyle = {
  minHeight: "100vh",
  background: "#030303",
  color: "#fff",
  padding: "4rem 6% 6rem",
};

const innerStyle = {
  maxWidth: "1280px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
};

const eyebrowStyle = {
  fontFamily: MONO,
  fontSize: "10px",
  letterSpacing: "3px",
  color: "rgba(0,229,204,0.65)",
  textTransform: "uppercase",
};

const titleStyle = {
  fontSize: "clamp(2rem,5vw,3.5rem)",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: 1,
  margin: "0.65rem 0 0.5rem",
};

const panelStyle = {
  border: "1px solid rgba(0,229,204,0.12)",
  background: "rgba(0,229,204,0.025)",
  position: "relative",
};

const tableCellStyle = {
  padding: "0.9rem 1rem",
  borderTop: "1px solid rgba(0,229,204,0.08)",
  verticalAlign: "top",
};

const actionButtonStyle = {
  background: "transparent",
  border: "1px solid rgba(239,68,68,0.5)",
  color: "#ef4444",
  fontFamily: MONO,
  fontSize: "10px",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  padding: "0.55rem 0.8rem",
  cursor: "pointer",
};

const getJobsFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.jobs)) return data.jobs;
  if (Array.isArray(data?.data?.jobs)) return data.data.jobs;
  return [];
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to load jobs right now.";

const formatLocation = (location) => {
  if (!location) return "Not specified";
  if (typeof location === "string") return location;

  const parts = [location.city, location.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Not specified";
};

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const CornerFrame = () => (
  <>
    <span style={{ position: "absolute", top: -1, left: -1, width: 18, height: 18, borderTop: `1px solid ${TEAL}`, borderLeft: `1px solid ${TEAL}` }} />
    <span style={{ position: "absolute", right: -1, bottom: -1, width: 18, height: 18, borderRight: `1px solid ${TEAL}`, borderBottom: `1px solid ${TEAL}` }} />
  </>
);

const StatusBadge = ({ status }) => {
  const isOpen = status === "open";
  return (
    <span style={{
      display: "inline-block",
      color: isOpen ? "#4ade80" : "#ef4444",
      border: `1px solid ${isOpen ? "rgba(74,222,128,0.35)" : "rgba(239,68,68,0.35)"}`,
      fontFamily: MONO,
      fontSize: 10,
      letterSpacing: 1.6,
      padding: "0.25rem 0.55rem",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {status || "unknown"}
    </span>
  );
};

const CategoryBadge = ({ category }) => {
  const label = category || "Other";
  const colors = CATEGORY_COLORS[label] || CATEGORY_COLORS.Other;

  return (
    <span style={{
      display: "inline-block",
      color: colors.color,
      background: colors.bg,
      fontFamily: MONO,
      fontSize: 10,
      letterSpacing: 1.2,
      padding: "0.28rem 0.6rem",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
};

const DarkSkeleton = () => (
  <section style={{ ...panelStyle, padding: "1.25rem", display: "grid", gap: "0.75rem", overflow: "hidden" }}>
    <CornerFrame />
    <div style={{ height: 12, width: "18%", background: "rgba(0,229,204,0.08)" }} />
    <div style={{ height: 10, width: "70%", background: "rgba(255,255,255,0.05)" }} />
    <div style={{ height: 10, width: "54%", background: "rgba(255,255,255,0.04)" }} />
  </section>
);

const AdminJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState("");

  const sortedJobs = useMemo(
    () =>
      [...jobs].sort((a, b) => {
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      }),
    [jobs]
  );

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      try {
        setLoading(true);
        setError("");

        const firstResponse = await jobsAPI.getAllJobs({ page: 1, limit: 100 });
        const firstData = firstResponse.data;
        const pages = Number(firstData?.pages || 1);
        const collectedJobs = getJobsFromResponse(firstData);

        if (pages > 1) {
          const extraRequests = Array.from({ length: pages - 1 }, (_, index) =>
            jobsAPI.getAllJobs({ page: index + 2, limit: 100 })
          );
          const extraResponses = await Promise.all(extraRequests);
          extraResponses.forEach((response) => {
            collectedJobs.push(...getJobsFromResponse(response.data));
          });
        }

        if (isMounted) setJobs(collectedJobs);
      } catch (err) {
        if (isMounted) setError(getErrorMessage(err));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  const closeDeleteModal = () => {
    if (!deletingId) {
      setJobToDelete(null);
      setDeleteError("");
    }
  };

  const handleDelete = async () => {
    if (!jobToDelete?._id || deletingId) return;

    try {
      setDeletingId(jobToDelete._id);
      setDeleteError("");
      await jobsAPI.deleteJob(jobToDelete._id);
      setJobs((currentJobs) => currentJobs.filter((job) => job._id !== jobToDelete._id));
      setJobToDelete(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div style={shellStyle}>
      <div style={innerStyle}>
        <header>
          <p style={eyebrowStyle}>SYS.ADMIN / LISTINGS</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <h1 style={titleStyle}>Admin Jobs</h1>
              <p style={{ color: "rgba(255,255,255,0.45)", maxWidth: 700, lineHeight: 1.6 }}>
                Review every open and closed job listing, then remove listings that need moderation.
              </p>
            </div>
            {!loading && !error && (
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: 2, color: TEAL, border: "1px solid rgba(0,229,204,0.35)", padding: "0.5rem 0.75rem" }}>
                {sortedJobs.length} {sortedJobs.length === 1 ? "JOB" : "JOBS"}
              </span>
            )}
          </div>
          <div style={{ height: 1, background: "linear-gradient(to right, rgba(0,229,204,0.45), transparent)", marginTop: "1.5rem" }} />
        </header>

        {loading && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <DarkSkeleton />
            <DarkSkeleton />
            <DarkSkeleton />
          </div>
        )}

        {!loading && error && (
          <section style={{ ...panelStyle, padding: "1.25rem", borderColor: "rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.06)" }} role="alert">
            <p style={{ ...eyebrowStyle, color: "#ef4444" }}>ERROR</p>
            <h2 style={{ color: "#fff", margin: "0.35rem 0" }}>Could not load jobs</h2>
            <p style={{ color: "rgba(255,255,255,0.58)" }}>{error}</p>
          </section>
        )}

        {!loading && !error && sortedJobs.length === 0 && (
          <section style={{ ...panelStyle, padding: "1.25rem" }}>
            <CornerFrame />
            <p style={eyebrowStyle}>EMPTY STATE</p>
            <h2 style={{ color: "#fff", margin: "0.35rem 0" }}>No jobs found</h2>
            <p style={{ color: "rgba(255,255,255,0.48)" }}>Open and closed job listings will appear here once they are created.</p>
          </section>
        )}

        {!loading && !error && sortedJobs.length > 0 && (
          <section style={{ ...panelStyle, overflow: "hidden" }}>
            <CornerFrame />
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
                <thead>
                  <tr style={{ background: "rgba(0,229,204,0.04)" }}>
                    {["Job", "Location", "Type", "Category", "Status", "Created", "Action"].map((heading, index) => (
                      <th key={heading} style={{
                        ...tableCellStyle,
                        borderTop: "none",
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: MONO,
                        fontSize: 10,
                        letterSpacing: 1.4,
                        textAlign: index === 6 ? "right" : "left",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedJobs.map((job) => (
                    <tr key={job._id || `${job.title}-${job.company}`}>
                      <td style={tableCellStyle}>
                        <div style={{ color: "#fff", fontWeight: 700 }}>{job.title || "Untitled job"}</div>
                        <div style={{ color: "rgba(255,255,255,0.38)", fontFamily: MONO, fontSize: 10, letterSpacing: 1.2, marginTop: 4, textTransform: "uppercase" }}>
                          {job.company || "Unknown company"}
                        </div>
                      </td>
                      <td style={{ ...tableCellStyle, color: "rgba(255,255,255,0.58)" }}>{formatLocation(job.location)}</td>
                      <td style={{ ...tableCellStyle, color: "rgba(255,255,255,0.58)", fontFamily: MONO, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>{job.type || "Not specified"}</td>
                      <td style={tableCellStyle}><CategoryBadge category={job.category} /></td>
                      <td style={tableCellStyle}><StatusBadge status={job.status} /></td>
                      <td style={{ ...tableCellStyle, color: "rgba(255,255,255,0.45)" }}>{formatDate(job.createdAt)}</td>
                      <td style={{ ...tableCellStyle, textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => setJobToDelete(job)}
                          style={{ ...actionButtonStyle, opacity: deletingId === job._id ? 0.55 : 1, cursor: deletingId === job._id ? "not-allowed" : "pointer" }}
                          disabled={deletingId === job._id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <Modal
          isOpen={Boolean(jobToDelete)}
          onClose={closeDeleteModal}
          onConfirm={handleDelete}
          title="Delete job listing"
          confirmText={deletingId ? "Deleting..." : "Delete"}
          confirmDanger
        >
          <p>
            Delete <strong>{jobToDelete?.title || "this job"}</strong>
            {jobToDelete?.company ? ` at ${jobToDelete.company}` : ""}? This action cannot be undone.
          </p>
          {deleteError && (
            <p style={{ color: "#dc2626", marginTop: "var(--space-md)", fontWeight: 600 }}>
              {deleteError}
            </p>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default AdminJobsPage;
