import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { authAPI } from "../services/api";
import SpookyGhost from "../components/SpookyGhost";

const roleOptions = [
  {
    value: "jobSeeker",
    label: "Job Seeker",
    description: "Find matched roles and track applications.",
  },
  {
    value: "recruiter",
    label: "Recruiter",
    description: "Post roles after admin approval.",
  },
];

const RegisterPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "jobSeeker" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register(form);
      const { token, user } = res.data;

      if (user.status === "pending") {
        setPending(true);
      } else {
        login(token, user);
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (pending) {
    return (
      <section className="register-page">
        <div className="register-grid" aria-hidden="true" />
        <div className="register-pending-card">
          <div className="register-pending-icon" aria-hidden="true">
            <span />
          </div>
          <p className="nexus-eyebrow">Recruiter Review</p>
          <h1>Account pending</h1>
          <p>
            Your recruiter account has been created. Our team is reviewing your details,
            and you will be able to post jobs as soon as your account is approved.
          </p>
          <Link className="nexus-btn primary register-pending-link" to="/login">
            Return to login
          </Link>
        </div>

        <RegisterStyles />
      </section>
    );
  }

  return (
    <section className="register-page">
      <div className="register-grid" aria-hidden="true" />
      <SpookyGhost passwordFocused={passwordFocused} />
      <div className="register-shell">
        <aside className="register-intro">
          <div>
            <p className="nexus-eyebrow">GIU Nexus Access</p>
            <h1>Create your network identity</h1>
            <p>
              Join GIU Nexus to discover opportunities, manage applications,
              and connect with verified recruiters in one secure workspace.
            </p>
          </div>

          <div className="register-status-panel">
            <div>
              <span className="register-status-dot" />
              <span>Profile layer ready</span>
            </div>
            <strong>NEW SESSION</strong>
          </div>
        </aside>

        <div className="register-card">
          <div className="register-card-header">
            <p className="nexus-eyebrow">Start Here</p>
            <h2>Create account</h2>
          </div>

          <div className="register-role-group" role="radiogroup" aria-label="Account type">
            {roleOptions.map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                className={`register-role-option${form.role === value ? " active" : ""}`}
                onClick={() => setForm({ ...form, role: value })}
                role="radio"
                aria-checked={form.role === value}
              >
                <span>{label}</span>
                <small>{description}</small>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="register-form">
            <label className="register-field">
              <span>Full name</span>
              <input
                className="nexus-input"
                name="name"
                type="text"
                placeholder="Mohab Khaled"
                value={form.name}
                onChange={handleChange}
                required
              />
            </label>

            <label className="register-field">
              <span>Email</span>
              <input
                className="nexus-input"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </label>

            <label className="register-field">
              <span>Password</span>
              <input
                className="nexus-input"
                name="password"
                type="password"
                placeholder="At least 6 characters"
                value={form.password}
                onChange={handleChange}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                required
              />
            </label>

            {error && <p className="register-alert">{error}</p>}

            {form.role === "recruiter" && (
              <p className="register-helper">
                Recruiter accounts require admin approval before posting jobs.
              </p>
            )}

            <button className="nexus-btn primary register-submit" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="register-switch">
            Already have one? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <RegisterStyles />
    </section>
  );
};

const RegisterStyles = () => (
  <style>{`
    .register-page {
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

    .register-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
      background-size: 42px 42px;
      mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
      opacity: 0.35;
    }

    .register-shell {
      width: min(1040px, 100%);
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(360px, 430px);
      gap: clamp(1rem, 4vw, 3rem);
      align-items: stretch;
      position: relative;
      z-index: 2;
    }

    .register-intro {
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

    .register-intro h1,
    .register-pending-card h1 {
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

    .register-intro p:not(.nexus-eyebrow),
    .register-pending-card > p:not(.nexus-eyebrow) {
      max-width: 520px;
      margin-top: 1.5rem;
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1.75;
    }

    .register-status-panel {
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

    .register-status-panel div {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    .register-status-panel strong {
      color: var(--accent);
      font-size: 0.62rem;
      font-weight: 600;
    }

    .register-status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 12px var(--accent);
      flex: 0 0 auto;
    }

    .register-card,
    .register-pending-card {
      border: 1px solid var(--border-glow);
      border-radius: var(--rounded-md);
      background: rgba(6, 12, 24, 0.35);
      box-shadow: 0 22px 70px rgba(0, 0, 0, 0.56), 0 0 1px rgba(0, 229, 204, 0.3);
      padding: clamp(1.5rem, 4vw, 2.4rem);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .register-card {
      align-self: center;
    }

    .register-card-header {
      margin-bottom: 2rem;
    }

    .register-card-header h2 {
      margin-top: 0.55rem;
      font-family: var(--font-display);
      font-size: clamp(1.45rem, 4vw, 2rem);
      font-weight: 600;
      line-height: 1.1;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 0;
    }

    .register-role-group {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.3rem;
    }

    .register-role-option {
      min-height: 108px;
      border: 1px solid var(--border-glass);
      border-radius: var(--rounded-md);
      background: rgba(255, 255, 255, 0.035);
      color: var(--text-secondary);
      cursor: pointer;
      padding: 0.85rem;
      text-align: left;
      transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
    }

    .register-role-option:hover,
    .register-role-option.active {
      border-color: var(--accent-mid);
      background: var(--accent-dim);
      color: var(--text-primary);
    }

    .register-role-option span {
      display: block;
      margin-bottom: 0.55rem;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }

    .register-role-option small {
      display: block;
      color: var(--text-muted);
      font-size: 0.78rem;
      line-height: 1.45;
    }

    .register-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .register-field {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .register-field > span {
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .register-alert {
      border: 1px solid rgba(255, 78, 110, 0.35);
      border-radius: var(--rounded-md);
      background: rgba(255, 78, 110, 0.08);
      color: #ff8ca3;
      padding: 0.85rem 1rem;
      font-size: 0.86rem;
      line-height: 1.45;
    }

    .register-helper {
      border: 1px solid var(--border-glass);
      border-radius: var(--rounded-md);
      background: rgba(0, 0, 0, 0.18);
      color: var(--text-muted);
      padding: 0.8rem 0.95rem;
      font-size: 0.84rem;
      line-height: 1.5;
    }

    .register-submit {
      width: 100%;
      min-height: 46px;
      margin-top: 0.35rem;
    }

    .register-switch {
      margin-top: 1.4rem;
      color: var(--text-secondary);
      text-align: center;
      font-size: 0.9rem;
    }

    .register-switch a {
      color: var(--accent);
      font-weight: 600;
    }

    .register-pending-card {
      width: min(520px, 100%);
      position: relative;
      z-index: 1;
      text-align: center;
    }

    .register-pending-card h1,
    .register-pending-card > p:not(.nexus-eyebrow) {
      margin-left: auto;
      margin-right: auto;
    }

    .register-pending-icon {
      width: 74px;
      height: 74px;
      border: 1px solid var(--accent-mid);
      border-radius: 50%;
      display: grid;
      place-items: center;
      margin: 0 auto 1.6rem;
      background: var(--accent-dim);
      box-shadow: 0 0 28px var(--accent-glow);
    }

    .register-pending-icon span {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 18px var(--accent);
    }

    .register-pending-link {
      width: 100%;
      min-height: 46px;
      margin-top: 2rem;
    }

    @media (max-width: 860px) {
      .register-shell {
        grid-template-columns: 1fr;
      }

      .register-intro {
        min-height: auto;
        gap: 2rem;
      }

      .register-intro h1 {
        font-size: clamp(1.7rem, 8vw, 2.65rem);
      }
    }

    @media (max-width: 520px) {
      .register-page {
        padding: 5.5rem 1rem 2rem;
      }

      .register-card,
      .register-intro,
      .register-pending-card {
        padding: 1.25rem;
      }

      .register-intro h1,
      .register-pending-card h1 {
        font-size: clamp(1.5rem, 9vw, 2.1rem);
        line-height: 1.12;
      }

      .register-status-panel,
      .register-role-group {
        align-items: stretch;
        grid-template-columns: 1fr;
      }

      .register-status-panel {
        align-items: flex-start;
        flex-direction: column;
      }
    }
  `}</style>
);

export default RegisterPage;
