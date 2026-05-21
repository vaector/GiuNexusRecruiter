import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { ProjectionScene } from "../components/projection";
import CardTunnel from "../components/projection/CardTunnel";
import PitchSection from "../components/projection/PitchSection";
import HowItWorksSection from "../components/projection/HowItWorksSection";
import AiMatchDemoSection from "../components/projection/AiMatchDemoSection";
import AudienceSection from "../components/projection/AudienceSection";
import CtaBanner from "../components/projection/CtaBanner";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import FluidBackground from "../components/FluidBackground";
import GooeyCursor from "../components/GooeyCursor";

const HERO_SCROLL_VH = 6;

export default function HomePage() {
  const zoomTargetRef = useRef(0);
  const lenisRef = useRef(null);
  const scrollbarRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const pctRef = useRef(null);
  const scrollIndicatorRef = useRef(null);
  const heroStickyRef = useRef(null);

  useEffect(() => {
    if (typeof history !== "undefined") history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const lenis = new Lenis({ lerp: 0.07, smoothWheel: true });
    lenisRef.current = lenis;

    let raf;
    function tick(time) {
      lenis.raf(time);

      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const maxZoom = vh * 2;
      const zoom = Math.min(Math.max(scrollY / Math.max(maxZoom, 1), 0), 1);
      zoomTargetRef.current = zoom;

      const totalH = document.documentElement.scrollHeight - vh;
      const pct = totalH > 0 ? scrollY / totalH : 0;

      if (pctRef.current) pctRef.current.textContent = (pct * 100).toFixed(1) + "%";

      if (scrollbarRef.current && scrollbarTrackRef.current) {
        const trackH = scrollbarTrackRef.current.offsetHeight - scrollbarRef.current.offsetHeight;
        scrollbarRef.current.style.transform = "translateY(" + pct * Math.max(trackH, 0) + "px)";
        scrollbarTrackRef.current.style.opacity = pct > 0.005 ? "1" : "0";
      }

      const indicatorOpacity = Math.max(0, 1 - scrollY / (vh * 0.35));
      if (scrollIndicatorRef.current) scrollIndicatorRef.current.style.opacity = indicatorOpacity;

      // Fade out hero as user scrolls into the second half of the hero section
      const fadeStart = vh * 2;
      const fadeEnd = vh * 3;
      const heroOpacity = 1 - Math.min(Math.max((scrollY - fadeStart) / (fadeEnd - fadeStart), 0), 1);
      if (heroStickyRef.current) heroStickyRef.current.style.opacity = heroOpacity;

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => { lenis.destroy(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <>
      <FluidBackground />
      <GooeyCursor />

      <section style={{ height: `${HERO_SCROLL_VH * 100}vh`, position: "relative", zIndex: 1 }}>
        {/* CardTunnel behind the hero - fixed within this scroll region */}
        <div style={{ position: "sticky", top: 0, height: "100vh", zIndex: 0 }}>
          <CardTunnel embedded />
        </div>

        {/* Hero on top, fades out on scroll */}
        <div
          ref={heroStickyRef}
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            overflow: "hidden",
            zIndex: 2,
            marginTop: "-100vh",
            pointerEvents: "none",
            transition: "opacity 0.05s linear",
          }}
        >
          <div style={{ pointerEvents: "auto", width: "100%", height: "100%" }}>
            <ProjectionScene zoomTargetRef={zoomTargetRef} />
          </div>

          <div
            ref={scrollIndicatorRef}
            style={{
              position: "absolute",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 55,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              transition: "opacity 0.3s ease",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                width: "26px",
                height: "40px",
                borderRadius: "13px",
                border: "2px solid rgba(255,255,255,0.7)",
                position: "relative",
                animation: "scrollPulse 1.6s ease-in-out infinite",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)",
                  animation: "scrollDot 1.6s ease-in-out infinite",
                }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.8)",
                }}
              >
                {">"}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace",
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "2px",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                SCROLL_DOWN
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* <section style={{ minHeight: "100vh", background: "#030303" }} /> */}

      {/* Section 3 - Pitch */}
      <PitchSection />

      {/* Section 4 - How It Works */}
      <HowItWorksSection />

      {/* Section 5 - AI Match Demo */}
      <AiMatchDemoSection />

      {/* Section 6 - Audience Split (Students / Companies) */}
      <AudienceSection />

      {/* Section 7 - CTA Banner */}
      <CtaBanner />

      <Footer />

      <Navbar />

      <div
        ref={scrollbarTrackRef}
        style={{
          position: "fixed",
          right: "6px",
          top: "12%",
          bottom: "12%",
          width: "3px",
          zIndex: 60,
          pointerEvents: "none",
          background: "rgba(255,255,255,0.04)",
          borderRadius: "2px",
          transition: "opacity 0.6s ease",
          opacity: 0,
        }}
      >
        <div
          ref={scrollbarRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "36px",
            background: "rgba(0,229,204,0.5)",
            borderRadius: "2px",
            boxShadow: "0 0 8px rgba(0,229,204,0.25)",
            willChange: "transform",
          }}
        />
      </div>

      <div
        style={{
          position: "fixed",
          top: "2rem",
          right: "2rem",
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
        PROGRESS: <strong ref={pctRef} style={{ color: "#00e5cc" }}>0.0%</strong>
      </div>

      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes scrollDot {
          0%, 100% { opacity: 0; transform: translateX(-50%) translateY(0); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0); }
          50% { opacity: 1; transform: translateX(-50%) translateY(14px); }
          60% { opacity: 0; transform: translateX(-50%) translateY(16px); }
        }
        html.lenis { height: auto; }
        html.lenis body { height: auto; }
        body { background: #000 !important; }

        `}</style>
    </>
  );
}
