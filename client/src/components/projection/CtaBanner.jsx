import React from "react";
import { Link } from "react-router-dom";

const ACCENT = "#00e5cc";

export default function CtaBanner() {
  return (
    <section
      style={{
        position: "relative",
        background: "#030303",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "100px 6%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${ACCENT}08 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
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
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
          maxWidth: "800px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
            fontWeight: 800,
            color: ACCENT,
            letterSpacing: "0.15em",
            textShadow: `0 0 40px ${ACCENT}30`,
          }}
        >
          NEXUS
        </span>

        <h2
          style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: "clamp(1.4rem, 2.8vw, 2.6rem)",
            fontWeight: 700,
            color: "#fff",
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
          }}
        >
          READY TO GET MATCHED?
        </h2>

        <div style={{ position: "relative", display: "inline-block" }}>
          <span
            style={{
              position: "absolute",
              top: -2,
              left: -2,
              width: 14,
              height: 14,
              borderTop: `2px solid ${ACCENT}`,
              borderLeft: `2px solid ${ACCENT}`,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: 14,
              height: 14,
              borderTop: `2px solid ${ACCENT}`,
              borderRight: `2px solid ${ACCENT}`,
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: -2,
              left: -2,
              width: 14,
              height: 14,
              borderBottom: `2px solid ${ACCENT}`,
              borderLeft: `2px solid ${ACCENT}`,
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 14,
              height: 14,
              borderBottom: `2px solid ${ACCENT}`,
              borderRight: `2px solid ${ACCENT}`,
            }}
          />
          <Link
            to="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              padding: "22px 56px",
              background: "transparent",
              color: ACCENT,
              fontFamily: "'Syncopate', sans-serif",
              fontSize: "clamp(14px, 1.2vw, 18px)",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textDecoration: "none",
              border: `2px solid ${ACCENT}60`,
              transition: "all 0.35s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = `${ACCENT}12`;
              e.currentTarget.style.borderColor = ACCENT;
              e.currentTarget.style.boxShadow = `0 0 30px ${ACCENT}40, inset 0 0 30px ${ACCENT}08`;
              e.currentTarget.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = `${ACCENT}60`;
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.color = ACCENT;
            }}
          >
            REGISTER NOW
            <span style={{ fontSize: "1.2em" }}>&#8594;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
