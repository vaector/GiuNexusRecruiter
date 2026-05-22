import { Link } from "react-router-dom";

const LAST_UPDATED = "May 23, 2026";

export default function PrivacyPage() {
  return (
    <div style={page}>
      <div style={bg} aria-hidden="true" />
      <div style={container}>
        <Link to="/" style={back}>← Back</Link>
        <p style={eyebrow}>Legal</p>
        <h1 style={title}>Privacy Policy</h1>
        <p style={sub}>Last updated: {LAST_UPDATED}</p>

        <div style={body}>
          <Section heading="1. Introduction">
            GIU Nexus ("we", "our", or "us") operates the GIU Nexus platform (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this policy carefully. If you disagree with its terms, please discontinue use of the Service immediately.
          </Section>

          <Section heading="2. Information We Collect">
            We collect information you provide directly to us, including:
            <ul style={ul}>
              <li><strong>Account data:</strong> name, email address, password (hashed), and role (job seeker or recruiter).</li>
              <li><strong>Profile data:</strong> bio, skills, profile picture, and CV documents you choose to upload.</li>
              <li><strong>Application data:</strong> cover letters, applications submitted, and referral codes.</li>
              <li><strong>Communication data:</strong> messages sent through our in-platform messaging system.</li>
              <li><strong>Usage data:</strong> pages visited, features used, search queries, and saved searches — collected automatically via server logs.</li>
              <li><strong>Device data:</strong> IP address, browser type, operating system, and time zone — collected automatically.</li>
            </ul>
          </Section>

          <Section heading="3. How We Use Your Information">
            We use the information we collect to:
            <ul style={ul}>
              <li>Create and manage your account.</li>
              <li>Match job seekers with relevant job listings using AI-powered similarity scoring.</li>
              <li>Facilitate communication between job seekers and recruiters.</li>
              <li>Send transactional notifications (application updates, messages, saved-search alerts).</li>
              <li>Detect and prevent fraudulent or abusive activity.</li>
              <li>Comply with legal obligations.</li>
              <li>Improve the platform through anonymised analytics.</li>
            </ul>
            We do not sell your personal data to third parties for marketing purposes.
          </Section>

          <Section heading="4. Sharing of Information">
            We may share your information with:
            <ul style={ul}>
              <li><strong>Recruiters:</strong> When you apply to a job, the recruiter sees your profile, CV, and cover letter.</li>
              <li><strong>Service providers:</strong> Third-party vendors who assist us in operating the platform (e.g., cloud storage via Cloudinary, database hosting, AI inference via Hugging Face). These providers are contractually bound to protect your data.</li>
              <li><strong>Law enforcement:</strong> When required by law, court order, or governmental authority.</li>
              <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets.</li>
            </ul>
          </Section>

          <Section heading="5. Data Retention">
            We retain your personal data for as long as your account is active or as needed to provide the Service. You may request deletion of your account at any time by contacting us. Certain records may be retained for longer periods where required by law or for legitimate business purposes such as fraud prevention.
          </Section>

          <Section heading="6. Security">
            We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS), bcrypt password hashing, JWT-based authentication with short expiry tokens, multi-factor authentication (TOTP) support, and regular security audits. No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.
          </Section>

          <Section heading="7. Your Rights">
            Depending on your jurisdiction, you may have the right to:
            <ul style={ul}>
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Request deletion of your data ("right to be forgotten").</li>
              <li>Object to or restrict certain processing activities.</li>
              <li>Data portability (receive your data in a machine-readable format).</li>
            </ul>
            To exercise any of these rights, contact us at the address below.
          </Section>

          <Section heading="8. Cookies">
            We use only essential session cookies required for authentication. We do not use advertising or tracking cookies. You can configure your browser to refuse cookies, but this may affect your ability to log in.
          </Section>

          <Section heading="9. Children's Privacy">
            The Service is not directed to individuals under the age of 16. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will delete it immediately.
          </Section>

          <Section heading="10. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Last updated" date. Continued use of the Service after changes take effect constitutes acceptance of the revised policy.
          </Section>

          <Section heading="11. Contact Us">
            For privacy-related questions or requests, contact us at:<br /><br />
            <strong>GIU Nexus — Data Controller</strong><br />
            German International University, New Administrative Capital, Egypt<br />
            Email: <a href="mailto:privacy@giunexus.app" style={link}>privacy@giunexus.app</a>
          </Section>
        </div>

        <div style={footer}>
          <Link to="/terms" style={link}>Terms of Service</Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <Link to="/contact" style={link}>Contact</Link>
        </div>
      </div>
      <Styles />
    </div>
  );
}

const Section = ({ heading, children }) => (
  <div style={{ marginBottom: "2rem" }}>
    <h2 style={h2}>{heading}</h2>
    <p style={p}>{children}</p>
  </div>
);

const Styles = () => (
  <style>{`
    .legal-page a:hover { color: #00e5cc !important; }
  `}</style>
);

const TEAL = "#00e5cc";
const MONO = "'JetBrains Mono','Fira Code',monospace";

const page = { minHeight: "100vh", background: "#030303", color: "#eaf2ff", padding: "96px 1.5rem 5rem", position: "relative", fontFamily: "'Inter',system-ui,sans-serif" };
const bg = { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize: "42px 42px", opacity: 0.35, pointerEvents: "none", zIndex: 0 };
const container = { maxWidth: 760, margin: "0 auto", position: "relative", zIndex: 1 };
const back = { fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.4)", textDecoration: "none", letterSpacing: "0.08em", display: "inline-block", marginBottom: "1.5rem" };
const eyebrow = { fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.5rem" };
const title = { fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, textTransform: "uppercase", margin: "0 0 0.5rem", lineHeight: 1.1 };
const sub = { fontFamily: MONO, fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 3rem", letterSpacing: "0.06em" };
const body = { borderLeft: "1px solid rgba(0,229,204,0.12)", paddingLeft: "1.5rem" };
const h2 = { fontFamily: MONO, fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, margin: "0 0 0.6rem" };
const p = { fontSize: 14, lineHeight: 1.8, color: "rgba(234,242,255,0.7)", margin: 0 };
const ul = { paddingLeft: "1.25rem", margin: "0.5rem 0 0", lineHeight: 1.9 };
const link = { color: TEAL, textDecoration: "none" };
const footer = { marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "1rem", alignItems: "center", fontFamily: MONO, fontSize: 11 };
