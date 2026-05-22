// Compact job card component used across multiple pages
// Shows: title, company, type, location, category badge, save button
// Props: job, onSaveToggle
import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import SaveJobButton from "./SaveJobButton";
import SkillChip from "./SkillChip";
import ReportButton from "./ReportButton";

export const CATEGORY_COLORS = {
  Frontend: { bg: "#dcfce7", color: "#166534" },
  Backend: { bg: "#dbeafe", color: "#1e40af" },
  "AI/ML": { bg: "#ede9fe", color: "#5b21b6" },
  DevOps: { bg: "#ccfbf1", color: "#115e59" },
  "Data Engineering": { bg: "#ffedd5", color: "#9a3412" },
  Other: { bg: "#f1f5f9", color: "#475569" },
};

const JobCard = ({ job, onSaveToggle, initialSaved = false }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const category = job.category || "Other";
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;

  const cardStyle = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
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
    color: "var(--color-text)",
    textDecoration: "none",
  };

  const companyStyle = {
    fontSize: "0.85rem",
    color: "var(--color-text-muted)",
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
  };

  const metaStyle = {
    fontSize: "0.8rem",
    color: "var(--color-text-muted)",
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
          <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>
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
        <span style={{
          fontSize: "0.75rem",
          color: job.status === "open" ? "#16a34a" : "#dc2626",
          fontWeight: 600,
          background: job.status === "open" ? "#dcfce7" : "#fee2e2",
          padding: "0.15rem 0.5rem",
          borderRadius: "999px",
        }}>
          {job.status}
        </span>
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
  );
};

export default JobCard;