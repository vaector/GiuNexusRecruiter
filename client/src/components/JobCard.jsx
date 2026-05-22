import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SaveJobButton from "./SaveJobButton";
import SkillChip from "./SkillChip";
import ReportButton from "./ReportButton";

export const CATEGORY_COLORS = {
  Frontend: { color: "#4ade80", border: "rgba(74, 222, 128, 0.35)", bg: "rgba(74, 222, 128, 0.08)" },
  Backend: { color: "#60a5fa", border: "rgba(96, 165, 250, 0.35)", bg: "rgba(96, 165, 250, 0.08)" },
  "AI/ML": { color: "#c084fc", border: "rgba(192, 132, 252, 0.35)", bg: "rgba(192, 132, 252, 0.08)" },
  DevOps: { color: "#2dd4bf", border: "rgba(45, 212, 191, 0.35)", bg: "rgba(45, 212, 191, 0.08)" },
  "Data Engineering": { color: "#fb923c", border: "rgba(251, 146, 60, 0.35)", bg: "rgba(251, 146, 60, 0.08)" },
  Other: { color: "var(--text-secondary)", border: "var(--border-glass)", bg: "rgba(255, 255, 255, 0.04)" },
};

const JobCard = ({ job, onSaveToggle, initialSaved = false }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const category = job.category || "Other";
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;

  const cardStyle = {
    background: "var(--bg-surface-solid)",
    border: "1px solid var(--border-glass)",
    borderRadius: "12px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    transition: "box-shadow 0.2s ease, transform 0.2s ease",
  };

  const titleStyle = {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    textDecoration: "none",
  };

  const companyStyle = {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    fontWeight: 500,
  };

  const badgeStyle = {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    fontSize: "0.75rem",
    fontWeight: 600,
    background: colors.bg,
    color: colors.color,
    border: `1px solid ${colors.border}`,
  };

  const metaStyle = {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  };

  const footerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "auto",
  };

  const statusBadge = (status) => {
    const isOpen = status === "open";
    return {
      fontSize: "0.75rem",
      fontWeight: 600,
      padding: "0.15rem 0.5rem",
      borderRadius: "999px",
      border: `1px solid ${isOpen ? "rgba(74, 222, 128, 0.35)" : "rgba(239, 68, 68, 0.35)"}`,
      color: isOpen ? "#4ade80" : "#ef4444",
      background: isOpen ? "rgba(74, 222, 128, 0.08)" : "rgba(239, 68, 68, 0.08)",
    };
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <Link style={titleStyle} to={`/jobs/${job._id}`}>{job.title}</Link>
          <p style={companyStyle}>{job.company}</p>
        </div>
        <span style={badgeStyle}>{category}</span>
      </div>

      <div style={metaStyle}>
        <span> {job.location?.city || job.location?.country || "—"}</span>
        <span> {job.type}</span>
        {(job.salary?.min != null || job.salary?.amount != null) && (
          <span> {(job.salary?.min ?? job.salary?.amount)?.toLocaleString?.() ?? "—"} {job.salary?.currency || ""}</span>
        )}
        {job.score !== undefined && (
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>
             {Math.round(job.score * 100)}% match
          </span>
        )}
      </div>

      {job.requirements?.length > 0 && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {job.requirements.slice(0, 3).map(req => (
            <SkillChip key={req} skill={req} />
          ))}
        </div>
      )}

      <div style={footerStyle}>
        <span style={statusBadge(job.status)}>
          {job.status}
        </span>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {isAuthenticated && user?.role === "jobSeeker" && (
            <SaveJobButton
              jobId={job._id}
              jobStatus={job.status}
              initialSaved={initialSaved}
              onToggle={onSaveToggle}
            />
          )}
          <ReportButton targetModel="JobPost" targetId={job._id} />
        </div>
      </div>
    </div>
  );
};

export default JobCard;
