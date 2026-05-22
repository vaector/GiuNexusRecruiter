import { useEffect, useState, useRef } from "react";
import Lenis from "lenis";

const useAdminEffects = () => {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const scrollbarRef = useRef(null);
  const scrollbarTrackRef = useRef(null);
  const pctRef = useRef(null);

  useEffect(() => {
    if (typeof history !== "undefined") history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const lenis = new Lenis({ lerp: 0.07, smoothWheel: true });

    lenis.on("scroll", (e) => {
      const pct = e.progress;
      if (pctRef.current) {
        pctRef.current.textContent = (pct * 100).toFixed(1) + "%";
      }
      if (scrollbarRef.current && scrollbarTrackRef.current) {
        const trackH = scrollbarTrackRef.current.offsetHeight - scrollbarRef.current.offsetHeight;
        scrollbarRef.current.style.transform = `translateY(${pct * Math.max(trackH, 0)}px)`;
        const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
        scrollbarTrackRef.current.style.opacity = isScrollable ? "1" : "0";
      }
    });

    let raf;
    function tick(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    const trackMouse = (e) => setCoords({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", trackMouse);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", trackMouse);
    };
  }, []);

  return { coords, scrollbarRef, scrollbarTrackRef, pctRef };
};

export default useAdminEffects;
