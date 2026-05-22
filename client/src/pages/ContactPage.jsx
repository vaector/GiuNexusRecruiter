import { Link } from "react-router-dom";

export default function ContactPage() {
  return (
    <div style={page}>
      <div style={bg} aria-hidden="true" />
      <div style={container}>
        <Link to="/" style={back}>← Back</Link>
        <p style={eyebrow}>Get in Touch</p>
        <h1 style={title}>Contact Us</h1>
        <p style={sub}>We're here to help. Reach out through any of the channels below.</p>

        <div style={grid}>
          <Card icon="✉" label="General Enquiries" value="hello@giunexus.app" href="mailto:hello@giunexus.app" />
          <Card icon="⚖" label="Legal & Privacy" value="legal@giunexus.app" href="mailto:legal@giunexus.app" />
          <Card icon="🛡" label="Security Reports" value="security@giunexus.app" href="mailto:security@giunexus.app" />
          <Card icon="📍" label="Address" value="German International University, New Administrative Capital, Cairo Governorate, Egypt" />
        </div>

        <div style={bodySection}>
          <h2 style={h2}>Support Hours</h2>
          <p style={p}>Our support team is available <strong style={{ color: "#eaf2ff" }}>Sunday – Thursday, 9:00 AM – 5:00 PM EET</strong>. We aim to respond to all enquiries within one business day.</p>

          <h2 style={{ ...h2, marginTop: "2rem" }}>Report Abuse or Fraud</h2>
          <p style={p}>
            If you encounter a fraudulent job listing, abusive user, or security vulnerability, please email <a href="mailto:security@giunexus.app" style={link}>security@giunexus.app</a> with details. We take all reports seriously and will investigate promptly.
          </p>

          <h2 style={{ ...h2, marginTop: "2rem" }}>Recruiter Enquiries</h2>
          <p style={p}>
            For questions about recruiter account approvals, job posting policies, or enterprise access, contact <a href="mailto:recruiters@giunexus.app" style={link}>recruiters@giunexus.app</a>.
          </p>
        </div>

        <div style={footer}>
          <Link to="/privacy" style={link}>Privacy Policy</Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <Link to="/terms" style={link}>Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

const Card = ({ icon, label, value, href }) => (
  <div style={card}>
    <span style={cardIcon}>{icon}</span>
    <span style={cardLabel}>{label}</span>
    {href
      ? <a href={href} style={{ ...cardValue, color: "#00e5cc", textDecoration: "none" }}>{value}</a>
      : <span style={cardValue}>{value}</span>
    }
  </div>
);

const TEAL = "#00e5cc";
const MONO = "'JetBrains Mono','Fira Code',monospace";

const page = { minHeight: "100vh", background: "#030303", color: "#eaf2ff", padding: "96px 1.5rem 5rem", position: "relative", fontFamily: "'Inter',system-ui,sans-serif" };
const bg = { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "42px 42px", opacity: 0.35, pointerEvents: "none", zIndex: 0 };
const container = { maxWidth: 760, margin: "0 auto", position: "relative", zIndex: 1 };
const back = { fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", letterSpacing: "0.08em", display: "inline-block", marginBottom: "1.5rem" };
const eyebrow = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.5rem" };
const title = { fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, textTransform: "uppercase", margin: "0 0 0.5rem", lineHeight: 1.1 };
const sub = { fontSize: 15, color: "rgba(234,242,255,0.5)", margin: "0 0 2.5rem", lineHeight: 1.6 };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "2.5rem" };
const card = { background: "rgba(6,12,24,0.9)", border: "1px solid rgba(0,229,204,0.12)", borderRadius: 6, padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" };
const cardIcon = { fontSize: 20 };
const cardLabel = { fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(234,242,255,0.4)" };
const cardValue = { fontSize: 13, color: "rgba(234,242,255,0.75)", lineHeight: 1.6 };
const bodySection = { borderLeft: "1px solid rgba(0,229,204,0.12)", paddingLeft: "1.5rem" };
const h2 = { fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.6rem" };
const p = { fontSize: 14, lineHeight: 1.8, color: "rgba(234,242,255,0.7)", margin: 0 };
const link = { color: TEAL, textDecoration: "none" };
const footer = { marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "1rem", alignItems: "center", fontFamily: MONO, fontSize: 11 };
