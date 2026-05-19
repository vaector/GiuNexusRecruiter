// Registration form
// Role selector shows only jobSeeker and recruiter
// Calls POST /api/v1/auth/register
// Shows pending approval notice for recruiters
import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { authAPI } from "../services/api";

const QUOTES = [
  { text: "Your next opportunity is one click away.", author: "GIU Nexus" },
  { text: "Join the future of talent.", author: "GIU Nexus" },
  { text: "Connecting ambition with opportunity.", author: "GIU Nexus" },
];

const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

const RegisterPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "jobSeeker" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
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

  const inputStyle = {
    width: "100%",
    padding: "0.85rem 1.15rem",
    borderRadius: "var(--rounded-md)",
    border: "1px solid var(--color-ink)",
    background: "var(--color-canvas)",
    color: "var(--color-ink)",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.15s",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle = {
    display: "block",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--color-ink)",
    marginBottom: "0.5rem",
  };

  if (pending) {
    return (
      <div style={{ 
        minHeight: "calc(100vh - 90px)", 
        width: "100%",
        display: "flex", 
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% -20%, #1e1324 0%, #0b0f19 40%, #05070a 100%)", 
        position: "relative",
        overflow: "hidden", 
        boxSizing: "border-box",
        padding: "2rem"
      }}>

        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.15, pointerEvents: "none", zIndex: 1
        }} />

        <div style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
          backgroundImage: "linear-gradient(rgba(255, 79, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 79, 0, 0.05) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none", zIndex: 1
        }} />

        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 600, background: "radial-gradient(circle, rgba(255,79,0,0.05) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1 }} />

        <div style={{ 
          position: "relative",
          zIndex: 2,
          maxWidth: 480, 
          width: "100%", 
          textAlign: "center",
          background: "rgba(25, 30, 45, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          padding: "4rem 3rem",
          borderRadius: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}>

          <div style={{ 
            width: 80, 
            height: 80, 
            borderRadius: "50%", 
            background: "radial-gradient(circle, rgba(255,79,0,0.15) 0%, rgba(255,79,0,0.05) 100%)", 
            border: "1px solid rgba(255, 79, 0, 0.3)",
            boxShadow: "0 0 40px rgba(255, 79, 0, 0.2), inset 0 0 20px rgba(255, 79, 0, 0.1)",
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            margin: "0 auto 2rem", 
            fontSize: "2.5rem" 
          }}>
            <span style={{ transform: "translateY(-2px)" }}>⏳</span>
          </div>
          
          <h1 style={{ fontSize: "2rem", fontWeight: 600, color: "white", marginBottom: "1rem", letterSpacing: "-0.5px" }}>
            Account Pending
          </h1>
          
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: 1.6, marginBottom: "2.5rem" }}>
            Your recruiter account has been successfully created. Our team is currently reviewing your details. You will be able to post jobs as soon as you are approved.
          </p>
          
          <Link to="/login" style={{ 
            display: "inline-block",
            background: "var(--color-primary)", 
            color: "white", 
            padding: "1rem 2.5rem", 
            borderRadius: "var(--rounded-md)", 
            textDecoration: "none", 
            fontWeight: 600, 
            fontSize: "16px",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 15px rgba(255, 79, 0, 0.3)"
          }}>
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--color-canvas)" }}>
      <div style={{
        position: "relative",
        flex: 1,
        background: "radial-gradient(circle at 80% 20%, #1e1324 0%, #0b0f19 50%, #05070a 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "4rem 3rem",
        minHeight: "100vh",
        overflow: "hidden",
        color: "white",
        boxSizing: "border-box"
      }}>
        
        <div style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: "linear-gradient(rgba(255, 79, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 79, 0, 0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            pointerEvents: "none",
            zIndex: 1
        }} />

        <div style={{ 
            position: "absolute", top: -100, right: -100, width: 450, height: 450, borderRadius: "50%", 
            border: "2px solid rgba(255, 79, 0, 0.3)", 
            boxShadow: "0 0 80px rgba(255, 79, 0, 0.15), inset 0 0 60px rgba(255, 79, 0, 0.1)",
            pointerEvents: "none",
            zIndex: 1 
        }} />

        <div style={{ 
            position: "absolute", bottom: -80, left: -80, width: 300, height: 300, borderRadius: "50%", 
            border: "1px solid rgba(255, 79, 0, 0.4)", 
            boxShadow: "0 0 80px rgba(255, 79, 0, 0.15), inset 0 0 60px rgba(255, 79, 0, 0.1)",
            pointerEvents: "none", zIndex: 1 
        }} />

        <div style={{ 
            position: "absolute", top: "45%", right: "5%", width: 150, height: 150, borderRadius: "50%", 
            background: "radial-gradient(circle, rgba(255,79,0,0.15) 0%, rgba(255,79,0,0) 70%)",
            border: "2px solid rgba(255, 79, 0, 0.5)", 
            boxShadow: "0 0 40px rgba(255, 79, 0, 0.3)",
            pointerEvents: "none", zIndex: 1 
        }} />

        <div style={{ position: "relative", zIndex: 2 }}>
        </div>

        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "start" }}>
            <blockquote style={{ fontSize: "2.4rem", fontWeight: 600, color: "white", lineHeight: 1.3, marginBottom: "1.25rem", fontStyle: "normal" }}>
              {quote.text}
            </blockquote>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "18px", letterSpacing: "0.5px" }}>— {quote.author}</p>
        </div>

        <div style={{ position: "relative", zIndex: 2 }}>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "12vh 2rem 4rem 2rem",
        overflowY: "auto",
        flexDirection: "column",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.5rem" }}>Create account</h1>
          <p style={{ color: "var(--color-body)", marginBottom: "2rem", fontSize: "15px" }}>
            Already have one?{" "}
            <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
          </p>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.75rem" }}>
            {[
              { value: "jobSeeker", label: "Job Seeker", icon: "👤" },
              { value: "recruiter", label: "Recruiter", icon: "🏢" },
            ].map(({ value, label, icon }) => (
                <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    style={{
                        flex: 1,
                        padding: "0.85rem",
                        borderRadius: "var(--rounded-md)",
                        border: form.role === value ? "2px solid var(--color-primary)" : "1px solid var(--color-mute)",
                        background: form.role === value ? "#fff3ee" : "var(--color-canvas)",
                        color: form.role === value ? "var(--color-primary)" : "var(--color-body)",
                        cursor: "pointer",
                        fontWeight: form.role === value ? 600 : 400,
                        fontSize: "14px",
                        transition: "all 0.15s",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "0.35rem",
                    }}
                >
                    <span style={{ fontSize: "1.3rem" }}>{icon}</span>
                    {label}
                    {value === "jobSeeker" && (
                        <span style={{ fontSize: "11px", color: "var(--color-body-mid)", fontWeight: 400 }}></span>
                    )}
                </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
                <label style={labelStyle}>Full name</label>
                <input
                    style={inputStyle}
                    name="name"
                    type="text"
                    placeholder="Mohab Khaled"
                    value={form.name}
                    onChange={handleChange}
                    required
                    onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-ink)"}
                />
            </div>

            <div>
                <label style={labelStyle}>Email address</label>
                <input
                    style={inputStyle}
                    name="email"
                    type="email"
                    placeholder="Mohab@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                    onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-ink)"}
                />
            </div>

            <div>
                <label style={labelStyle}>Password</label>
                <input
                    style={inputStyle}
                    name="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={handleChange}
                    required
                    onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--color-ink)"}
                />
            </div>

            {error && (
                <div style={{ background: "#fff0ee", border: "1px solid #ffcbb5", borderRadius: "var(--rounded-sm)", padding: "0.75rem 1rem", color: "#9a3412", fontSize: "14px" }}>
                  {error}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                style={{
                    background: loading ? "var(--color-mute)" : "var(--color-primary)",
                    color: "var(--color-on-primary)",
                    border: "none",
                    padding: "0.85rem",
                    borderRadius: "var(--rounded-md)",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "opacity 0.15s",
                    marginTop: "0.5rem",
                }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

        <div style={{ minHeight: "45px", marginTop: "1rem" }}>
            {form.role === "recruiter" && (
                <p style={{ 
                    fontSize: "13px", 
                    color: "var(--color-body-mid)", 
                    lineHeight: 1.5,
                    margin: 0
                }}>
                    ‼️ Recruiter accounts require admin approval before you can post jobs.
                </p>
            )}
        </div>

            <p style={{ marginTop: "1.5rem", fontSize: "12px", color: "var(--color-body-mid)", textAlign: "center", lineHeight: 1.5 }}>
                By creating an account you agree to our terms of service and privacy policy.
            </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;