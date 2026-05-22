const ApplicationStatusBadge = ({ status }) => {
  const STATUS_STYLES = {
    pending: { border: "rgba(250, 204, 21, 0.35)", color: "#facc15", bg: "rgba(250, 204, 21, 0.08)", label: "Pending" },
    shortlisted: { border: "rgba(74, 222, 128, 0.35)", color: "#4ade80", bg: "rgba(74, 222, 128, 0.08)", label: "Shortlisted" },
    interview: { border: "rgba(96, 165, 250, 0.35)", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.08)", label: "Interview" },
    offer: { border: "rgba(168, 85, 247, 0.35)", color: "#a855f7", bg: "rgba(168, 85, 247, 0.08)", label: "Offer" },
    contract_sent: { border: "rgba(0, 229, 204, 0.35)", color: "#00e5cc", bg: "rgba(0, 229, 204, 0.08)", label: "Contract Sent" },
    accepted: { border: "rgba(34, 197, 94, 0.35)", color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)", label: "Accepted" },
    rejected: { border: "rgba(239, 68, 68, 0.35)", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", label: "Rejected" },
  };

  const styles = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <span style={{
      display: "inline-block",
      padding: "0.25rem 0.75rem",
      borderRadius: "999px",
      fontSize: "0.78rem",
      fontWeight: 600,
      background: styles.bg,
      color: styles.color,
      border: `1px solid ${styles.border}`,
      letterSpacing: "0.02em",
    }}>
      {styles.label}
    </span>
  );
};

export default ApplicationStatusBadge;
