// Coloured badge for application status
// pending: yellow, shortlisted: green, rejected: red
// Props: status
const STATUS_STYLES = {
  pending: { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
  shortlisted: { bg: "#dcfce7", color: "#166534", label: "Shortlisted" },
  rejected: { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
};

const ApplicationStatusBadge = ({ status }) => {
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
      letterSpacing: "0.02em",
    }}>
      {styles.label}
    </span>
  );
};

export default ApplicationStatusBadge;