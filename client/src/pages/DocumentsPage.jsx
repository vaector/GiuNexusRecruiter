import { useState, useEffect, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import { documentsAPI } from "../services/api";
import { AuthContext } from "../context/AuthContext";
import PageLoader from "../components/PageLoader";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

const TYPE_LABELS = {
  offer_letter: "Offer Letter",
  contract: "Contract",
  nda: "NDA",
  cv: "CV / Resume",
  cover_letter: "Cover Letter",
  other: "Other",
};

const TYPE_ICONS = {
  offer_letter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
  contract: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  nda: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  cv: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  cover_letter: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  ),
  other: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
  ),
};

const STATUS_STYLES = {
  pending: { color: "#f0c040", bg: "rgba(240,192,64,0.1)", border: "rgba(240,192,64,0.3)" },
  signed: { color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.3)" },
  rejected: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.3)" },
};

const relativeTime = (d) => {
  if (!d) return "";
  const diff = Math.max(0, Date.now() - new Date(d).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
};

export default function DocumentsPage() {
  const { applicationId } = useParams();
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [signingId, setSigningId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const spotlightRef = useRef(null);

  const recruiterTypes = ["offer_letter", "contract", "nda"];
  const jobSeekerTypes = ["cv", "cover_letter"];
  const allowedTypes = user?.role === "recruiter" ? recruiterTypes : jobSeekerTypes;

  const loadDocs = async () => {
    if (!applicationId) return;
    setLoading(true);
    setError("");
    try {
      const res = await documentsAPI.getDocuments(applicationId);
      setDocuments(res.data.documents || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, [applicationId]);

  useEffect(() => {
    document.body.style.background = "#030303";
    return () => { document.body.style.background = ""; };
  }, []);

  useEffect(() => {
    const panel = spotlightRef.current;
    if (!panel) return;
    const onPointerMove = (e) => {
      const r = panel.getBoundingClientRect();
      panel.style.setProperty("--spotlight-x", `${Math.floor(e.clientX - r.left)}px`);
      panel.style.setProperty("--spotlight-y", `${Math.floor(e.clientY - r.top)}px`);
    };
    panel.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => panel.removeEventListener("pointermove", onPointerMove);
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadType || !applicationId) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("applicationId", applicationId);
      formData.append("type", uploadType);
      await documentsAPI.uploadDocument(formData);
      setUploadFile(null);
      setUploadType("");
      setShowUpload(false);
      await loadDocs();
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleSign = async (id) => {
    setSigningId(id);
    setError("");
    try {
      await documentsAPI.signDocument(id);
      await loadDocs();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to sign document.");
    } finally {
      setSigningId(null);
    }
  };

  const handleVerify = async (id) => {
    setVerifyingId(id);
    setVerifyResult(null);
    try {
      const res = await documentsAPI.verifyDocument(id);
      setVerifyResult(res.data.verification);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to verify document.");
    } finally {
      setVerifyingId(null);
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

  return (
    <div
      ref={spotlightRef}
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
        DOCS: <strong style={{ color: TEAL }}>{documents.length}</strong>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: "860px", margin: "0 auto", padding: "100px 1.5rem 4rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.18em", color: "rgba(0,229,204,0.6)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              APPLICATION
            </div>
            <h1 style={{ fontFamily: "'Syncopate','Inter',system-ui,sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 600, color: "#eaf2ff", letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0 }}>
              DOCUMENTS
            </h1>
            <p style={{ fontSize: "0.9rem", color: "rgba(234,242,255,0.45)", lineHeight: 1.7, marginTop: "0.5rem" }}>
              Upload, sign, and verify documents for this application.
            </p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            style={{
              fontFamily: MONO, fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.5rem 1rem", borderRadius: "2px",
              border: "1px solid rgba(0,229,204,0.3)",
              background: showUpload ? "rgba(0,229,204,0.1)" : "rgba(0,229,204,0.05)",
              color: TEAL, cursor: "pointer", transition: "all 0.18s ease",
              boxShadow: showUpload ? "0 0 6px rgba(0,229,204,0.1)" : "none",
            }}
          >
            {showUpload ? "CANCEL" : "+ UPLOAD"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" aria-live="assertive" style={{ ...glassPanel, padding: "0.85rem 1rem", marginBottom: "1rem", borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em" }}>
            {error}
          </div>
        )}

        {/* Upload form */}
        {showUpload && (
          <form onSubmit={handleUpload} style={{ ...glassPanel, padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "1rem" }}>
              UPLOAD DOCUMENT
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.35rem" }}>
                DOCUMENT TYPE *
              </label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                required
                style={{ width: "100%", background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px", color: uploadType ? "#eaf2ff" : "rgba(234,242,255,0.45)", fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.85rem", padding: "0.55rem 0.75rem", outline: "none", cursor: "pointer" }}
              >
                <option value="">Select type...</option>
                {allowedTypes.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.35rem" }}>
                FILE (PDF, DOC, DOCX, IMAGE — MAX 5MB) *
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                onChange={(e) => setUploadFile(e.target.files[0] || null)}
                required
                style={{ width: "100%", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px", color: "#eaf2ff", fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.85rem", padding: "0.55rem 0.75rem", outline: "none" }}
              />
              {uploadFile && (
                <div style={{ marginTop: "0.5rem", fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.06em", color: "rgba(0,229,204,0.6)" }}>
                  {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            {uploadError && (
              <div role="alert" style={{ padding: "0.5rem 0.75rem", marginBottom: "0.75rem", borderRadius: "2px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#ef4444", fontFamily: MONO, fontSize: "0.72rem" }}>
                {uploadError}
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !uploadType || !uploadFile}
              style={{
                fontFamily: MONO, fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "0.6rem 1.25rem", borderRadius: "2px",
                border: "1px solid rgba(0,229,204,0.4)",
                background: uploading ? "rgba(0,229,204,0.15)" : "rgba(0,229,204,0.12)",
                color: uploading ? "rgba(0,229,204,0.5)" : TEAL,
                cursor: uploading || !uploadType || !uploadFile ? "not-allowed" : "pointer",
                transition: "all 0.18s ease",
              }}
            >
              {uploading ? "UPLOADING..." : "UPLOAD"}
            </button>
          </form>
        )}

        {/* Verify result modal */}
        {verifyResult && (
          <div style={{ ...glassPanel, padding: "1.5rem", marginBottom: "1.5rem", borderColor: "rgba(74,222,128,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#4ade80" }}>
                VERIFICATION RESULT
              </div>
              <button
                onClick={() => setVerifyResult(null)}
                style={{ background: "transparent", border: "none", color: "rgba(234,242,255,0.4)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1, padding: "0.25rem" }}
              >
                ×
              </button>
            </div>
            {[
              { label: "STATUS", value: verifyResult.isSigned ? "SIGNED" : "PENDING", color: verifyResult.isSigned ? "#4ade80" : "#f0c040" },
              { label: "FILE HASH", value: verifyResult.fileHash ? `${verifyResult.fileHash.slice(0, 12)}...${verifyResult.fileHash.slice(-8)}` : "—" },
              { label: "UPLOADED BY", value: verifyResult.uploadedBy?.name || verifyResult.uploadedBy || "—" },
              { label: "UPLOADED AT", value: verifyResult.uploadedAt ? new Date(verifyResult.uploadedAt).toLocaleString() : "—" },
              ...(verifyResult.isSigned ? [
                { label: "SIGNED BY", value: verifyResult.signedBy?.name || verifyResult.signedBy || "—" },
                { label: "SIGNED AT", value: verifyResult.signedAt ? new Date(verifyResult.signedAt).toLocaleString() : "—" },
                { label: "SIGNATURE TOKEN", value: verifyResult.signatureToken ? `${verifyResult.signatureToken.slice(0, 12)}...` : "—" },
              ] : []),
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)" }}>{item.label}</span>
                <span style={{ fontFamily: MONO, fontSize: "0.72rem", color: item.color || "#eaf2ff", letterSpacing: "0.04em" }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Document list */}
        {loading ? <PageLoader /> : documents.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", gap: "1rem" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(234,242,255,0.3)", textTransform: "uppercase" }}>NO DOCUMENTS</div>
            <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.2)" }}>
              Upload a document to get started.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {documents.map((doc) => {
              const isHovered = hoveredId === doc._id;
              const ss = STATUS_STYLES[doc.status] || STATUS_STYLES.pending;
              const typeIcon = TYPE_ICONS[doc.type] || TYPE_ICONS.other;
              const canSign = user?.role === "jobSeeker" && doc.status === "pending" && doc.uploadedBy?._id !== user?._id && doc.uploadedBy !== user?._id;
              return (
                <div
                  key={doc._id}
                  onMouseEnter={() => setHoveredId(doc._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    ...glassPanel,
                    padding: "1rem 1.25rem",
                    background: isHovered ? "rgba(0,229,204,0.04)" : "rgba(6, 12, 24, 0.92)",
                    borderLeft: `2px solid ${ss.border}`,
                    display: "flex", flexDirection: "column", gap: "0.6rem",
                    transition: "background 0.18s ease, box-shadow 0.18s ease",
                    boxShadow: isHovered ? `inset 2px 0 0 ${ss.border}` : "none",
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                      <div style={{
                        width: "32px", height: "32px", borderRadius: "2px",
                        background: `${ss.color}10`, border: `1px solid ${ss.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: ss.color, flexShrink: 0,
                      }}>
                        {typeIcon}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "#eaf2ff" }}>
                            {doc.fileName || TYPE_LABELS[doc.type] || doc.type}
                          </span>
                          <span style={{ fontFamily: MONO, fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "0.15rem 0.4rem", borderRadius: "2px", color: ss.color, background: ss.bg, border: `1px solid ${ss.border}` }}>
                            {doc.status}
                          </span>
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(0,229,204,0.6)" }}>
                          {TYPE_LABELS[doc.type] || doc.type}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.03em", color: "rgba(234,242,255,0.3)" }}>
                        {relativeTime(doc.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    {doc.fileUrl && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "0.3rem 0.65rem", borderRadius: "2px",
                          border: "1px solid rgba(0,229,204,0.3)", background: "rgba(0,229,204,0.05)",
                          color: TEAL, textDecoration: "none", transition: "all 0.18s ease",
                        }}
                      >
                        VIEW FILE
                      </a>
                    )}
                    {canSign && (
                      <button
                        onClick={() => handleSign(doc._id)}
                        disabled={signingId === doc._id}
                        style={{
                          fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "0.3rem 0.65rem", borderRadius: "2px",
                          border: "1px solid rgba(74,222,128,0.4)", background: "rgba(74,222,128,0.08)",
                          color: "#4ade80", cursor: signingId === doc._id ? "wait" : "pointer",
                          transition: "all 0.18s ease",
                        }}
                      >
                        {signingId === doc._id ? "SIGNING..." : "SIGN"}
                      </button>
                    )}
                    <button
                      onClick={() => handleVerify(doc._id)}
                      disabled={verifyingId === doc._id}
                      style={{
                        fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
                        padding: "0.3rem 0.65rem", borderRadius: "2px",
                        border: "1px solid rgba(255,255,255,0.08)", background: "transparent",
                        color: "rgba(234,242,255,0.45)", cursor: verifyingId === doc._id ? "wait" : "pointer",
                        transition: "all 0.18s ease",
                      }}
                    >
                      {verifyingId === doc._id ? "..." : "VERIFY"}
                    </button>
                  </div>

                  {/* Signed info */}
                  {doc.status === "signed" && doc.signedAt && (
                    <div style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.03em", color: "rgba(234,242,255,0.25)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      Signed {relativeTime(doc.signedAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            END.DOCUMENTS
          </span>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            APP: <strong style={{ color: "rgba(140,230,240,0.38)" }}>{applicationId?.slice(-8)}</strong>
          </span>
        </div>
      </div>

      <style>{`@keyframes docSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}