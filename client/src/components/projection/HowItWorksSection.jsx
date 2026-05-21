  import React, { useEffect, useRef, useState } from "react";

  const SECTION_VH = 400;
  //const PATH = "M 85 74 H 915 C 970 74 970 217 915 217 H 85 C 310 217 10 360 85 360 H 915";

  const PATH = "M 85 74 H 995 C 1100 74 1100 265 995 265 H 15 C -90 265 -90 465 15 465 H 915";

  const STEPS = [
    {
      num: "01",
      eyebrow: "PROFILE",
      title: "BUILD PROFILE",
      desc: "Create your professional identity. Upload your CV, add skills, and let our engine map your potential.",
      icon: "[ ≡ ]",
      side: "left",
      top: 100,
    },
    {
      num: "02",
      eyebrow: "MATCHING",
      title: "GET MATCHED",
      desc: "Our AI analyses thousands of signals to find opportunities that fit your unique profile.",
      icon: "[ ⟡ ]",
      side: "right",
      top: 290,
    },
    {
      num: "03",
      eyebrow: "OFFER",
      title: "GET HIRED",
      desc: "From match to offer letter. The right connection, at the right moment.",
      icon: "[ ✓ ]",
      side: "left",
      top: 490,
    },
  ];

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

  function HudCorners({ active }) {
    const border = active ? "2px solid rgba(0,229,204,0.65)" : "1px solid rgba(255,255,255,0.12)";
    const base = { position: "absolute", width: 10, height: 10, transition: "border-color 0.45s ease" };
    return (
      <>
        <span style={{ ...base, top: -1, left: -1, borderTop: border, borderLeft: border }} />
        <span style={{ ...base, top: -1, right: -1, borderTop: border, borderRight: border }} />
        <span style={{ ...base, bottom: -1, left: -1, borderBottom: border, borderLeft: border }} />
        <span style={{ ...base, bottom: -1, right: -1, borderBottom: border, borderRight: border }} />
      </>
    );
  }

  function StepBadge({ step, active }) {
    return (
      <div
        style={{
          width: 108,
          minHeight: 104,
          border: active ? "1px solid rgba(0,229,204,0.45)" : "1px solid rgba(255,255,255,0.08)",
          background: active ? "rgba(0,229,204,0.055)" : "rgba(255,255,255,0.015)",
          boxShadow: active ? "0 0 24px rgba(0,229,204,0.12), inset 0 0 18px rgba(0,229,204,0.03)" : "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          position: "relative",
          flexShrink: 0,
          transition: "border-color 0.45s ease, background 0.45s ease, box-shadow 0.45s ease",
        }}
      >
        <HudCorners active={active} />
        <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10, letterSpacing: "0.24em", color: active ? "#00e5cc" : "rgba(255,255,255,0.22)" }}>STEP</span>
        <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 32, lineHeight: 1, fontWeight: 800, color: active ? "#fff" : "rgba(255,255,255,0.18)" }}>{step.num}</span>
        <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 8, letterSpacing: "0.2em", color: active ? "rgba(0,229,204,0.72)" : "rgba(255,255,255,0.2)" }}>{step.eyebrow}</span>
        <span style={{ width: 4, height: 4, borderRadius: "50%", background: active ? "#ff003c" : "rgba(255,0,60,0.18)", marginTop: 4 }} />
      </div>
    );
  }

  function StepCard({ step, active }) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 132,
          border: active ? "1px solid rgba(0,229,204,0.36)" : "1px solid rgba(255,255,255,0.065)",
          background: active ? "rgba(0,229,204,0.035)" : "rgba(255,255,255,0.012)",
          boxShadow: active ? "0 0 28px rgba(0,229,204,0.11), inset 0 0 22px rgba(0,229,204,0.02)" : "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 12,
          padding: "24px 28px",
          position: "relative",
          transition: "border-color 0.45s ease, background 0.45s ease, box-shadow 0.45s ease",
        }}
      >
        <HudCorners active={active} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 22, color: active ? "#00e5cc" : "rgba(255,255,255,0.14)", lineHeight: 1 }}>{step.icon}</span>
          <h3 style={{ margin: 0, fontFamily: "'Syncopate',sans-serif", fontSize: "clamp(13px,1.55vw,18px)", letterSpacing: "0.08em", color: active ? "#fff" : "rgba(255,255,255,0.25)" }}>{step.title}</h3>
        </div>
        <p style={{ margin: 0, maxWidth: 520, fontFamily: "'Inter',sans-serif", fontSize: 13, lineHeight: 1.65, color: active ? "rgba(255,255,255,0.58)" : "rgba(255,255,255,0.16)" }}>{step.desc}</p>
      </div>
    );
  }

  function StepRow({ step, active }) {
    const reverse = step.side === "right";
    return (
      <div
        style={{
          position: "absolute",
          top: step.top,
          left: 31,
          right: 31,
          display: "flex",
          flexDirection: reverse ? "row-reverse" : "row",
          alignItems: "stretch",
          gap: 22,
          zIndex: 3,
        }}
      >
        <StepBadge step={step} active={active} />
        <StepCard step={step} active={active} />
      </div>
    );
  }

  function getDotPosition(progress) {
    const p = Math.min(Math.max(progress, 0), 1);
    const pts = [
      { p: 0, x: 85, y: 74 },
      { p: 0.33, x: 995, y: 74 },
      { p: 0.5, x: 995, y: 265, curve: true, cp1x: 1100, cp1y: 74, cp2x: 1100, cp2y: 265 },
      { p: 0.66, x: 15, y: 265 },
      { p: 0.82, x: 15, y: 465, curve: true, cp1x: -90, cp1y: 265, cp2x: -90, cp2y: 465 },
      { p: 1, x: 915, y: 465 },
    ];

    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (p >= a.p && p <= b.p) {
        const local = (p - a.p) / (b.p - a.p || 1);
        const ease = local * local * (3 - 2 * local);
        if (b.curve) {
          const t = ease;
          const inv = 1 - t;
          return {
            x: inv * inv * inv * a.x + 3 * inv * inv * t * b.cp1x + 3 * inv * t * t * b.cp2x + t * t * t * b.x,
            y: inv * inv * inv * a.y + 3 * inv * inv * t * b.cp1y + 3 * inv * t * t * b.cp2y + t * t * t * b.y,
          };
        }
        return {
          x: a.x + (b.x - a.x) * ease,
          y: a.y + (b.y - a.y) * ease,
        };
      }
    }
    return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
  }

  export default function HowItWorksSection() {
    const sectionRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [activeStep, setActiveStep] = useState(-1);
    const [coordVal, setCoordVal] = useState("000000");

    useEffect(() => {
      const section = sectionRef.current;
      if (!section) return;
      const onScroll = () => {
        const rect = section.getBoundingClientRect();
        const vh = window.innerHeight;
        const sectionH = section.offsetHeight;
        const p = Math.min(Math.max(-rect.top / (sectionH - vh), 0), 1);
        setProgress(p);

        // Adjust these thresholds to fine-tune when cards activate.
        // We've lowered them so the cards activate earlier as the dot approaches or passes them.
        setActiveStep(
          p < 0.0 ? -1 : 
          p < 0.52 ? 0 : 
          p < 0.83 ? 1 : 
          2
        );

        setCoordVal(String(Math.floor(p * 1000)).padStart(6, "0"));
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const dot = getDotPosition(progress);

    return (
      <section ref={sectionRef} style={{ height: SECTION_VH + "vh", position: "relative", background: "rgba(3,3,3,0.75)", zIndex: 1 }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", cursor: "crosshair" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.035) 50%)", backgroundSize: "100% 4px", pointerEvents: "none", zIndex: 5 }} />
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)", pointerEvents: "none", zIndex: 4 }} />
          <div style={{ position: "absolute", inset: 0, opacity: 0.045, pointerEvents: "none", zIndex: 6, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
          <CornerBrackets />

          {/* <div style={{ position: "absolute", top: "2rem", left: "2.5rem", zIndex: 20, pointerEvents: "none", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>PROC_03 // HOW IT WORKS</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.15)", position: "relative" }}>
              <span style={{ position: "absolute", right: 0, top: -2, width: 5, height: 5, background: "#00e5cc" }} />
            </div>
            <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(0,229,204,0.7)", textTransform: "uppercase" }}>STEP_{String(Math.max(activeStep + 1, 0)).padStart(2, "0")}</span>
          </div> */}

          {/* <div style={{ position: "absolute", top: "2rem", right: "2.5rem", zIndex: 20, pointerEvents: "none" }}>
            <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              STATUS: <span style={{ color: activeStep >= 0 ? "#00e5cc" : "rgba(255,255,255,0.3)" }}>{activeStep >= 0 ? "ACTIVE" : "STANDBY"}</span>
            </span>
          </div> */}

          <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", padding: "88px 7% 74px" }}>
            <div style={{ width: "100%", maxWidth: 980 }}>
              <h2 style={{ margin: "0 0 42px", textAlign: "center", fontFamily: "'Syncopate',sans-serif", fontSize: "clamp(1.7rem,4vw,5rem)", lineHeight: 1, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>HOW IT WORKS</h2>
              <div style={{ position: "relative", height: 512 }}>
                <svg viewBox="0 0 1000 512" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, zIndex: 1, overflow: "visible", pointerEvents: "none" }}>
                  <path d={PATH} fill="none" stroke="rgba(0,229,204,0.2)" strokeWidth="2" strokeDasharray="8 10" strokeLinecap="round" />
                  <path d={PATH} fill="none" stroke="rgba(0,229,204,0.72)" strokeWidth="2" strokeLinecap="round" pathLength="1" strokeDashoffset={1 - progress} strokeDasharray="1" style={{ filter: "drop-shadow(0 0 8px rgba(0,229,204,0.35))" }} />
                  <circle cx={dot.x} cy={dot.y} r="7" fill="#00e5cc" style={{ filter: "drop-shadow(0 0 8px rgba(0,229,204,0.9)) drop-shadow(0 0 22px rgba(0,229,204,0.45))" }} />
                  <circle cx={dot.x} cy={dot.y} r="16" fill="rgba(0,229,204,0.13)" />
                </svg>

                {STEPS.map((step, i) => (
                  <StepRow key={step.num} step={step} active={activeStep >= i} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ position: "absolute", bottom: "2rem", left: "2.5rem", right: "2.5rem", zIndex: 20, pointerEvents: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>
              COORD: <strong style={{ color: "#00e5cc" }}>{coordVal}</strong>
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {STEPS.map((_, i) => (
                <span key={i} style={{ width: i === activeStep ? 24 : 6, height: 6, borderRadius: 3, background: i === activeStep ? "#00e5cc" : i < activeStep ? "rgba(0,229,204,0.3)" : "rgba(255,255,255,0.2)", transition: "all 0.4s ease" }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
