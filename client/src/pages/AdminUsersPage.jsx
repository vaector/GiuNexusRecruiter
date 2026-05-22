// All users with filtering by role and status
// GET /api/v1/users  — list
// GET /api/v1/users/:id — single user detail (modal)
// Admin only
import React, { useState, useEffect } from "react";
import { usersAPI } from "../services/api";
import { Spinner } from "../components/Spinner";
import GooeyCursor from "../components/GooeyCursor";
import Navbar from "../components/Navbar";
import useAdminEffects from "../utils/useAdminEffects";

const ROLES = ["all", "jobSeeker", "recruiter", "admin"];
const STATUSES = ["all", "active", "pending", "suspended"];

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { coords, scrollbarRef, scrollbarTrackRef, pctRef } = useAdminEffects();

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (roleFilter !== "all") params.role = roleFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await usersAPI.getAllUsers(params);
      setUsers(res.data.users || []);
    } catch {
      setError("SYS.ERR: FAILED_TO_FETCH_USERS");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelectedUser(null);
    try {
      const res = await usersAPI.getUserById(id);
      setSelectedUser(res.data.user || res.data);
    } catch {
      showToast("SYS.ERR: FAILED_TO_FETCH_USER", "error");
    } finally {
      setDetailLoading(false);
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
        TOTAL_USERS: <strong className="text-accent">{users.length}</strong>
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

      {selectedUser !== null && (
        <div className="detail-overlay" onClick={() => setSelectedUser(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setSelectedUser(null)}>✕</button>
            <div className="nexus-eyebrow">User Detail // ID: {selectedUser._id?.slice(-8)}</div>
            <h2 className="nexus-display-md" style={{ margin: "0.5rem 0 1.5rem" }}>{selectedUser.name}</h2>
            <div className="detail-grid">
              <Field label="Email" value={selectedUser.email} />
              <Field label="Role" value={selectedUser.role} />
              <Field label="Status" value={selectedUser.status} />
              <Field label="Joined" value={fmt(selectedUser.createdAt)} />
              {selectedUser.phone && <Field label="Phone" value={selectedUser.phone} />}
              {selectedUser.location && <Field label="Location" value={selectedUser.location} />}
              {Array.isArray(selectedUser.skills) && selectedUser.skills.length > 0 && (
                <div className="detail-field full">
                  <span className="field-label">Skills</span>
                  <div className="skill-tags">
                    {selectedUser.skills.map((s) => <span key={s}>{s}</span>)}
                  </div>
                </div>
              )}
              {selectedUser.bio && (
                <div className="detail-field full">
                  <span className="field-label">Bio</span>
                  <p className="text-secondary" style={{ margin: 0, lineHeight: 1.6 }}>{selectedUser.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="detail-overlay">
          <Spinner />
        </div>
      )}

      <main style={{ position: "relative", zIndex: 10, paddingTop: "8rem", paddingBottom: "6rem", minHeight: "100vh" }}>
        <div className="nexus-container" style={{ maxWidth: "960px" }}>
          <header style={{ marginBottom: "2rem" }}>
            <div className="nexus-eyebrow">Admin Subsystem // Access Level 4</div>
            <h1 className="nexus-display-lg">All Users</h1>
            <p className="nexus-body-lg text-secondary">
              Browse, filter, and inspect platform user accounts.
            </p>
          </header>

          <div className="filter-row">
            {ROLES.map((r) => (
              <button
                key={r}
                className={`nexus-filter-pill ${roleFilter === r ? "active" : ""}`}
                onClick={() => setRoleFilter(r)}
              >
                {r === "all" ? "ALL ROLES" : r.toUpperCase()}
              </button>
            ))}
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem" }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  className={`nexus-filter-pill ${statusFilter === s ? "active" : ""}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === "all" ? "ALL STATUS" : s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="nexus-glass-panel error-panel">
              <p className="nexus-mono-sm text-primary">{error}</p>
              <button className="nexus-btn primary" onClick={fetchUsers} style={{ marginTop: "1rem" }}>
                RETRY_CONNECTION
              </button>
            </div>
          )}

          {loading ? (
            <div className="nexus-state-container"><Spinner /></div>
          ) : users.length === 0 ? (
            <div className="nexus-glass-panel empty-state">
              <div className="nexus-display-md text-secondary" style={{ marginBottom: "0.5rem" }}>// NULL</div>
              <p className="nexus-body-lg text-primary">No users match the current filters.</p>
            </div>
          ) : (
            <div className="users-table">
              <div className="table-head">
                <span>User</span>
                <span>Role</span>
                <span>Status</span>
                <span>Joined</span>
                <span />
              </div>
              {users.map((u) => {
                const initials = u.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";
                return (
                  <div key={u._id} className="table-row">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", minWidth: 0 }}>
                      <div className="nexus-avatar">{initials}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="text-primary" style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                        <div className="nexus-body-sm text-secondary" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                      </div>
                    </div>
                    <span className="nexus-mono-sm text-accent">{u.role}</span>
                    <span className={`status-badge ${u.status}`}>{u.status}</span>
                    <span className="nexus-mono-sm text-tertiary">{fmt(u.createdAt)}</span>
                    <button className="nexus-btn secondary" style={{ padding: "0.3rem 0.7rem", fontSize: "0.7rem" }} onClick={() => openDetail(u._id)}>
                      VIEW
                    </button>
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
        .filter-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; align-items: center; }
        .users-table { display: flex; flex-direction: column; gap: 2px; }
        .table-head { display: grid; grid-template-columns: 1fr 110px 100px 120px 70px; padding: 0.5rem 1rem; }
        .table-head span { font-family: var(--font-mono); font-size: 0.65rem; color: rgba(234,242,255,0.35); text-transform: uppercase; letter-spacing: 0.1em; }
        .table-row { display: grid; grid-template-columns: 1fr 110px 100px 120px 70px; align-items: center; padding: 0.75rem 1rem; background: rgba(6,12,24,0.9); border: 1px solid rgba(0,229,204,0.1); border-radius: 3px; gap: 0.5rem; animation: panelEntry 0.4s cubic-bezier(0.16,1,0.3,1) both; }
        .table-row:hover { border-color: rgba(0,229,204,0.22); }
        .status-badge { font-family: var(--font-mono); font-size: 0.68rem; padding: 0.2rem 0.5rem; border-radius: 2px; text-transform: uppercase; }
        .status-badge.active { color: #00e5cc; background: rgba(0,229,204,0.1); }
        .status-badge.pending { color: #f59e0b; background: rgba(245,158,11,0.1); }
        .status-badge.suspended { color: #ff5555; background: rgba(255,85,85,0.1); }
        .nexus-avatar { width: 36px; height: 36px; border-radius: 2px; background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); color: var(--accent); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.8rem; flex-shrink: 0; }
        .detail-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; padding: 1rem; }
        .detail-panel { background: #060c18; border: 1px solid rgba(0,229,204,0.22); border-radius: 6px; padding: 2rem; max-width: 560px; width: 100%; position: relative; max-height: 80vh; overflow-y: auto; }
        .detail-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; color: rgba(234,242,255,0.5); cursor: pointer; font-size: 1rem; }
        .detail-close:hover { color: #eaf2ff; }
        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .detail-field { display: flex; flex-direction: column; gap: 0.25rem; }
        .detail-field.full { grid-column: 1 / -1; }
        .field-label { font-family: var(--font-mono); font-size: 0.65rem; color: rgba(234,242,255,0.35); text-transform: uppercase; letter-spacing: 0.1em; }
        .skill-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.25rem; }
        .skill-tags span { border: 1px solid rgba(255,255,255,0.1); border-radius: 3px; font-size: 0.72rem; padding: 0.2rem 0.45rem; color: rgba(234,242,255,0.6); }
        .nexus-state-container { text-align: center; padding: 4rem 2rem; }
        .empty-state, .error-panel { text-align: center; padding: 4rem 2rem; animation: panelEntry 0.6s cubic-bezier(0.16,1,0.3,1); }
        .error-panel { border-color: rgba(255,50,50,0.3); background: rgba(255,50,50,0.05); }
        .nexus-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); z-index: 1000; background: var(--bg-surface-solid); backdrop-filter: blur(20px); border: 1px solid var(--accent); color: var(--accent); font-family: var(--font-mono); font-size: 0.72rem; padding: 1rem 1.5rem; border-radius: 2px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); animation: toastEntry 0.4s cubic-bezier(0.16,1,0.3,1); }
        .nexus-toast.error { border-color: #ff3333; color: #ff3333; }
        @keyframes panelEntry { 0% { transform: translateY(12px) scale(0.98); opacity: 0; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        @keyframes toastEntry { 0% { transform: translate(-50%, 16px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </>
  );
}

function Field({ label, value }) {
  return (
    <div className="detail-field">
      <span className="field-label">{label}</span>
      <span className="text-primary" style={{ fontSize: "0.88rem" }}>{value || "—"}</span>
    </div>
  );
}
