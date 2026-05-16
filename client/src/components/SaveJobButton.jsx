// Bookmark toggle button
// Calls POST /api/v1/jobs/:id/save
// Updates state optimistically
// Disabled when job status is not open
// Props: jobId, initialSaved, jobStatus
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const SaveJobButton = ({ jobId, initialSaved = false, jobStatus, onToggle }) => {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) return null;

  const disabled = jobStatus !== "open" && !saved;

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading || disabled) return;

    setLoading(true);
    try {
      const res = await api.post(`/jobs/${jobId}/save`);
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
        color: saved ? "var(--color-accent)" : "var(--color-text-muted)",
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(1.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      {loading ? "⏳" : saved ? "🔖" : "🏷️"}
      <span style={{ fontSize: "0.75rem", fontWeight: 500 }}>
        {saved ? "Saved" : "Save"}
      </span>
    </button>
  );
};

export default SaveJobButton;