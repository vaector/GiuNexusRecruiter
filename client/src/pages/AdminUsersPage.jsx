// All users with filtering by role and status
// GET /api/v1/users
// Delete via DELETE /api/v1/users/:id
// Status change via PATCH /api/v1/users/:id/status
// Admin only

import React, { useState, useEffect, useCallback } from "react";
import { usersAPI } from "../services/api";
import { Spinner } from "../components/Spinner";
import Modal from "../components/Modal";
import GooeyCursor from "../components/GooeyCursor";
import Navbar from "../components/Navbar";
import useAdminEffects from "../utils/useAdminEffects";

const ROLES = ["", "jobSeeker", "recruiter", "admin"];
const STATUSES = ["", "approved", "pending", "rejected"];

// Brighter, balanced theme for the badges
const BADGE_STYLES = {
  approved:  { bg: "transparent", color: "#00e5cc", border: "1px solid rgba(0, 229, 204, 0.4)" },
  pending:   { bg: "transparent", color: "rgba(234, 242, 255, 0.6)", border: "1px dashed rgba(234, 242, 255, 0.3)" },
  rejected:  { bg: "transparent", color: "rgba(234, 242, 255, 0.3)", border: "1px solid rgba(255, 255, 255, 0.06)", textDecoration: "line-through" },
  
  admin:     { bg: "rgba(0, 229, 204, 0.1)", color: "#00e5cc", border: "1px solid rgba(0, 229, 204, 0.3)" },
  recruiter: { bg: "transparent", color: "#eaf2ff", border: "1px solid rgba(255, 255, 255, 0.3)" }, 
  jobSeeker: { bg: "transparent", color: "rgba(234, 242, 255, 0.8)", border: "1px solid rgba(255, 255, 255, 0.15)" }, // Brightened to not look grayed out
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ role: "", status: "" });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [statusModal, setStatusModal] = useState(null);
  const LIMIT = 20;

  const { coords, scrollbarRef, scrollbarTrackRef, pctRef } = useAdminEffects();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = { page, limit: LIMIT };
      if (filters.role) params.role = filters.role;
      if (filters.status) params.status = filters.status;
      const res = await usersAPI.getAllUsers(params);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
      setPages(Math.ceil((res.data.total || 0) / LIMIT));
    } catch (err) {
      setError("SYS.ERR: FAILED_TO_LOAD_USERS");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Robust Scroll Engine

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleDelete = async () => {
    const { id, name } = deleteModal;
    setActionLoading((prev) => ({ ...prev, [id]: "deleting" }));
    try {
      await usersAPI.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setTotal((prev) => prev - 1);
      showToast(`SYS.UPDATE: ${name}_TERMINATED`);
    } catch {
      showToast("SYS.ERR: DELETION_FAILED", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
      setDeleteModal(null);
    }
  };

  const handleStatusChange = async () => {
    const { id, status, name } = statusModal;
    setActionLoading((prev) => ({ ...prev, [id]: "status" }));
    try {
      await usersAPI.updateUserStatus(id, status);
      setUsers((prev) => prev.map((u) => u._id === id ? { ...u, status } : u));
      showToast(`SYS.UPDATE: ${name}_STATUS_${status.toUpperCase()}`);
    } catch {
      showToast("SYS.ERR: STATUS_UPDATE_FAILED", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
      setStatusModal(null);
    }
  };

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "??";

  const selectStyle = {
    padding: "0.5rem 0.75rem",
    borderRadius: "2px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    background: "rgba(6, 12, 24, 0.92)",
    color: "#eaf2ff",
    fontSize: "11px",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    outline: "none",
    textTransform: "uppercase"
  };

  const actionBtnStyle = (disabled, isDanger = false) => ({
    padding: "0.35rem 0.85rem",
    borderRadius: "2px",
    border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : isDanger ? "rgba(239, 68, 68, 0.4)" : "rgba(255,255,255,0.2)"}`,
    background: disabled ? "transparent" : isDanger ? "rgba(239, 68, 68, 0.05)" : "transparent",
    color: disabled ? "rgba(234, 242, 255, 0.3)" : isDanger ? "#ef4444" : "#eaf2ff",
    fontSize: "10px",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });

  // Strict Grid Layout: Fixed widths for the end columns guarantees nothing shifts
  const gridTemplate = "minmax(150px, 1fr) minmax(180px, 1.5fr) 110px 110px 160px";

  return (
    <>
      {/* STATIC DARK BACKGROUND */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "#030303", pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 120%)" }}></div>
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}></div>
      </div>

      <GooeyCursor />
      <Navbar />

      {/* --- HUD Elements --- */}
      <div style={{ position: "fixed", top: "1.5rem", left: "1.5rem", zIndex: 60, pointerEvents: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.14em", color: "rgba(140,230,240,0.38)" }}>
        SYS.READY // COORD: {coords.x}, {coords.y}
      </div>
      
      <div style={{ position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 60, pointerEvents: "none", fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.14em", color: "rgba(140,230,240,0.38)", textAlign: "right" }}>
        PROGRESS: <strong ref={pctRef} style={{ color: "#00e5cc" }}>0.0%</strong>
      </div>

      {/* --- Custom Scrollbar --- */}
      <div ref={scrollbarTrackRef} style={{ position: "fixed", right: "6px", top: "12%", bottom: "12%", width: "3px", zIndex: 60, pointerEvents: "none", background: "rgba(255,255,255,0.04)", borderRadius: "2px", transition: "opacity 0.6s ease", opacity: 0 }}>
        <div ref={scrollbarRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "36px", background: "rgba(0,229,204,0.5)", borderRadius: "2px", boxShadow: "0 0 8px rgba(0,229,204,0.25)", willChange: "transform" }} />
      </div>

      {/* --- Toasts --- */}
      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", background: "rgba(6, 12, 24, 0.92)", color: toast.type === "error" ? "#ef4444" : "#00e5cc", border: `1px solid ${toast.type === "error" ? "#ef4444" : "#00e5cc"}`, padding: "1rem 1.5rem", borderRadius: "2px", fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", zIndex: 1000, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeIn 0.2s ease" }}>
          {toast.message}
        </div>
      )}

      {/* --- Modals --- */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} onConfirm={handleDelete} title="TERMINATE USER" confirmText="CONFIRM" confirmDanger>
        <p style={{ color: "rgba(234, 242, 255, 0.45)" }}>Permanently delete <strong style={{ color: "#eaf2ff" }}>{deleteModal?.name}</strong>? This cannot be reversed.</p>
      </Modal>

      <Modal isOpen={!!statusModal} onClose={() => setStatusModal(null)} onConfirm={handleStatusChange} title="MODIFY ACCESS" confirmText="AUTHORIZE">
        <p style={{ color: "rgba(234, 242, 255, 0.45)" }}>Change <strong style={{ color: "#eaf2ff" }}>{statusModal?.name}</strong>'s status to <strong style={{ color: "#00e5cc" }}>{statusModal?.status?.toUpperCase()}</strong>?</p>
      </Modal>

      {/* --- Main View Container --- */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "clamp(6rem, 8vw, 8rem) clamp(1.5rem, 4vw, 2rem)", minHeight: "100vh" }}>
        
        {/* header */}
        <div style={{ marginBottom: "clamp(1.5rem, 3vw, 2.5rem)" }}>
          <p style={{ fontSize: "10px", fontWeight: 400, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px", color: "#00e5cc", marginBottom: "0.5rem", textTransform: "uppercase" }}>
            Admin Subsystem // Level 4
          </p>
          <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 600, fontFamily: "'Syncopate', sans-serif", color: "#eaf2ff", marginBottom: "0.5rem", textTransform: "uppercase" }}>
            User Management
          </h1>
          <p style={{ color: "rgba(234, 242, 255, 0.45)", fontSize: "14px" }}>
            {total} total records in the database
          </p>
        </div>

        {/* filters */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "clamp(1.25rem, 2vw, 2rem)", background: "rgba(6, 12, 24, 0.92)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "4px", padding: "1rem 1.25rem", alignItems: "center" }}>
          
          {/* REMOVED THE UNDERSCORE HERE */}
          <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono', monospace", color: "rgba(234, 242, 255, 0.45)", marginRight: "0.25rem" }}>
            FILTER BY:
          </span>

          <select style={selectStyle} value={filters.role} onChange={(e) => handleFilterChange("role", e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r ? r.replace("jobSeeker", "JOB SEEKER").toUpperCase() : "ALL ROLES"}</option>
            ))}
          </select>

          <select style={selectStyle} value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s ? s.toUpperCase() : "ALL STATUSES"}</option>
            ))}
          </select>

          {(filters.role || filters.status) && (
            <button onClick={() => { setFilters({ role: "", status: "" }); setPage(1); }} style={{ background: "none", border: "none", color: "#00e5cc", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", cursor: "pointer", padding: "0.5rem" }}>
              RESET FILTERS {/* REMOVED THE UNDERSCORE HERE */}
            </button>
          )}
        </div>

        {/* content */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <Spinner />
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(234,242,255,0.3)", marginTop: "1rem" }}>FETCHING_RECORDS...</p>
          </div>
        ) : error ? (
          <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "4px", padding: "1.5rem", color: "#eaf2ff", textAlign: "center" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", marginBottom: "1rem" }}>{error}</p>
            <button onClick={fetchUsers} style={actionBtnStyle(false)}>RETRY</button>
          </div>
        ) : users.length === 0 ? (
          <div style={{ background: "rgba(6, 12, 24, 0.92)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "4px", padding: "4rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "rgba(234, 242, 255, 0.3)", fontFamily: "'Syncopate', sans-serif" }}>// NULL</div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 500, color: "#eaf2ff", marginBottom: "0.5rem" }}>No users found</h2>
            <p style={{ color: "rgba(234, 242, 255, 0.45)", fontSize: "14px" }}>Adjust active filters to continue.</p>
          </div>
        ) : (
          <>
            {/* table */}
            <div style={{ background: "rgba(6, 12, 24, 0.92)", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "4px", overflow: "hidden" }}>
              
              {/* table header */}
              <div className="admin-table-row header" style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: "1rem", padding: "0.75rem 1.25rem", background: "rgba(8, 12, 24, 0.4)", borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
                {["USER_DATA", "EMAIL", "ROLE", "STATUS", "ACTIONS"].map((h) => (
                  <span key={h} style={{ fontSize: "10px", fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", color: "rgba(234, 242, 255, 0.3)", letterSpacing: "1px" }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* rows */}
              {users.map((user, i) => {
                const isBusy = !!actionLoading[user._id];
                const roleStyle = BADGE_STYLES[user.role] || BADGE_STYLES.jobSeeker;
                const statusStyle = BADGE_STYLES[user.status] || BADGE_STYLES.pending;
                const nextStatuses = ["approved", "pending", "rejected"].filter((s) => s !== user.status);

                return (
                  <div key={user._id} className="admin-table-row body-row" style={{ display: "grid", gridTemplateColumns: gridTemplate, gap: "1rem", padding: "1rem 1.25rem", borderBottom: i < users.length - 1 ? "1px solid rgba(255, 255, 255, 0.06)" : "none", alignItems: "center" }}>
                    
                    {/* name + avatar */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "2px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#00e5cc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>
                        {getInitials(user.name)}
                      </div>
                      <span style={{ fontWeight: 400, color: "#eaf2ff", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {user.name}
                      </span>
                    </div>

                    {/* email (Forced left-align) */}
                    <span className="email-cell" style={{ textAlign: "left", width: "100%", color: "rgba(234, 242, 255, 0.45)", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.email}
                    </span>

                    {/* role badge */}
                    <div>
                      <span style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "2px", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", background: roleStyle.bg, color: roleStyle.color, border: roleStyle.border }}>
                        {user.role === "jobSeeker" ? "JOB SEEKER" : user.role.toUpperCase()}
                      </span>
                    </div>

                    {/* status badge */}
                    <div>
                      <span style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "2px", fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", background: statusStyle.bg, color: statusStyle.color, border: statusStyle.border, textDecoration: statusStyle.textDecoration || "none" }}>
                        {user.status?.toUpperCase()}
                      </span>
                    </div>

                    {/* actions */}
                    <div className="action-cell" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-start" }}>
                      {user.role !== "admin" ? (
                        <>
                          {nextStatuses.map((s) => (
                            <button key={s} disabled={isBusy} onClick={() => setStatusModal({ id: user._id, status: s, name: user.name })} style={actionBtnStyle(isBusy)}>
                              {s.substring(0,3).toUpperCase()}
                            </button>
                          ))}
                          <button disabled={isBusy} onClick={() => setDeleteModal({ id: user._id, name: user.name })} style={actionBtnStyle(isBusy, true)}>
                            {actionLoading[user._id] === "deleting" ? "..." : "DEL"}
                          </button>
                        </>
                      ) : (
                        /* ADDED FALLBACK TEXT SO THE ADMIN ROW DOESN'T COLLAPSE */
                        <span style={{ fontSize: "10px", color: "rgba(234,242,255,0.3)", fontFamily: "'JetBrains Mono', monospace" }}>SYS_ADMIN</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* pagination */}
            {pages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={actionBtnStyle(page === 1)}>
                  {"< PREV"}
                </button>
                <span style={{ fontSize: "10px", fontFamily: "'JetBrains Mono', monospace", color: "rgba(234,242,255,0.45)" }}>
                  PAGE {page} OF {pages}
                </span>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} style={actionBtnStyle(page === pages)}>
                  {"NEXT >"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        
        .body-row:hover { background: rgba(255, 255, 255, 0.02); }

        @media (max-width: 900px) {
          .admin-table-row { grid-template-columns: 1.5fr 110px 110px 160px !important; }
          .email-cell { display: none !important; }
        }
        @media (max-width: 600px) {
          .admin-table-row.header { display: none !important; }
          .admin-table-row.body-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .action-cell { width: 100%; justify-content: flex-start; margin-top: 0.5rem; }
        }
      `}</style>
    </>
  );
}