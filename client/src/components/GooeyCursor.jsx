import { useEffect, useRef } from "react";

const TAIL_LENGTH = 20;
const CURSOR_SIZE = 28;
const LERP_FACTOR = 0.35;

export default function GooeyCursor() {
  const containerRef = useRef(null);
  const historyRef = useRef(Array.from({ length: TAIL_LENGTH }, () => ({ x: 0, y: 0 })));
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    const circles = [];
    for (let i = 0; i < TAIL_LENGTH; i++) {
      const div = document.createElement("div");
      div.className = "gooey-cursor-circle";
      container.appendChild(div);
      circles.push(div);
    }

    const onPointerMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    const onTouchMove = (e) => {
      const touch = e.touches[0];
      if (touch) {
        mouseRef.current.x = touch.clientX;
        mouseRef.current.y = touch.clientY;
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const update = () => {
      const history = historyRef.current;
      history.shift();
      history.push({ x: mouseRef.current.x, y: mouseRef.current.y });
      for (let i = 0; i < TAIL_LENGTH; i++) {
        const current = history[i];
        const next = history[i + 1] || current;
        current.x += (next.x - current.x) * LERP_FACTOR;
        current.y += (next.y - current.y) * LERP_FACTOR;
        circles[i].style.transform =
          `translate(${current.x}px, ${current.y}px) scale(${i / TAIL_LENGTH})`;
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onTouchMove);
      circles.forEach((c) => c.remove());
      initializedRef.current = false;
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        id="gooey-cursor"
        style={{
          position: "fixed",
          top: `${CURSOR_SIZE / -2}px`,
          left: `${CURSOR_SIZE / -2}px`,
          pointerEvents: "none",
          mixBlendMode: "difference",
          filter: "url(#goo)",
          zIndex: 4000,
        }}
      />
      <style>{`
        .gooey-cursor-circle {
          position: absolute;
          width: ${CURSOR_SIZE}px;
          height: ${CURSOR_SIZE}px;
          border-radius: 50%;
          background: #eaf2ff;
          top: 0;
          left: 0;
          transform-origin: center;
          will-change: transform;
        }
        @media (max-width: 768px) {
          #gooey-cursor { display: none !important; }
        }
        @media (pointer: coarse) {
          #gooey-cursor { display: none !important; }
        }
      `}</style>
    </>
  );
}