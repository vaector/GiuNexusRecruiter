// Simple footer with project name
const Footer = () => {
  const style = {
    background: "var(--color-surface)",
    borderTop: "1px solid var(--color-border)",
    padding: "2rem",
    textAlign: "center",
    color: "var(--color-text-muted)",
    fontSize: "0.85rem",
    marginTop: "auto",
  };

  return (
    <footer style={style}>
      <p>GIU Nexus — AI-Powered Career & Talent Platform</p>
    </footer>
  );
};

export default Footer;