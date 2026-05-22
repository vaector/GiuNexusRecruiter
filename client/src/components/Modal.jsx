// Reusable modal dialog
// Used for delete confirmations, apply form, withdraw application
// Props: isOpen, onClose, onConfirm, title, children
import { useEffect } from "react";

const Modal = ({ isOpen, onClose, onConfirm, title, children, confirmText = "Confirm", confirmDanger = false }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "1rem",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-surface-solid)",
          border: "1px solid var(--border-glow)",
          borderRadius: "var(--rounded-md)",
          padding: "2rem",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 22px 70px rgba(0,0,0,0.56), 0 0 1px rgba(0,229,204,0.3)",
          color: "var(--text-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: 0,
          lineHeight: 1.25,
        }}>
          {title}
        </h2>
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          {children}
        </div>
        {onConfirm && (
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "1.5rem", flexWrap: "wrap" }}>
            <button
              onClick={onClose}
              style={{
                minHeight: "42px",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--rounded-md)",
                border: "1px solid var(--border-glass)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                fontWeight: 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                minHeight: "42px",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--rounded-md)",
                border: confirmDanger ? "1px solid rgba(255,78,110,0.45)" : "1px solid var(--accent-mid)",
                background: confirmDanger ? "rgba(255,78,110,0.1)" : "var(--accent-dim)",
                color: confirmDanger ? "#ff8ca3" : "var(--accent)",
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
