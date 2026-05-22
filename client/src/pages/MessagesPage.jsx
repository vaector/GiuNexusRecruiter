import { useContext, useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { messagesAPI } from "../services/api";
import PageLoader from "../components/PageLoader";
import usePolling from "../utils/usePolling";

const MAX_CHARS = 2000;
const DROP_CHAR_LIMIT = 150;

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
  return `${Math.floor(days / 7)}w ago`;
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatDateHeader = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function DroppingText({ text, active }) {
  if (!text) return null;
  if (!active || text.length > DROP_CHAR_LIMIT) {
    return <span>{text}</span>;
  }
  return (
    <span>
      {Array.from(text).map((char, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: 0,
            animation: "charDrop 0.45s cubic-bezier(0.16,1,0.3,1) forwards",
            animationDelay: `${i * 22}ms`,
            whiteSpace: char === " " ? "pre" : undefined,
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export default function MessagesPage() {
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useContext(AuthContext);

  const withParam = searchParams.get("with");
  const senderParam = searchParams.get("sender");
  const recipientParam = searchParams.get("recipient");
  const contextName = searchParams.get("name");
  const contextRole = searchParams.get("role");
  const contextJobTitle = searchParams.get("job");

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState(null);
  const [jobInfo, setJobInfo] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);
  const inputRef = useRef(null);
  const initialIdsRef = useRef(null);
  const spotlightRef = useRef(null);
  const prevMessageCountRef = useRef(0);

  const buildParams = useCallback(
    (p) => {
      const params = { ...p };
      if (user?.role === "recruiter" && withParam) {
        params.with = withParam;
      }
      if (user?.role === "admin" && senderParam && recipientParam) {
        params.sender = senderParam;
        params.recipient = recipientParam;
      }
      return params;
    },
    [user, withParam, senderParam, recipientParam]
  );

  const fetchMessages = useCallback(
    async (p = 1) => {
      try {
        const params = buildParams({ page: p, limit: 30 });
        const res = await messagesAPI.getMessages(jobId, params);
        const data = res.data;
        const newMessages = data.messages || [];
        if (p === 1) {
          setMessages(newMessages);
          initialIdsRef.current = new Set(newMessages.map((m) => m._id));
        } else {
          setMessages((prev) => [...newMessages, ...prev]);
        }
        setHasMore(data.hasMore || false);
        setTotal(data.total || 0);
        setPage(p);
        if (data.messages?.length && p === 1) {
          const first = data.messages[0];
          setJobInfo(first.job);
          if (user?.role === "recruiter" || user?.role === "admin") {
            const other =
              first.sender?._id === user._id
                ? first.recipient
                : first.sender;
            setOtherUser(other);
          }
        }
        if (data.messages?.length && !otherUser && user) {
          const first = data.messages[0];
          const other =
            first.sender?._id === user._id ? first.recipient : first.sender;
          setOtherUser(other);
        }
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load messages");
      }
    },
    [jobId, buildParams, user, otherUser]
  );

  const pollForNew = useCallback(async () => {
    if (!jobId || !isAuthenticated) return;
    try {
      const params = buildParams({ page: 1, limit: 30 });
      const res = await messagesAPI.getMessages(jobId, params);
      const data = res.data;
      const newMessages = data.messages || [];
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m._id));
        const fresh = newMessages.filter((m) => !existingIds.has(m._id));
        if (fresh.length === 0) return prev;
        return [...prev, ...fresh];
      });
      if (data.messages?.length && !otherUser && user) {
        const first = data.messages[0];
        const other =
          first.sender?._id === user._id ? first.recipient : first.sender;
        setOtherUser(other);
      }
    } catch {}
  }, [jobId, isAuthenticated, buildParams, otherUser, user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    fetchMessages(1).finally(() => setLoading(false));
  }, [isAuthenticated, jobId]);

  useLayoutEffect(() => {
    if (!loading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [loading]);

  useEffect(() => {
    const currentCount = messages.length;
    if (
      currentCount > prevMessageCountRef.current &&
      prevMessageCountRef.current > 0
    ) {
      const el = messagesListRef.current;
      if (el) {
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 150;
        if (!nearBottom) {
          prevMessageCountRef.current = currentCount;
          return;
        }
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
    prevMessageCountRef.current = currentCount;
  }, [messages.length]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 350) + "px";
    }
  }, [inputText]);

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

  usePolling(pollForNew, 5000, isAuthenticated && !loading);

  const isNewMessage = useCallback(
    (msg) => {
      if (!initialIdsRef.current) return false;
      return !initialIdsRef.current.has(msg._id);
    },
    []
  );

  const handleSend = async () => {
    const body = inputText.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const payload = { body };
      if (user?.role === "recruiter" && withParam) {
        payload.recipientId = withParam;
      }
      const res = await messagesAPI.sendMessage(jobId, payload);
      const newMsg = res.data.message || res.data;
      setMessages((prev) => [...prev, newMsg]);
      if (initialIdsRef.current) {
        initialIdsRef.current.add(newMsg._id);
      }
      setInputText("");
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getGroupKey = (msg, idx) => {
    const prev = messages[idx - 1];
    if (!prev) return "first";
    const sameSender = msg.sender?._id === prev.sender?._id;
    const timeDiff =
      new Date(msg.createdAt) - new Date(prev.createdAt);
    if (!sameSender || timeDiff > 300000) return "first";
    return "continued";
  };

  const shouldShowDate = (msg, idx) => {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    const d1 = new Date(msg.createdAt).toDateString();
    const d2 = new Date(prev.createdAt).toDateString();
    return d1 !== d2;
  };

  const isOwn = (msg) => {
    return msg.sender?._id === user?._id;
  };

  const currentUserId = user?._id;
  const displayOtherUser = otherUser || (contextName || contextRole ? {
    name: contextName || (contextRole === "jobSeeker" ? "Applicant" : "Recruiter"),
    role: contextRole || (user?.role === "recruiter" ? "jobSeeker" : "recruiter"),
  } : null);
  const displayJobInfo = jobInfo || (contextJobTitle ? { title: contextJobTitle } : null);

  return (
    <div
      ref={spotlightRef}
      className="msg-page"
      style={{
        position: "relative",
        height: "100vh",
        background: "#030303",
        color: "#eaf2ff",
        fontFamily: "'Inter',system-ui,-apple-system,sans-serif",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        paddingTop: "84px",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.04,
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
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
          width: "100%",
          borderLeft: "1px solid rgba(0,229,204,0.08)",
          borderRight: "1px solid rgba(0,229,204,0.08)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <header
          className="msg-header"
        >
          <button
            onClick={() => navigate("/conversations")}
            className="msg-back-btn"
            aria-label="Back to conversations"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily:
                  "'JetBrains Mono','Fira Code',monospace",
                fontSize: "0.55rem",
                fontWeight: 500,
                letterSpacing: "0.14em",
                color: "rgba(0,229,204,0.6)",
                textTransform: "uppercase",
                marginBottom: "0.15rem",
              }}
            >
            {displayOtherUser?.role === "recruiter"
                ? "RECRUITER"
                : displayOtherUser?.role === "jobSeeker"
                ? "APPLICANT"
                : "THREAD"}
            </div>
            <div
              style={{
                fontSize: "0.92rem",
                fontWeight: 600,
                color: "#eaf2ff",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayOtherUser?.name || "Loading..."}
            </div>
            {displayJobInfo && (
              <div
                style={{
                  fontFamily:
                    "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "0.6rem",
                  color: "rgba(0,229,204,0.5)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginTop: "0.1rem",
                }}
              >
                {displayJobInfo.title}
                {displayJobInfo.company ? ` · ${displayJobInfo.company}` : ""}
              </div>
            )}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.12em",
              color: "rgba(140,230,240,0.38)",
              textTransform: "uppercase",
            }}
          >
            {total} MSGS
          </div>
        </header>

        <div
          ref={messagesListRef}
          className="msg-list"
        >
          {loading ? <PageLoader /> : messages.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
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
                  fontFamily:
                    "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                  color: "rgba(234,242,255,0.3)",
                  textTransform: "uppercase",
                }}
              >
                NO MESSAGES YET
              </div>
              <div
                style={{
                  fontSize: "0.82rem",
                  color: "rgba(234,242,255,0.2)",
                  textAlign: "center",
                  maxWidth: "320px",
                  lineHeight: "1.45",
                }}
              >
                Send a message to start a conversation with{" "}
                <span style={{ color: "#00e5cc", fontWeight: 500 }}>
                  {displayOtherUser?.name || "the user"}
                </span>{" "}
                about the position of{" "}
                <span style={{ color: "#00e5cc", fontWeight: 500 }}>
                  {displayJobInfo?.title || "this job"}
                </span>.
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const own = isOwn(msg);
                const group = getGroupKey(msg, idx);
                const showDate = shouldShowDate(msg, idx);
                const fresh = isNewMessage(msg);
                const isLast =
                  idx === messages.length - 1;
                const shouldDrop = fresh;
                const shouldCharDrop =
                  fresh && isLast && msg.body.length <= DROP_CHAR_LIMIT;

                return (
                  <div key={msg._id || idx}>
                    {showDate && (
                      <div className="msg-date-separator">
                        <span>
                          {formatDateHeader(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`msg-bubble-wrap ${
                        own ? "own" : "other"
                      } ${shouldDrop ? "dropping" : ""}`}
                      style={{
                        display: "flex",
                        justifyContent: own
                          ? "flex-end"
                          : "flex-start",
                        marginBottom:
                          group === "continued"
                            ? "2px"
                            : "10px",
                      }}
                    >
                      <div
                        className={`msg-bubble ${own ? "own" : "other"} ${shouldDrop ? "msg-drop-anim" : ""}`}
                        style={{
                          maxWidth: "70%",
                          position: "relative",
                        }}
                      >
                        {group === "first" && !own && (
                          <div
                            style={{
                              fontFamily:
                                "'JetBrains Mono','Fira Code',monospace",
                              fontSize: "0.55rem",
                              fontWeight: 500,
                              letterSpacing: "0.1em",
                              color: own
                                ? "rgba(234,242,255,0.45)"
                                : "rgba(0,229,204,0.6)",
                              marginBottom: "0.2rem",
                              textTransform: "uppercase",
                            }}
                          >
                            {msg.sender?.name || "Unknown"}
                          </div>
                        )}
                        <div
                          style={{
                            fontSize: "0.88rem",
                            lineHeight: 1.55,
                            color: own
                              ? "#eaf2ff"
                              : "rgba(234,242,255,0.85)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {shouldCharDrop ? (
                            <DroppingText
                              text={msg.body}
                              active={true}
                            />
                          ) : (
                            msg.body
                          )}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: own
                              ? "flex-end"
                              : "flex-start",
                            gap: "0.3rem",
                            marginTop: "0.2rem",
                            fontFamily:
                              "'JetBrains Mono','Fira Code',monospace",
                            fontSize: "0.55rem",
                            letterSpacing: "0.03em",
                            color: own
                              ? "rgba(5,10,20,0.45)"
                              : "rgba(234,242,255,0.25)",
                          }}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {own && msg.readAt && (
                            <svg
                              width="12"
                              height="8"
                              viewBox="0 0 16 10"
                              style={{
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "1.5",
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                              }}
                            >
                              <polyline points="1 5 5 9 15 1" />
                              <polyline points="5 5 8 8 14 2" />
                            </svg>
                          )}
                        </div>
                        {shouldDrop && (
                          <div className="msg-splash" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {error && (
          <div className="msg-error">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
            <button
              className="msg-error-dismiss"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="msg-input-area">
          <div className="msg-input-wrap">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              maxLength={MAX_CHARS}
              className="msg-input"
            />
            <button
              className="msg-send-btn"
              onClick={handleSend}
              disabled={!inputText.trim() || sending}
              aria-label="Send message"
            >
              {sending ? (
                <div className="msg-send-spinner" />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <div className="msg-input-footer">
            <span
              style={{
                color:
                  inputText.length > MAX_CHARS * 0.9
                    ? "#ff003c"
                    : "rgba(234,242,255,0.2)",
              }}
            >
              {inputText.length}/{MAX_CHARS}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes msgDrop {
          0% {
            opacity: 0;
            transform: translateY(60px);
          }
          55% {
            opacity: 1;
          }
          80% {
            transform: translateY(-6px);
          }
          92% {
            transform: translateY(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes charDrop {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.85);
          }
          50% {
            opacity: 1;
          }
          75% {
            transform: translateY(-2px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes rippleSplash {
          0% {
            box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(0,229,204,0.25);
          }
          40% {
            box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 16px 3px rgba(0,229,204,0.1);
          }
          100% {
            box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(0,229,204,0);
          }
        }
        @keyframes convSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes bellPulse {
          0%, 100% { box-shadow: 0 0 3px rgba(0,229,204,0.3); }
          50% { box-shadow: 0 0 8px rgba(0,229,204,0.6); }
        }

        .msg-page {
          position: relative;
        }

        .msg-header {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: rgba(8,12,24,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(0,229,204,0.12);
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .msg-header {
            padding: 0.75rem 1.5rem;
          }
        }

        .msg-back-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(234,242,255,0.45);
          cursor: pointer;
          padding: 0.35rem;
          border-radius: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.18s ease;
          flex-shrink: 0;
        }
        .msg-back-btn:hover {
          color: #eaf2ff;
          border-color: rgba(0,229,204,0.3);
          background: rgba(0,229,204,0.06);
        }
        .msg-back-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(0,229,204,0.5);
        }

        .msg-list {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 1rem 1rem 0.5rem;
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .msg-list {
            padding: 1.5rem 2rem 0.5rem;
          }
        }

        .msg-list::-webkit-scrollbar {
          width: 3px;
        }
        .msg-list::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.02);
        }
        .msg-list::-webkit-scrollbar-thumb {
          background: rgba(0,229,204,0.2);
          border-radius: 2px;
        }
        .msg-list::-webkit-scrollbar-thumb:hover {
          background: rgba(0,229,204,0.4);
        }

        .msg-date-separator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 1rem 0 0.75rem;
        }
        .msg-date-separator span {
          font-family: 'JetBrains Mono','Fira Code',monospace;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: rgba(140,230,240,0.3);
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          background: rgba(8,12,24,0.6);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 2px;
        }

        .msg-bubble-wrap.own {
          animation-name: msgSlideInRight;
        }
        .msg-bubble-wrap.other {
          animation-name: msgSlideInLeft;
        }
        .msg-bubble-wrap {
          animation-duration: 0.35s;
          animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
          animation-fill-mode: both;
        }
        @keyframes msgSlideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes msgSlideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .msg-bubble-wrap.dropping .msg-bubble.msg-drop-anim {
          animation: msgDrop 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .msg-bubble-wrap.dropping .msg-bubble.msg-drop-anim.msg-splash-anim {
          animation: msgDrop 0.55s cubic-bezier(0.16, 1, 0.3, 1) both,
                     rippleSplash 0.6s ease-out both;
          animation-delay: 0s, 0.15s;
        }

        .msg-splash {
          position: absolute;
          inset: -4px;
          border-radius: 6px;
          pointer-events: none;
          animation: rippleSplash 0.6s ease-out both;
          animation-delay: 0.15s;
        }

        .msg-bubble.own {
          background: #00e5cc;
          color: #050a14;
          border-radius: 4px 4px 0 4px;
          padding: 0.55rem 0.85rem;
        }
        .msg-bubble.other {
          background: rgba(6,12,24,0.92);
          border: 1px solid rgba(0,229,204,0.12);
          border-radius: 4px 4px 4px 0;
          padding: 0.55rem 0.85rem;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .msg-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid rgba(0,229,204,0.2);
          border-top-color: #00e5cc;
          border-radius: 50%;
          animation: convSpin 0.8s linear infinite;
        }

        .msg-input-area {
          position: relative;
          z-index: 10;
          padding: 0.5rem 0.75rem 0.5rem;
          background: rgba(8,12,24,0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid rgba(0,229,204,0.12);
          flex-shrink: 0;
        }
        @media (min-width: 768px) {
          .msg-input-area {
            padding: 0.75rem 1.5rem 0.5rem;
          }
        }

        .msg-input-wrap {
          display: flex;
          align-items: flex-end;
          gap: 0.5rem;
          background: rgba(8,12,24,0.6);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          padding: 0.35rem 0.55rem;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .msg-input-wrap:focus-within {
          border-color: rgba(0,229,204,0.3);
          box-shadow: 0 0 8px rgba(0,229,204,0.08);
        }

        .msg-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #eaf2ff;
          font-family: 'Inter',system-ui,sans-serif;
          font-size: 0.88rem;
          line-height: 1.5;
          resize: none;
          max-height: 350px;
          min-height: 22px;
          padding: 0.15rem 0;
        }
        .msg-input::placeholder {
          color: rgba(234,242,255,0.25);
        }

        .msg-send-btn {
          background: #00e5cc;
          border: none;
          color: #050a14;
          width: 32px;
          height: 32px;
          border-radius: 3px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.18s ease;
        }
        .msg-send-btn:hover:not(:disabled) {
          background: #1af5da;
          transform: scale(1.05);
          box-shadow: 0 0 12px rgba(0,229,204,0.3);
        }
        .msg-send-btn:disabled {
          background: rgba(0,229,204,0.15);
          color: rgba(5,10,20,0.35);
          cursor: not-allowed;
        }
        .msg-send-btn:focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(0,229,204,0.5);
        }

        .msg-send-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(5,10,20,0.2);
          border-top-color: #050a14;
          border-radius: 50%;
          animation: convSpin 0.6s linear infinite;
        }

        .msg-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255,0,60,0.1);
          border: 1px solid rgba(255,0,60,0.3);
          border-radius: 2px;
          color: #ff003c;
          font-size: 0.78rem;
          font-family: 'Inter',system-ui,sans-serif;
          margin: 0.5rem 0.75rem;
        }
        @media (min-width: 768px) {
          .msg-error {
            margin: 0.5rem 1.5rem;
          }
        }
        .msg-error-dismiss {
          background: none;
          border: 1px solid rgba(255,0,60,0.3);
          color: #ff003c;
          font-size: 0.68rem;
          cursor: pointer;
          padding: 0.15rem 0.5rem;
          border-radius: 2px;
          margin-left: auto;
          font-family: 'JetBrains Mono','Fira Code',monospace;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .msg-error-dismiss:hover {
          background: rgba(255,0,60,0.1);
        }

        .msg-input-footer {
          display: flex;
          justify-content: flex-end;
          padding: 0.15rem 0.5rem 0;
          font-family: 'JetBrains Mono','Fira Code',monospace;
          font-size: 0.55rem;
          letter-spacing: 0.03em;
          color: rgba(234,242,255,0.2);
        }

        @media (max-width: 767px) {
          .msg-input-wrap {
            padding: 0.25rem 0.45rem;
          }
          .msg-input {
            font-size: 0.82rem;
          }
        }
      `}</style>
    </div>
  );
}
