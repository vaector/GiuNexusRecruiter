import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { authAPI, profileAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

const STEPS = { IDLE: "idle", LOADING: "loading", QR: "qr", VERIFY: "verify", DONE: "done" };

export default function TotpSetupPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.IDLE);
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [generating, setGenerating] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    document.body.style.background = "#030303";
    return () => { document.body.style.background = ""; };
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const onPointerMove = (e) => {
      const r = panel.getBoundingClientRect();
      panel.style.setProperty("--spotlight-x", `${Math.floor(e.clientX - r.left)}px`);
      panel.style.setProperty("--spotlight-y", `${Math.floor(e.clientY - r.top)}px`);
    };
    panel.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => panel.removeEventListener("pointermove", onPointerMove);
  }, []);

  const handleSetup = async () => {
    setError("");
    setGenerating(true);
    try {
      const res = await authAPI.setupTotp();
      setSecret(res.data.secret);
      setOtpauthUrl(res.data.otpauthUrl);
      setStep(STEPS.QR);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate TOTP secret.");
    } finally {
      setGenerating(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    if (!code.trim() || code.trim().length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setVerifying(true);
    try {
      await authAPI.verifyMfaOtp({ userId: user?._id, otp: code.trim(), method: "totp" });
      await profileAPI.toggleMfa({ mfaEnabled: true, mfaMethod: "totp" });
      setStep(STEPS.DONE);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    setError("");
    setVerifying(true);
    try {
      await profileAPI.toggleMfa({ mfaEnabled: false, mfaMethod: "email_otp" });
      setStep(STEPS.IDLE);
      setSecret("");
      setOtpauthUrl("");
      setCode("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to disable TOTP.");
    } finally {
      setVerifying(false);
    }
  };

  const isTotpEnabled = user?.mfaEnabled && user?.mfaMethod === "totp";

  const glassPanel = {
    background: "rgba(6, 12, 24, 0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(0, 229, 204, 0.12)",
    borderRadius: "4px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2)",
  };

  const btnPrimary = {
    fontFamily: MONO,
    fontSize: "0.68rem",
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase" ,
    padding: "0.6rem 1.25rem",
    border: "1px solid rgba(0, 229, 204, 0.4)",
    borderRadius: "2px",
    background: "rgba(0, 229, 204, 0.12)",
    color: TEAL,
    cursor: "pointer",
    transition: "all 0.18s ease",
  };

  const btnDanger = {
    ...btnPrimary,
    borderColor: "rgba(239, 68, 68, 0.4)",
    background: "rgba(239, 68, 68, 0.08)",
    color: "#ef4444",
  };

  return (
    <div
      ref={panelRef}
      style={{ position: "relative", minHeight: "100vh", background: "#030303", color: "#eaf2ff", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}
    >
      {/* Grain */}
      <div style={{ position: "fixed", inset: 0, opacity: 0.045, pointerEvents: "none", zIndex: 9998, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      {/* Vignette */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)", pointerEvents: "none", zIndex: 9997 }} />
      {/* Spotlight */}
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(0,229,204,0.03), transparent 60%)", pointerEvents: "none", zIndex: 1 }} />

      {/* HUD */}
      <div style={{ position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 60, pointerEvents: "none", fontFamily: MONO, fontSize: "9px", letterSpacing: "0.14em", color: "rgba(140,230,240,0.38)", textTransform: "uppercase", textAlign: "right" }}>
        MFA.SETUP<br />
        METHOD: <strong style={{ color: TEAL }}>TOTP</strong>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: "640px", margin: "0 auto", padding: "100px 1.5rem 4rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: MONO, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.18em", color: "rgba(0,229,204,0.6)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            SECURITY
          </div>
          <h1 style={{ fontFamily: "'Syncopate','Inter',system-ui,sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 600, color: "#eaf2ff", letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0 }}>
            TOTP SETUP
          </h1>
          <p style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.9rem", color: "rgba(234,242,255,0.45)", lineHeight: 1.7, marginTop: "0.75rem" }}>
            {isTotpEnabled
              ? "TOTP authenticator is currently enabled on your account."
              : "Enable two-factor authentication using an authenticator app like Google Authenticator or Authy."}
          </p>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" style={{ ...glassPanel, padding: "0.85rem 1rem", marginBottom: "1rem", borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em" }}>
            {error}
          </div>
        )}

        {/* Already enabled state */}
        {isTotpEnabled && step !== STEPS.DONE && (
          <div style={{ ...glassPanel, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "2px", background: "rgba(0,229,204,0.1)", border: "1px solid rgba(0,229,204,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL }}>
                  TOTP ENABLED
                </div>
                <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.6)", marginTop: "2px" }}>
                  Your account is protected with authenticator-based MFA.
                </div>
              </div>
            </div>
            <button onClick={handleDisable} disabled={verifying} style={btnDanger}>
              {verifying ? "DISABLING..." : "DISABLE TOTP"}
            </button>
          </div>
        )}

        {/* Initial state — show enable button */}
        {!isTotpEnabled && step === STEPS.IDLE && (
          <div style={{ ...glassPanel, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "2px", background: "rgba(0,229,204,0.1)", border: "1px solid rgba(0,229,204,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(234,242,255,0.45)", marginBottom: "0.25rem" }}>
                  STEP 1
                </div>
                <div style={{ fontSize: "0.9rem", color: "#eaf2ff", lineHeight: 1.5 }}>
                  Generate a TOTP secret and scan the QR code with your authenticator app.
                </div>
              </div>
            </div>
            <button onClick={handleSetup} disabled={generating} style={btnPrimary}>
              {generating ? "GENERATING..." : "ENABLE TOTP"}
            </button>
          </div>
        )}

        {/* QR code display */}
        {step === STEPS.QR && (
          <div style={{ ...glassPanel, padding: "1.5rem" }}>
            <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "1rem" }}>
              STEP 2 — SCAN QR CODE
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ background: "#fff", padding: "12px", borderRadius: "4px", display: "inline-flex" }}>
                <QRCodeSVG value={otpauthUrl} size={180} level="M" />
              </div>
              <div style={{ width: "100%" }}>
                <div style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", marginBottom: "0.5rem" }}>
                  MANUAL ENTRY KEY
                </div>
                <div style={{ ...glassPanel, padding: "0.75rem 1rem", fontFamily: MONO, fontSize: "0.82rem", letterSpacing: "0.08em", color: TEAL, wordBreak: "break-all", background: "rgba(0,0,0,0.4)" }}>
                  {secret}
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
              <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "0.75rem" }}>
                STEP 3 — VERIFY CODE
              </div>
              <p style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.45)", marginBottom: "1rem", lineHeight: 1.5 }}>
                Enter the 6-digit code from your authenticator app to verify setup.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setCode(v); setError(""); }}
                  placeholder="000000"
                  maxLength={6}
                  aria-label="TOTP verification code"
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "2px",
                    color: "#eaf2ff",
                    fontFamily: MONO,
                    fontSize: "1.5rem",
                    letterSpacing: "0.5em",
                    padding: "0.75rem 1rem",
                    width: "220px",
                    outline: "none",
                    textAlign: "center",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(0,229,204,0.5)"; e.target.style.boxShadow = "0 0 8px rgba(0,229,204,0.25)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                />
                <button onClick={handleVerify} disabled={verifying || code.length !== 6} style={btnPrimary}>
                  {verifying ? "VERIFYING..." : "VERIFY & ENABLE"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success state */}
        {step === STEPS.DONE && (
          <div style={{ ...glassPanel, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "2px", background: "rgba(0,229,204,0.1)", border: "1px solid rgba(0,229,204,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e5cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL }}>
                  TOTP ENABLED
                </div>
                <div style={{ fontSize: "0.9rem", color: "rgba(234,242,255,0.6)", marginTop: "2px" }}>
                  Your account is now protected with authenticator-based MFA. You will need your authenticator code when logging in.
                </div>
              </div>
            </div>
            <button onClick={() => navigate("/profile")} style={btnPrimary}>
              BACK TO PROFILE
            </button>
          </div>
        )}

        {/* Bottom divider */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            END.TOTP_SETUP
          </span>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            STATUS: <strong style={{ color: isTotpEnabled ? TEAL : "rgba(140,230,240,0.38)" }}>{isTotpEnabled ? "ACTIVE" : "IDLE"}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}