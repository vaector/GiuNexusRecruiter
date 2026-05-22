// Coloured badge for application status
// Props: status
const STATUS_STYLES = {
  pending:       { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
  screening:     { bg: "#dbeafe", color: "#1e40af", label: "Screening" },
  interview:     { bg: "#ede9fe", color: "#5b21b6", label: "Interview" },
  offer:         { bg: "#d1fae5", color: "#065f46", label: "Offer" },
  contract_sent: { bg: "#ccfbf1", color: "#115e59", label: "Contract Sent" },
  accepted:      { bg: "#dcfce7", color: "#14532d", label: "Accepted" },
  shortlisted:   { bg: "#dcfce7", color: "#166534", label: "Shortlisted" },
  rejected:      { bg: "#fee2e2", color: "#991b1b", label: "Rejected" },
  withdrawn:     { bg: "#f1f5f9", color: "#475569", label: "Withdrawn" },
};

const FALLBACK = { bg: "#f1f5f9", color: "#475569", label: "Unknown" };

const ApplicationStatusBadge = ({ status }) => {
  const styles = STATUS_STYLES[status] || FALLBACK;

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