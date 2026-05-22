import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authAPI } from "../services/api";

export default function VerifyOtpPage() {
  const { state } = useLocation();
  const email = state?.email;
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!email) {
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
            Session expired. Please restart the password reset process.
          </p>
          <Link to="/forgot-password" className="btn-primary" style={{ display: "inline-block" }}>
            Back to forgot password
          </Link>
        </div>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp({ email, otp });
      navigate(`/reset-password/${data.resetToken}`);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code");
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
          <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: "var(--space-sm)" }}>Step 2 of 3</p>
          <h1 className="display-sm">Enter verification code</h1>
          <p className="body-sm" style={{ marginTop: "var(--space-sm)", color: "var(--color-text-muted)" }}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            <label className="body-sm" style={{ fontWeight: 500, color: "var(--color-ink)" }}>Verification code</label>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
              style={{ letterSpacing: "0.3em", fontSize: "1.25rem", textAlign: "center" }}
            />
          </div>

          {error && (
            <p className="body-sm" style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--rounded-sm)", padding: "var(--space-md)" }}>
              {error}
            </p>
          )}

          <button className="btn-primary" type="submit" disabled={loading || otp.length !== 6} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Verifying..." : "Verify code"}
          </button>
        </form>

        <p className="body-sm" style={{ textAlign: "center", marginTop: "var(--space-xl)", color: "var(--color-text-muted)" }}>
          Didn't get a code?{" "}
          <Link to="/forgot-password" style={{ color: "var(--color-accent)", fontWeight: 600 }}>Resend</Link>
        </p>
      </div>
    </div>
  );
}
