export const Spinner = ({ size = 32, color = "var(--accent)" }) => (
  <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
    <div style={{
      width: size,
      height: size,
      border: `3px solid var(--border-glass)`,
      borderTop: `3px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export const Skeleton = ({ width = "100%", height = 20, borderRadius = 6 }) => (
  <div style={{
    width,
    height,
    borderRadius,
    background: "linear-gradient(90deg, var(--border-glass) 25%, var(--bg-surface) 50%, var(--border-glass) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.4s infinite",
  }}>
    <style>{`@keyframes shimmer { to { background-position: -200% 0; } }`}</style>
  </div>
);

export const SkeletonCard = () => (
  <div style={{
    background: "var(--bg-surface-solid)",
    border: "1px solid var(--border-glass)",
    borderRadius: "12px",
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  }}>
    <Skeleton height={20} width="60%" />
    <Skeleton height={14} width="40%" />
    <Skeleton height={14} width="80%" />
    <Skeleton height={14} width="30%" />
  </div>
);

export default Spinner;
