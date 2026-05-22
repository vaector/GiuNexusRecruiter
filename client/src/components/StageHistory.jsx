import ApplicationStatusBadge from "./ApplicationStatusBadge";

const StageHistory = ({ history = [] }) => {
  if (!history.length) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
        No stage history yet.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", position: "relative" }}>
      {history.map((entry, index) => (
        <div key={index} style={{ display: "flex", gap: "1rem", alignItems: "flex-start", position: "relative", paddingBottom: "1.25rem" }}>
          <div style={{ position: "relative" }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "var(--accent)",
              flexShrink: 0,
              marginTop: "0.3rem",
              position: "relative",
              zIndex: 1,
            }} />
            {index < history.length - 1 && (
              <div style={{
                position: "absolute",
                left: 5,
                top: 16,
                bottom: 0,
                width: 2,
                background: "var(--border-glass)",
              }} />
            )}
          </div>
          <div>
            <ApplicationStatusBadge status={entry.status} />
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {new Date(entry.changedAt).toLocaleString()}
              {entry.changedBy?.name && ` · by ${entry.changedBy.name}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StageHistory;
