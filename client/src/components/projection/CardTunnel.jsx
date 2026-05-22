import { useEffect, useRef } from "react";

const JOBS = [
  { id: "NXS-4821", title: "Quantum ML Engineer", company: "NeuralDyne", type: "FT", tags: "ML\u00b7Quantum\u00b7Python" },
  { id: "NXS-7193", title: "Blockchain Architect", company: "ChainVault", type: "CT", tags: "Solidity\u00b7Rust\u00b7DeFi" },
  { id: "NXS-3356", title: "Neural Interface UX", company: "Synaptic Labs", type: "FT", tags: "UX\u00b7Neuro\u00b7BIO" },
  { id: "NXS-9087", title: "Cloud Infra Lead", company: "CloudForge", type: "RM", tags: "K8s\u00b7AWS\u00b7Terraform" },
  { id: "NXS-1124", title: "Cyber Threat Analyst", company: "ShieldNet", type: "FT", tags: "SOC\u00b7Pentest\u00b7ZeroTrust" },
  { id: "NXS-6650", title: "AI Research Scientist", company: "DeepMind Nexus", type: "FT", tags: "NLP\u00b7PyTorch\u00b7Research" },
];

const COLORS = ["#00e5cc", "#ff003c", "#ccff00", "#f0c040", "#a78bfa", "#ffffff"];

const SEQUENCE = [
  { type: "card" },
  { type: "card" },
  { type: "card" },
  { type: "heading", text: "TRENDING" },
  { type: "card" },
  { type: "card" },
  { type: "card" },
  { type: "card" },
  { type: "card" },
  { type: "card" },
  { type: "heading", text: "TRENDING" },
  { type: "card" },
  { type: "card" },
  { type: "card" },
  { type: "card" },
  { type: "card" },
  { type: "card" },
];

const CONFIG = {
  starCount: 120,
  zGap: 600,
  camSpeed: 3,
  tunnelDepth: SEQUENCE.length * 600,
};

const SECTION_VH = 600;

export default function CardTunnel({ embedded }) {
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const worldRef = useRef(null);
  const velRef = useRef(null);
  const coordRef = useRef(null);
  const itemsRef = useRef([]);
  const stateRef = useRef({
    prevScroll: 0,
    velocity: 0,
    targetSpeed: 0,
    mouseX: 0,
    mouseY: 0,
  });

  useEffect(() => {
    const world = worldRef.current;
    const viewport = viewportRef.current;
    if (!world || !viewport) return;

    const vw = window.innerWidth;
    const isMobile = vw < 768;
    const cardW = isMobile ? Math.min(260, Math.floor(vw * 0.7)) : 320;
    const cardH = isMobile ? Math.min(350, Math.floor(vw * 0.92)) : 420;
    const spreadX = isMobile ? 0.12 : 0.25;
    const spreadY = isMobile ? 0.15 : 0.25;

    const items = [];
    let jobIdx = 0;

    SEQUENCE.forEach((entry, i) => {
      const el = document.createElement("div");
      el.style.cssText =
        "position:absolute;left:0;top:0;backface-visibility:hidden;transform-origin:center center;display:flex;align-items:center;justify-content:center;";

      if (entry.type === "heading") {
        const txt = document.createElement("div");
        txt.style.cssText =
          "font-size:12vw;font-weight:800;color:transparent;-webkit-text-stroke:2px rgba(255,255,255,0.15);text-transform:uppercase;white-space:nowrap;pointer-events:none;letter-spacing:-0.5rem;mix-blend-mode:overlay;transform:translate(-50%,-50%);font-family:'Syncopate',sans-serif;";
        txt.innerText = entry.text;
        el.appendChild(txt);
        items.push({ el, type: "text", x: 0, y: 0, rot: 0, baseZ: -i * CONFIG.zGap, textEl: txt });
      } else {
        const job = JOBS[jobIdx % JOBS.length];
        const color = COLORS[jobIdx % COLORS.length];
        jobIdx++;

        const card = document.createElement("div");
        card.style.cssText = [
          "width:" + cardW + "px",
          "height:" + cardH + "px",
          "background:rgba(10,10,10,0.55)",
          "border:1px solid rgba(255,255,255,0.08)",
          "position:relative",
          "padding:1.5rem",
          "display:flex",
          "flex-direction:column",
          "justify-content:space-between",
          "backdrop-filter:blur(8px)",
          "-webkit-backdrop-filter:blur(8px)",
          "box-shadow:0 0 0 1px rgba(0,0,0,0.5),0 20px 50px rgba(0,0,0,0.5)",
          "transform:translate(-50%,-50%)",
        ].join(";");

        card.innerHTML = [
          '<div style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:0.75rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;">',
          '<span style="font-family:JetBrains Mono,monospace;font-size:0.7rem;color:' + color + ';letter-spacing:0.12em;">' + job.id + "</span>",
          '<span style="font-size:0.6rem;font-weight:600;letter-spacing:0.08em;color:' + color + ";border:1px solid " + color + '66;padding:0.15rem 0.5rem;border-radius:2px;">' + job.type + "</span>",
          "</div>",
          '<h2 style="font-size:1.6rem;line-height:0.9;margin:0;text-transform:uppercase;font-weight:700;color:#fff;font-family:Syncopate,sans-serif;mix-blend-mode:hard-light;">' + job.title + "</h2>",
          '<div style="margin-top:0.5rem;font-family:JetBrains Mono,monospace;font-size:0.75rem;color:rgba(234,242,255,0.5);">' + job.company + "</div>",
          '<div style="margin-top:auto;font-family:JetBrains Mono,monospace;font-size:0.7rem;color:rgba(255,255,255,0.4);display:flex;justify-content:space-between;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.06);">' + job.tags + "</div>",
          '<div style="position:absolute;bottom:1.5rem;right:1.5rem;font-size:3.5rem;opacity:0.04;font-weight:900;font-family:Syncopate,sans-serif;line-height:1;">0' + i + "</div>",
        ].join("");

        const before = document.createElement("span");
        before.style.cssText = "position:absolute;top:-1px;left:-1px;width:10px;height:10px;border-top:1px solid rgba(255,255,255,0.3);border-left:1px solid rgba(255,255,255,0.3);pointer-events:none;";
        card.appendChild(before);

        const after = document.createElement("span");
        after.style.cssText = "position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-bottom:1px solid rgba(255,255,255,0.3);border-right:1px solid rgba(255,255,255,0.3);pointer-events:none;";
        card.appendChild(after);

        el.appendChild(card);

        const angle = (i / SEQUENCE.length) * Math.PI * 6;
        const x = Math.cos(angle) * (window.innerWidth * spreadX);
        const y = Math.sin(angle) * (window.innerHeight * spreadY);
        const rot = (Math.random() - 0.5) * 16;

        items.push({ el, type: "card", x, y, rot, baseZ: -i * CONFIG.zGap });
      }

      world.appendChild(el);
    });

    for (let i = 0; i < CONFIG.starCount; i++) {
      const el = document.createElement("div");
      el.style.cssText = "position:absolute;width:2px;height:2px;background:white;transform:translate(-50%,-50%);";
      world.appendChild(el);
      items.push({
        el,
        type: "star",
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        baseZ: -(Math.random() * (CONFIG.tunnelDepth + 2000)),
      });
    }

    itemsRef.current = items;

    const state = stateRef.current;
    const onMouseMove = (e) => {
      state.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      state.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    let lastTime = 0;
    let raf;

    function tick(time) {
      if (!sectionRef.current || !viewport || !world) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const sectionTop = embedded ? 0 : sectionRef.current.offsetTop;
      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      const localScroll = embedded ? Math.max(0, scrollY - vh * 1.5) : Math.max(0, scrollY - sectionTop + vh * 0.5);
      const sectionH = embedded ? document.documentElement.scrollHeight : sectionRef.current.offsetHeight;
      const isVisible = scrollY + vh > sectionTop && scrollY < sectionTop + sectionH;

      const delta = time - lastTime;
      lastTime = time;

      if (!isVisible) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const scrollDelta = localScroll - state.prevScroll;
      state.prevScroll = localScroll;
      state.targetSpeed = delta > 0 ? scrollDelta / delta * 16 : 0;
      state.velocity += (state.targetSpeed - state.velocity) * 0.1;

      if (velRef.current) velRef.current.textContent = Math.abs(state.velocity).toFixed(2);
      if (coordRef.current) coordRef.current.textContent = String(Math.floor(localScroll)).padStart(6, "0");

      const tiltX = state.mouseY * 5 - state.velocity * 0.5;
      const tiltY = state.mouseX * 5;
      world.style.transform = "rotateX(" + tiltX + "deg) rotateY(" + tiltY + "deg)";

      const baseFov = 1000;
      const fov = baseFov - Math.min(Math.abs(state.velocity) * 10, 600);
      viewport.style.perspective = "" + fov + "px";

      const cameraZ = localScroll * CONFIG.camSpeed;

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const relZ = item.baseZ + cameraZ;

        let alpha = 1;
        if (relZ < -3000) alpha = 0;
        else if (relZ < -2000) alpha = (relZ + 3000) / 1000;
        if (relZ > 100 && item.type !== "star") alpha = 1 - (relZ - 100) / 400;
        if (alpha < 0) alpha = 0;

        item.el.style.opacity = alpha;

        if (alpha > 0) {
          let trans = "translate3d(" + item.x + "px," + item.y + "px," + relZ + "px)";
          if (item.type === "star") {
            const stretch = Math.max(1, Math.min(1 + Math.abs(state.velocity) * 0.1, 10));
            trans += " scale3d(1,1," + stretch + ")";
          } else if (item.type === "text") {
            trans += " rotateZ(" + item.rot + "deg)";
            if (Math.abs(state.velocity) > 1) {
              const offset = state.velocity * 2;
              item.textEl.style.textShadow = offset + "px 0 red," + -offset + "px 0 cyan";
            } else {
              item.textEl.style.textShadow = "none";
            }
          } else {
            const t = time * 0.001;
            const float = Math.sin(t + item.x) * 10;
            trans += " rotateZ(" + item.rot + "deg) rotateY(" + float + "deg)";
          }
          item.el.style.transform = trans;
        }
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouseMove);
      while (world.firstChild) world.removeChild(world.firstChild);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="card-tunnel-section"
      style={{ height: embedded ? "100%" : SECTION_VH + "vh", position: "relative", background: "#030303" }}
    >
      <div
        className="card-tunnel-viewport"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
          cursor: "crosshair",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%)",
            backgroundSize: "100% 4px",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.6) 120%)",
            pointerEvents: "none",
            zIndex: 11,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.07,
            pointerEvents: "none",
            zIndex: 12,
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }}
        />

        <div
          ref={viewportRef}
          style={{
            position: "absolute",
            inset: 0,
            perspective: "1000px",
            overflow: "hidden",
            zIndex: 1,
          }}
        >
          <div
            ref={worldRef}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transformStyle: "preserve-3d",
              willChange: "transform",
            }}
          />
        </div>

        <div
          className="card-tunnel-hud"
          style={{
            position: "absolute",
            inset: "2rem",
            zIndex: 20,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            color: "rgba(255,255,255,0.5)",
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>SYS.READY</span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(255,255,255,0.2)",
                margin: "0 1rem",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  top: "-2px",
                  width: "5px",
                  height: "5px",
                  background: "#ff003c",
                }}
              />
            </div>
          </div>
          <div
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              alignSelf: "flex-start",
              marginTop: "auto",
              marginBottom: "auto",
            }}
          >
            SCROLL VELOCITY // <strong ref={velRef} style={{ color: "#00f3ff" }}>0.00</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              COORD: <strong ref={coordRef} style={{ color: "#00f3ff" }}>000000</strong>
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background: "rgba(255,255,255,0.2)",
                margin: "0 1rem",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  top: "-2px",
                  width: "5px",
                  height: "5px",
                  background: "#ff003c",
                }}
              />
            </div>
            {/* <span>VER 2.0.4 [BETA]</span> */}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .card-tunnel-hud {
            inset: 0.75rem !important;
            font-size: 8px !important;
          }
          .card-tunnel-hud > div:nth-child(2) {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}