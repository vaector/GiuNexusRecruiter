// Lists pending recruiters
// GET /api/v1/users?role=recruiter&status=pending
// Approve/Reject buttons call PATCH /api/v1/users/:id/status
// Admin only
import React, { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import { usersAPI } from "../services/api";
import { Spinner } from "../components/Spinner";
import GooeyCursor from "../components/GooeyCursor";
import Navbar from "../components/Navbar";

export default function PendingRecruitersPage() {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);
  
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const lenisRef = useRef(null);
  const scrollbarRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const pctRef = useRef(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAllUsers({ role: "recruiter", status: "pending" });
      setRecruiters(res.data.users || []);
    } catch (err) {
      setError("SYS.ERR: FAILED_TO_FETCH_TELEMETRY");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();

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

  const handleAction = async (id, status) => {
    setActionLoading((prev) => ({ ...prev, [id]: status }));
    try {
      await usersAPI.updateUserStatus(id, status);
      setRecruiters((prev) => prev.filter((r) => r._id !== id));
      showToast(
        status === "approved" ? "SYS.UPDATE: RECRUITER_APPROVED" : "SYS.UPDATE: RECRUITER_REJECTED",
        status === "approved" ? "success" : "error"
      );
    } catch (err) {
      showToast("SYS.ERR: ACTION_FAILED", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  // Card Spotlight Restored
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`);
  };

  return (
    <>
      <div className="nexus-static-bg">
        <div className="nexus-vignette"></div>
        <div className="nexus-grain"></div>
      </div>

      <GooeyCursor />
      <Navbar />

      <div className="nexus-hud top-left">
        SYS.READY // COORD: {coords.x}, {coords.y}
      </div>
      
      <div className="nexus-hud" style={{ top: "2rem", right: "2rem", textAlign: "right" }}>
        PROGRESS: <strong ref={pctRef} className="text-accent">0.0%</strong>
        <br />
        PENDING_REQ: <strong className="text-accent">{recruiters.length}</strong>
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
        <div className="nexus-container" style={{ maxWidth: "900px" }}>
          
          <header style={{ marginBottom: "3rem" }}>
            <div className="nexus-eyebrow">Admin Subsystem // Access Level 4</div>
            <h1 className="nexus-display-lg">Pending Recruiters</h1>
            <p className="nexus-body-lg text-secondary">
              Awaiting clearance. Review and authorize access credentials below.
            </p>
          </header>

          <div className="nexus-filter-bar" style={{ marginBottom: "2rem" }}>
            <div className="nexus-filter-pill active">
              STATUS: AWAITING_REVIEW
              {recruiters.length > 0 && <span className="nexus-badge">{recruiters.length}</span>}
            </div>
          </div>

          <section>
            {loading ? (
              <div className="nexus-state-container">
                <Spinner />
                <p className="nexus-mono-sm text-tertiary" style={{ marginTop: '1.5rem' }}>FETCHING_RECORDS...</p>
              </div>
            ) : error ? (
              <div className="nexus-glass-panel error-panel">
                <p className="nexus-mono-sm text-primary">{error}</p>
                <button className="nexus-btn primary" onClick={fetchPending} style={{ marginTop: '1rem' }}>
                  RETRY_CONNECTION
                </button>
              </div>
            ) : recruiters.length === 0 ? (
              <div className="nexus-glass-panel empty-state">
                <div className="nexus-display-md text-secondary" style={{ marginBottom: '0.5rem' }}>// NULL</div>
                <h2 className="nexus-body-lg text-primary">No pending requests</h2>
                <p className="nexus-body-sm text-tertiary">All recruiter accounts have been processed.</p>
              </div>
            ) : (
              <div className="nexus-grid">
                {recruiters.map((recruiter, index) => {
                  const isApproving = actionLoading[recruiter._id] === "approved";
                  const isRejecting = actionLoading[recruiter._id] === "rejected";
                  const isBusy = isApproving || isRejecting;
                  const initials = recruiter.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
                  const joinedDate = new Date(recruiter.createdAt).toISOString().split('T')[0];
                  
                  return (
                    <div 
                      key={recruiter._id} 
                      className="nexus-glass-panel nexus-card"
                      onMouseMove={handleMouseMove}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="card-info">
                        <div className="nexus-avatar">{initials}</div>
                        <div className="card-meta">
                          <p className="text-primary" style={{ fontWeight: 600 }}>{recruiter.name}</p>
                          <p className="text-secondary nexus-body-sm">{recruiter.email}</p>
                          <p className="nexus-mono-sm text-tertiary" style={{ marginTop: "0.25rem" }}>
                            TS: {joinedDate} // ID: {recruiter._id.slice(-6)}
                          </p>
                        </div>
                      </div>

                      <div className="card-actions">
                        <button
                          onClick={() => handleAction(recruiter._id, "rejected")}
                          disabled={isBusy}
                          className="nexus-btn secondary"
                        >
                          {isRejecting ? "REJECTING..." : "REJECT"}
                        </button>
                        <button
                          onClick={() => handleAction(recruiter._id, "approved")}
                          disabled={isBusy}
                          className="nexus-btn primary"
                        >
                          {isApproving ? "APPROVING..." : "AUTHORIZE"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <style>{`
        /* --- Static Background Styling --- */
        .nexus-static-bg {
          position: fixed; inset: 0; z-index: 0;
          background: #030303; pointer-events: none;
        }
        .nexus-vignette {
          position: absolute; inset: 0;
          background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 120%);
        }
        .nexus-grain {
          position: absolute; inset: 0; opacity: 0.05;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }

        /* --- Page Specific Layout --- */
        .nexus-grid { display: flex; flex-direction: column; gap: 1rem; }
        
        .nexus-card {
          padding: clamp(1.25rem, 2.5vw, 1.5rem);
          display: flex; align-items: center; justify-content: space-between;
          gap: 1.5rem; flex-wrap: wrap;
          animation: panelEntry 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .card-info { display: flex; align-items: center; gap: 1.25rem; flex: 1; min-width: 0; }
        .card-actions { display: flex; gap: 0.75rem; flex-shrink: 0; }
        
        .nexus-avatar {
          width: 48px; height: 48px; border-radius: 2px;
          background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass);
          color: var(--accent); display: flex; align-items: center; justify-content: center;
          font-family: var(--font-mono); font-size: 1rem; flex-shrink: 0;
        }

        .card-meta p { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .nexus-state-container { text-align: center; padding: 4rem 2rem; }
        .empty-state, .error-panel { text-align: center; padding: 4rem 2rem; animation: panelEntry 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .error-panel { border-color: rgba(255, 50, 50, 0.3); background: rgba(255, 50, 50, 0.05); }

        .nexus-toast {
          position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); z-index: 1000;
          background: var(--bg-surface-solid); backdrop-filter: blur(20px);
          border: 1px solid var(--accent); color: var(--accent);
          font-family: var(--font-mono); font-size: 0.72rem; padding: 1rem 1.5rem;
          border-radius: 2px; box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 12px var(--accent-glow);
          animation: toastEntry 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nexus-toast.error { border-color: #ff3333; color: #ff3333; box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 12px rgba(255, 51, 51, 0.25); }

        @keyframes panelEntry { 0% { transform: translateY(16px) scale(0.97); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes toastEntry { 0% { transform: translate(-50%, 16px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </>
  );
}