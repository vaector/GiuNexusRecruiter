// Toggle switches for email and inApp notification preferences
// Used on EditProfilePage or ProfilePage
const NotificationPreferences = ({ preferences = {}, onChange }) => {
  const toggleStyle = (active) => ({
    width: 44,
    height: 24,
    borderRadius: 999,
    background: active ? "var(--color-accent)" : "var(--color-border)",
    position: "relative",
    cursor: "pointer",
    transition: "background 0.2s ease",
    flexShrink: 0,
  });

  const knobStyle = (active) => ({
    position: "absolute",
    top: 3,
    left: active ? 23 : 3,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#fff",
    transition: "left 0.2s ease",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  });

  const handleToggle = (key) => {
    onChange({ ...preferences, [key]: !preferences[key] });
  };

  return (
    <div>
      <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-text)" }}>
        Notification Preferences
      </h3>

      {[
        { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
        { key: "inApp", label: "In-App Notifications", desc: "See alerts inside the platform" },
      ].map(({ key, label, desc }, i) => (
        <div key={key} style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 0",
          borderBottom: i === 0 ? "1px solid var(--color-border)" : "none",
        }}>
          <div>
            <p style={{ fontSize: "0.9rem", color: "var(--color-text)", fontWeight: 500 }}>{label}</p>
            <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.1rem" }}>{desc}</p>
          </div>
          <div style={toggleStyle(preferences[key])} onClick={() => handleToggle(key)}>
            <div style={knobStyle(preferences[key])} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationPreferences;