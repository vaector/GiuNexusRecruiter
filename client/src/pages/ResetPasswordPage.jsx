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

    if (!token) {
      return (
        <div style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-canvas-soft)",
          padding: "var(--space-xl)",
        }}>
          <div style={{
            width: "100%",
            maxWidth: "420px",
            background: "var(--color-canvas)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--rounded-md)",
            padding: "var(--space-3xl)",
            textAlign: "center",
          }}>
            <p className="body-md" style={{ color: "#dc2626", marginBottom: "var(--space-xl)" }}>
              Invalid or missing reset token. Please request a new password reset.
            </p>
            <Link to="/forgot-password" className="btn-primary" style={{ display: "inline-block" }}>
              Request new reset
            </Link>
          </div>
        </div>
      );
    }

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
        background: "var(--color-canvas-soft)",
        padding: "var(--space-xl)",
      }}>
        <div style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--color-canvas)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--rounded-md)",
          padding: "var(--space-3xl)",
        }}>
          {success ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "var(--space-lg)" }}>✅</div>
              <h2 className="display-sm" style={{ marginBottom: "var(--space-md)" }}>Password reset!</h2>
              <p className="body-md" style={{ color: "var(--color-text-muted)" }}>Redirecting you to login...</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: "var(--space-2xl)" }}>
                <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: "var(--space-sm)" }}>Almost done</p>
                <h1 className="display-sm">Set new password</h1>
              </div>

              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                  <label className="body-sm" style={{ fontWeight: 500, color: "var(--color-ink)" }}>New password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                  <label className="body-sm" style={{ fontWeight: 500, color: "var(--color-ink)" }}>Confirm new password</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Repeat password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                {error && (
                  <p className="body-sm" style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--rounded-sm)", padding: "var(--space-md)" }}>
                    {error}
                  </p>
                )}

                <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Resetting..." : "Reset password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }