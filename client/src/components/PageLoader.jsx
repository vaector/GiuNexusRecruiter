import { useEffect, useState } from "react";

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const PageLoader = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#030303",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.15s ease",
      }}
      aria-label="Loading page"
      role="status"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: GRAIN_SVG,
          opacity: 0.05,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%)",
          pointerEvents: "none",
        }}
      />

      <p
        style={{
          fontFamily:
            "'JetBrains Mono','Fira Code',monospace",
          fontSize: "9px",
          letterSpacing: "0.14em",
          color: "rgba(140,230,240,0.38)",
          textTransform: "uppercase",
          marginBottom: "1.5rem",
        }}
      >
        SYS.LOADING
      </p>

      <h1
        style={{
          fontFamily: "'Syncopate',Inter,system-ui,sans-serif",
          fontSize: "clamp(2rem,5vw,3.5rem)",
          fontWeight: 700,
          letterSpacing: "-0.5px",
          textTransform: "uppercase",
          color: "#eaf2ff",
          lineHeight: 1,
        }}
      >
        NEXUS
      </h1>

      <div
        style={{
          width: "200px",
          height: "2px",
          background: "rgba(255,255,255,0.06)",
          marginTop: "2rem",
          position: "relative",
          overflow: "hidden",
          borderRadius: "1px",
        }}
      >
        <div
          className="nexus-loader-bar"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: "40%",
            background: "#00e5cc",
            boxShadow: "0 0 8px rgba(0,229,204,0.25)",
          }}
        />
      </div>

      <p
        style={{
          fontFamily:
            "'JetBrains Mono','Fira Code',monospace",
          fontSize: "9px",
          letterSpacing: "0.14em",
          color: "rgba(140,230,240,0.38)",
          marginTop: "1rem",
          textTransform: "uppercase",
        }}
      >
        INITIALIZING...
      </p>

      <style>{`
        @keyframes nexusLoaderSlide {
          0% { transform: translateX(-250%); }
          100% { transform: translateX(350%); }
        }
        .nexus-loader-bar {
          animation: nexusLoaderSlide 0.8s cubic-bezier(0.16,1,0.3,1) infinite;
        }
      `}</style>
    </div>
  );
};

export default PageLoader;
