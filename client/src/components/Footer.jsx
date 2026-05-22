import React from "react";
import { Link } from "react-router-dom";

const ACCENT = "#00e5cc";
const MONO = "'JetBrains Mono','Fira Code',monospace";
const SANS = "'Inter',sans-serif";

const COLUMNS = [
  {
    title: "PLATFORM",
    links: [
      { label: "Browse Jobs", to: "/jobs" },
      { label: "Register", to: "/register" },
      { label: "Login", to: "/login" },
      { label: "AI Matching", to: "/#ai-match" },
    ],
  },
  {
    title: "CANDIDATES",
    links: [
      { label: "Recommended Jobs", to: "/jobs/recommended" },
      { label: "Saved Jobs", to: "/jobs/saved" },
      { label: "My Applications", to: "/applications/my" },
      { label: "Referrals", to: "/referrals" },
    ],
  },
  {
    title: "RECRUITERS",
    links: [
      { label: "Dashboard", to: "/recruiter/dashboard" },
      { label: "Post a Job", to: "/recruiter/jobs/create" },
      { label: "Messages", to: "/conversations" },
      { label: "My Jobs", to: "/recruiter/jobs" },
    ],
  },
  {
    title: "ACCOUNT",
    links: [
      { label: "Profile", to: "/profile" },
      { label: "Change Password", to: "/profile/change-password" },
      { label: "Notifications", to: "/notifications" },
      { label: "Security", to: "/profile/totp-setup" },
    ],
  },
];

const LEGAL_LINKS = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Contact", to: "/contact" },
];

const linkStyle = {
  fontFamily: SANS,
  fontSize: 13,
  color: "rgba(255,255,255,0.45)",
  textDecoration: "none",
  transition: "color 0.25s ease",
  display: "block",
  padding: "4px 0",
};

export default function Footer() {
  return (
    <footer
      style={{
        position: "relative",
        background: "#030303",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.03,
          pointerEvents: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

<div
          className="footer-inner"
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "64px 6% 40px",
          }}
        >
          <div
            className="footer-columns"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr repeat(4, 1fr)",
              gap: "48px",
              marginBottom: "56px",
            }}
          >
          <div>
            <Link
              to="/"
              style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: 20,
                fontWeight: 800,
                color: ACCENT,
                textDecoration: "none",
                letterSpacing: "0.1em",
                textShadow: `0 0 20px ${ACCENT}25`,
              }}
            >
              NEXUS
            </Link>
            <p
              style={{
                fontFamily: SANS,
                fontSize: 13,
                color: "rgba(255,255,255,0.35)",
                lineHeight: 1.7,
                marginTop: "16px",
                maxWidth: "280px",
              }}
            >
              AI-powered career & talent matching platform. Connecting the right people with the right opportunities.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "16px",
                }}
              >
                {col.title}
              </span>
              {col.links.map((link) => (
                <Link
                  key={link.to + link.label}
                  to={link.to}
                  style={linkStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.color = ACCENT;
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.2)",
            }}
          >
            &copy; {new Date().getFullYear()} GIU NEXUS &mdash; ALL SYSTEMS NOMINAL
          </span>
          <div style={{ display: "flex", gap: "24px" }}>
            {LEGAL_LINKS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.25)",
                  textDecoration: "none",
                  transition: "color 0.25s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = ACCENT;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.25)";
                }}
              >
                {item.label.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          .footer-columns {
            grid-template-columns: 1fr 1fr !important;
            gap: 28px !important;
            margin-bottom: 32px !important;
          }
          .footer-columns > div:first-child {
            grid-column: 1 / -1 !important;
          }
          .footer-inner {
            padding: 40px 4% 28px !important;
          }
        }
        @media (max-width: 480px) {
          .footer-columns {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
        }
      `}</style>
    </footer>
  );
}
