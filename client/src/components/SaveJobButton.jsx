import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { jobsAPI } from "../services/api";

const SaveJobButton = ({ jobId, initialSaved = false, jobStatus, onToggle }) => {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  if (!isAuthenticated) return null;

  const disabled = jobStatus !== "open" && !saved;

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || disabled) return;

    setLoading(true);
    try {
      const res = await jobsAPI.saveJob(jobId);
      const newSaved = res.data.saved;
      setSaved(newSaved);
      if (onToggle) onToggle(jobId, newSaved);
    } catch (err) {
      console.error("Save toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || loading}
      title={disabled ? "Cannot save a closed job" : saved ? "Unsave job" : "Save job"}
      style={{
        background: "none",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "1rem",
        opacity: disabled ? 0.4 : 1,
        transition: "transform 0.15s ease",
        padding: "0.25rem 0.5rem",
        lineHeight: 1,
        display: "flex",
        alignItems: "center",
        gap: "0.25rem",
        color: saved ? "var(--accent)" : "var(--text-muted)",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(1.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {loading ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.7s linear infinite" }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : saved ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )}
      <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>
        {saved ? "Saved" : "Save"}
      </span>
    </button>
  );
};

export default SaveJobButton;
