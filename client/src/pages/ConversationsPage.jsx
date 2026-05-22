import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { messagesAPI } from "../services/api";

const relativeTime = (dateStr) => {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ConversationsPage() {
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);
  const spotlightRef = useRef(null);

  const totalUnread = conversations.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0
  );
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!isAuthenticated) return;
    let mounted = true;
    const fetch = async () => {
      try {
        const res = isAdmin
          ? await messagesAPI.getAdminConversations()
          : await messagesAPI.getConversations();
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
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    document.body.style.background = "#030303";
    document.body.style.overflow = "";
    document.documentElement.style.scrollBehavior = "auto";
    return () => {
      document.body.style.background = "";
    };
  }, []);

  useEffect(() => {
    const panel = spotlightRef.current;
    if (!panel) return;
    const onPointerMove = (e) => {
      const r = panel.getBoundingClientRect();
      panel.style.setProperty(
        "--spotlight-x",
        `${Math.floor(e.clientX - r.left)}px`
      );
      panel.style.setProperty(
        "--spotlight-y",
        `${Math.floor(e.clientY - r.top)}px`
      );
    };
    panel.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => panel.removeEventListener("pointermove", onPointerMove);
  }, []);

  const handleConvClick = (conv) => {
    const jobId = conv.job._id;
    if (isAdmin) {
      navigate(
        `/conversations/${jobId}?sender=${conv.sender._id}&recipient=${conv.recipient._id}`
      );
      return;
    }
    const otherId = conv.otherUser._id;
    if (user?.role === "recruiter") {
      navigate(`/conversations/${jobId}?with=${otherId}`);
    } else {
      navigate(`/conversations/${jobId}`);
    }
  };

  return (
    <div
      ref={spotlightRef}
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#030303",
        color: "#eaf2ff",
        fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.045,
          pointerEvents: "none",
          zIndex: 9998,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)",
          pointerEvents: "none",
          zIndex: 9997,
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(0,229,204,0.03), transparent 60%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          position: "fixed",
          top: "1.5rem",
          right: "1.5rem",
          zIndex: 60,
          pointerEvents: "none",
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: "9px",
          letterSpacing: "0.14em",
          color: "rgba(140,230,240,0.38)",
          textTransform: "uppercase",
          textAlign: "right",
        }}
      >
        THREADS:{" "}
        <strong style={{ color: "#00e5cc" }}>{conversations.length}</strong>
        {totalUnread > 0 && (
          <>
            <br />
            UNREAD:{" "}
            <strong style={{ color: "#00e5cc" }}>{totalUnread}</strong>
          </>
        )}
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "860px",
          margin: "0 auto",
          padding: "100px 1.5rem 4rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.65rem",
                fontWeight: 500,
                letterSpacing: "0.18em",
                color: "rgba(0,229,204,0.6)",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              {isAdmin ? "ADMIN MESSAGING" : "MESSAGING"}
            </div>
            <h1
              style={{
                fontFamily: "'Syncopate','Inter',system-ui,sans-serif",
                fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                fontWeight: 600,
                color: "#eaf2ff",
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
                margin: 0,
              }}
            >
              {isAdmin ? "ALL CONVERSATIONS" : "CONVERSATIONS"}
            </h1>
          </div>
          {totalUnread > 0 && (
            <span
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.55rem",
                fontWeight: 700,
                background: "#00e5cc",
                color: "#050a14",
                padding: "0.2rem 0.55rem",
                borderRadius: "2px",
                boxShadow: "0 0 8px rgba(0,229,204,0.4)",
                letterSpacing: "0.06em",
                marginTop: "0.35rem",
              }}
            >
              {totalUnread} UNREAD
            </span>
          )}
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "4rem 0",
              gap: "1rem",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "2px solid rgba(0,229,204,0.2)",
                borderTopColor: "#00e5cc",
                borderRadius: "50%",
                animation: "convSpin 0.8s linear infinite",
              }}
            />
            <div
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.68rem",
                letterSpacing: "0.14em",
                color: "rgba(234,242,255,0.3)",
                textTransform: "uppercase",
              }}
            >
              LOADING...
            </div>
          </div>
        ) : conversations.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "4rem 0",
              gap: "1rem",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(234,242,255,0.15)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <div
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
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
              }}
            >
              {isAdmin
                ? "No platform conversation threads have been created yet."
                : "Start by applying to jobs or connecting with recruiters."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {conversations.map((conv) => {
              const isUnread = (conv.unreadCount || 0) > 0;
              const participant = isAdmin ? conv.sender : conv.otherUser;
              const secondaryParticipant = isAdmin ? conv.recipient : null;
              const key = isAdmin
                ? `${conv.job?._id}-${conv.sender?._id}-${conv.recipient?._id}`
                : `${conv.job?._id}-${conv.otherUser?._id}`;
              const isHovered = hoveredId === key;
              return (
                <button
                  key={key}
                  onClick={() => handleConvClick(conv)}
                  onMouseEnter={() => setHoveredId(key)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="conv-card"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.85rem",
                    padding: "0.85rem 1rem",
                    background: isHovered
                      ? "rgba(0,229,204,0.04)"
                      : isUnread
                      ? "rgba(0,229,204,0.02)"
                      : "transparent",
                    borderLeft: isUnread
                      ? "2px solid rgba(0,229,204,0.4)"
                      : "2px solid transparent",
                    cursor: "pointer",
                    transition:
                      "background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
                    borderRadius: "2px",
                    boxShadow: isHovered
                      ? "inset 2px 0 0 rgba(0,229,204,0.5), 0 0 12px rgba(0,229,204,0.04)"
                      : "none",
                    border: "none",
                    width: "100%",
                    textAlign: "left",
                    color: "inherit",
                    font: "inherit",
                  }}
                >
                  <div className="conv-avatar">
                    {(participant?.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.15rem",
                      }}
                    >
                      {!isUnread ? null : (
                        <span className="conv-unread-dot" />
                      )}
                      <span
                        style={{
                          fontFamily:
                            "'JetBrains Mono','Fira Code',monospace",
                          fontSize: "0.55rem",
                          fontWeight: 500,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "rgba(0,229,204,0.7)",
                        }}
                      >
                        {isAdmin
                          ? "THREAD"
                          : conv.otherUser?.role === "recruiter"
                          ? "RECRUITER"
                          : conv.otherUser?.role === "jobSeeker"
                          ? "APPLICANT"
                          : "USER"}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.92rem",
                        fontWeight: isUnread ? 500 : 400,
                        color: isUnread ? "#eaf2ff" : "rgba(234,242,255,0.6)",
                        lineHeight: 1.4,
                        marginBottom: "0.2rem",
                      }}
                    >
                      {isAdmin
                        ? `${participant?.name || "Unknown"} to ${
                            secondaryParticipant?.name || "Unknown"
                          }`
                        : participant?.name || "Unknown"}
                    </div>
                    <div
                      style={{
                        fontFamily:
                          "'JetBrains Mono','Fira Code',monospace",
                        fontSize: "0.68rem",
                        color: "#00e5cc",
                        opacity: 0.7,
                        marginBottom: "0.3rem",
                      }}
                    >
                      {conv.job?.title || "Job"}
                      {conv.job?.company ? ` · ${conv.job.company}` : ""}
                    </div>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: isUnread
                          ? "rgba(234,242,255,0.55)"
                          : "rgba(234,242,255,0.35)",
                        lineHeight: 1.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "500px",
                      }}
                    >
                      {conv.latestMessage?.body || "No messages yet"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginTop: "0.25rem",
                        fontFamily:
                          "'JetBrains Mono','Fira Code',monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.03em",
                        color: "rgba(234,242,255,0.3)",
                      }}
                    >
                      <span>{formatDate(conv.latestMessageAt)}</span>
                      {conv.latestMessageAt && (
                        <>
                          <span style={{ color: "rgba(0,229,204,0.35)" }}>
                            ·
                          </span>
                          <span
                            style={{ color: "rgba(0,229,204,0.5)" }}
                          >
                            {relativeTime(conv.latestMessageAt)}
                          </span>
                        </>
                      )}
                      {isUnread && (
                        <>
                          <span style={{ color: "rgba(0,229,204,0.35)" }}>
                            ·
                          </span>
                          <span style={{ color: "#00e5cc" }}>
                            {conv.unreadCount} NEW
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      flexShrink: 0,
                      marginTop: "4px",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={
                        isHovered
                          ? "#00e5cc"
                          : "rgba(234,242,255,0.2)"
                      }
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1rem",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.14em",
              color: "rgba(140,230,240,0.25)",
              textTransform: "uppercase",
            }}
          >
            END.CONVERSATIONS
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.14em",
              color: "rgba(140,230,240,0.25)",
              textTransform: "uppercase",
            }}
          >
            TOTAL: {conversations.length}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes convSpin {
          to { transform: rotate(360deg); }
        }
        .conv-avatar {
          width: 38px;
          height: 38px;
          border-radius: 2px;
          background: rgba(0,229,204,0.08);
          border: 1px solid rgba(0,229,204,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'JetBrains Mono','Fira Code',monospace;
          font-size: 0.7rem;
          font-weight: 600;
          color: #00e5cc;
          flex-shrink: 0;
        }
        .conv-unread-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00e5cc;
          box-shadow: 0 0 6px rgba(0,229,204,0.4);
          flex-shrink: 0;
          animation: bellPulse 2s ease-in-out infinite;
        }
        @keyframes bellPulse {
          0%, 100% { box-shadow: 0 0 3px rgba(0,229,204,0.3); }
          50% { box-shadow: 0 0 8px rgba(0,229,204,0.6); }
        }
      `}</style>
    </div>
  );
}
