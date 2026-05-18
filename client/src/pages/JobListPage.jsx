import { useState, useEffect, useRef, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { jobsAPI } from "../services/api";
import JobCard from "../components/JobCard";
import { SkeletonCard } from "../components/Spinner";

const CATEGORIES = ["Frontend", "Backend", "AI/ML", "DevOps", "Data Engineering", "Other"];
const JOB_TYPES = ["full-time", "part-time", "internship"];
const WORKPLACE_TYPES = ["on_site", "remote", "hybrid"];
const STATUS_OPTIONS = ["open", "closed"];
const LIMIT = 12;

const paramsToFilters = (searchParams) => {
  const f = { status: searchParams.get("status") || "open" };
  if (searchParams.get("keyword")) f.keyword = searchParams.get("keyword");
  if (searchParams.get("category")) f.category = searchParams.get("category");
  if (searchParams.get("location")) f.location = searchParams.get("location");
  if (searchParams.get("type")) f.type = searchParams.get("type");
  if (searchParams.get("workplaceType")) f.workplaceType = searchParams.get("workplaceType");
  return f;
};

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

  // Fetch saved jobs once on mount for jobSeekers
  useEffect(() => {
    if (isAuthenticated && user?.role === "jobSeeker") {
      jobsAPI.getSavedJobs()
        .then(res => setSavedSet(new Set(res.data.jobs.map(j => j._id))))
        .catch(() => {});
    }
  }, [isAuthenticated, user?.role]);

  // Debounce keyword — skip first render so mount doesn't reset page
  useEffect(() => {
    if (isFirstKeywordRender.current) {
      isFirstKeywordRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setFilters(prev => {
        const next = { ...prev };
        if (keywordInput.trim()) {
          next.keyword = keywordInput.trim();
        } else {
          delete next.keyword;
        }
        return next;
      });
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  // Sync filters + page to URL
  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    if (page > 1) params.page = String(page);
    setSearchParams(params, { replace: true });
  }, [filters, page, setSearchParams]);

  // Fetch jobs
  useEffect(() => {
    setLoading(true);
    setError(null);
    jobsAPI.getAllJobs({ ...filters, page, limit: LIMIT })
      .then(res => {
        setData({ jobs: res.data.jobs, total: res.data.total, pages: res.data.pages });
      })
      .catch(err => {
        setError(err.response?.data?.message || "Failed to load jobs. Check your connection.");
      })
      .finally(() => setLoading(false));
  }, [filters, page, retryCount]);

  const clearFilters = () => {
    setFilters({ status: "open" });
    setKeywordInput("");
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
        if (key === "status") next.status = "open";
      }
      return next;
    });
    setPage(1);
  };

  const hasActiveFilters =
    !!filters.keyword ||
    !!filters.category ||
    !!filters.location ||
    !!filters.type ||
    !!filters.workplaceType ||
    filters.status !== "open";

  const inputStyle = {
    fontSize: "0.875rem",
    padding: "0.5rem 0.75rem",
    height: "38px",
    borderRadius: "var(--rounded-sm)",
    border: "1px solid var(--color-border)",
    background: "var(--color-canvas)",
    color: "var(--color-ink)",
    outline: "none",
    fontFamily: "var(--font-body)",
  };

  return (
    <div className="container" style={{ paddingTop: "2rem", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 className="display-sm">Browse Jobs</h1>
        <p className="caption" style={{ marginTop: "0.25rem", minHeight: "1.2em" }}>
          {!loading && `${data.total} ${data.total === 1 ? "job" : "jobs"} found`}
        </p>
      </div>

      {/* Filter bar */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "var(--color-canvas)",
        borderBottom: "1px solid var(--color-border)",
        paddingBottom: "0.75rem",
        marginBottom: "1.5rem",
        display: "flex",
        gap: "0.6rem",
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        <input
          style={{ ...inputStyle, width: "190px" }}
          placeholder="Search jobs..."
          value={keywordInput}
          onChange={e => setKeywordInput(e.target.value)}
        />

        <select
          style={{ ...inputStyle, width: "160px", cursor: "pointer" }}
          value={filters.category || ""}
          onChange={e => handleFilterChange("category", e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          style={{ ...inputStyle, width: "150px", cursor: "pointer" }}
          value={filters.type || ""}
          onChange={e => handleFilterChange("type", e.target.value)}
        >
          <option value="">All Types</option>
          {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          style={{ ...inputStyle, width: "110px", cursor: "pointer" }}
          value={filters.status || "open"}
          onChange={e => handleFilterChange("status", e.target.value)}
        >
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          style={{ ...inputStyle, width: "145px", cursor: "pointer" }}
          value={filters.workplaceType || ""}
          onChange={e => handleFilterChange("workplaceType", e.target.value)}
        >
          <option value="">All Workplaces</option>
          {WORKPLACE_TYPES.map(w => <option key={w} value={w}>{w.replace("_", " ")}</option>)}
        </select>

        <input
          style={{ ...inputStyle, width: "120px" }}
          placeholder="City..."
          value={filters.location || ""}
          onChange={e => handleFilterChange("location", e.target.value)}
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            style={{
              ...inputStyle,
              width: "auto",
              padding: "0.5rem 1rem",
              border: "1px solid var(--color-ink)",
              color: "var(--color-ink)",
              cursor: "pointer",
              fontWeight: 600,
              transition: "background 0.15s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--color-canvas-soft)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--color-canvas)"}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: "var(--color-accent-subtle)",
          border: "1px solid var(--color-accent-border)",
          borderRadius: "8px",
          padding: "0.75rem 1rem",
          marginBottom: "1.25rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}>
          <span style={{ fontSize: "0.875rem", color: "var(--color-accent)" }}>{error}</span>
          <button
            onClick={() => { setError(null); setRetryCount(c => c + 1); }}
            style={{
              background: "var(--color-accent)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--rounded-sm)",
              padding: "0.35rem 0.75rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "var(--font-body)",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : data.jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <p className="body-md" style={{ marginBottom: "1rem" }}>No jobs match your filters.</p>
          <button
            onClick={clearFilters}
            style={{
              background: "var(--color-canvas)",
              color: "var(--color-ink)",
              border: "1px solid var(--color-ink)",
              padding: "0.6rem 1.25rem",
              borderRadius: "var(--rounded-md)",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {data.jobs.map(job => (
            <JobCard
              key={job._id}
              job={job}
              initialSaved={savedSet.has(job._id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && data.pages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
          marginTop: "2rem",
        }}>
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 1}
            style={{
              background: "var(--color-canvas)",
              color: "var(--color-ink)",
              border: "1px solid var(--color-ink)",
              padding: "0.5rem 1rem",
              borderRadius: "var(--rounded-md)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: page === 1 ? "not-allowed" : "pointer",
              opacity: page === 1 ? 0.4 : 1,
              transition: "opacity 0.15s",
              fontFamily: "var(--font-body)",
            }}
          >
            ← Prev
          </button>
          <span className="caption">Page {page} of {data.pages}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= data.pages}
            style={{
              background: "var(--color-canvas)",
              color: "var(--color-ink)",
              border: "1px solid var(--color-ink)",
              padding: "0.5rem 1rem",
              borderRadius: "var(--rounded-md)",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: page >= data.pages ? "not-allowed" : "pointer",
              opacity: page >= data.pages ? 0.4 : 1,
              transition: "opacity 0.15s",
              fontFamily: "var(--font-body)",
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default JobListPage;
