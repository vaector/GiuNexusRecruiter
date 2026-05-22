import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { reportsAPI } from "../services/api";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

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
          fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase",
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

      {isOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={handleClose}
        >
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
          <div
            style={{
              position: "relative",
              background: "rgba(6, 12, 24, 0.92)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(0, 229, 204, 0.12)",
              borderRadius: "4px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2)",
              padding: "1.5rem",
              width: "100%",
              maxWidth: "440px",
              margin: "0 1rem",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grain */}
            <div style={{
              position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none", borderRadius: "4px",
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "0.5rem" }}>
                REPORT
              </div>
              <h2 style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: "1.1rem", fontWeight: 600, color: "#eaf2ff", marginBottom: "1rem" }}>
                Report {targetModel === "JobPost" ? "Job Post" : "User"}
              </h2>

              {submitted ? (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.75rem" }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em", color: TEAL }}>
                    REPORT SUBMITTED
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "rgba(234,242,255,0.45)", marginTop: "0.5rem" }}>
                    Our team will review it shortly.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.35rem" }}>
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
                    <label style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.35rem" }}>
                      DETAILS (OPTIONAL)
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder="Describe the issue..."
                      style={{
                        width: "100%", padding: "0.55rem 0.75rem",
                        background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px",
                        color: "#eaf2ff", fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.85rem",
                        outline: "none", resize: "vertical", minHeight: "60px",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(0,229,204,0.5)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                    />
                  </div>

                  {error && (
                    <div role="alert" style={{ padding: "0.5rem 0.75rem", marginBottom: "0.75rem", borderRadius: "2px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#ef4444", fontFamily: MONO, fontSize: "0.72rem" }}>
                      {error}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleClose}
                      style={{
                        fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "0.5rem 1rem", borderRadius: "2px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "transparent", color: "rgba(234,242,255,0.45)",
                        cursor: "pointer", transition: "all 0.18s ease",
                      }}
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || !reason}
                      style={{
                        fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "0.5rem 1rem", borderRadius: "2px",
                        border: "1px solid rgba(239,68,68,0.4)",
                        background: loading ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)",
                        color: loading ? "rgba(239,68,68,0.5)" : "#ef4444",
                        cursor: loading || !reason ? "not-allowed" : "pointer",
                        transition: "all 0.18s ease",
                      }}
                    >
                      {loading ? "SUBMITTING..." : "SUBMIT REPORT"}
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={handleClose}
                aria-label="Close"
                style={{
                  position: "absolute", top: "0.75rem", right: "0.75rem",
                  background: "transparent", border: "none",
                  color: "rgba(234,242,255,0.3)", cursor: "pointer",
                  fontSize: "1.2rem", lineHeight: 1, padding: "0.25rem",
                }}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportButton;