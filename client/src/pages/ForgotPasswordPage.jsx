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
    <section className="forgot-page">
      <div className="forgot-grid" aria-hidden="true" />
      <div className="forgot-shell">
        <aside className="forgot-intro">
          <div>
            <p className="nexus-eyebrow">GIU Nexus Access</p>
            <h1>Recover your session</h1>
            <p>
              Request a verification code and get back to your applications,
              conversations, and saved opportunities.
            </p>
          </div>

          <div className="forgot-status-panel">
            <div>
              <span className="forgot-status-dot" />
              <span>Recovery channel ready</span>
            </div>
            <strong>SECURE RESET</strong>
          </div>
        </aside>

        <div className="forgot-card">
          <div className="forgot-card-header">
            <p className="nexus-eyebrow">Password Recovery</p>
            <h2>Forgot password?</h2>
            <p>Enter your email and we will send you a verification code.</p>
          </div>

          {!message ? (
            <form onSubmit={submit} className="forgot-form">
              <label className="forgot-field">
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

              {error && <p className="forgot-alert">{error}</p>}

              <button className="nexus-btn primary forgot-submit" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          ) : (
            <div className="forgot-confirm">
              <p className="forgot-success">{message}</p>
              <button
                className="nexus-btn primary forgot-submit"
                type="button"
                onClick={() => navigate("/verify-otp", { state: { email } })}
              >
                Enter verification code
              </button>
            </div>
          )}

          <p className="forgot-switch">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>

      <style>{`
        .forgot-page {
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

        .forgot-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 42px 42px;
          mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
          opacity: 0.35;
        }

        .forgot-shell {
          width: min(1040px, 100%);
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(360px, 430px);
          gap: clamp(1rem, 4vw, 3rem);
          align-items: stretch;
          position: relative;
          z-index: 1;
        }

        .forgot-intro {
          min-height: 560px;
          border: 1px solid var(--border-glow);
          border-radius: var(--rounded-md);
          background:
            linear-gradient(145deg, rgba(6, 12, 24, 0.78), rgba(6, 12, 24, 0.35)),
            linear-gradient(90deg, rgba(0, 229, 204, 0.12), transparent);
          padding: clamp(2rem, 5vw, 3.5rem);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48);
        }

        .forgot-intro h1 {
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
        }

        .forgot-intro p:not(.nexus-eyebrow) {
          max-width: 520px;
          margin-top: 1.5rem;
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.75;
        }

        .forgot-status-panel {
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

        .forgot-status-panel div {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }

        .forgot-status-panel strong {
          color: var(--accent);
          font-size: 0.62rem;
          font-weight: 600;
        }

        .forgot-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 12px var(--accent);
          flex: 0 0 auto;
        }

        .forgot-card {
          align-self: center;
          border: 1px solid var(--border-glow);
          border-radius: var(--rounded-md);
          background: var(--bg-surface-solid);
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.56), 0 0 1px rgba(0, 229, 204, 0.3);
          padding: clamp(1.5rem, 4vw, 2.4rem);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
        }

        .forgot-card-header {
          margin-bottom: 2rem;
        }

        .forgot-card-header h2 {
          margin-top: 0.55rem;
          font-family: var(--font-display);
          font-size: clamp(1.45rem, 4vw, 2rem);
          font-weight: 600;
          line-height: 1.1;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .forgot-card-header p:not(.nexus-eyebrow) {
          margin-top: 0.85rem;
          color: var(--text-muted);
          font-size: 0.92rem;
          line-height: 1.6;
        }

        .forgot-form,
        .forgot-confirm {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .forgot-field {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .forgot-field > span {
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 0.68rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .forgot-alert {
          border: 1px solid rgba(255, 78, 110, 0.35);
          border-radius: var(--rounded-md);
          background: rgba(255, 78, 110, 0.08);
          color: #ff8ca3;
          padding: 0.85rem 1rem;
          font-size: 0.86rem;
          line-height: 1.45;
        }

        .forgot-success {
          border: 1px solid var(--accent-mid);
          border-radius: var(--rounded-md);
          background: var(--accent-dim);
          color: var(--text-secondary);
          padding: 0.85rem 1rem;
          font-size: 0.86rem;
          line-height: 1.55;
        }

        .forgot-submit {
          width: 100%;
          min-height: 46px;
          margin-top: 0.35rem;
        }

        .forgot-switch {
          margin-top: 1.4rem;
          text-align: center;
          font-size: 0.9rem;
        }

        .forgot-switch a {
          color: var(--accent);
          font-weight: 600;
        }

        @media (max-width: 860px) {
          .forgot-shell {
            grid-template-columns: 1fr;
          }

          .forgot-intro {
            min-height: auto;
            gap: 2rem;
          }

          .forgot-intro h1 {
            font-size: clamp(1.7rem, 8vw, 2.65rem);
          }
        }

        @media (max-width: 520px) {
          .forgot-page {
            padding: 5.5rem 1rem 2rem;
          }

          .forgot-card,
          .forgot-intro {
            padding: 1.25rem;
          }

          .forgot-intro h1 {
            font-size: clamp(1.5rem, 9vw, 2.1rem);
            line-height: 1.12;
          }

          .forgot-status-panel {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </section>
  );
}
