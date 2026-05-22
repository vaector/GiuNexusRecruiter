import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { reportsAPI } from "../services/api";
import Modal from "./Modal";

const REASONS = ["spam", "misleading", "inappropriate", "fake_company", "harassment", "other"];

const REASON_LABELS = {
  spam: "Spam",
  misleading: "Misleading",
  inappropriate: "Inappropriate",
  fake_company: "Fake Company",
  harassment: "Harassment",
  other: "Other",
};

const ReportButton = ({ targetModel, targetId }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) return null;

  const handleOpen = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSubmitted(false);
    setReason("");
    setDetails("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!reason) { setError("Please select a reason."); return; }
    setLoading(true);
    setError("");
    try {
      await reportsAPI.createReport({ targetModel, targetId, reason, details });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Report"
        style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase",
          padding: "3px 8px", borderRadius: "2px",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent",
          color: "rgba(234,242,255,0.3)",
          cursor: "pointer",
          transition: "all 0.18s ease",
          display: "inline-flex", alignItems: "center", gap: "4px",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
          e.currentTarget.style.color = "#ef4444";
          e.currentTarget.style.background = "rgba(239,68,68,0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(234,242,255,0.3)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1 1 3 1 3-2 5-2 3 2 5 2 3-1 3-1V3s-1 1-3 1-3-2-5-2-3 2-5 2-3-1-3-1z" /><line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        REPORT
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={submitted ? undefined : handleSubmit}
        title={`REPORT ${targetModel === "JobPost" ? "JOB POST" : "USER"}`}
        confirmText={loading ? "SUBMITTING..." : "SUBMIT REPORT"}
        confirmDanger
      >
        {submitted ? (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.75rem" }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: "0.72rem", letterSpacing: "0.06em", color: "#00e5cc" }}>
              REPORT SUBMITTED
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgba(234,242,255,0.45)", marginTop: "0.5rem" }}>
              Our team will review it shortly.
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.35rem" }}>
                REASON *
              </label>
              <select
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(""); }}
                style={{
                  width: "100%", padding: "0.55rem 0.75rem",
                  background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px",
                  color: reason ? "#eaf2ff" : "rgba(234,242,255,0.45)",
                  fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.85rem",
                  outline: "none", cursor: "pointer",
                }}
              >
                <option value="">Select a reason...</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>{REASON_LABELS[r]}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.35rem" }}>
                DETAILS (OPTIONAL)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Describe the issue..."
                className="nexus-input"
                style={{ resize: "vertical", minHeight: "60px" }}
              />
            </div>

            {error && (
              <div role="alert" style={{ padding: "0.5rem 0.75rem", marginBottom: "0.75rem", borderRadius: "2px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#ef4444", fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: "0.72rem" }}>
                {error}
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default ReportButton;
