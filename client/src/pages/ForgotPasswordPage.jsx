  import { useState } from "react";
  import { useNavigate, Link } from "react-router-dom";
  import { authAPI } from "../services/api";

  export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const submit = async (e) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await authAPI.forgotPassword(email);
        setMessage("If an account exists, a code was sent to the email provided.");
      } catch (err) {
        setError(err.response?.data?.message || "Request failed");
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
          <div style={{ marginBottom: "var(--space-2xl)" }}>
            <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: "var(--space-sm)" }}>Password recovery</p>
            <h1 className="display-sm">Forgot password?</h1>
            <p className="body-sm" style={{ marginTop: "var(--space-sm)", color: "var(--color-text-muted)" }}>
              Enter your email and we'll send you a verification code.
            </p>
          </div>

          {!message ? (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                <label className="body-sm" style={{ fontWeight: 500, color: "var(--color-ink)" }}>Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="body-sm" style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--rounded-sm)", padding: "var(--space-md)" }}>
                  {error}
                </p>
              )}

              <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
              <div style={{
                background: "var(--color-accent-subtle)",
                border: "1px solid var(--color-accent-border)",
                borderRadius: "var(--rounded-sm)",
                padding: "var(--space-md)",
              }}>
                <p className="body-sm" style={{ color: "var(--color-ink)" }}>{message}</p>
              </div>
              <button
                className="btn-primary"
                style={{ width: "100%" }}
                onClick={() => navigate("/verify-otp", { state: { email } })}
              >
                Enter verification code
              </button>
            </div>
          )}

          <p className="body-sm" style={{ textAlign: "center", marginTop: "var(--space-xl)", color: "var(--color-text-muted)" }}>
            <Link to="/login" style={{ color: "var(--color-accent)", fontWeight: 600 }}>Back to login</Link>
          </p>
        </div>
      </div>
    );
  }