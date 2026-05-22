import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { messagesAPI } from "../services/api";
import relativeTime from "../utils/relativeTime";

const truncate = (str, len) => {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
};

export default function ChatWidget() {
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const widgetRef = useRef(null);

  const isOnMessagesPage = location.pathname.startsWith("/conversations");

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  );

  useEffect(() => {
    if (!isAuthenticated || isOnMessagesPage) return;
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await messagesAPI.getConversations();
        if (mounted) {
          setConversations(res.data.conversations || []);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isOnMessagesPage]);

  useEffect(() => {
    if (!isAuthenticated || isOnMessagesPage) return;
    const id = setInterval(async () => {
      try {
        const res = await messagesAPI.getConversations();
        setConversations(res.data.conversations || []);
      } catch {}
    }, 15000);
    return () => clearInterval(id);
  }, [isAuthenticated, isOnMessagesPage]);

  useEffect(() => {
    const handler = (e) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated || user?.role === "admin" || isOnMessagesPage) return null;

  const handleConvClick = (conv) => {
    const jobId = conv.job._id;
    const otherId = conv.otherUser._id;
    if (user?.role === "recruiter") {
      navigate(`/conversations/${jobId}?with=${otherId}`);
    } else {
      navigate(`/conversations/${jobId}`);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={widgetRef}
      className="chat-widget-root"
    >
      <button
        className={`chat-widget-btn ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close messages" : "Open messages"}
      >
        {isOpen ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {totalUnread > 0 && !isOpen && (
          <span className="chat-widget-badge">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      <div className={`chat-widget-panel ${isOpen ? "open" : ""}`}>
        <div className="chat-widget-header">
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "0.65rem",
              fontWeight: 500,
              letterSpacing: "0.18em",
              color: "#00e5cc",
              textTransform: "uppercase",
            }}
          >
            MESSAGES
          </span>
          {totalUnread > 0 && (
            <span
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.55rem",
                fontWeight: 700,
                background: "#00e5cc",
                color: "#050a14",
                padding: "0.1rem 0.35rem",
                borderRadius: "2px",
                boxShadow: "0 0 6px rgba(0,229,204,0.4)",
                letterSpacing: "0.06em",
              }}
            >
              {totalUnread} NEW
            </span>
          )}
        </div>

        <div className="chat-widget-list">
          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "2rem 0",
              }}
            >
              <div className="chat-widget-spinner" />
            </div>
          ) : conversations.length === 0 ? (
            <div
              style={{
                padding: "2rem 1rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily:
                    "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                  color: "rgba(234,242,255,0.3)",
                  textTransform: "uppercase",
                }}
              >
                NO CONVERSATIONS
              </div>
              <div
                style={{
                  fontFamily: "'Inter',system-ui,sans-serif",
                  fontSize: "0.82rem",
                  color: "rgba(234,242,255,0.2)",
                  marginTop: "0.5rem",
                }}
              >
                Messages will appear here
              </div>
            </div>
          ) : (
            conversations.slice(0, 5).map((conv) => {
              const isUnread = (conv.unreadCount || 0) > 0;
              return (
                <button
                  key={`${conv.job._id}-${conv.otherUser._id}`}
                  className={`chat-widget-conv ${isUnread ? "unread" : ""}`}
                  onClick={() => handleConvClick(conv)}
                >
                  <div className="chat-widget-avatar">
                    {(conv.otherUser?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-widget-conv-body">
                    <div className="chat-widget-conv-top">
                      <span
                        className="chat-widget-conv-name"
                        style={{
                          fontWeight: isUnread ? 600 : 400,
                          color: isUnread
                            ? "#eaf2ff"
                            : "rgba(234,242,255,0.6)",
                        }}
                      >
                        {conv.otherUser?.name || "Unknown"}
                      </span>
                      <span className="chat-widget-conv-time">
                        {relativeTime(conv.latestMessageAt)}
                      </span>
                    </div>
                    <div className="chat-widget-conv-job">
                      {conv.job?.title
                        ? truncate(conv.job.title, 24)
                        : "Job"}
                      {conv.job?.company
                        ? ` · ${truncate(conv.job.company, 16)}`
                        : ""}
                    </div>
                    <div className="chat-widget-conv-preview">
                      {truncate(conv.latestMessage?.body, 38) ||
                        "No messages yet"}
                    </div>
                  </div>
                  {isUnread && (
                    <span className="chat-widget-unread-dot" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {conversations.length > 0 && (
          <Link to="/conversations" className="chat-widget-view-all">
            VIEW ALL
          </Link>
        )}
      </div>

      <style>{`
        .chat-widget-root {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 100;
        }
        @media (max-width: 768px) {
          .chat-widget-root {
            bottom: 16px;
            right: 12px;
          }
        }
        .chat-widget-btn {
          width: 52px;
          height: 52px;
          border-radius: 4px;
          background: #00e5cc;
          border: none;
          color: #050a14;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,229,204,0.3), 0 0 40px rgba(0,229,204,0.1);
          transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
          position: relative;
          z-index: 2;
        }
        .chat-widget-btn.open {
          background: rgba(6,12,24,0.95);
          color: #00e5cc;
          border: 1px solid rgba(0,229,204,0.3);
          box-shadow: 0 0 12px rgba(0,229,204,0.15);
        }
        .chat-widget-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 24px rgba(0,229,204,0.4), 0 0 50px rgba(0,229,204,0.15);
        }
        .chat-widget-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(0,229,204,0.5), 0 4px 20px rgba(0,229,204,0.3);
        }
        .chat-widget-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ff003c;
          color: #fff;
          font-size: 0.55rem;
          font-weight: 700;
          border-radius: 2px;
          padding: 0.1rem 0.3rem;
          min-width: 14px;
          text-align: center;
          line-height: 1.4;
          box-shadow: 0 0 6px rgba(255,0,60,0.4);
          font-family: 'JetBrains Mono','Fira Code',monospace;
          animation: bellPulse 2s ease-in-out infinite;
        }
        .chat-widget-panel {
          position: absolute;
          bottom: 62px;
          right: 0;
          width: 340px;
          background: rgba(6,12,24,0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(0,229,204,0.12);
          border-radius: 4px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(0,229,204,0.2);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateY(8px) scale(0.97);
          transition: opacity 0.18s cubic-bezier(0.16,1,0.3,1),
                      transform 0.18s cubic-bezier(0.16,1,0.3,1),
                      visibility 0.18s ease;
          z-index: 3;
          overflow: hidden;
        }
        .chat-widget-panel.open {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateY(0) scale(1);
        }
        @media (max-width: 768px) {
          .chat-widget-panel {
            width: calc(100vw - 24px);
            right: -6px;
          }
        }
        .chat-widget-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .chat-widget-list {
          max-height: 340px;
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        .chat-widget-list::-webkit-scrollbar {
          width: 3px;
        }
        .chat-widget-list::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .chat-widget-list::-webkit-scrollbar-thumb {
          background: rgba(0,229,204,0.2);
          border-radius: 2px;
        }
        .chat-widget-list::-webkit-scrollbar-thumb:hover {
          background: rgba(0,229,204,0.4);
        }
        .chat-widget-conv {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          padding: 0.7rem 1rem;
          width: 100%;
          background: transparent;
          border: none;
          border-left: 2px solid transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s ease, border-color 0.15s ease;
          color: inherit;
          font: inherit;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .chat-widget-conv.unread {
          border-left-color: rgba(0,229,204,0.4);
        }
        .chat-widget-conv:hover {
          background: rgba(0,229,204,0.04);
        }
        .chat-widget-conv.unread:hover {
          background: rgba(0,229,204,0.06);
          box-shadow: inset 2px 0 0 rgba(0,229,204,0.5);
        }
        .chat-widget-avatar {
          width: 32px;
          height: 32px;
          border-radius: 2px;
          background: rgba(0,229,204,0.08);
          border: 1px solid rgba(0,229,204,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono','Fira Code',monospace;
          font-size: 0.6rem;
          font-weight: 600;
          color: #00e5cc;
          flex-shrink: 0;
        }
        .chat-widget-conv-body {
          flex: 1;
          min-width: 0;
        }
        .chat-widget-conv-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.15rem;
        }
        .chat-widget-conv-name {
          font-size: 0.78rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .chat-widget-conv-time {
          font-family: 'JetBrains Mono','Fira Code',monospace;
          font-size: 0.55rem;
          color: rgba(234,242,255,0.3);
          flex-shrink: 0;
          margin-left: 0.5rem;
        }
        .chat-widget-conv-job {
          font-family: 'JetBrains Mono','Fira Code',monospace;
          font-size: 0.55rem;
          letter-spacing: 0.06em;
          color: rgba(0,229,204,0.5);
          margin-bottom: 0.15rem;
          text-transform: uppercase;
        }
        .chat-widget-conv-preview {
          font-size: 0.72rem;
          color: rgba(234,242,255,0.35);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .chat-widget-unread-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00e5cc;
          box-shadow: 0 0 6px rgba(0,229,204,0.4);
          flex-shrink: 0;
          margin-top: 6px;
          animation: bellPulse 2s ease-in-out infinite;
        }
        .chat-widget-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0,229,204,0.2);
          border-top-color: #00e5cc;
          border-radius: 50%;
          animation: widgetSpin 0.8s linear infinite;
        }
        .chat-widget-view-all {
          display: block;
          padding: 0.55rem;
          text-align: center;
          color: #00e5cc;
          text-decoration: none;
          font-family: 'JetBrains Mono','Fira Code',monospace;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border-top: 1px solid rgba(255,255,255,0.06);
          transition: background 0.15s ease;
        }
        .chat-widget-view-all:hover {
          background: rgba(0,229,204,0.06);
        }
      `}</style>
    </div>
  );
}
