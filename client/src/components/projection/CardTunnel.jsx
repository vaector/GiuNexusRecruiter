import { useEffect, useRef, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { jobsAPI } from "../../services/api";

const COLORS = ["#00e5cc", "#ff003c", "#ccff00", "#f0c040", "#a78bfa", "#ffffff"];
const Z_GAP = 600;

const fmtSalary = (s) => {
  if (!s) return null;
  if (typeof s === "string") return s;
  const cur = s.currency || "USD";
  const min = s.min;
  const max = s.max;
  const period = s.period === "yearly" ? "/yr" : s.period === "monthly" ? "/mo" : s.period === "hourly" ? "/hr" : "";
  if (min && max) return `${cur} ${min.toLocaleString()}–${max.toLocaleString()}${period}`;
  if (min) return `${cur} ${min.toLocaleString()}${period}`;
  return null;
};

const fmtLocation = (l) => {
  if (!l) return "Remote";
  if (typeof l === "string") return l;
  return [l.city, l.country].filter(Boolean).join(", ") || "Remote";
};

const formatJobForCard = (job, index) => {
  const salaryStr = fmtSalary(job.salary);
  const locationStr = fmtLocation(job.location);
  return {
    id: job._id || `JOB-${index}`,
    title: job.title || "Untitled Position",
    company: job.companyName || job.company || "Unknown Company",
    type: job.type || "FT",
    tags: [job.category, locationStr, salaryStr].filter(Boolean).join(" · ") || "Details TBD",
    category: job.category || "Other",
    location: locationStr,
    salary: salaryStr || "Competitive",
    postedAt: job.createdAt || new Date().toISOString(),
    viewCount: job.viewCount || 0,
  };
};

const EmptyCardPlaceholder = ({ index, total }) => (
  <div style={{
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: "0.5rem",
    opacity: 0.4,
  }}>
    <div style={{
      fontSize: "0.7rem",
      fontFamily: "'JetBrains Mono', monospace",
      color: "rgba(255,255,255,0.3)",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
    }}>
      No more jobs to show
    </div>
    <div style={{
      fontSize: "0.6rem",
      fontFamily: "'JetBrains Mono', monospace",
      color: "rgba(255,255,255,0.15)",
    }}>
      {index} of {total} slots
    </div>
  </div>
);

const TRENDING_SEQUENCE = [
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

const RECOMMENDED_SEQUENCE = [
  { type: "heading", text: "RECOMMENDED" },
  { type: "card", rec: true },
  { type: "card", rec: true },
  { type: "card", rec: true },
  { type: "card", rec: true },
  { type: "card", rec: true },
  { type: "card", rec: true },
  { type: "heading", text: "RECOMMENDED" },
  { type: "card", rec: true },
  { type: "card", rec: true },
  { type: "card", rec: true },
  { type: "card", rec: true },
  { type: "card", rec: true },
  { type: "card", rec: true },
];

export default function CardTunnel({ embedded }) {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [viewingSection, setViewingSection] = useState("trending");
  const [selectedJob, setSelectedJob] = useState(null);
  const [trendingJobs, setTrendingJobs] = useState([]);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);
  const viewportRef = useRef(null);
  const worldRef = useRef(null);
  const velRef = useRef(null);
  const coordRef = useRef(null);
  const itemsRef = useRef([]);
  const selectedJobRef = useRef(null);
  const stateRef = useRef({
    prevScroll: 0,
    velocity: 0,
    targetSpeed: 0,
    mouseX: 0,
    mouseY: 0,
    currentSection: "trending",
  });

  const isJobSeeker = isAuthenticated && user?.role === "jobSeeker";
  const sequence = isJobSeeker
    ? [...TRENDING_SEQUENCE, ...RECOMMENDED_SEQUENCE]
    : TRENDING_SEQUENCE;
  const trendingCount = TRENDING_SEQUENCE.length;

  const handleSelectJob = useCallback((job) => {
    setSelectedJob(job);
  }, []);

  useEffect(() => {
    selectedJobRef.current = handleSelectJob;
  }, [handleSelectJob]);

  useEffect(() => {
    let mounted = true;
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const [trendingRes, recRes] = await Promise.all([
          jobsAPI.getAllJobs({ limit: 50, status: "open" }),
          isJobSeeker ? jobsAPI.getRecommendedJobs().catch((err) => {
            console.warn("Recommended jobs fetch failed:", err);
            return { data: { jobs: [] } };
          }) : Promise.resolve({ data: { jobs: [] } }),
        ]);
        if (mounted) {
          const allJobs = Array.isArray(trendingRes.data?.jobs) ? trendingRes.data.jobs : (Array.isArray(trendingRes.data) ? trendingRes.data : []);
          console.log("Fetched trending jobs:", allJobs.length, allJobs);
          const trending = [...allJobs]
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .map(formatJobForCard);
            
          const recData = Array.isArray(recRes.data?.jobs) ? recRes.data.jobs : (Array.isArray(recRes.data) ? recRes.data : []);
          const recommended = recData.map(formatJobForCard);
          console.log("Processed trending:", trending.length, "recommended:", recommended.length);
          setTrendingJobs(trending);
          setRecommendedJobs(recommended);
        }
      } catch (err) {
        console.error("Failed to fetch jobs for tunnel:", err);
        if (mounted) {
          setTrendingJobs([]);
          setRecommendedJobs([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchJobs();
    return () => { mounted = false; };
  }, [isJobSeeker]);

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

    const currentSequence = isJobSeeker
      ? [...TRENDING_SEQUENCE, ...RECOMMENDED_SEQUENCE]
      : TRENDING_SEQUENCE;
    const currentTrendingCount = TRENDING_SEQUENCE.length;

    const items = [];
    let jobIdx = 0;
    let recIdx = 0;

    currentSequence.forEach((entry, i) => {
      const el = document.createElement("div");
      el.style.cssText =
        "position:absolute;left:0;top:0;backface-visibility:hidden;transform-origin:center center;display:flex;align-items:center;justify-content:center;pointer-events:none;";

      if (entry.type === "heading") {
        const txt = document.createElement("div");
        txt.style.cssText =
          "font-size:12vw;font-weight:800;color:transparent;-webkit-text-stroke:2px rgba(255,255,255,0.15);text-transform:uppercase;white-space:nowrap;pointer-events:none;letter-spacing:-0.5rem;mix-blend-mode:overlay;transform:translate(-50%,-50%);font-family:'Syncopate',sans-serif;";
        txt.innerText = entry.text;
        el.appendChild(txt);
        items.push({ el, type: "text", x: 0, y: 0, rot: 0, baseZ: -i * Z_GAP, textEl: txt });
      } else {
        const isRec = entry.rec;
        const pool = isRec ? recommendedJobs : trendingJobs;
        const idx = isRec ? recIdx++ : jobIdx++;
        const poolLen = pool.length;
        const isEmpty = poolLen === 0;
        const job = isEmpty ? null : pool[idx % 6];
        const color = isRec ? "#a78bfa" : COLORS[idx % COLORS.length];

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
          isEmpty ? "cursor:default" : "cursor:pointer",
          "transition:border-color 0.2s ease,box-shadow 0.2s ease,transform 0.2s ease",
        ].join(";");

if (isEmpty) {
          card.innerHTML = [
            '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:0.5rem;opacity:0.4;">',
            '<div style="font-size:0.7rem;font-family:JetBrains Mono,monospace;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;">No jobs available</div>',
            "</div>",
          ].join("");
        } else {
          card.innerHTML = [
            '<div style="border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:0.75rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;">',
            '<span style="font-family:JetBrains Mono,monospace;font-size:0.7rem;color:' + color + ';letter-spacing:0.12em;">' + job.id.substring(0, 8) + "</span>",
            '<span style="font-size:0.6rem;font-weight:600;letter-spacing:0.08em;color:' + color + ";border:1px solid " + color + '66;padding:0.15rem 0.5rem;border-radius:2px;">' + job.type + "</span>",
            "</div>",
            '<h2 style="font-size:1.6rem;line-height:0.9;margin:0;text-transform:uppercase;font-weight:700;color:#fff;font-family:Syncopate,sans-serif;mix-blend-mode:hard-light;">' + job.title + "</h2>",
            '<div style="margin-top:0.5rem;font-family:JetBrains Mono,monospace;font-size:0.75rem;color:rgba(234,242,255,0.5);">' + job.company + "</div>",
            '<div style="margin-top:auto;font-family:JetBrains Mono,monospace;font-size:0.7rem;color:rgba(255,255,255,0.4);display:flex;justify-content:space-between;padding-top:0.75rem;border-top:1px solid rgba(255,255,255,0.06);">' + job.tags + "</div>",
            '<div style="position:absolute;bottom:1.5rem;right:1.5rem;font-size:3.5rem;opacity:0.04;font-weight:900;font-family:Syncopate,sans-serif;line-height:1;">0' + i + "</div>",
          ].join("");
        }

        const before = document.createElement("span");
        before.style.cssText = "position:absolute;top:-1px;left:-1px;width:10px;height:10px;border-top:1px solid rgba(255,255,255,0.3);border-left:1px solid rgba(255,255,255,0.3);pointer-events:none;";
        card.appendChild(before);

        const after = document.createElement("span");
        after.style.cssText = "position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-bottom:1px solid rgba(255,255,255,0.3);border-right:1px solid rgba(255,255,255,0.3);pointer-events:none;";
        card.appendChild(after);

        card.addEventListener("mouseenter", () => {
          if (!isEmpty) {
            card.style.borderColor = "rgba(0, 229, 204, 0.35)";
            card.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.5),0 20px 50px rgba(0,0,0,0.5),0 0 20px rgba(0,229,204,0.15)";
            card.style.transform = "translate(-50%,-50%) scale(1.02)";
          }
        });
        card.addEventListener("mouseleave", () => {
          if (!isEmpty) {
            card.style.borderColor = "rgba(255,255,255,0.08)";
            card.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.5),0 20px 50px rgba(0,0,0,0.5)";
            card.style.transform = "translate(-50%,-50%) scale(1)";
          }
        });
        card.addEventListener("click", (e) => {
          if (!isEmpty) {
            e.stopPropagation();
            selectedJobRef.current(job);
          }
        });

        el.appendChild(card);

        const angle = (i / currentSequence.length) * Math.PI * 6;
        const x = Math.cos(angle) * (window.innerWidth * spreadX);
        const y = Math.sin(angle) * (window.innerHeight * spreadY);
        const rot = (Math.random() - 0.5) * 16;

        items.push({ el, type: "card", x, y, rot, baseZ: -i * Z_GAP });
      }

      world.appendChild(el);
    });

    for (let i = 0; i < 120; i++) {
      const el = document.createElement("div");
      el.style.cssText = "position:absolute;width:2px;height:2px;background:white;transform:translate(-50%,-50%);pointer-events:none;";
      world.appendChild(el);
      items.push({
        el,
        type: "star",
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        baseZ: -(Math.random() * (currentSequence.length * Z_GAP + 2000)),
      });
    }

    itemsRef.current = items;

    const state = stateRef.current;
    state.prevScroll = 0;
    state.velocity = 0;
    state.targetSpeed = 0;
    state.currentSection = "trending";

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

      const cameraZ = localScroll * 3;
      const currentIsJobSeeker = isJobSeeker;
      if (currentIsJobSeeker && currentTrendingCount > 0) {
        const trendingEndZ = currentTrendingCount * Z_GAP;
        const section = cameraZ >= trendingEndZ ? "recommended" : "trending";
        if (state.currentSection !== section) {
          state.currentSection = section;
          setViewingSection(section);
        }
      }

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const relZ = item.baseZ + cameraZ;

        let alpha = 1;
        if (relZ < -3000) alpha = 0;
        else if (relZ < -2000) alpha = (relZ + 3000) / 1000;
        if (relZ > 100 && item.type !== "star") alpha = 1 - (relZ - 100) / 400;
        if (alpha < 0) alpha = 0;

        item.el.style.opacity = alpha;

        if (item.type === "card" && alpha > 0.3) {
          item.el.style.pointerEvents = "auto";
        } else {
          item.el.style.pointerEvents = "none";
        }

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
  }, [isJobSeeker, trendingJobs, recommendedJobs, embedded]);

  const sectionVH = sequence.length > TRENDING_SEQUENCE.length
    ? Math.max(600, Math.ceil(sequence.length * Z_GAP / 900) + 100)
    : 600;

  const handleViewMore = () => {
    if (viewingSection === "recommended") {
      navigate("/jobs/recommended");
    } else {
      navigate("/jobs");
    }
  };

  const handleCloseSelected = () => setSelectedJob(null);

  return (
    <section
      ref={sectionRef}
      className="card-tunnel-section"
      style={{ height: embedded ? "100%" : sectionVH + "vh", position: "relative", background: "#030303" }}
    >
      <div
        className="card-tunnel-viewport"
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "clip",
          cursor: selectedJob ? "pointer" : "crosshair",
        }}
        onClick={selectedJob ? handleCloseSelected : undefined}
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
          </div>
        </div>

        <button
            onClick={(e) => { e.stopPropagation(); handleViewMore(); }}
            style={{
              position: "absolute",
              bottom: "2rem",
              right: "2rem",
              zIndex: 100,
              background: "rgba(0, 229, 204, 0.08)",
              border: "1px solid rgba(0, 229, 204, 0.25)",
              color: "#00e5cc",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "0.55rem 1.4rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 229, 204, 0.15)";
              e.currentTarget.style.borderColor = "rgba(0, 229, 204, 0.5)";
              e.currentTarget.style.boxShadow = "0 0 16px rgba(0, 229, 204, 0.2)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 229, 204, 0.08)";
              e.currentTarget.style.borderColor = "rgba(0, 229, 204, 0.25)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {viewingSection === "recommended" ? "VIEW MORE RECOMMENDED" : "VIEW MORE TRENDING"} &rarr;
          </button>

          {selectedJob && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
            }}
            onClick={(e) => { e.stopPropagation(); setSelectedJob(null); }}
          >
            <div
              style={{
                width: "min(380px, 88vw)",
                background: "rgba(10,10,10,0.85)",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "2rem",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                position: "relative",
                animation: "cardTunnelFadeIn 0.25s ease",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  right: "0.75rem",
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                  padding: "0.25rem",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
              >
                &times;
              </button>
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.75rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: selectedJob.id?.startsWith("REC") ? "#a78bfa" : "#00e5cc", letterSpacing: "0.12em" }}>{selectedJob.id}</span>
                <span style={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", color: selectedJob.id?.startsWith("REC") ? "#a78bfa" : "#00e5cc", border: "1px solid " + (selectedJob.id?.startsWith("REC") ? "#a78bfa66" : "#00e5cc66"), padding: "0.15rem 0.5rem", borderRadius: "2px" }}>{selectedJob.type}</span>
              </div>
              <h2 style={{ fontSize: "1.4rem", lineHeight: 0.9, margin: 0, textTransform: "uppercase", fontWeight: 700, color: "#fff", fontFamily: "'Syncopate', sans-serif" }}>{selectedJob.title}</h2>
              <div style={{ marginTop: "0.5rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.75rem", color: "rgba(234,242,255,0.5)" }}>{selectedJob.company}</div>
              <div style={{ marginTop: "0.5rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>{selectedJob.tags}</div>
              <button
                onClick={() => { setSelectedJob(null); navigate("/jobs"); }}
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "1.5rem",
                  padding: "0.7rem 1rem",
                  background: "rgba(0, 229, 204, 0.1)",
                  border: "1px solid rgba(0, 229, 204, 0.3)",
                  color: "#00e5cc",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 229, 204, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(0, 229, 204, 0.6)";
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 229, 204, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0, 229, 204, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(0, 229, 204, 0.3)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                View Job Details &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cardTunnelFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
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