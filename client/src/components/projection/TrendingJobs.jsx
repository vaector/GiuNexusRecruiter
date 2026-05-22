import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const JOBS = [
  {
    id: "NXS-4821",
    title: "Senior Quantum ML Engineer",
    company: "NeuralDyne Corp",
    location: "Neo Tokyo",
    type: "FULL-TIME",
    salary: "$180k \u2013 $260k",
    tags: ["ML", "Quantum", "Python"],
    posted: "2h ago",
    hot: true,
  },
  {
    id: "NXS-7193",
    title: "Blockchain Security Architect",
    company: "ChainVault Systems",
    location: "Orbital Hub",
    type: "CONTRACT",
    salary: "$200k \u2013 $320k",
    tags: ["Solidity", "Rust", "DeFi"],
    posted: "5h ago",
  },
  {
    id: "NXS-3356",
    title: "Neural Interface Designer",
    company: "Synaptic Labs",
    location: "Berlin",
    type: "FULL-TIME",
    salary: "$150k \u2013 $220k",
    tags: ["UX", "Neuro", "BIO"],
    posted: "8h ago",
  },
  {
    id: "NXS-9087",
    title: "Cloud Infrastructure Lead",
    company: "CloudForge",
    location: "Remote",
    type: "REMOTE",
    salary: "$140k \u2013 $200k",
    tags: ["K8s", "AWS", "Terraform"],
    posted: "12h ago",
  },
  {
    id: "NXS-1124",
    title: "Cyber Threat Analyst",
    company: "ShieldNet",
    location: "Singapore",
    type: "FULL-TIME",
    salary: "$130k \u2013 $190k",
    tags: ["SOC", "Pentest", "ZeroTrust"],
    posted: "1d ago",
  },
  {
    id: "NXS-6650",
    title: "AI Research Scientist",
    company: "DeepMind Nexus",
    location: "London",
    type: "FULL-TIME",
    salary: "$220k \u2013 $350k",
    tags: ["NLP", "PyTorch", "Research"],
    posted: "3h ago",
    hot: true,
  },
];

const TYPE_COLORS = {
  "FULL-TIME": "#00e5cc",
  CONTRACT: "#f0c040",
  REMOTE: "#a78bfa",
};

function JobCard({ job, index }) {
  const [hovered, setHovered] = useState(false);
  const accentColor = TYPE_COLORS[job.type] || "#00e5cc";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        background: hovered
          ? "rgba(12, 20, 30, 0.85)"
          : "rgba(8, 14, 24, 0.55)",
        border: `1px solid ${hovered ? accentColor : "rgba(255,255,255,0.08)"}`,
        borderRadius: "4px",
        padding: "1.5rem",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        cursor: "pointer",
        overflow: "hidden",
        boxShadow: hovered
          ? `0 0 30px ${accentColor}22, 0 0 60px ${accentColor}11, 0 8px 32px rgba(0,0,0,0.4)`
          : "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "-1px",
          left: "-1px",
          width: hovered ? "100%" : "10px",
          height: hovered ? "100%" : "10px",
          borderTop: `1px solid ${accentColor}`,
          borderLeft: `1px solid ${accentColor}`,
          transition: "all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "absolute",
          bottom: "-1px",
          right: "-1px",
          width: hovered ? "100%" : "10px",
          height: hovered ? "100%" : "10px",
          borderBottom: `1px solid ${accentColor}`,
          borderRight: `1px solid ${accentColor}`,
          transition: "all 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "0.75rem",
          marginBottom: "1rem",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontSize: "0.7rem",
            color: accentColor,
            letterSpacing: "0.12em",
          }}
        >
          {job.id}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {job.hot && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                color: "#ff003c",
                textTransform: "uppercase",
                animation: "hotPulse 2s ease-in-out infinite",
              }}
            >
              \u25CF HOT
            </span>
          )}
          <span
            style={{
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              color: accentColor,
              border: `1px solid ${accentColor}44`,
              padding: "0.15rem 0.5rem",
              borderRadius: "2px",
            }}
          >
            {job.type}
          </span>
        </div>
      </div>

      <h3
        style={{
          fontFamily:
            "'Syncopate', 'Inter', system-ui, sans-serif",
          fontSize: "1.1rem",
          fontWeight: 700,
          color: "#eaf2ff",
          lineHeight: 1.3,
          margin: "0 0 0.5rem 0",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
        }}
      >
        {job.title}
      </h3>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          marginBottom: "1rem",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            color: "rgba(234,242,255,0.6)",
          }}
        >
          {job.company}
        </span>
        <span
          style={{
            fontSize: "0.6rem",
            color: "rgba(234,242,255,0.25)",
          }}
        >
          \u2022
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            color: "rgba(234,242,255,0.4)",
          }}
        >
          {job.location}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          marginBottom: "1.25rem",
        }}
      >
        {job.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "0.6rem",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.1em",
              color: "rgba(234,242,255,0.5)",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "0.2rem 0.55rem",
              borderRadius: "2px",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "0.75rem",
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#eaf2ff",
            letterSpacing: "0.02em",
          }}
        >
          {job.salary}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.65rem",
            color: "rgba(234,242,255,0.35)",
            letterSpacing: "0.05em",
          }}
        >
          {job.posted}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "1.25rem",
          right: "1.25rem",
          fontSize: "3.5rem",
          fontWeight: 900,
          color: "rgba(234,242,255,0.03)",
          fontFamily: "'Syncopate', sans-serif",
          lineHeight: 1,
          pointerEvents: "none",
          transition: "color 0.3s ease",
        }}
      >
        0{index + 1}
      </div>
    </div>
  );
}

export default function TrendingJobs() {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    const el = sectionRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        position: "relative",
        background: "#030303",
        padding: "6rem 2rem 8rem",
        minHeight: "100vh",
        zIndex: 3,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,229,204,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ marginBottom: "4rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              marginBottom: "0.75rem",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                color: "#00e5cc",
                textTransform: "uppercase",
              }}
            >
              // SIGNAL_ACQUIRED
            </span>
            <div
              style={{
                flex: 1,
                height: "1px",
                background:
                  "linear-gradient(to right, rgba(0,229,204,0.3), transparent)",
              }}
            />
          </div>

          <h2
            style={{
              fontFamily:
                "'Syncopate', 'Inter', system-ui, sans-serif",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              color: "#eaf2ff",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              margin: "0 0 0.5rem 0",
            }}
          >
            Trending Jobs
          </h2>

          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.8rem",
              color: "rgba(234,242,255,0.4)",
              letterSpacing: "0.05em",
              margin: 0,
            }}
          >
            TOP OPPORTUNITIES MATCHING YOUR PROFILE // {JOBS.length} RESULTS
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {JOBS.map((job, i) => (
            <div
              key={job.id}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transition: `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`,
              }}
            >
              <Link
                to={`/jobs/${job.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <JobCard job={job} index={i} />
              </Link>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "3rem",
          }}
        >
          <Link
            to="/jobs"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#00e5cc",
              border: "1px solid rgba(0,229,204,0.3)",
              padding: "0.75rem 2rem",
              borderRadius: "2px",
              textDecoration: "none",
              transition:
                "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#00e5cc";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(0,229,204,0.15)";
              e.currentTarget.style.background =
                "rgba(0,229,204,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor =
                "rgba(0,229,204,0.3)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "transparent";
            }}
          >
            Browse All Jobs
            <span
              style={{
                display: "inline-block",
                transition: "transform 0.2s ease",
              }}
            >
              \u2192
            </span>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes hotPulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}