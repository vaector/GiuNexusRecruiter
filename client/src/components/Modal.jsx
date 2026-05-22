import React, { useEffect } from "react";

const Modal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  confirmText = "CONFIRM", 
  confirmDanger = false, 
  children 
}) => {
  
  // Prevent background scrolling when modal is open
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

  // Determine colors based on whether it's a danger action (Delete) or standard (Approve)
  const themeColor = confirmDanger ? "#ef4444" : "#00e5cc"; // Red vs Teal
  const themeBg = confirmDanger ? "rgba(239, 68, 68, 0.05)" : "rgba(0, 229, 204, 0.05)";
  const themeBorder = confirmDanger ? "rgba(239, 68, 68, 0.4)" : "rgba(0, 229, 204, 0.4)";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(3, 3, 3, 0.85)", 
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      animation: "modalFadeIn 0.2s ease-out"
    }}>
      
      {/* Modal Glass Panel */}
      <div style={{
        background: "rgba(6, 12, 24, 0.95)",
        border: `1px solid rgba(255, 255, 255, 0.08)`,
        borderRadius: "4px",
        width: "90%", 
        maxWidth: "440px",
        boxShadow: `0 24px 48px rgba(0,0,0,0.8), 0 0 24px ${confirmDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 229, 204, 0.1)'}`,
        overflow: "hidden",
        animation: "modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        
        {/* Header */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h2 style={{
            margin: 0, fontSize: "14px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontWeight: 600, color: themeColor, textTransform: "uppercase", letterSpacing: "1px"
          }}>
            {title}
          </h2>
          <button 
            onClick={onClose} 
            style={{
              background: "transparent", border: "none", color: "rgba(234, 242, 255, 0.45)",
              fontSize: "1.2rem", cursor: "pointer", transition: "color 0.2s", padding: "0 0.5rem"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#eaf2ff"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(234, 242, 255, 0.45)"}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ 
          padding: "1.5rem", 
          color: "rgba(234, 242, 255, 0.6)", 
          fontSize: "14px", 
          lineHeight: "1.6",
          fontFamily: "Inter, system-ui, sans-serif"
        }}>
          {children}
        </div>

        {/* Footer / Actions */}
        <div style={{
          padding: "1.25rem 1.5rem",
          background: "rgba(0, 0, 0, 0.2)",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex", justifyContent: "flex-end", gap: "0.75rem"
        }}>
          <button 
            onClick={onClose} 
            style={{
              padding: "0.5rem 1.25rem", borderRadius: "2px",
              border: "1px solid rgba(255, 255, 255, 0.2)", background: "transparent",
              color: "#eaf2ff", fontSize: "11px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontWeight: 600, cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.5px"
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            CANCEL
          </button>
          
          <button 
            onClick={onConfirm} 
            style={{
              padding: "0.5rem 1.25rem", borderRadius: "2px",
              border: `1px solid ${themeBorder}`, background: themeBg,
              color: themeColor, fontSize: "11px", fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontWeight: 600, cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.5px"
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.boxShadow = `0 0 12px ${confirmDanger ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 229, 204, 0.25)'}`; 
              e.currentTarget.style.background = confirmDanger ? "rgba(239, 68, 68, 0.15)" : "rgba(0, 229, 204, 0.15)";
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = themeBg;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalFadeIn { 
          from { opacity: 0; backdrop-filter: blur(0px); } 
          to { opacity: 1; backdrop-filter: blur(8px); } 
        }
        @keyframes modalSlideUp { 
          from { transform: translateY(20px) scale(0.95); opacity: 0; } 
          to { transform: translateY(0) scale(1); opacity: 1; } 
        }
      `}</style>
    </div>
  );
};

export default Modal;