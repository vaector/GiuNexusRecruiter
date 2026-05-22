import { useState, useEffect, useRef, useCallback } from "react";
import { savedSearchesAPI } from "../services/api";
import relativeTime from "../utils/relativeTime";
import PageLoader from "../components/PageLoader";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

const JOB_TYPES = ["full-time", "part-time", "internship", "contract"];
const CATEGORIES = ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"];

const FILTER_KEYS = [
  { key: "keyword", label: "KEYWORDS", type: "text", placeholder: "e.g. React, Node.js" },
  { key: "location", label: "LOCATION", type: "text", placeholder: "e.g. Cairo" },
  { key: "type", label: "JOB TYPE", type: "select", options: JOB_TYPES },
  { key: "category", label: "CATEGORY", type: "select", options: CATEGORIES },
  { key: "isRemote", label: "REMOTE ONLY", type: "checkbox" },
  { key: "salaryMin", label: "MIN SALARY", type: "number", placeholder: "e.g. 50000" },
];

export default function SavedSearchesPage() {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formFilters, setFormFilters] = useState({});
  const [formAlert, setFormAlert] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const panelRef = useRef(null);

  const loadSearches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await savedSearchesAPI.getSavedSearches();
      setSearches(res.data.savedSearches || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load saved searches.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSearches();
  }, [loadSearches]);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSaving(true);
    setError("");
    try {
      await savedSearchesAPI.createSavedSearch({ name: formName.trim(), filters: formFilters, alertEnabled: formAlert });
      setFormName("");
      setFormFilters({});
      setFormAlert(false);
      setShowForm(false);
      await loadSearches();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save search.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await savedSearchesAPI.deleteSavedSearch(id);
      setSearches((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete search.");
    } finally {
      setDeletingId(null);
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

  const badgeStyle = (active) => ({
    fontFamily: MONO,
    fontSize: "0.55rem",
    fontWeight: 700,
    padding: "0.15rem 0.4rem",
    borderRadius: "2px",
    ...(active
      ? { background: TEAL, color: "#050a14", boxShadow: "0 0 6px rgba(0,229,204,0.4)" }
      : { background: "rgba(255,255,255,0.06)", color: "rgba(234,242,255,0.3)" }),
  });

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
        TOTAL: <strong style={{ color: TEAL }}>{searches.length}</strong>
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: "860px", margin: "0 auto", padding: "100px 1.5rem 4rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.18em", color: "rgba(0,229,204,0.6)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              JOB SEEKER
            </div>
            <h1 style={{ fontFamily: "'Syncopate','Inter',system-ui,sans-serif", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 600, color: "#eaf2ff", letterSpacing: "-0.5px", lineHeight: 1.1, margin: 0 }}>
              SAVED SEARCHES
            </h1>
            <p style={{ fontSize: "0.9rem", color: "rgba(234,242,255,0.45)", lineHeight: 1.7, marginTop: "0.5rem" }}>
              Save search filters to quickly find matching jobs later. Max 10 active searches.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              fontFamily: MONO, fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "0.5rem 1rem", borderRadius: "2px",
              border: "1px solid rgba(0,229,204,0.3)",
              background: showForm ? "rgba(0,229,204,0.1)" : "rgba(0,229,204,0.05)",
              color: TEAL, cursor: "pointer", transition: "all 0.18s ease",
              boxShadow: showForm ? "0 0 6px rgba(0,229,204,0.1)" : "none",
              alignSelf: "flex-start", marginTop: "0.35rem",
            }}
          >
            {showForm ? "CANCEL" : "+ NEW SEARCH"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" aria-live="assertive" style={{ ...glassPanel, padding: "0.85rem 1rem", marginBottom: "1rem", borderColor: "rgba(239,68,68,0.3)", color: "#ef4444", fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em" }}>
            {error}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} style={{ ...glassPanel, padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ fontFamily: MONO, fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "1rem" }}>
              CREATE SAVED SEARCH
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", display: "block", marginBottom: "0.35rem" }}>
                NAME *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Remote React Jobs"
                required
                maxLength={100}
                style={{
                  background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px",
                  color: "#eaf2ff", fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.9rem",
                  padding: "0.6rem 0.75rem", width: "100%", outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(0,229,204,0.5)"; e.target.style.boxShadow = "0 0 8px rgba(0,229,204,0.25)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div style={{ fontFamily: MONO, fontSize: "0.65rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.3)", marginBottom: "0.5rem" }}>
              FILTERS
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
              {FILTER_KEYS.map((f) => {
                if (f.type === "checkbox") {
                  return (
                    <label key={f.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em", color: "rgba(234,242,255,0.6)", textTransform: "uppercase" }}>
                      <input
                        type="checkbox"
                        checked={!!formFilters[f.key]}
                        onChange={(e) => setFormFilters((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                        style={{ accentColor: TEAL }}
                      />
                      {f.label}
                    </label>
                  );
                }
                if (f.type === "select") {
                  return (
                    <div key={f.key}>
                      <div style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.25)", marginBottom: "0.25rem" }}>
                        {f.label}
                      </div>
                      <select
                        value={formFilters[f.key] || ""}
                        onChange={(e) => setFormFilters((prev) => {
                          const next = { ...prev };
                          if (e.target.value) next[f.key] = e.target.value;
                          else delete next[f.key];
                          return next;
                        })}
                        style={{ background: "#0a0a0a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px", color: "rgba(255,255,255,0.6)", fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "1px", padding: "0.5rem 0.75rem", width: "100%", outline: "none", cursor: "pointer" }}
                      >
                        <option value="">ALL</option>
                        {f.options.map((opt) => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                      </select>
                    </div>
                  );
                }
                return (
                  <div key={f.key}>
                    <div style={{ fontFamily: MONO, fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(234,242,255,0.25)", marginBottom: "0.25rem" }}>
                      {f.label}
                    </div>
                    <input
                      type={f.type}
                      value={formFilters[f.key] || ""}
                      onChange={(e) => setFormFilters((prev) => {
                        const next = { ...prev };
                        if (e.target.value) next[f.key] = f.type === "number" ? Number(e.target.value) : e.target.value;
                        else delete next[f.key];
                        return next;
                      })}
                      placeholder={f.placeholder}
                      style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2px", color: "#eaf2ff", fontFamily: "'Inter',system-ui,sans-serif", fontSize: "0.9rem", padding: "0.5rem 0.75rem", width: "100%", outline: "none", transition: "border-color 0.2s" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(0,229,204,0.5)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; }}
                    />
                  </div>
                );
              })}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.06em", color: "rgba(234,242,255,0.6)", textTransform: "uppercase", marginBottom: "1.25rem" }}>
              <input
                type="checkbox"
                checked={formAlert}
                onChange={(e) => setFormAlert(e.target.checked)}
                style={{ accentColor: TEAL }}
              />
              ENABLE JOB ALERTS
            </label>

            <button
              type="submit"
              disabled={saving || !formName.trim()}
              style={{
                fontFamily: MONO, fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "0.6rem 1.25rem", borderRadius: "2px",
                border: "1px solid rgba(0,229,204,0.4)",
                background: saving ? "rgba(0,229,204,0.15)" : "rgba(0,229,204,0.12)",
                color: saving ? "rgba(0,229,204,0.5)" : TEAL,
                cursor: saving || !formName.trim() ? "not-allowed" : "pointer",
                transition: "all 0.18s ease",
              }}
            >
              {saving ? "SAVING..." : "SAVE SEARCH"}
            </button>
          </form>
        )}

        {/* List */}
        {loading ? <PageLoader /> : searches.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", gap: "1rem" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(234,242,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <div style={{ fontFamily: MONO, fontSize: "0.72rem", letterSpacing: "0.1em", color: "rgba(234,242,255,0.3)", textTransform: "uppercase" }}>
              NO SAVED SEARCHES
            </div>
            <div style={{ fontSize: "0.82rem", color: "rgba(234,242,255,0.2)" }}>
              Save search filters to quickly find matching jobs.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {searches.map((s) => {
              const isHovered = hoveredId === s._id;
              const filters = s.filters || {};
              const activeFilters = Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== false);
              return (
                <div
                  key={s._id}
                  onMouseEnter={() => setHoveredId(s._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    ...glassPanel,
                    padding: "0.85rem 1rem",
                    background: isHovered ? "rgba(0,229,204,0.04)" : "rgba(6, 12, 24, 0.92)",
                    flexDirection: "column",
                    gap: "0.5rem",
                    display: "flex",
                    borderLeft: "2px solid rgba(0,229,204,0.4)",
                    transition: "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                    boxShadow: isHovered ? "inset 2px 0 0 rgba(0,229,204,0.5), 0 0 12px rgba(0,229,204,0.04)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                      <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "#eaf2ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.name}
                      </span>
                      <span style={badgeStyle(s.alertEnabled)}>
                        {s.alertEnabled ? "ALERTS ON" : "ALERTS OFF"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                      <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.03em", color: "rgba(234,242,255,0.3)" }}>
                        {s.createdAt ? relativeTime(s.createdAt) : ""}
                      </span>
                      <button
                        onClick={() => handleDelete(s._id)}
                        disabled={deletingId === s._id}
                        aria-label={`Delete saved search ${s.name}`}
                        style={{
                          fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "0.25rem 0.5rem", borderRadius: "2px",
                          border: "1px solid rgba(239,68,68,0.3)",
                          background: isHovered ? "rgba(239,68,68,0.08)" : "transparent",
                          color: "#ef4444", cursor: deletingId === s._id ? "wait" : "pointer",
                          opacity: deletingId === s._id ? 0.5 : 1,
                          transition: "all 0.18s ease",
                        }}
                      >
                        {deletingId === s._id ? "..." : "DELETE"}
                      </button>
                    </div>
                  </div>
                  {activeFilters.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {activeFilters.map(([key, val]) => (
                        <span
                          key={key}
                          style={{
                            fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.06em", textTransform: "uppercase",
                            padding: "0.2rem 0.5rem", borderRadius: "2px",
                            border: "1px solid rgba(0,229,204,0.2)",
                            color: "rgba(0,229,204,0.6)",
                            background: "rgba(0,229,204,0.04)",
                          }}
                        >
                          {key}: {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom divider */}
        <div style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            END.SAVED_SEARCHES
          </span>
          <span style={{ fontFamily: MONO, fontSize: "0.6rem", letterSpacing: "0.14em", color: "rgba(140,230,240,0.25)", textTransform: "uppercase" }}>
            COUNT: <strong style={{ color: TEAL }}>{searches.length}</strong>/10
          </span>
        </div>
      </div>
    </div>
  );
}