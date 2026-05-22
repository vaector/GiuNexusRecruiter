// All users with filtering by role and status
// GET /api/v1/users
// Delete via DELETE /api/v1/users/:id
// Status change via PATCH /api/v1/users/:id/status
// Admin only
import { useState, useEffect, useCallback } from "react";
import { usersAPI } from "../services/api";
import { Spinner } from "../components/Spinner";
import Modal from "../components/Modal";

const ROLES = ["", "jobSeeker", "recruiter", "admin"];
const STATUSES = ["", "approved", "pending", "rejected"];

const STATUS_STYLES = {
  approved: { bg: "#dcfce7", color: "#166534" },
  pending: { bg: "#fef9c3", color: "#854d0e" },
  rejected: { bg: "#fee2e2", color: "#991b1b" },
};

const ROLE_STYLES = {
  admin: { bg: "#ede9fe", color: "#5b21b6" },
  recruiter: { bg: "#dbeafe", color: "#1e40af" },
  jobSeeker: { bg: "#f1f5f9", color: "#475569" },
};

const AdminUsersPage = () => {
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
      setPages(res.data.pages || 1);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

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
      showToast(`${name} has been deleted`);
    } catch {
      showToast("Failed to delete user", "error");
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
      showToast(`${name}'s status updated to ${status}`);
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
      setStatusModal(null);
    }
  };

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const selectStyle = {
    padding: "0.5rem 0.75rem",
    borderRadius: "var(--rounded-sm)",
    border: "1px solid var(--color-border)",
    background: "var(--color-canvas)",
    color: "var(--color-ink)",
    fontSize: "clamp(12px, 1vw, 14px)",
    cursor: "pointer",
    fontFamily: "inherit",
    outline: "none",
  };

  const badgeStyle = (styles) => ({
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: "var(--rounded-pill)",
    fontSize: "clamp(10px, 0.85vw, 12px)",
    fontWeight: 600,
    background: styles.bg,
    color: styles.color,
  });

  const actionBtnStyle = (color, disabled) => ({
    padding: "0.35rem 0.85rem",
    borderRadius: "var(--rounded-sm)",
    border: `1px solid ${color}`,
    background: "transparent",
    color: disabled ? "var(--color-mute)" : color,
    fontSize: "clamp(11px, 0.9vw, 13px)",
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)" }}>

      {/* toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", right: "2rem",
          background: toast.type === "success" ? "var(--color-ink)" : "#dc2626",
          color: "var(--color-on-primary)",
          padding: "0.85rem 1.5rem", borderRadius: "var(--rounded-md)",
          fontSize: "14px", fontWeight: 500, zIndex: 1000,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.2s ease",
        }}>
          {toast.message}
        </div>
      )}

      {/* delete modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete User"
        confirmText="Delete"
        confirmDanger
      >
        <p>Are you sure you want to permanently delete <strong>{deleteModal?.name}</strong>? This action cannot be undone.</p>
      </Modal>

      {/* status modal */}
      <Modal
        isOpen={!!statusModal}
        onClose={() => setStatusModal(null)}
        onConfirm={handleStatusChange}
        title="Update User Status"
        confirmText="Confirm"
      >
        <p>Change <strong>{statusModal?.name}</strong>'s status to <strong>{statusModal?.status}</strong>?</p>
      </Modal>

      {/* header */}
      <div style={{ marginBottom: "clamp(1.5rem, 3vw, 2.5rem)" }}>
        <p style={{ fontSize: "clamp(10px, 0.9vw, 12px)", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-body-mid)", marginBottom: "0.5rem" }}>
          Admin Panel
        </p>
        <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
          User Management
        </h1>
        <p style={{ color: "var(--color-body)", fontSize: "clamp(13px, 1.1vw, 15px)" }}>
          {total} total users on the platform
        </p>
      </div>

      {/* filters */}
      <div style={{
        display: "flex", gap: "0.75rem", flexWrap: "wrap",
        marginBottom: "clamp(1.25rem, 2vw, 2rem)",
        background: "var(--color-canvas-soft)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--rounded-md)",
        padding: "1rem 1.25rem",
        alignItems: "center",
      }}>
        <span style={{ fontSize: "clamp(12px, 1vw, 14px)", fontWeight: 500, color: "var(--color-body)", marginRight: "0.25rem" }}>Filter:</span>

        <select style={selectStyle} value={filters.role} onChange={(e) => handleFilterChange("role", e.target.value)}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r ? r.replace("jobSeeker", "Job Seeker").replace("recruiter", "Recruiter").replace("admin", "Admin") : "All roles"}</option>
          ))}
        </select>

        <select style={selectStyle} value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All statuses"}</option>
          ))}
        </select>

        {(filters.role || filters.status) && (
          <button
            onClick={() => { setFilters({ role: "", status: "" }); setPage(1); }}
            style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "clamp(12px, 1vw, 14px)", fontWeight: 600, cursor: "pointer" }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* content */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <div style={{ background: "var(--color-accent-subtle)", border: "1px solid var(--color-accent-border)", borderRadius: "var(--rounded-md)", padding: "1.5rem", color: "var(--color-body)", textAlign: "center" }}>
          {error}
          <button onClick={fetchUsers} style={{ display: "block", margin: "1rem auto 0", background: "var(--color-primary)", color: "var(--color-on-primary)", border: "none", padding: "0.5rem 1.25rem", borderRadius: "var(--rounded-md)", cursor: "pointer", fontWeight: 600 }}>
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div style={{ background: "var(--color-canvas-soft)", border: "1px solid var(--color-border)", borderRadius: "var(--rounded-md)", padding: "4rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👥</div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.5rem" }}>No users found</h2>
          <p style={{ color: "var(--color-body-mid)", fontSize: "14px" }}>Try adjusting your filters</p>
        </div>
      ) : (
        <>
          {/* table */}
          <div style={{ background: "var(--color-canvas)", border: "1px solid var(--color-border)", borderRadius: "var(--rounded-md)", overflow: "hidden" }}>
            {/* table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr auto auto auto",
              gap: "1rem",
              padding: "0.75rem 1.25rem",
              background: "var(--color-canvas-soft)",
              borderBottom: "1px solid var(--color-border)",
            }}>
              {["User", "Email", "Role", "Status", "Actions"].map((h) => (
                <span key={h} style={{ fontSize: "clamp(10px, 0.85vw, 12px)", fontWeight: 500, color: "var(--color-body-mid)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {h}
                </span>
              ))}
            </div>

            {/* rows */}
            {users.map((user, i) => {
              const isBusy = !!actionLoading[user._id];
              const roleStyle = ROLE_STYLES[user.role] || ROLE_STYLES.jobSeeker;
              const statusStyle = STATUS_STYLES[user.status] || STATUS_STYLES.pending;
              const nextStatuses = ["approved", "pending", "rejected"].filter((s) => s !== user.status);

              return (
                <div
                  key={user._id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.5fr auto auto auto",
                    gap: "1rem",
                    padding: "1rem 1.25rem",
                    borderBottom: i < users.length - 1 ? "1px solid var(--color-border)" : "none",
                    alignItems: "center",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-canvas-soft)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  {/* name + avatar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "var(--color-ink)", color: "var(--color-on-primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 700, flexShrink: 0,
                    }}>
                      {getInitials(user.name)}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--color-ink)", fontSize: "clamp(13px, 1.1vw, 15px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.name}
                    </span>
                  </div>

                  {/* email */}
                  <span style={{ color: "var(--color-body)", fontSize: "clamp(12px, 1vw, 14px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.email}
                  </span>

                  {/* role badge */}
                  <span style={badgeStyle(roleStyle)}>
                    {user.role === "jobSeeker" ? "Job Seeker" : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>

                  {/* status badge */}
                  <span style={badgeStyle(statusStyle)}>
                    {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                  </span>

                  {/* actions */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {user.role !== "admin" && nextStatuses.map((s) => (
                      <button
                        key={s}
                        disabled={isBusy}
                        onClick={() => setStatusModal({ id: user._id, status: s, name: user.name })}
                        style={actionBtnStyle("var(--color-ink)", isBusy)}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                    {user.role !== "admin" && (
                      <button
                        disabled={isBusy}
                        onClick={() => setDeleteModal({ id: user._id, name: user.name })}
                        style={actionBtnStyle("#dc2626", isBusy)}
                      >
                        {actionLoading[user._id] === "deleting" ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ ...actionBtnStyle("var(--color-ink)", page === 1), padding: "0.5rem 1rem" }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: "14px", color: "var(--color-body)" }}>
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                style={{ ...actionBtnStyle("var(--color-ink)", page === pages), padding: "0.5rem 1rem" }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) {
          .users-grid { grid-template-columns: 1fr 1fr auto !important; }
        }
      `}</style>
    </div>
  );
};

export default AdminUsersPage;