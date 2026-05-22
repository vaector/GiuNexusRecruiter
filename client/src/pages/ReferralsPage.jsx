import { useState, useEffect, useRef, useCallback, useContext } from "react";
import { referralsAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

const TABS = [
  { key: "code", label: "MY CODE" },
  { key: "sent", label: "SENT" },
  { key: "received", label: "RECEIVED" },
];

const STATUS_STYLES = {
  pending: { color: "#f0c040", bg: "rgba(240,192,64,0.1)", border: "rgba(240,192,64,0.3)" },
  accepted: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.3)" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
  expired: { color: "rgba(234,242,255,0.3)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" },
};

const relativeTime = (dateStr) => {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

export default function ReferralsPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("code");
  const [referralCode, setReferralCode] = useState("");
  const [codeLoading, setCodeLoading] = useState(true);
  const [sentList, setSentList] = useState([]);
  const [receivedList, setReceivedList] = useState([]);
  const [sentTotal, setSentTotal] = useState(0);
  const [receivedTotal, setReceivedTotal] = useState(0);
  const [sentPage, setSentPage] = useState(1);
  const [receivedPage, setReceivedPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [referrerCode, setReferrerCode] = useState("");
  const [jobId, setJobId] = useState("");
  const [requestMsg, setRequestMsg] = useState("");
  const [requesting, setRequesting] = useState(false);

  const [respondingId, setRespondingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const panelRef = useRef(null);

  const loadCode = useCallback(async () => {
    try {
      setCodeLoading(true);
      const res = await referralsAPI.getMyCode();
      setReferralCode(res.data.code);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load referral code.");
    } finally {
      setCodeLoading(false);
    }
  }, []);

  const loadSent = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await referralsAPI.getSentReferrals({ page: p, limit: 20 });
      setSentList(res.data.referrals || []);
      setSentTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sent referrals.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadReceived = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await referralsAPI.getReceivedReferrals({ page: p, limit: 20 });
      setReceivedList(res.data.referrals || []);
      setReceivedTotal(res.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load received referrals.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCode();
  }, [loadCode]);

  useEffect(() => {
    if (activeTab === "sent") loadSent(sentPage);
    else if (activeTab === "received") loadReceived(receivedPage);
  }, [activeTab, sentPage, receivedPage, loadSent, loadReceived]);

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestReferral = async (e) => {
    e.preventDefault();
    if (!referrerCode.trim() || !jobId.trim()) return;
    setRequesting(true);
    setError("");
    try {
      await referralsAPI.requestReferral({ referrerCode: referrerCode.trim(), jobId: jobId.trim(), message: requestMsg.trim() });
      setShowRequestForm(false);
      setReferrerCode("");
      setJobId("");
      setRequestMsg("");
      if (activeTab === "sent") loadSent(sentPage);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request referral.");
    } finally {
      setRequesting(false);
    }
  };

  const handleRespond = async (id, status) => {
    setRespondingId(id);
    setError("");
    try {
      await referralsAPI.respondToReferral(id, status);
      loadReceived(receivedPage);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to respond to referral.");
    } finally {
      setRespondingId(null);
    }
  };

  const glassPanel = {
    background: "rgba(6, 12, 24, 0.92)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(0, 229, 204, 0.12)",
    borderRadius: "4px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5), 0 0 1px rgba(0, 229, 204, 0.2)",
  };

  const inputStyle = {
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "2px",
    color: "#eaf2ff",
    fontFamily: "'Inter',system-ui,sans-serif",
    fontSize: "0.9rem",
    padding: "0.6rem 0.75rem",
    width: "100%",
    outline: "none",
    transition: "border-color 0.2s",
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
        SENT: <strong style={{ color: TEAL }}>{sentTotal}</strong><br />
        RCVD: <strong style={{ color: TEAL }}>{receivedTotal}</strong>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: "860px", margin: "0 auto", padding: "100px 1.5rem 4rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ fontFamily: MONO, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.18em", color: "rgba(0,229,204,0.6)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            NETWORK
          </div>
          <h1 style={{ fontFamily: "'Syncopate','Inter',system-ui,sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 600, color: "#eaf2ff", letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0 }}>
            REFERRALS
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(234,242,255,0.45)", lineHeight: 1.7, marginTop: "0.5rem" }}>
            Share your referral code, request referrals, and manage incoming referral requests.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" aria-live="assertive" style={{ ...glassPanel, padding: "0.85rem 1rem", marginBottom: "1rem", borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em" }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  fontFamily: MONO, fontSize: "0.68rem", fontWeight: isActive ? 600 : 400, letterSpacing: "0.1em", textTransform: "uppercase",
                  padding: "0.4rem 0.75rem", borderRadius: "2px",
                  border: isActive ? "1px solid rgba(0,229,204,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  background: isActive ? "rgba(0,229,204,0.1)" : "transparent",
                  color: isActive ? TEAL : "rgba(234,242,255,0.45)",
                  cursor: "pointer", transition: "all 0.18s ease",
                  boxShadow: isActive ? "0 0 6px rgba(0,229,204,0.1)" : "none",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB: My Code */}
        {activeTab === "code" && (
          <div style={{ ...glassPanel, padding: "1.5rem" }}>
            <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "1rem" }}>
              YOUR REFERRAL CODE
            </div>
            <p style={{ fontSize: "0.85rem", color: "rgba(234,242,255,0.45)", marginBottom: "1.25rem", lineHeight: 1.5 }}>
              Share this code with job seekers so they can request a referral from you.
            </p>
            {codeLoading ? (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "20px", height: "20px", border: "2px solid rgba(0,229,204,0.2)", borderTopColor: TEAL, borderRadius: "50%", animation: "refSpin 0.8s linear infinite" }} />
                <span style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.14em", color: "rgba(234,242,255,0.3)", textTransform: "uppercase" }}>LOADING...</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <div style={{ ...glassPanel, padding: "0.75rem 1.5rem", fontFamily: MONO, fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.12em", color: TEAL, background: "rgba(0,0,0,0.4)" }}>
                  {referralCode}
                </div>
                <button
                  onClick={handleCopyCode}
                  style={{
                    fontFamily: MONO, fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "0.5rem 1rem", borderRadius: "2px",
                    border: "1px solid rgba(0,229,204,0.3)",
                    background: copied ? "rgba(0,229,204,0.15)" : "rgba(0,229,204,0.05)",
                    color: copied ? TEAL : "rgba(0,229,204,0.7)",
                    cursor: "pointer", transition: "all 0.18s ease",
                  }}
                >
                  {copied ? "COPIED" : "COPY"}
                </button>
              </div>
            )}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "1.5rem", paddingTop: "1.25rem" }}>
              <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "0.75rem" }}>
                REQUEST A REFERRAL
              </div>
              <p style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.4)", marginBottom: "1rem", lineHeight: 1.5 }}>
                Enter a referrer&apos;s code and the job ID to request a referral. You must have already applied to the job.
              </p>
              {!showRequestForm ? (
                <button
                  onClick={() => setShowRequestForm(true)}
                  style={{
                    fontFamily: MONO, fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                    padding: "0.5rem 1rem", borderRadius: "2px",
                    border: "1px solid rgba(0,229,204,0.3)",
                    background: "rgba(0,229,204,0.05)",
                    color: TEAL, cursor: "pointer", transition: "all 0.18s ease",
                  }}
                >
                  + REQUEST REFERRAL
                </button>
              ) : (
                <form onSubmit={handleRequestReferral} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.25rem" }}>
                      REFERRER CODE *
                    </label>
                    <input
                      type="text"
                      value={referrerCode}
                      onChange={(e) => setReferrerCode(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCD1234"
                      required
                      maxLength={8}
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(0,229,204,0.5)"; e.target.style.boxShadow = "0 0 8px rgba(0,229,204,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.25rem" }}>
                      JOB ID *
                    </label>
                    <input
                      type="text"
                      value={jobId}
                      onChange={(e) => setJobId(e.target.value)}
                      placeholder="e.g. 6554a1b2c3d4e5f6a7b8c9d0"
                      required
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(0,229,204,0.5)"; e.target.style.boxShadow = "0 0 8px rgba(0,229,204,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div>
                    <label style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.25rem" }}>
                      MESSAGE (OPTIONAL)
                    </label>
                    <textarea
                      value={requestMsg}
                      onChange={(e) => setRequestMsg(e.target.value)}
                      placeholder="Tell the referrer why you need this referral..."
                      rows={3}
                      maxLength={300}
                      style={{ ...inputStyle, resize: "vertical", minHeight: "60px" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(0,229,204,0.5)"; e.target.style.boxShadow = "0 0 8px rgba(0,229,204,0.25)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="submit"
                      disabled={requesting}
                      style={{
                        fontFamily: MONO, fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "0.55rem 1.25rem", borderRadius: "2px",
                        border: "1px solid rgba(0,229,204,0.4)",
                        background: requesting ? "rgba(0,229,204,0.15)" : "rgba(0,229,204,0.12)",
                        color: requesting ? "rgba(0,229,204,0.5)" : TEAL,
                        cursor: requesting ? "not-allowed" : "pointer", transition: "all 0.18s ease",
                      }}
                    >
                      {requesting ? "SENDING..." : "SEND REQUEST"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowRequestForm(false); setReferrerCode(""); setJobId(""); setRequestMsg(""); }}
                      style={{
                        fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "0.55rem 1rem", borderRadius: "2px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "transparent", color: "rgba(234,242,255,0.45)", cursor: "pointer", transition: "all 0.18s ease",
                      }}
                    >
                      CANCEL
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB: Sent */}
        {activeTab === "sent" && (
          <div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", gap: "1rem" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid rgba(0,229,204,0.2)", borderTopColor: TEAL, borderRadius: "50%", animation: "refSpin 0.8s linear infinite" }} />
                <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.14em", color: "rgba(234,242,255,0.3)", textTransform: "uppercase" }}>
                  LOADING...
                </div>
                <style>{`@keyframes refSpin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : sentList.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", gap: "1rem" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                </svg>
                <div style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(234,242,255,0.3)", textTransform: "uppercase" }}>
                  NO SENT REFERRALS
                </div>
                <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.2)" }}>
                  Request a referral to get started.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {sentList.map((ref) => {
                  const isHovered = hoveredId === ref._id;
                  const statusStyle = STATUS_STYLES[ref.status] || STATUS_STYLES.pending;
                  return (
                    <div
                      key={ref._id}
                      onMouseEnter={() => setHoveredId(ref._id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        ...glassPanel,
                        padding: "0.85rem 1rem",
                        background: isHovered ? "rgba(0,229,204,0.04)" : "rgba(6, 12, 24, 0.92)",
                        borderLeft: `2px solid ${statusStyle.border}`,
                        display: "flex", flexDirection: "column", gap: "0.5rem",
                        transition: "background 0.18s ease, box-shadow 0.18s ease",
                        boxShadow: isHovered ? `inset 2px 0 0 ${statusStyle.border}` : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusStyle.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                          </svg>
                          <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "#eaf2ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ref.job?.title || "Job"} at {ref.job?.company || "Company"}
                          </span>
                        </div>
                        <span style={{
                          fontFamily: MONO, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                          padding: "0.15rem 0.4rem", borderRadius: "2px",
                          color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}`,
                        }}>
                          {ref.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.03em", color: "rgba(234,242,255,0.3)" }}>
                        <span>Referrer: {ref.referrer?.name || ref.code}</span>
                        <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                        <span style={{ color: "rgba(0,229,204,0.5)" }}>{relativeTime(ref.requestedAt)}</span>
                      </div>
                      {ref.message && (
                        <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.45)", lineHeight: 1.5, fontStyle: "italic" }}>
                          &ldquo;{ref.message}&rdquo;
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: Received */}
        {activeTab === "received" && (
          <div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", gap: "1rem" }}>
                <div style={{ width: "24px", height: "24px", border: "2px solid rgba(0,229,204,0.2)", borderTopColor: TEAL, borderRadius: "50%", animation: "refSpin 0.8s linear infinite" }} />
                <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.14em", color: "rgba(234,242,255,0.3)", textTransform: "uppercase" }}>
                  LOADING...
                </div>
                <style>{`@keyframes refSpin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : receivedList.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", gap: "1rem" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <div style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(234,242,255,0.3)", textTransform: "uppercase" }}>
                  NO RECEIVED REFERRALS
                </div>
                <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.2)" }}>
                  When someone requests a referral from you, it will appear here.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {receivedList.map((ref) => {
                  const isHovered = hoveredId === ref._id;
                  const statusStyle = STATUS_STYLES[ref.status] || STATUS_STYLES.pending;
                  const isPending = ref.status === "pending";
                  return (
                    <div
                      key={ref._id}
                      onMouseEnter={() => setHoveredId(ref._id)}
                      onMouseLeave={() => setHoveredId(null)}
                      style={{
                        ...glassPanel,
                        padding: "0.85rem 1rem",
                        background: isHovered ? "rgba(0,229,204,0.04)" : "rgba(6, 12, 24, 0.92)",
                        borderLeft: `2px solid ${statusStyle.border}`,
                        display: "flex", flexDirection: "column", gap: "0.5rem",
                        transition: "background 0.18s ease, box-shadow 0.18s ease",
                        boxShadow: isHovered ? `inset 2px 0 0 ${statusStyle.border}` : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={statusStyle.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                          </svg>
                          <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "#eaf2ff" }}>
                            {ref.referred?.name || "Unknown"}
                          </span>
                        </div>
                        <span style={{
                          fontFamily: MONO, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
                          padding: "0.15rem 0.4rem", borderRadius: "2px",
                          color: statusStyle.color, background: statusStyle.bg, border: `1px solid ${statusStyle.border}`,
                        }}>
                          {ref.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.6)" }}>
                        {ref.job?.title || "Job"} at {ref.job?.company || "Company"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.03em", color: "rgba(234,242,255,0.3)" }}>
                        <span style={{ color: "rgba(0,229,204,0.5)" }}>{relativeTime(ref.requestedAt)}</span>
                        {ref.respondedAt && (
                          <>
                            <span style={{ color: "rgba(0,229,204,0.35)" }}>·</span>
                            <span>Responded {relativeTime(ref.respondedAt)}</span>
                          </>
                        )}
                      </div>
                      {ref.message && (
                        <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.45)", lineHeight: 1.5, fontStyle: "italic" }}>
                          &ldquo;{ref.message}&rdquo;
                        </div>
                      )}
                      {isPending && (
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                          <button
                            onClick={() => handleRespond(ref._id, "accepted")}
                            disabled={respondingId === ref._id}
                            style={{
                              fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
                              padding: "0.3rem 0.75rem", borderRadius: "2px",
                              border: "1px solid rgba(74,222,128,0.4)",
                              background: "rgba(74,222,128,0.08)",
                              color: "#4ade80", cursor: respondingId === ref._id ? "wait" : "pointer",
                              transition: "all 0.18s ease",
                            }}
                          >
                            {respondingId === ref._id ? "..." : "ACCEPT"}
                          </button>
                          <button
                            onClick={() => handleRespond(ref._id, "rejected")}
                            disabled={respondingId === ref._id}
                            style={{
                              fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
                              padding: "0.3rem 0.75rem", borderRadius: "2px",
                              border: "1px solid rgba(239,68,68,0.4)",
                              background: "rgba(239,68,68,0.08)",
                              color: "#ef4444", cursor: respondingId === ref._id ? "wait" : "pointer",
                              transition: "all 0.18s ease",
                            }}
                          >
                            {respondingId === ref._id ? "..." : "REJECT"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom divider */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            END.REFERRALS
          </span>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            TAB: <strong style={{ color: TEAL }}>{TABS.find((t) => t.key === activeTab)?.label}</strong>
          </span>
        </div>
      </div>

      <style>{`@keyframes refSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}