// Lists pending recruiters
// GET /api/v1/users?role=recruiter&status=pending
// Approve/Reject buttons call PATCH /api/v1/users/:id/status
// Admin only
import { useState, useEffect } from "react";
import { usersAPI } from "../services/api";
import { Spinner } from "../components/Spinner";

const PendingRecruitersPage = () => {
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await usersAPI.getAllUsers({ role: "recruiter", status: "pending" });
      setRecruiters(res.data.users || []);
    } catch (err) {
      setError("Failed to load pending recruiters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

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
        status === "approved"
          ? "Recruiter approved successfully"
          : "Recruiter rejected",
        status === "approved" ? "success" : "error"
      );
    } catch (err) {
      showToast("Action failed. Please try again.", "error");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: null }));
    }
  };

  const pageStyle = {
    maxWidth: 900,
    margin: "0 auto",
    padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2rem)",
  };

  const cardStyle = {
    background: "var(--color-canvas-soft)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--rounded-md)",
    padding: "clamp(1rem, 2vw, 1.5rem)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
  };

  const avatarStyle = {
    width: "clamp(40px, 5vw, 52px)",
    height: "clamp(40px, 5vw, 52px)",
    borderRadius: "50%",
    background: "var(--color-ink)",
    color: "var(--color-on-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "clamp(1rem, 1.5vw, 1.3rem)",
    fontWeight: 700,
    flexShrink: 0,
  };

  const approveBtnStyle = (loading) => ({
    background: loading ? "var(--color-mute)" : "var(--color-primary)",
    color: "var(--color-on-primary)",
    border: "none",
    padding: "0.5rem 1.25rem",
    borderRadius: "var(--rounded-md)",
    fontSize: "clamp(12px, 1vw, 14px)",
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap",
  });

  const rejectBtnStyle = (loading) => ({
    background: "transparent",
    color: loading ? "var(--color-mute)" : "var(--color-ink)",
    border: `1px solid ${loading ? "var(--color-mute)" : "var(--color-ink)"}`,
    padding: "0.5rem 1.25rem",
    borderRadius: "var(--rounded-md)",
    fontSize: "clamp(12px, 1vw, 14px)",
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  });

  return (
    <div style={pageStyle}>

      {/* toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          background: toast.type === "success" ? "var(--color-ink)" : "#dc2626",
          color: "var(--color-on-primary)",
          padding: "0.85rem 1.5rem",
          borderRadius: "var(--rounded-md)",
          fontSize: "14px",
          fontWeight: 500,
          zIndex: 1000,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          animation: "fadeIn 0.2s ease",
        }}>
          {toast.message}
        </div>
      )}

      {/* header */}
      <div style={{ marginBottom: "clamp(1.5rem, 3vw, 2.5rem)" }}>
        <p style={{ fontSize: "clamp(10px, 0.9vw, 12px)", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", color: "var(--color-body-mid)", marginBottom: "0.5rem" }}>
          Admin Panel
        </p>
        <h1 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
          Pending Recruiters
        </h1>
        <p style={{ color: "var(--color-body)", fontSize: "clamp(13px, 1.1vw, 15px)" }}>
          Review and approve or reject recruiter account requests.
        </p>
      </div>

      {/* stats bar */}
      <div style={{
        background: "var(--color-canvas-soft)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--rounded-md)",
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "clamp(1.25rem, 2vw, 2rem)",
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: loading ? "var(--color-mute)" : recruiters.length > 0 ? "#f59e0b" : "#16a34a",
          flexShrink: 0,
        }} />
        <p style={{ fontSize: "clamp(13px, 1.1vw, 15px)", color: "var(--color-body)", fontWeight: 500 }}>
          {loading ? "Loading..." : recruiters.length > 0
            ? `${recruiters.length} recruiter${recruiters.length !== 1 ? "s" : ""} awaiting review`
            : "All caught up — no pending recruiters"}
        </p>
      </div>

      {/* content */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <div style={{
          background: "var(--color-accent-subtle)",
          border: "1px solid var(--color-accent-border)",
          borderRadius: "var(--rounded-md)",
          padding: "1.5rem",
          color: "var(--color-body)",
          textAlign: "center",
          fontSize: "14px",
        }}>
          {error}
          <button
            onClick={fetchPending}
            style={{ display: "block", margin: "1rem auto 0", background: "var(--color-primary)", color: "var(--color-on-primary)", border: "none", padding: "0.5rem 1.25rem", borderRadius: "var(--rounded-md)", cursor: "pointer", fontSize: "14px", fontWeight: 600 }}
          >
            Retry
          </button>
        </div>
      ) : recruiters.length === 0 ? (
        <div style={{
          background: "var(--color-canvas-soft)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--rounded-md)",
          padding: "clamp(2rem, 5vw, 4rem)",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
          <h2 style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.5rem" }}>
            No pending requests
          </h2>
          <p style={{ color: "var(--color-body-mid)", fontSize: "clamp(13px, 1.1vw, 15px)" }}>
            All recruiter accounts have been reviewed.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
          {recruiters.map((recruiter) => {
            const isApproving = actionLoading[recruiter._id] === "approved";
            const isRejecting = actionLoading[recruiter._id] === "rejected";
            const isBusy = isApproving || isRejecting;
            const initials = recruiter.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
            const joinedDate = new Date(recruiter.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

            return (
              <div key={recruiter._id} style={cardStyle}>
                {/* left — avatar + info */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                  <div style={avatarStyle}>{initials}</div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: "var(--color-ink)", fontSize: "clamp(14px, 1.2vw, 16px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {recruiter.name}
                    </p>
                    <p style={{ color: "var(--color-body-mid)", fontSize: "clamp(12px, 1vw, 13px)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {recruiter.email}
                    </p>
                    <p style={{ color: "var(--color-mute)", fontSize: "clamp(10px, 0.85vw, 12px)", marginTop: "0.2rem" }}>
                      Registered {joinedDate}
                    </p>
                  </div>
                </div>

                {/* right — actions */}
                <div style={{ display: "flex", gap: "0.6rem", flexShrink: 0 }}>
                  <button
                    onClick={() => handleAction(recruiter._id, "rejected")}
                    disabled={isBusy}
                    style={rejectBtnStyle(isBusy)}
                  >
                    {isRejecting ? "Rejecting..." : "Reject"}
                  </button>
                  <button
                    onClick={() => handleAction(recruiter._id, "approved")}
                    disabled={isBusy}
                    style={approveBtnStyle(isBusy)}
                  >
                    {isApproving ? "Approving..." : "Approve"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default PendingRecruitersPage;