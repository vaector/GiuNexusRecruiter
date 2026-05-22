// Admin referral management
// GET /api/v1/referrals — all referrals
// PATCH /api/v1/referrals/:id/status — update status
// Admin only
import { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import { referralsAPI } from "../services/api";
import { Spinner } from "../components/Spinner";
import GooeyCursor from "../components/GooeyCursor";
import Navbar from "../components/Navbar";

const STATUSES = ["all", "pending", "accepted", "rejected"];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const lenisRef = useRef(null);
  const scrollbarRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const pctRef = useRef(null);

  const fetchReferrals = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await referralsAPI.getAllReferrals(params);
      setReferrals(res.data.referrals || []);
    } catch {
      setError("SYS.ERR: FAILED_TO_FETCH_REFERRALS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
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

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = async (id, status) => {
    setActionLoading((prev) => ({ ...prev, [id]: status }));
    try {
      await referralsAPI.updateReferralStatus(id, status);
      setReferrals((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status } : r))
      );
      showToast(`SYS.UPDATE: REFERRAL_${status.toUpperCase()}`);
    } catch {
      showToast("SYS.ERR: ACTION_FAILED", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

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
        TOTAL_REFERRALS: <strong className="text-accent">{referrals.length}</strong>
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

      {toast && (
        <div className={`nexus-toast ${toast.type === "error" ? "error" : ""}`}>
          {toast.message}
        </div>
      )}

      <main style={{ position: "relative", zIndex: 10, paddingTop: "8rem", paddingBottom: "6rem", minHeight: "100vh" }}>
        <div className="nexus-container" style={{ maxWidth: "980px" }}>
          <header style={{ marginBottom: "2rem" }}>
            <div className="nexus-eyebrow">Admin Subsystem // Access Level 4</div>
            <h1 className="nexus-display-lg">Referral Management</h1>
            <p className="nexus-body-lg text-secondary">
              Review and update the status of all platform referrals.
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
              <button className="nexus-btn primary" onClick={fetchReferrals} style={{ marginTop: "1rem" }}>
                RETRY_CONNECTION
              </button>
            </div>
          )}

          {loading ? (
            <div className="nexus-state-container"><Spinner /></div>
          ) : referrals.length === 0 ? (
            <div className="nexus-glass-panel empty-state">
              <p className="nexus-body-lg text-primary">No referrals match this filter.</p>
            </div>
          ) : (
            <div className="nexus-grid">
              {referrals.map((ref, index) => {
                const referrer = ref.referrer || ref.from || {};
                const referred = ref.referred || ref.to || {};
                const isBusy = !!actionLoading[ref._id];
                const isPending = ref.status === "pending";

                return (
                  <div
                    key={ref._id}
                    className="nexus-glass-panel nexus-card"
                    style={{ animationDelay: `${index * 0.04}s` }}
                  >
                    <div className="ref-info">
                      <div>
                        <div className="nexus-mono-sm text-tertiary">FROM</div>
                        <div className="text-primary" style={{ fontWeight: 600 }}>{referrer.name || "—"}</div>
                        <div className="nexus-body-sm text-secondary">{referrer.email || "—"}</div>
                      </div>
                      <div className="ref-arrow">→</div>
                      <div>
                        <div className="nexus-mono-sm text-tertiary">TO</div>
                        <div className="text-primary" style={{ fontWeight: 600 }}>{referred.name || "—"}</div>
                        <div className="nexus-body-sm text-secondary">{referred.email || "—"}</div>
                      </div>
                      <div>
                        <div className="nexus-mono-sm text-tertiary">DATE</div>
                        <div className="nexus-body-sm text-secondary">{fmt(ref.createdAt)}</div>
                      </div>
                      <span className={`status-badge ${ref.status}`}>{ref.status}</span>
                    </div>

                    {isPending && (
                      <div className="card-actions">
                        <button
                          className="nexus-btn secondary"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(ref._id, "rejected")}
                        >
                          {actionLoading[ref._id] === "rejected" ? "REJECTING..." : "REJECT"}
                        </button>
                        <button
                          className="nexus-btn primary"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(ref._id, "accepted")}
                        >
                          {actionLoading[ref._id] === "accepted" ? "ACCEPTING..." : "ACCEPT"}
                        </button>
                      </div>
                    )}
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
        .nexus-grid { display: flex; flex-direction: column; gap: 1rem; }
        .nexus-card { padding: clamp(1.25rem, 2.5vw, 1.5rem); display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; flex-wrap: wrap; animation: panelEntry 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        .ref-info { display: flex; align-items: center; gap: 1.5rem; flex: 1; flex-wrap: wrap; }
        .ref-arrow { font-size: 1.2rem; color: rgba(0,229,204,0.5); }
        .card-actions { display: flex; gap: 0.75rem; flex-shrink: 0; }
        .status-badge { font-family: var(--font-mono); font-size: 0.68rem; padding: 0.25rem 0.6rem; border-radius: 2px; text-transform: uppercase; }
        .status-badge.pending { color: #f59e0b; background: rgba(245,158,11,0.1); }
        .status-badge.accepted { color: #00e5cc; background: rgba(0,229,204,0.1); }
        .status-badge.rejected { color: #ff5555; background: rgba(255,85,85,0.1); }
        .nexus-state-container { text-align: center; padding: 4rem 2rem; }
        .empty-state, .error-panel { text-align: center; padding: 4rem 2rem; animation: panelEntry 0.6s cubic-bezier(0.16,1,0.3,1); }
        .error-panel { border-color: rgba(255,50,50,0.3); background: rgba(255,50,50,0.05); }
        .nexus-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); z-index: 1000; background: var(--bg-surface-solid); backdrop-filter: blur(20px); border: 1px solid var(--accent); color: var(--accent); font-family: var(--font-mono); font-size: 0.72rem; padding: 1rem 1.5rem; border-radius: 2px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); animation: toastEntry 0.4s cubic-bezier(0.16,1,0.3,1); }
        .nexus-toast.error { border-color: #ff3333; color: #ff3333; }
        @keyframes panelEntry { 0% { transform: translateY(16px) scale(0.97); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes toastEntry { 0% { transform: translate(-50%, 16px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </>
  );
}
