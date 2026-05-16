// Bell icon in Navbar showing unread count badge
// Clicking opens dropdown or navigates to NotificationsPage
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

const NotificationBell = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get("/notifications?limit=1");
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
        fontSize: "1.3rem",
        padding: "0.25rem",
        lineHeight: 1,
      }}
      title="Notifications"
    >
      🔔
      {unreadCount > 0 && (
        <span style={{
          position: "absolute",
          top: -2,
          right: -4,
          background: "#dc2626",
          color: "#fff",
          fontSize: "0.65rem",
          fontWeight: 700,
          borderRadius: "999px",
          padding: "0.1rem 0.35rem",
          minWidth: 16,
          textAlign: "center",
          lineHeight: 1.4,
        }}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;