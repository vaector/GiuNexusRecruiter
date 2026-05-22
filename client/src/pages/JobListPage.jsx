import { useState, useEffect, useRef, useContext } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { AuthContext } from "../context/AuthContext";
import { jobsAPI } from "../services/api";
import { CATEGORY_COLORS } from "../components/JobCard";
import SaveJobButton from "../components/SaveJobButton";

const MONO = "'JetBrains Mono','Fira Code',monospace";
const TEAL = "#00e5cc";

const CATEGORIES = ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"];
const JOB_TYPES = ["full-time", "part-time", "internship"];
const WORKPLACE_TYPES = ["on_site", "remote", "hybrid"];
const STATUS_OPTIONS = ["open", "closed"];
const LIMIT = 12;

const paramsToFilters = (p) => {
  const f = { status: p.get("status") || "open" };
  if (p.get("keyword")) f.keyword = p.get("keyword");
  if (p.get("category")) f.category = p.get("category");
  if (p.get("location")) f.location = p.get("location");
  if (p.get("type")) f.type = p.get("type");
  if (p.get("workplaceType")) f.workplaceType = p.get("workplaceType");
  return f;
};

/* ── Dark skeleton card ── */
function DarkSkeleton() {
  return (
    <div style={{
      border: "1px solid rgba(0,229,204,0.1)", padding: "1.5rem",
      background: "rgba(0,229,204,0.02)", position: "relative", overflow: "hidden",
    }}>
      <div style={{ height: "12px", width: "60%", background: "rgba(255,255,255,0.06)", marginBottom: "0.75rem", borderRadius: "2px" }} />
      <div style={{ height: "10px", width: "35%", background: "rgba(255,255,255,0.04)", marginBottom: "1.25rem", borderRadius: "2px" }} />
      <div style={{ height: "8px", width: "80%", background: "rgba(255,255,255,0.04)", marginBottom: "0.5rem", borderRadius: "2px" }} />
      <div style={{ height: "8px", width: "50%", background: "rgba(255,255,255,0.04)", borderRadius: "2px" }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, transparent 0%, rgba(0,229,204,0.03) 50%, transparent 100%)",
        animation: "shimmer 1.8s ease-in-out infinite",
      }} />
    </div>
  );
}

/* ── Dark job card ── */
function DarkJobCard({ job, initialSaved }) {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const catColors = CATEGORY_COLORS[job.category] || CATEGORY_COLORS.Other;

  return (
    <div
      onClick={() => navigate(`/jobs/${job._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${hovered ? "rgba(0,229,204,0.35)" : "rgba(0,229,204,0.12)"}`,
        padding: "1.5rem",
        background: hovered ? "rgba(0,229,204,0.04)" : "rgba(0,229,204,0.02)",
        position: "relative",
        transition: "border-color 0.25s ease, background 0.25s ease, transform 0.25s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        cursor: "pointer",
        display: "flex", flexDirection: "column", gap: "0.85rem",
      }}
    >
      {/* Corner accent */}
      <div style={{
        position: "absolute", top: -1, left: -1, width: 16, height: 16,
        borderTop: `1px solid ${hovered ? TEAL : "rgba(0,229,204,0.3)"}`,
        borderLeft: `1px solid ${hovered ? TEAL : "rgba(0,229,204,0.3)"}`,
        transition: "border-color 0.25s",
      }} />
      <div style={{
        position: "absolute", bottom: -1, right: -1, width: 16, height: 16,
        borderBottom: `1px solid ${hovered ? TEAL : "rgba(0,229,204,0.3)"}`,
        borderRight: `1px solid ${hovered ? TEAL : "rgba(0,229,204,0.3)"}`,
        transition: "border-color 0.25s",
      }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
              color: hovered ? "#fff" : "rgba(255,255,255,0.85)",
              fontFamily: "'Inter',sans-serif",
              fontSize: "1rem", fontWeight: 700,
              lineHeight: 1.3, display: "block",
              transition: "color 0.2s",
            }}>
            {job.title}
          </span>
          <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "1px", color: "rgba(255,255,255,0.35)", marginTop: "4px", textTransform: "uppercase" }}>
            {job.company}
          </p>
        </div>
        <span style={{
          fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", textTransform: "uppercase",
          padding: "4px 10px", border: "1px solid rgba(0,229,204,0.25)", color: TEAL,
          flexShrink: 0,
        }}>
          {job.category || "OTHER"}
        </span>
      </div>

      {/* Meta */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {job.location?.city && (
          <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
            {job.location.city}
          </span>
        )}
        <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
          {job.type}
        </span>
        <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
          {job.workplaceType?.replace("_", "-")}
        </span>
        {(job.salary?.min != null || job.salary?.amount != null) && (
          <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", color: TEAL, textTransform: "uppercase" }}>
            {(job.salary?.min ?? job.salary?.amount)?.toLocaleString()} {job.salary?.currency || ""}
          </span>
        )}
        {job.score !== undefined && (
          <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "1px", color: TEAL }}>
            {Math.round(job.score * 100)}% MATCH
          </span>
        )}
      </div>

      {/* Requirements chips */}
      {job.requirements?.length > 0 && (
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {job.requirements.slice(0, 3).map(req => (
            <span key={req} style={{
              fontFamily: MONO, fontSize: "9px", letterSpacing: "1px",
              padding: "3px 8px", border: "1px solid rgba(0,229,204,0.2)",
              color: "rgba(0,229,204,0.6)", textTransform: "uppercase",
            }}>
              {req}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
        <span style={{
          fontFamily: MONO, fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase",
          color: job.status === "open" ? "#4ade80" : "#ef4444",
          padding: "3px 8px",
          border: `1px solid ${job.status === "open" ? "rgba(74,222,128,0.3)" : "rgba(239,68,68,0.3)"}`,
        }}>
          {job.status}
        </span>
        {isAuthenticated && user?.role === "jobSeeker" && (
          <SaveJobButton jobId={job._id} jobStatus={job.status} initialSaved={initialSaved} />
        )}
      </div>
    </div>
  );
}

/* ── Filter input ── */
function FilterInput({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${focused ? "rgba(0,229,204,0.5)" : "rgba(255,255,255,0.1)"}`,
        color: "#fff", fontFamily: MONO, fontSize: "10px", letterSpacing: "1px",
        padding: "0.5rem 0.75rem", outline: "none",
        transition: "border-color 0.2s",
        ...style,
      }}
    />
  );
}

function FilterSelect({ children, style, ...props }) {
  return (
    <select
      {...props}
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "rgba(255,255,255,0.6)", fontFamily: MONO, fontSize: "10px", letterSpacing: "1px",
        padding: "0.5rem 0.75rem", outline: "none", cursor: "pointer",
        transition: "border-color 0.2s",
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = "rgba(0,229,204,0.5)"}
      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
    >
      {children}
    </select>
  );
}

/* ── Main page ── */
const JobListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useContext(AuthContext);

  const [filters, setFilters] = useState(() => paramsToFilters(searchParams));
  const [page, setPage] = useState(() => parseInt(searchParams.get("page"), 10) || 1);
  const [keywordInput, setKeywordInput] = useState(searchParams.get("keyword") || "");
  const [data, setData] = useState({ jobs: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedSet, setSavedSet] = useState(new Set());
  const [retryCount, setRetryCount] = useState(0);

  const isFirstKeywordRender = useRef(true);
  const scrollbarRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const pctRef = useRef(null);

  useEffect(() => {
    if (typeof history !== "undefined") history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
    let raf;
    const tick = (time) => {
      lenis.raf(time);
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const totalH = document.documentElement.scrollHeight - vh;
      const pct = totalH > 0 ? scrollY / totalH : 0;
      if (pctRef.current) pctRef.current.textContent = (pct * 100).toFixed(1) + "%";
      if (scrollbarRef.current && scrollbarTrackRef.current) {
        const trackH = scrollbarTrackRef.current.offsetHeight - scrollbarRef.current.offsetHeight;
        scrollbarRef.current.style.transform = `translateY(${pct * Math.max(trackH, 0)}px)`;
        scrollbarTrackRef.current.style.opacity = pct > 0.005 ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { lenis.destroy(); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === "jobSeeker") {
      jobsAPI.getSavedJobs()
        .then(res => setSavedSet(new Set(res.data.jobs.map(j => j._id))))
        .catch(() => {});
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    if (isFirstKeywordRender.current) { isFirstKeywordRender.current = false; return; }
    const timer = setTimeout(() => {
      setFilters(prev => {
        const next = { ...prev };
        if (keywordInput.trim()) next.keyword = keywordInput.trim();
        else delete next.keyword;
        return next;
      });
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [filters, page, setSearchParams]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    jobsAPI.getAllJobs({ ...filters, page, limit: LIMIT })
      .then(res => setData({ jobs: res.data.jobs, total: res.data.total, pages: res.data.pages }))
      .catch(err => setError(err.response?.data?.message || "Failed to load jobs."))
      .finally(() => setLoading(false));
  }, [filters, page, retryCount]);

  const clearFilters = () => { setFilters({ status: "open" }); setKeywordInput(""); setPage(1); };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev };
      if (value) next[key] = value;
      else { delete next[key]; if (key === "status") next.status = "open"; }
      return next;
    });
    setPage(1);
  };

  const hasActiveFilters =
    !!filters.keyword || !!filters.category || !!filters.location ||
    !!filters.type || !!filters.workplaceType || filters.status !== "open";

  return (
    <>
      <div style={{ minHeight: "100vh", background: "#030303", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ padding: "6.75rem 6% 0", maxWidth: "1280px", margin: "0 auto" }}>
          <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: "rgba(0,229,204,0.6)", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            SYS.LISTINGS
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "1.5rem", marginBottom: "0.5rem" }}>
            <h1 style={{
              fontFamily: "'Inter',sans-serif", fontSize: "clamp(2rem,5vw,3.5rem)",
              fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1,
            }}>
              Browse Jobs
            </h1>
            {!loading && (
              <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "2px", color: TEAL, textTransform: "uppercase" }}>
                [{data.total} {data.total === 1 ? "RESULT" : "RESULTS"}]
              </span>
            )}
          </div>
          <div style={{ height: "1px", background: "linear-gradient(to right, rgba(0,229,204,0.4), transparent)", marginTop: "1.5rem" }} />
        </div>

        {/* ── Filter bar ── */}
        <div style={{
          position: "sticky", top: "4.75rem", zIndex: 20,
          background: "rgba(3,3,3,0.95)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(0,229,204,0.1)",
          padding: "0.875rem 6%",
          maxWidth: "100%",
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: MONO, fontSize: "9px", letterSpacing: "2px", color: "rgba(0,229,204,0.4)", textTransform: "uppercase", marginRight: "0.25rem" }}>
              FILTER:
            </span>

            <FilterInput
              placeholder="SEARCH..."
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              style={{ width: "160px" }}
            />

            <FilterSelect value={filters.category || ""} onChange={e => handleFilterChange("category", e.target.value)} style={{ width: "150px" }}>
              <option value="">ALL CATEGORIES</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
            </FilterSelect>

            <FilterSelect value={filters.type || ""} onChange={e => handleFilterChange("type", e.target.value)} style={{ width: "140px" }}>
              <option value="">ALL TYPES</option>
              {JOB_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </FilterSelect>

            <FilterSelect value={filters.status || "open"} onChange={e => handleFilterChange("status", e.target.value)} style={{ width: "110px" }}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </FilterSelect>

            <FilterSelect value={filters.workplaceType || ""} onChange={e => handleFilterChange("workplaceType", e.target.value)} style={{ width: "130px" }}>
              <option value="">ALL WORKPLACES</option>
              {WORKPLACE_TYPES.map(w => <option key={w} value={w}>{w.replace("_", "-").toUpperCase()}</option>)}
            </FilterSelect>

            <FilterInput
              placeholder="CITY..."
              value={filters.location || ""}
              onChange={e => handleFilterChange("location", e.target.value)}
              style={{ width: "100px" }}
            />

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  background: "transparent", border: "1px solid rgba(239,68,68,0.4)",
                  color: "#ef4444", fontFamily: MONO, fontSize: "9px", letterSpacing: "2px",
                  textTransform: "uppercase", padding: "0.5rem 0.875rem", cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                CLEAR ×
              </button>
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2.5rem 6% 6rem" }}>

          {/* Error banner */}
          {error && (
            <div style={{
              border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)",
              padding: "0.875rem 1.25rem", marginBottom: "2rem",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
            }}>
              <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "1px", color: "#ef4444", textTransform: "uppercase" }}>
                ERROR: {error}
              </span>
              <button
                onClick={() => { setError(null); setRetryCount(c => c + 1); }}
                style={{
                  background: "transparent", border: `1px solid ${TEAL}`, color: TEAL,
                  fontFamily: MONO, fontSize: "9px", letterSpacing: "2px",
                  textTransform: "uppercase", padding: "0.35rem 0.875rem", cursor: "pointer",
                }}
              >
                RETRY
              </button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {Array.from({ length: 6 }).map((_, i) => <DarkSkeleton key={i} />)}
            </div>
          ) : data.jobs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "6rem 0" }}>
              <p style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "3px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: "1.5rem" }}>
                NO RESULTS FOUND
              </p>
              <button onClick={clearFilters} style={{
                background: "transparent", border: `1px solid ${TEAL}`, color: TEAL,
                fontFamily: MONO, fontSize: "10px", letterSpacing: "2px",
                textTransform: "uppercase", padding: "0.75rem 2rem", cursor: "pointer",
              }}>
                CLEAR FILTERS
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
              {data.jobs.map(job => (
                <DarkJobCard key={job._id} job={job} initialSaved={savedSet.has(job._id)} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && data.pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1.5rem", marginTop: "3rem" }}>
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                style={{
                  background: "transparent", border: `1px solid ${page === 1 ? "rgba(255,255,255,0.1)" : "rgba(0,229,204,0.4)"}`,
                  color: page === 1 ? "rgba(255,255,255,0.2)" : TEAL,
                  fontFamily: MONO, fontSize: "10px", letterSpacing: "2px",
                  textTransform: "uppercase", padding: "0.6rem 1.25rem",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                ← PREV
              </button>
              <span style={{ fontFamily: MONO, fontSize: "10px", letterSpacing: "2px", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
                PAGE <strong style={{ color: TEAL }}>{page}</strong> / {data.pages}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pages}
                style={{
                  background: "transparent", border: `1px solid ${page >= data.pages ? "rgba(255,255,255,0.1)" : "rgba(0,229,204,0.4)"}`,
                  color: page >= data.pages ? "rgba(255,255,255,0.2)" : TEAL,
                  fontFamily: MONO, fontSize: "10px", letterSpacing: "2px",
                  textTransform: "uppercase", padding: "0.6rem 1.25rem",
                  cursor: page >= data.pages ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                NEXT →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom scrollbar */}
      <div ref={scrollbarTrackRef} style={{
        position: "fixed", right: "6px", top: "12%", bottom: "12%",
        width: "3px", zIndex: 60, pointerEvents: "none",
        background: "rgba(255,255,255,0.04)", borderRadius: "2px",
        transition: "opacity 0.6s ease", opacity: 0,
      }}>
        <div ref={scrollbarRef} style={{
          position: "absolute", top: 0, left: 0, width: "100%", height: "36px",
          background: "rgba(0,229,204,0.5)", borderRadius: "2px",
          boxShadow: "0 0 8px rgba(0,229,204,0.25)", willChange: "transform",
        }} />
      </div>

      {/* Progress HUD */}
      <div style={{
        position: "fixed", top: "2rem", right: "2rem", zIndex: 60, pointerEvents: "none",
        fontFamily: MONO, fontSize: "9px", letterSpacing: "0.14em",
        color: "rgba(140,230,240,0.38)", textTransform: "uppercase", textAlign: "right",
      }}>
        PROGRESS: <strong ref={pctRef} style={{ color: TEAL }}>0.0%</strong>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        html.lenis { height: auto; }
        html.lenis body { height: auto; }
        body { background: #000 !important; }
      `}</style>
    </>
  );
};

export default JobListPage;
