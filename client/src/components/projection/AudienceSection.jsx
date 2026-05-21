import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import RotatingText from "./RotatingText";

const ACCENT = "#00e5cc";

function HudCorners({ color = ACCENT, active = true, size = 12 }) {
  const border = active ? `2px solid ${color}` : "1px solid rgba(255,255,255,0.12)";
  const base = { position: "absolute", width: size, height: size, transition: "border-color 0.45s ease" };
  return (
    <>
      <span style={{ ...base, top: -2, left: -2, borderTop: border, borderLeft: border }} />
      <span style={{ ...base, top: -2, right: -2, borderTop: border, borderRight: border }} />
      <span style={{ ...base, bottom: -2, left: -2, borderBottom: border, borderLeft: border }} />
      <span style={{ ...base, bottom: -2, right: -2, borderBottom: border, borderRight: border }} />
    </>
  );
}

function CornerBrackets() {
  const ref = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handler = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  useEffect(() => {
    let raf;
    const tick = () => {
      const s = smoothRef.current;
      const m = mouseRef.current;
      s.x += (m.x - s.x) * 0.03;
      s.y += (m.y - s.y) * 0.03;
      if (ref.current) {
        ref.current.style.transform = `translate(${s.x * 10}px,${-s.y * 8}px)`;
        const t = performance.now() * 0.001;
        const rawBlend = 0.5 - 0.5 * Math.cos(t * 0.346);
        const tBias = Math.pow(rawBlend, 5);
        const sph = 0.6;
        const r = (0.05 + 0.06 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 0.8))) * (1 - tBias) + (0.46 + 0.07 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 2.4))) * tBias;
        const g = (0.69 + 0.14 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 0.0))) * (1 - tBias) + (0.34 + 0.05 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 1.2))) * tBias;
        const b = (0.64 + 0.12 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 2.0))) * (1 - tBias) + (0.44 + 0.05 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 3.6))) * tBias;
        ref.current.style.borderColor = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},0.6)`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "5%",
        left: "5%",
        right: "5%",
        bottom: "5%",
        pointerEvents: "none",
        zIndex: 3,
        border: "2px solid rgba(100,200,220,0.6)",
        borderRadius: "2px",
        maskImage: "linear-gradient(#fff,#fff) top left,linear-gradient(#fff,#fff) top right,linear-gradient(#fff,#fff) bottom left,linear-gradient(#fff,#fff) bottom right",
        maskSize: "80px 80px",
        maskRepeat: "no-repeat",
        maskPosition: "top left,top right,bottom left,bottom right",
        WebkitMaskImage: "linear-gradient(#fff,#fff),linear-gradient(#fff,#fff),linear-gradient(#fff,#fff),linear-gradient(#fff,#fff)",
        WebkitMaskSize: "80px 80px",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "top left,top right,bottom left,bottom right",
      }}
    />
  );
}

const FEATURES = [
  { icon: "≡", label: "AI PROFILE EXTRACTION", desc: "AI-driven skill extraction from CVs — map your potential automatically" },
  { icon: "⟡", label: "PRECISION MATCHING", desc: "Automated matching with precise roles using thousands of signals" },
  { icon: "◉", label: "REAL-TIME TRACKING", desc: "Track application status in real-time with live updates" },
  { icon: "↗", label: "DIRECT CONNECTIONS", desc: "Direct connection between candidates and hiring managers" },
  { icon: "⬡", label: "SMART FILTERING", desc: "High-precision AI candidate filtering and automated ranking" },
  { icon: "✓", label: "STREAMLINED HIRING", desc: "From match to offer letter — the right connection at the right moment" },
];

export default function AudienceSection() {
  return (
    <section style={{
      minHeight: "100vh",
      position: "relative",
      background: "#030303",
      zIndex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      cursor: "crosshair",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.2) 50%)",
        backgroundSize: "100% 4px",
        pointerEvents: "none",
        zIndex: 5,
      }} />

      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)",
        pointerEvents: "none",
        zIndex: 4,
      }} />

      <div style={{
        position: "absolute",
        inset: 0,
        opacity: 0.04,
        pointerEvents: "none",
        zIndex: 6,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }} />

      <CornerBrackets />

      <div style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: "1100px",
        padding: "80px 6%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <div style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "48px",
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.4)",
            textTransform: "uppercase",
          }}>
            SYS.READY
          </span>
          <div style={{
            flex: 1,
            height: 1,
            background: "rgba(255,255,255,0.15)",
            position: "relative",
          }}>
            <span style={{
              position: "absolute",
              right: 0,
              top: -2,
              width: 5,
              height: 5,
              background: ACCENT,
            }} />
          </div>
          {/* <span style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "rgba(0,229,204,0.7)",
            textTransform: "uppercase",
          }}>
            SECTOR_06
          </span> */}
        </div>

        <span style={{
          fontFamily: "'JetBrains Mono','Fira Code',monospace",
          fontSize: 14,
          letterSpacing: 2,
          color: ACCENT,
          marginBottom: 16,
          display: "block",
          textAlign: "center",
        }}>
          // ACCESS_PROTOCOL: UNIVERSAL
        </span>

        <h2 style={{
          fontFamily: "'Syncopate', sans-serif",
          color: "#fff",
          fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)",
          fontWeight: 700,
          lineHeight: 1.3,
          margin: "0 0 48px 0",
          textAlign: "center",
          letterSpacing: "-0.02em",
        }}>
          ONE PLATFORM. EVERY ROLE.
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "20px",
          width: "100%",
          marginBottom: "64px",
        }}>
          {FEATURES.map((feat, i) => (
            <div key={i} style={{
              position: "relative",
              padding: "24px 28px",
              background: "rgba(255,255,255,0.012)",
              border: "1px solid rgba(255,255,255,0.065)",
              transition: "border-color 0.45s ease, background 0.45s ease, box-shadow 0.45s ease",
              cursor: "crosshair",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "rgba(0,229,204,0.25)";
              e.currentTarget.style.background = "rgba(0,229,204,0.03)";
              e.currentTarget.style.boxShadow = "0 0 24px rgba(0,229,204,0.11), inset 0 0 18px rgba(0,229,204,0.02)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.065)";
              e.currentTarget.style.background = "rgba(255,255,255,0.012)";
              e.currentTarget.style.boxShadow = "none";
            }}>
              <HudCorners color={ACCENT} active={false} size={10} />
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 10,
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 18,
                  color: ACCENT,
                }}>
                  [{feat.icon}]
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 12,
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.7)",
                  textTransform: "uppercase",
                }}>
                  {feat.label}
                </span>
              </div>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.6,
                margin: 0,
              }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
          width: "100%",
          marginBottom: "40px",
        }}>
          <div style={{
            flex: 1,
            height: 1,
            background: `linear-gradient(to right, transparent, ${ACCENT}30)`,
          }} />
          <span style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
          }}>
            ACCESS_MODE
          </span>
          <div style={{
            flex: 1,
            height: 1,
            background: `linear-gradient(to left, transparent, ${ACCENT}30)`,
          }} />
        </div>

        <div style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          padding: "24px 48px",
          background: "rgba(0,229,204,0.03)",
          border: "1px solid rgba(0,229,204,0.25)",
        }}>
          <HudCorners color={ACCENT} active={true} size={14} />

          <h2 style={{
            fontFamily: "'Syncopate', sans-serif",
            fontSize: "clamp(2rem, 4vw, 4rem)",
            fontWeight: 800,
            color: "#fff",
            margin: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "16px",
            textShadow: "0 0 30px rgba(0,229,204,0.3)",
            whiteSpace: "nowrap",
          }}>
            FOR{" "}
            <RotatingText
              texts={["CANDIDATES", "RECRUITERS", "TEAMS", "EVERYONE"]}
              mainClassName="audience-rotating"
              splitBy="characters"
              rotationInterval={2500}
              staggerDuration={0.02}
              staggerFrom="first"
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-120%", opacity: 0 }}
            />
          </h2>
        </div>

        {/* <div style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "48px",
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 10,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
          }}>
            COORD: <span style={{ color: ACCENT }}>SEC06</span>
          </span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} style={{
                width: i === 5 ? 24 : 6,
                height: 6,
                background: i === 5 ? ACCENT : "rgba(0,229,204,0.3)",
                transition: "all 0.4s ease",
              }} />
            ))}
          </div>
        </div> */}
      </div>

      <style>{`
        .audience-rotating {
          color: #00e5cc !important;
          font-family: 'Syncopate', sans-serif !important;
          font-weight: 800 !important;
        }
        .audience-rotating .text-rotate-word {
          align-items: center;
        }
        .audience-rotating .text-rotate-element {
          display: inline-block;
        }
      `}</style>
    </section>
  );
}
