  import { useState, useContext } from "react";
  import { useNavigate, useLocation, Link } from "react-router-dom";
  import { AuthContext } from "../context/AuthContext";
  import { authAPI } from "../services/api";

  export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mfa, setMfa] = useState(null);
    const [otp, setOtp] = useState("");

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const submit = async (e) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const res = await authAPI.login({ email, password });
        const data = res.data;
        if (data?.mfaRequired) {
          setMfa(data);
          return;
        }
        login(data.token, data.user);
        navigate(from, { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || "Login failed");
      } finally {
        setLoading(false);
      }
    };

    const submitMfa = async (e) => {
      e.preventDefault();
      if (!mfa) return;
      setError(null);
      setLoading(true);
      try {
        const res = await authAPI.verifyMfa({ userId: mfa.userId, otp, method: mfa.mfaMethod });
        const data = res.data;
        login(data.token, data.user);
        navigate(from, { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || "MFA verification failed");
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
            <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: "var(--space-sm)" }}>Welcome back</p>
            <h1 className="display-sm">Sign in</h1>
          </div>

          {!mfa ? (
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
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="body-sm" style={{ fontWeight: 500, color: "var(--color-ink)" }}>Password</label>
                  <Link to="/forgot-password" className="caption" style={{ color: "var(--color-accent)" }}>Forgot password?</Link>
                </div>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="body-sm" style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--rounded-sm)", padding: "var(--space-md)" }}>
                  {error}
                </p>
              )}

              <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", marginTop: "var(--space-xs)", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitMfa} style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
              <p className="body-md">Enter the verification code sent via <strong>{mfa.mfaMethod === "email_otp" ? "email" : "authenticator app"}</strong>.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                <label className="body-sm" style={{ fontWeight: 500, color: "var(--color-ink)" }}>Verification code</label>
                <input
                  className="input"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="body-sm" style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--rounded-sm)", padding: "var(--space-md)" }}>
                  {error}
                </p>
              )}

              <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>
          )}

          <p className="body-sm" style={{ textAlign: "center", marginTop: "var(--space-xl)", color: "var(--color-text-muted)" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "var(--color-accent)", fontWeight: 600 }}>Sign up</Link>
          </p>
        </div>
      </div>
    );
  }