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

  if (!email) {
    return (
      <section className="otp-page">
        <div className="otp-grid" aria-hidden="true" />
        <div className="otp-message-card">
          <p className="nexus-eyebrow">Password Recovery</p>
          <h1>Session expired</h1>
          <p>Please restart the password reset process to request a new verification code.</p>
          <Link className="nexus-btn primary otp-submit" to="/forgot-password">
            Back to forgot password
          </Link>
        </div>

        <OtpStyles />
      </section>
    );
  }

  return (
    <section className="otp-page">
      <div className="otp-grid" aria-hidden="true" />
      <div className="otp-shell">
        <aside className="otp-intro">
          <div>
            <p className="nexus-eyebrow">GIU Nexus Access</p>
            <h1>Verify your recovery code</h1>
            <p>
              Confirm the code sent to your email to continue into the secure
              password reset flow.
            </p>
          </div>

          <div className="otp-status-panel">
            <div>
              <span className="otp-status-dot" />
              <span>Verification layer active</span>
            </div>
            <strong>STEP 2 OF 3</strong>
          </div>
        </aside>

        <div className="otp-card">
          <div className="otp-card-header">
            <p className="nexus-eyebrow">Step 2 of 3</p>
            <h2>Enter code</h2>
            <p>
              We sent a 6-digit code to <strong>{email}</strong>.
            </p>
          </div>

          <form onSubmit={submit} className="otp-form">
            <label className="otp-field">
              <span>Verification code</span>
              <input
                className="nexus-input otp-code-input"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </label>

            {error && <p className="otp-alert">{error}</p>}

            <button
              className="nexus-btn primary otp-submit"
              type="submit"
              disabled={loading || otp.length !== 6}
            >
              {loading ? "Verifying..." : "Verify code"}
            </button>
          </form>

          <p className="otp-switch">
            Didn't get a code? <Link to="/forgot-password">Resend</Link>
          </p>
        </div>
      </div>

      <OtpStyles />
    </section>
  );
}

const OtpStyles = () => (
  <style>{`
    .otp-page {
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

    .otp-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
      background-size: 42px 42px;
      mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
      opacity: 0.35;
    }

    .otp-shell {
      width: min(1040px, 100%);
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(360px, 430px);
      gap: clamp(1rem, 4vw, 3rem);
      align-items: stretch;
      position: relative;
      z-index: 1;
    }

    .otp-intro {
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

    .otp-intro h1,
    .otp-message-card h1 {
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

    .otp-intro p:not(.nexus-eyebrow),
    .otp-message-card > p:not(.nexus-eyebrow) {
      max-width: 520px;
      margin-top: 1.5rem;
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1.75;
    }

    .otp-status-panel {
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

    .otp-status-panel div {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    .otp-status-panel strong {
      color: var(--accent);
      font-size: 0.62rem;
      font-weight: 600;
    }

    .otp-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 12px var(--accent);
      flex: 0 0 auto;
    }

    .otp-card,
    .otp-message-card {
      border: 1px solid var(--border-glow);
      border-radius: var(--rounded-md);
      background: var(--bg-surface-solid);
      box-shadow: 0 22px 70px rgba(0, 0, 0, 0.56), 0 0 1px rgba(0, 229, 204, 0.3);
      padding: clamp(1.5rem, 4vw, 2.4rem);
      backdrop-filter: blur(22px);
      -webkit-backdrop-filter: blur(22px);
    }

    .otp-card {
      align-self: center;
    }

    .otp-card-header {
      margin-bottom: 2rem;
    }

    .otp-card-header h2 {
      margin-top: 0.55rem;
      font-family: var(--font-display);
      font-size: clamp(1.45rem, 4vw, 2rem);
      font-weight: 600;
      line-height: 1.1;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .otp-card-header p:not(.nexus-eyebrow) {
      margin-top: 0.85rem;
      color: var(--text-muted);
      font-size: 0.92rem;
      line-height: 1.6;
    }

    .otp-card-header strong {
      color: var(--text-primary);
      font-weight: 600;
    }

    .otp-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .otp-field {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .otp-field > span {
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .otp-code-input {
      font-family: var(--font-mono);
      font-size: 1.25rem;
      letter-spacing: 0.3em;
      text-align: center;
    }

    .otp-alert {
      border: 1px solid rgba(255, 78, 110, 0.35);
      border-radius: var(--rounded-md);
      background: rgba(255, 78, 110, 0.08);
      color: #ff8ca3;
      padding: 0.85rem 1rem;
      font-size: 0.86rem;
      line-height: 1.45;
    }

    .otp-submit {
      width: 100%;
      min-height: 46px;
      margin-top: 0.35rem;
    }

    .otp-switch {
      margin-top: 1.4rem;
      color: var(--text-secondary);
      text-align: center;
      font-size: 0.9rem;
    }

    .otp-switch a,
    .otp-message-card a {
      color: var(--accent);
      font-weight: 600;
    }

    .otp-message-card {
      width: min(520px, 100%);
      position: relative;
      z-index: 1;
      text-align: center;
    }

    .otp-message-card h1,
    .otp-message-card > p:not(.nexus-eyebrow) {
      margin-left: auto;
      margin-right: auto;
    }

    .otp-message-card .otp-submit {
      margin-top: 2rem;
    }

    @media (max-width: 860px) {
      .otp-shell {
        grid-template-columns: 1fr;
      }

      .otp-intro {
        min-height: auto;
        gap: 2rem;
      }

      .otp-intro h1 {
        font-size: clamp(1.7rem, 8vw, 2.65rem);
      }
    }

    @media (max-width: 520px) {
      .otp-page {
        padding: 5.5rem 1rem 2rem;
      }

      .otp-card,
      .otp-intro,
      .otp-message-card {
        padding: 1.25rem;
      }

      .otp-intro h1,
      .otp-message-card h1 {
        font-size: clamp(1.5rem, 9vw, 2.1rem);
        line-height: 1.12;
      }

      .otp-status-panel {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `}</style>
);
