// Small rounded chip for a single skill string
// Props: skill
const SkillChip = ({ skill, onRemove }) => {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      padding: "0.3rem 0.75rem",
      borderRadius: "999px",
      fontSize: "0.8rem",
      fontWeight: 500,
      background: "var(--color-accent-subtle)",
      color: "var(--color-accent)",
      border: "1px solid var(--color-accent-border)",
    }}>
      {skill}
      {onRemove && (
        <button
          onClick={() => onRemove(skill)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-accent)",
            padding: 0,
            lineHeight: 1,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default SkillChip;