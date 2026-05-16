// Report job or user button that opens a modal
// POST /api/v1/reports
// Used on JobDetailPage and user profile views
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Modal from "./Modal";
import api from "../services/api";

const REASONS = ["spam", "misleading", "inappropriate", "fake_company", "harassment", "other"];

const ReportButton = ({ targetModel, targetId }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated) return null;

  const handleSubmit = async () => {
    if (!reason) { setError("Please select a reason"); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/reports", { targetModel, targetId, reason, details });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSubmitted(false);
    setReason("");
    setDetails("");
    setError("");
  };

  const inputStyle = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "0.9rem",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          background: "none",
          border: "1px solid var(--color-border)",
          borderRadius: "8px",
          padding: "0.4rem 0.9rem",
          fontSize: "0.82rem",
          color: "var(--color-text-muted)",
          cursor: "pointer",
        }}
      >
        🚩 Report
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Report ${targetModel === "JobPost" ? "Job Post" : "User"}`}
        onConfirm={submitted ? null : handleSubmit}
        confirmText={loading ? "Submitting..." : "Submit Report"}
        confirmDanger
      >
        {submitted ? (
          <p style={{ color: "#16a34a" }}>
            ✅ Your report has been submitted. Our team will review it shortly.
          </p>
        ) : (
          <>
            <select
              style={{ ...inputStyle, marginBottom: "0.75rem" }}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Select a reason...</option>
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </option>
              ))}
            </select>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              placeholder="Additional details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={1000}
            />
            {error && (
              <p style={{ color: "#dc2626", fontSize: "0.82rem", marginTop: "0.5rem" }}>{error}</p>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default ReportButton;