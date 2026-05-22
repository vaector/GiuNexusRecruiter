import React, { useEffect } from "react";

const Modal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText = "CONFIRM",
  confirmDanger = false,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(3, 3, 3, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "modalFadeIn 0.2s ease-out",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--bg-surface-solid)",
          border: "1px solid var(--border-glow)",
          borderRadius: "var(--rounded-md)",
          width: "100%",
          maxWidth: "480px",
          boxShadow: `0 24px 48px rgba(0,0,0,0.8), 0 0 24px ${
            confirmDanger
              ? "rgba(239, 68, 68, 0.1)"
              : "rgba(0, 229, 204, 0.1)"
          }`,
          overflow: "hidden",
          animation: "modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-glass)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "14px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              color: "var(--text-primary)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              lineHeight: 1.25,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              fontSize: "1.2rem",
              cursor: "pointer",
              transition: "color 0.2s",
              padding: "0 0.5rem",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-primary)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-muted)")
            }
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "1.5rem",
            color: "var(--text-muted)",
            fontSize: "0.9rem",
            lineHeight: "1.6",
            fontFamily: "var(--font-body)",
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {onConfirm && (
          <div
            style={{
              padding: "1.25rem 1.5rem",
              background: "rgba(0, 0, 0, 0.2)",
              borderTop: "1px solid var(--border-glass)",
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={onClose}
              style={{
                minHeight: "42px",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--rounded-md)",
                border: "1px solid var(--border-glass)",
                background: "transparent",
                color: "var(--text-secondary)",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              CANCEL
            </button>

            <button
              onClick={onConfirm}
              style={{
                minHeight: "42px",
                padding: "0.6rem 1.25rem",
                borderRadius: "var(--rounded-md)",
                border: confirmDanger
                  ? "1px solid rgba(255,78,110,0.45)"
                  : "1px solid var(--accent-mid)",
                background: confirmDanger
                  ? "rgba(255,78,110,0.1)"
                  : "var(--accent-dim)",
                color: confirmDanger ? "#ff8ca3" : "var(--accent)",
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = confirmDanger
                  ? "0 0 12px rgba(255,78,110,0.25)"
                  : "0 0 12px rgba(0, 229, 204, 0.25)";
                e.currentTarget.style.filter = "brightness(1.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.filter = "none";
              }}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px) scale(0.95); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Modal;