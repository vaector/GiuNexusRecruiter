import React, { useState, useEffect, useRef } from "react";
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

const SCENARIOS = [
  {
    skills: "React, Node.js, GraphQL",
    jobTitle: "Senior Full Stack Engineer",
    company: "TechNova Solutions",
    location: "London, UK (Hybrid)",
    salary: "\u00A385,000 - \u00A3110,000",
    match: 97,
    matchBar: "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591",
    glowColor: "#00e5cc",
  },
  {
    skills: "Python, TensorFlow, PyTorch",
    jobTitle: "Machine Learning Researcher",
    company: "AI Dynamics",
    location: "Remote",
    salary: "$130,000 - $160,000",
    match: 94,
    matchBar: "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591",
    glowColor: "#9d4edd",
  },
  {
    skills: "Figma, Framer, CSS",
    jobTitle: "Lead UI/UX Designer",
    company: "Creative Studio",
    location: "Berlin, DE",
    salary: "\u20AC75,000 - \u20AC95,000",
    match: 91,
    matchBar: "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591",
    glowColor: "#f72585",
  },
  {
    skills: "Rust, Go, C++",
    jobTitle: "Systems Field Engineer",
    company: "Core Infrastructure Inc.",
    location: "San Francisco, CA",
    salary: "$150,000 - $190,000",
    match: 88,
    matchBar: "\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591",
    glowColor: "#ff9e00",
  },
];

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "0, 229, 204";
}

export default function AiMatchDemoSection() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [phase, setPhase] = useState("typing");
  const [typedText, setTypedText] = useState("");
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const currScenario = SCENARIOS[scenarioIdx];
  const typingTimer = useRef(null);
  const flowTimer = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    startScenario();
    return () => {
      clearTimeout(typingTimer.current);
      clearTimeout(flowTimer.current);
    };
  }, [scenarioIdx]);

  const startScenario = () => {
    setPhase("typing");
    setTypedText("");
    let charIdx = 0;
    const targetText = SCENARIOS[scenarioIdx].skills;

    const typeNext = () => {
      if (charIdx < targetText.length) {
        setTypedText(targetText.substring(0, charIdx + 1));
        charIdx++;
        typingTimer.current = setTimeout(typeNext, 40 + Math.random() * 60);
      } else {
        flowTimer.current = setTimeout(() => {
          setPhase("scanning");
          flowTimer.current = setTimeout(() => {
            setPhase("found");
            flowTimer.current = setTimeout(() => {
              setScenarioIdx((prev) => (prev + 1) % SCENARIOS.length);
            }, 3500);
          }, 1200);
        }, 500);
      }
    };
    flowTimer.current = setTimeout(typeNext, 800);
  };

  const isScanning = phase === "scanning" || phase === "found";
  const isFound = phase === "found";

  return (
    <section
      style={{
        minHeight: "100vh",
        position: "relative",
        background: "#030303",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        cursor: "crosshair",
        padding: isMobile ? "40px 0" : "0",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.2) 50%)",
          backgroundSize: "100% 4px",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle, transparent 30%, #000 120%)",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.04,
          pointerEvents: "none",
          zIndex: 6,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <CornerBrackets />

      <div
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "1100px",
          padding: isMobile ? "40px 4% 32px" : "80px 6%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "48px",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.4)",
              textTransform: "uppercase",
            }}
          >
            SYS.READY
          </span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(255,255,255,0.15)",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                right: 0,
                top: -2,
                width: 5,
                height: 5,
                background: currScenario.glowColor,
                transition: "background 0.6s ease",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "rgba(0,229,204,0.7)",
              textTransform: "uppercase",
            }}
          >
            SECTOR_05
          </span>
        </div> */}

        <span
          style={{
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: 14,
            letterSpacing: 2,
            color: currScenario.glowColor,
            marginBottom: 16,
            display: "block",
            textAlign: "center",
            transition: "color 0.6s ease",
          }}
        >
          // NEURAL_MATCH_PROTOCOL: ACTIVE
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? "10px" : "20px",
            width: "100%",
            marginBottom: isMobile ? "24px" : "40px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: isMobile ? "0 0 0" : 1,
              height: 1,
              background: `linear-gradient(to right, transparent, ${currScenario.glowColor}30)`,
              transition: "background 0.6s ease",
              minWidth: isMobile ? 0 : 40,
            }}
          />
          <div
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              padding: isMobile ? "14px 20px" : "20px 40px",
              background: `rgba(${hexToRgb(currScenario.glowColor)}, 0.03)`,
              border: `1px solid rgba(${hexToRgb(currScenario.glowColor)}, 0.25)`,
              transition: "background 0.6s ease, border-color 0.6s ease",
            }}
          >
            <HudCorners color={currScenario.glowColor} active={true} size={14} />
            <h2
              style={{
                fontFamily: "'Syncopate', sans-serif",
                fontSize: "clamp(1.2rem, 2.5vw, 2.2rem)",
                fontWeight: 800,
                color: "#fff",
                margin: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "16px",
                textShadow: `0 0 30px rgba(${hexToRgb(currScenario.glowColor)}, 0.3)`,
                whiteSpace: "normal",
                textAlign: "center",
                transition: "text-shadow 0.6s ease",
              }}
            >
              AI MATCH ENGINE{" "}
              {/* <RotatingText
                texts={["ENGINE", "NETWORK", "PROTOCOL", "SYSTEM"]}
                mainClassName="aimatch-rotating"
                splitBy="characters"
                rotationInterval={2500}
                staggerDuration={0.02}
                staggerFrom="first"
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-120%", opacity: 0 }}
              /> */}
            </h2>
          </div>
          <div
            style={{
              flex: isMobile ? "0 0 0" : 1,
              height: 1,
              background: `linear-gradient(to left, transparent, ${currScenario.glowColor}30)`,
              transition: "background 0.6s ease",
              minWidth: isMobile ? 0 : 40,
            }}
          />
        </div>

        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? "16px" : "40px",
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              position: "relative",
              background: "rgba(255,255,255,0.012)",
              border: "1px solid rgba(255,255,255,0.065)",
              padding: isMobile ? "20px 16px" : "32px",
              transition: "border-color 0.45s ease, background 0.45s ease, box-shadow 0.45s ease",
            }}
          >
            <HudCorners color={currScenario.glowColor} active={isScanning} size={10} />
            <div
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: isMobile ? 10 : 12,
                color: "rgba(255,255,255,0.4)",
                marginBottom: isMobile ? "12px" : "20px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              INPUT_TERMINAL
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: isMobile ? 12 : 14,
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.8,
              }}
            >
              <div style={{ opacity: 0.5, fontSize: "12px", marginBottom: "12px" }}>
                {"// SYSTEM_READY"}<br />{"// AWAITING_INPUT..."}
              </div>
              <div>
                <span style={{ color: currScenario.glowColor, transition: "color 0.6s ease" }}>{">"}</span>{" "}
                {"ENTER_SKILLS: ["}{typedText}
                {phase === "typing" && (
                  <span style={{ animation: "cursorBlink 1s infinite" }}>_</span>
                )}{"]"}
              </div>
              {isScanning && (
                <div style={{ marginTop: "8px", color: "rgba(255,255,255,0.9)" }}>
                  <span style={{ color: currScenario.glowColor, transition: "color 0.6s ease" }}>{">"}</span>{" "}
                  SCANNING_DATABASE
                  <span style={{ animation: "dots 1.5s steps(4, end) infinite" }}>...</span>
                </div>
              )}
              {isFound && (
                <div
                  style={{
                    marginTop: "8px",
                    color: "#fff",
                    textShadow: `0 0 10px ${currScenario.glowColor}`,
                  }}
                >
                  <span style={{ color: currScenario.glowColor, transition: "color 0.6s ease" }}>{">"}</span>{" "}
                  MATCH FOUND: {currScenario.match}% {currScenario.matchBar}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              background: isFound
                ? `rgba(${hexToRgb(currScenario.glowColor)}, 0.03)`
                : "rgba(255,255,255,0.012)",
              border: `1px solid ${
                isFound
                  ? `rgba(${hexToRgb(currScenario.glowColor)}, 0.25)`
                  : "rgba(255,255,255,0.065)"
              }`,
              padding: "32px",
              transition:
                "border-color 0.45s ease, background 0.45s ease, box-shadow 0.45s ease",
              boxShadow: isFound
                ? `0 0 24px rgba(${hexToRgb(currScenario.glowColor)}, 0.11), inset 0 0 18px rgba(${hexToRgb(currScenario.glowColor)}, 0.02)`
                : "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              opacity: isFound ? 1 : 0.35,
            }}
          >
            <HudCorners color={currScenario.glowColor} active={isFound} size={10} />
            <div
              style={{
                fontFamily: "'JetBrains Mono','Fira Code',monospace",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                marginBottom: "20px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              MATCH_RESULT
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "20px",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: "6px",
                  }}
                >
                  {currScenario.company}
                </div>
                <h3
                  style={{
                    fontFamily: "'Syncopate', sans-serif",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#fff",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {currScenario.jobTitle}
                </h3>
              </div>
              <div
                style={{
                  background: `rgba(${hexToRgb(currScenario.glowColor)}, 0.1)`,
                  border: `1px solid ${currScenario.glowColor}`,
                  color: currScenario.glowColor,
                  padding: "6px 14px",
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: `0 0 15px rgba(${hexToRgb(currScenario.glowColor)}, 0.25)`,
                }}
              >
                {currScenario.match}%
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                color: "rgba(255,255,255,0.55)",
                marginBottom: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 12, color: currScenario.glowColor }}>LOC</span>{" "}
                {currScenario.location}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 12, color: currScenario.glowColor }}>SAL</span>{" "}
                {currScenario.salary}
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {currScenario.skills.split(", ").map((skill) => (
                <span
                  key={skill}
                  style={{
                    background: `rgba(${hexToRgb(currScenario.glowColor)}, 0.06)`,
                    border: `1px solid rgba(${hexToRgb(currScenario.glowColor)}, 0.2)`,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontFamily: "'JetBrains Mono','Fira Code',monospace",
                    color: currScenario.glowColor,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: isMobile ? "24px" : "48px",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono','Fira Code',monospace",
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.35)",
              textTransform: "uppercase",
            }}
          >
            COORD: <span style={{ color: currScenario.glowColor, transition: "color 0.6s ease" }}>SEC05</span>
          </span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {SCENARIOS.map((s, i) => (
              <span
                key={i}
                style={{
                  width: i === scenarioIdx ? 24 : 6,
                  height: 6,
                  background: i === scenarioIdx ? currScenario.glowColor : "rgba(0,229,204,0.3)",
                  transition: "all 0.4s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .aimatch-rotating {
          color: ${currScenario.glowColor} !important;
          font-family: 'Syncopate', sans-serif !important;
          font-weight: 800 !important;
          transition: color 0.6s ease;
        }
        .aimatch-rotating .text-rotate-word {
          align-items: center;
        }
        .aimatch-rotating .text-rotate-element {
          display: inline-block;
        }
        @keyframes cursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes dots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
        }
      `}</style>
    </section>
  );
}
