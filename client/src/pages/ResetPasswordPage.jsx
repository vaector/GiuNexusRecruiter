import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-base)",
      padding: "var(--space-xl)",
    }}>
      <div className="nexus-glass-panel" style={{ width: "100%", maxWidth: "420px" }}>
        {success ? (
          <div style={{ textAlign: "center" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00e5cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: "0.75rem" }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="nexus-display-md" style={{ marginBottom: "var(--space-md)" }}>Password reset!</p>
            <p className="nexus-body-lg">Redirecting you to login...</p>
          </div>
        ) : !token ? (
          <div style={{ textAlign: "center" }}>
            <p className="nexus-body-lg" style={{ color: "#ef4444", marginBottom: "var(--space-xl)" }}>
              Invalid or missing reset token. Please request a new password reset.
            </p>
            <Link to="/forgot-password" className="nexus-btn primary">Request new reset</Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "var(--space-2xl)" }}>
              <p className="nexus-eyebrow" style={{ marginBottom: "var(--space-sm)" }}>Almost done</p>
              <p className="nexus-display-md">Set new password</p>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                <label className="nexus-body-sm" style={{ fontWeight: 500, color: "var(--text-primary)" }}>New password</label>
                <input
                  className="nexus-input"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                <label className="nexus-body-sm" style={{ fontWeight: 500, color: "var(--text-primary)" }}>Confirm new password</label>
                <input
                  className="nexus-input"
                  type="password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <div role="alert" style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "var(--rounded-sm)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(239, 68, 68, 0.06)",
                  color: "#ef4444",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                }}>
                  {error}
                </div>
              )}

              <button className="nexus-btn primary" type="submit" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Resetting..." : "Reset password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
