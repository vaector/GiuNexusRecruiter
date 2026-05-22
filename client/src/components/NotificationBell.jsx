import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { notificationsAPI } from "../services/api";

const NotificationBell = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnread = async () => {
      try {
        const res = await notificationsAPI.getNotifications({ limit: 1 });
        setUnreadCount(res.data.unreadCount || 0);
      } catch (err) {
        console.error("Failed to fetch notification count:", err);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={() => navigate("/notifications")}
      style={{
        position: "relative",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0.3rem",
        lineHeight: 1,
        transition: "transform 0.15s ease, filter 0.2s ease",
        filter: unreadCount > 0 ? "drop-shadow(0 0 6px rgba(0, 229, 204, 0.7))" : "none",
        color: "rgba(234, 242, 255, 0.45)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.15)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      title="Notifications"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {unreadCount > 0 && (
        <span style={{
          position: "absolute",
          top: -2,
          right: -4,
          background: "#00e5cc",
          color: "#050a14",
          fontSize: "0.6rem",
          fontWeight: 700,
          borderRadius: "999px",
          padding: "0.1rem 0.3rem",
          minWidth: 14,
          textAlign: "center",
          lineHeight: 1.4,
          boxShadow: "0 0 8px rgba(0, 229, 204, 0.6)",
          animation: "bellPulse 2s ease-in-out infinite",
        }}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
      <style>{`
        @keyframes bellPulse {
          0%, 100% { box-shadow: 0 0 4px rgba(0, 229, 204, 0.4); }
          50% { box-shadow: 0 0 12px rgba(0, 229, 204, 0.8); }
        }
      `}</style>
    </button>
  );
};

export default NotificationBell;
