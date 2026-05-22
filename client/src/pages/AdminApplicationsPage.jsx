// All applications across the platform
// GET /api/v1/applications — admin view
// Admin only
import { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import { applicationsAPI } from "../services/api";
import { Spinner } from "../components/Spinner";
import GooeyCursor from "../components/GooeyCursor";
import Navbar from "../components/Navbar";

const STATUSES = ["all", "pending", "shortlisted", "rejected"];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const fmtLabel = (v) =>
  (v || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const lenisRef = useRef(null);
  const scrollbarRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const pctRef = useRef(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await applicationsAPI.getAllApplications(params);
      setApplications(res.data.applications || []);
    } catch {
      setError("SYS.ERR: FAILED_TO_FETCH_APPLICATIONS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  useEffect(() => {
    if (typeof history !== "undefined") history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
    lenisRef.current = lenis;
    let raf;
    function tick(time) {
      lenis.raf(time);
      const scrollY = window.scrollY;
      const totalH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = totalH > 0 ? Math.min(Math.max(scrollY / totalH, 0), 1) : 0;
      if (pctRef.current) pctRef.current.textContent = (pct * 100).toFixed(1) + "%";
      if (scrollbarRef.current && scrollbarTrackRef.current) {
        const trackH = scrollbarTrackRef.current.offsetHeight - scrollbarRef.current.offsetHeight;
        scrollbarRef.current.style.transform = `translateY(${pct * Math.max(trackH, 0)}px)`;
        scrollbarTrackRef.current.style.opacity = totalH > 50 ? "1" : "0";
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    const trackMouse = (e) => setCoords({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", trackMouse);
    return () => {
      lenis.destroy();
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", trackMouse);
    };
  }, []);

  return (
    <>
      <div className="nexus-static-bg">
        <div className="nexus-vignette" />
        <div className="nexus-grain" />
      </div>
      <GooeyCursor />
      <Navbar />

      <div className="nexus-hud top-left">
        SYS.READY // COORD: {coords.x}, {coords.y}
      </div>
      <div className="nexus-hud" style={{ top: "2rem", right: "2rem", textAlign: "right" }}>
        PROGRESS: <strong ref={pctRef} className="text-accent">0.0%</strong>
        <br />
        TOTAL_APPS: <strong className="text-accent">{applications.length}</strong>
      </div>

      <div
        ref={scrollbarTrackRef}
        style={{
          position: "fixed", right: "6px", top: "12%", bottom: "12%", width: "3px",
          zIndex: 60, pointerEvents: "none", background: "rgba(255,255,255,0.04)",
          borderRadius: "2px", transition: "opacity 0.6s ease", opacity: 0,
        }}
      >
        <div
          ref={scrollbarRef}
          style={{
            position: "absolute", top: 0, left: 0, width: "100%", height: "36px",
            background: "rgba(0,229,204,0.5)", borderRadius: "2px",
            boxShadow: "0 0 8px rgba(0,229,204,0.25)", willChange: "transform",
          }}
        />
      </div>

      <main style={{ position: "relative", zIndex: 10, paddingTop: "8rem", paddingBottom: "6rem", minHeight: "100vh" }}>
        <div className="nexus-container" style={{ maxWidth: "1100px" }}>
          <header style={{ marginBottom: "2rem" }}>
            <div className="nexus-eyebrow">Admin Subsystem // Access Level 4</div>
            <h1 className="nexus-display-lg">All Applications</h1>
            <p className="nexus-body-lg text-secondary">
              Platform-wide view of every job application and its current status.
            </p>
          </header>

          <div className="filter-row">
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`nexus-filter-pill ${statusFilter === s ? "active" : ""}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === "all" ? "ALL" : s.toUpperCase()}
              </button>
            ))}
          </div>

          {error && (
            <div className="nexus-glass-panel error-panel">
              <p className="nexus-mono-sm text-primary">{error}</p>
              <button className="nexus-btn primary" onClick={fetchApplications} style={{ marginTop: "1rem" }}>
                RETRY_CONNECTION
              </button>
            </div>
          )}

          {loading ? (
            <div className="nexus-state-container"><Spinner /></div>
          ) : applications.length === 0 ? (
            <div className="nexus-glass-panel empty-state">
              <p className="nexus-body-lg text-primary">No applications match this filter.</p>
            </div>
          ) : (
            <div className="apps-table">
              <div className="table-head">
                <span>Applicant</span>
                <span>Job</span>
                <span>Status</span>
                <span>AI Match</span>
                <span>Applied</span>
              </div>
              {applications.map((app) => {
                const candidate = app.user || {};
                const job = app.job || {};
                const initials = candidate.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
                return (
                  <div key={app._id} className="table-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                      <div className="nexus-avatar">{initials}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="text-primary" style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {candidate.name || "Unknown"}
                        </div>
                        <div className="nexus-body-sm text-secondary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {candidate.email || "—"}
                        </div>
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className="text-primary" style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {job.title || "—"}
                      </div>
                      <div className="nexus-body-sm text-secondary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {job.company || "—"}
                      </div>
                    </div>
                    <span className={`status-badge ${app.status}`}>{fmtLabel(app.status)}</span>
                    <span className="nexus-mono-sm text-accent">
                      {app.aiMatchScore != null ? `${app.aiMatchScore}%` : "N/A"}
                    </span>
                    <span className="nexus-mono-sm text-tertiary">{fmt(app.appliedAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style>{`
        .nexus-static-bg { position: fixed; inset: 0; z-index: 0; background: #030303; pointer-events: none; }
        .nexus-vignette { position: absolute; inset: 0; background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 120%); }
        .nexus-grain { position: absolute; inset: 0; opacity: 0.05; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .filter-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
        .apps-table { display: flex; flex-direction: column; gap: 2px; }
        .table-head { display: grid; grid-template-columns: 1.4fr 1.2fr 110px 90px 110px; padding: 0.5rem 1rem; }
        .table-head span { font-family: var(--font-mono); font-size: 0.65rem; color: rgba(234,242,255,0.35); text-transform: uppercase; letter-spacing: 0.1em; }
        .table-row { display: grid; grid-template-columns: 1.4fr 1.2fr 110px 90px 110px; align-items: center; padding: 0.75rem 1rem; background: rgba(6,12,24,0.9); border: 1px solid rgba(0,229,204,0.1); border-radius: 3px; gap: 0.5rem; animation: panelEntry 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .table-row:hover { border-color: rgba(0,229,204,0.2); }
        .nexus-avatar { width: 36px; height: 36px; border-radius: 2px; background: rgba(255,255,255,0.03); border: 1px solid rgba(0,229,204,0.15); color: var(--accent); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.8rem; flex-shrink: 0; }
        .status-badge { font-family: var(--font-mono); font-size: 0.68rem; padding: 0.2rem 0.5rem; border-radius: 2px; text-transform: uppercase; display: inline-block; }
        .status-badge.pending { color: #f59e0b; background: rgba(245,158,11,0.1); }
        .status-badge.shortlisted { color: #00e5cc; background: rgba(0,229,204,0.1); }
        .status-badge.rejected { color: #ff5555; background: rgba(255,85,85,0.1); }
        .nexus-state-container { text-align: center; padding: 4rem 2rem; }
        .empty-state, .error-panel { text-align: center; padding: 4rem 2rem; animation: panelEntry 0.6s cubic-bezier(0.16,1,0.3,1); }
        .error-panel { border-color: rgba(255,50,50,0.3); background: rgba(255,50,50,0.05); }
        @keyframes panelEntry { 0% { transform: translateY(12px) scale(0.98); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>
    </>
  );
}
