import React, { useEffect, useRef, useState } from "react";

const frameStyle = {
  position: "fixed",
  top: "5%",
  left: "5%",
  right: "5%",
  bottom: "20%",
  pointerEvents: "none",
  zIndex: 2,
  willChange: "transform",
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
  transition: "opacity 0.8s ease",
};

export default function CornerFrame({ visible }) {
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
    function tick() {
      const s = smoothRef.current;
      const m = mouseRef.current;
      s.x += (m.x - s.x) * 0.03;
      s.y += (m.y - s.y) * 0.03;
      if (ref.current) {
        ref.current.style.transform = `translate(${s.x * 20}px,${-s.y * 15}px)`;
      }

      // Color sync
      const t = performance.now() * 0.001;
      const rawBlend = 0.5 - 0.5 * Math.cos(t * 0.346);
      const tBias = Math.pow(rawBlend, 5);
      const sph = 0.6;
      const r = (0.05 + 0.06 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 0.8))) * (1 - tBias) + (0.46 + 0.07 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 2.4))) * tBias;
      const g = (0.69 + 0.14 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 0.0))) * (1 - tBias) + (0.34 + 0.05 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 1.2))) * tBias;
      const b = (0.64 + 0.12 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 2.0))) * (1 - tBias) + (0.44 + 0.05 * (0.5 + 0.5 * Math.cos(sph * 5.0 + 3.6))) * tBias;
      if (ref.current) {
        ref.current.style.borderColor = `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},0.6)`;
      }
      raf = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <div ref={ref} style={{ ...frameStyle, opacity: visible ? 0.4 : 0 }} />;
}
