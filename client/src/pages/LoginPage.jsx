import { useState, useContext } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { authAPI } from "../services/api";
import SpookyGhost from "../components/SpookyGhost";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mfa, setMfa] = useState(null);
  const [otp, setOtp] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

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
      const res = await authAPI.verifyMfaOtp({ userId: mfa.userId, otp, method: mfa.mfaMethod });
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
    <section className="login-page">
      <div className="login-grid" aria-hidden="true" />
      <SpookyGhost passwordFocused={passwordFocused} />
      <div className="login-shell">
        <aside className="login-intro">
          <p className="nexus-eyebrow">GIU Nexus Access</p>
          <h1>Enter the network</h1>
          <p>
            Sign in to continue tracking applications, recruiter conversations,
            alerts, and role-matched openings from one command center.
          </p>

          <div className="login-status-panel">
            <div>
              <span className="login-status-dot" />
              <span>Identity layer online</span>
            </div>
            <strong>SECURE SESSION</strong>
          </div>
        </aside>

        <div className="login-card">
          <div className="login-card-header">
            <p className="nexus-eyebrow">{mfa ? "Second Factor" : "Welcome Back"}</p>
            <h2>{mfa ? "Verify access" : "Sign in"}</h2>
          </div>

          {!mfa ? (
            <form onSubmit={submit} className="login-form">
              <label className="login-field">
                <span>Email</span>
                <input
                  className="nexus-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="login-field">
                <span className="login-field-row">
                  Password
                  <Link to="/forgot-password">Forgot?</Link>
                </span>
                <input
                  className="nexus-input"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                />
              </label>

              {error && <p className="login-alert">{error}</p>}

              <button className="nexus-btn primary login-submit" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitMfa} className="login-form">
              <p className="login-helper">
                Enter the verification code sent via{" "}
                <strong>{mfa.mfaMethod === "email_otp" ? "email" : "authenticator app"}</strong>.
              </p>

              <label className="login-field">
                <span>Verification code</span>
                <input
                  className="nexus-input login-code-input"
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setOtp(v); setError(null); }}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  required
                />
              </label>

              {error && <p className="login-alert">{error}</p>}

              <button className="nexus-btn primary login-submit" type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>
          )}

          <p className="login-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: calc(100vh - 64px);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: clamp(6rem, 12vh, 8rem) clamp(1rem, 4vw, 3rem) clamp(3rem, 7vh, 5rem);
          background:
            linear-gradient(135deg, rgba(0, 229, 204, 0.08), transparent 34%),
            radial-gradient(circle at 78% 16%, rgba(0, 229, 204, 0.12), transparent 28%),
            var(--bg-base);
        }

        .login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
          opacity: 0.35;
        }

        .login-shell {
          width: min(1040px, 100%);
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 430px);
          gap: clamp(1rem, 4vw, 3rem);
          align-items: stretch;
          position: relative;
          z-index: 2;
        }

        .login-intro {
          min-height: 560px;
          border: 1px solid var(--border-glow);
          border-radius: var(--rounded-md);
          background:
            linear-gradient(145deg, rgba(6, 12, 24, 0.55), rgba(6, 12, 24, 0.22)),
            linear-gradient(90deg, rgba(0, 229, 204, 0.08), transparent);
          padding: clamp(2rem, 5vw, 3.5rem);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .login-intro h1 {
          max-width: 620px;
          margin-top: 1.2rem;
          font-family: var(--font-display);
          font-size: clamp(1.75rem, 4.2vw, 3.15rem);
          line-height: 1.06;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-primary);
          letter-spacing: 0;
          overflow-wrap: anywhere;
          word-break: normal;
        }

        .login-intro p:not(.nexus-eyebrow) {
          max-width: 520px;
          margin-top: 1.5rem;
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.75;
        }

        .login-status-panel {
          width: min(420px, 100%);
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
          padding: 0.85rem 1rem;
          border: 1px solid var(--border-glass);
          border-radius: var(--rounded-md);
          background: rgba(0, 0, 0, 0.22);
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .login-status-panel div {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }

        .login-status-panel strong {
          color: var(--accent);
          font-size: 0.62rem;
          font-weight: 600;
        }

        .login-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent);
          flex: 0 0 auto;
        }

        .login-card {
          align-self: center;
          border: 1px solid var(--border-glow);
          border-radius: var(--rounded-md);
          background: rgba(6, 12, 24, 0.35);
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.56), 0 0 1px rgba(0, 229, 204, 0.3);
          padding: clamp(1.5rem, 4vw, 2.4rem);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .login-card-header {
          margin-bottom: 2rem;
        }

        .login-card-header h2 {
          margin-top: 0.55rem;
          font-family: var(--font-display);
          font-size: clamp(1.45rem, 4vw, 2rem);
          font-weight: 600;
          line-height: 1.1;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .login-field > span,
        .login-field-row {
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .login-field-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .login-field-row a,
        .login-switch a {
          color: var(--accent);
          font-weight: 600;
        }

        .login-code-input {
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
        }

        .login-helper {
          color: var(--text-muted);
          font-size: 0.92rem;
          line-height: 1.65;
        }

        .login-helper strong {
          color: var(--text-primary);
          font-weight: 600;
        }

        .login-alert {
          border: 1px solid rgba(255, 78, 110, 0.35);
          border-radius: var(--rounded-md);
          background: rgba(255, 78, 110, 0.08);
          color: #ff8ca3;
          padding: 0.85rem 1rem;
          font-size: 0.86rem;
          line-height: 1.45;
        }

        .login-submit {
          width: 100%;
          min-height: 46px;
          margin-top: 0.35rem;
        }

        .login-switch {
          margin-top: 1.4rem;
          color: var(--text-secondary);
          text-align: center;
          font-size: 0.9rem;
        }

        @media (max-width: 860px) {
          .login-shell {
            grid-template-columns: 1fr;
          }

          .login-intro {
            min-height: auto;
            gap: 2rem;
          }

          .login-intro h1 {
            font-size: clamp(1.7rem, 8vw, 2.65rem);
          }
        }

        @media (max-width: 520px) {
          .login-page {
            padding: 5.5rem 1rem 2rem;
          }

          .login-card,
          .login-intro {
            padding: 1.25rem;
          }

          .login-intro h1 {
            font-size: clamp(1.5rem, 9vw, 2.1rem);
            line-height: 1.12;
          }

          .login-status-panel {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
