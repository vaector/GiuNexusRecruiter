import { Link } from "react-router-dom";

const LAST_UPDATED = "May 23, 2026";

export default function TermsPage() {
  return (
    <div style={page}>
      <div style={bg} aria-hidden="true" />
      <div style={container}>
        <Link to="/" style={back}>← Back</Link>
        <p style={eyebrow}>Legal</p>
        <h1 style={title}>Terms of Service</h1>
        <p style={sub}>Last updated: {LAST_UPDATED}</p>

        <div style={body}>
          <Section heading="1. Acceptance of Terms">
            By accessing or using the GIU Nexus platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not access or use the Service. These Terms apply to all visitors, users, and others who access the Service.
          </Section>

          <Section heading="2. Description of Service">
            GIU Nexus is an AI-powered career and talent matching platform that connects job seekers with recruiters. The Service includes job listings, AI-based job recommendations, application management, messaging, document management, and related features.
          </Section>

          <Section heading="3. User Accounts">
            <ul style={ul}>
              <li>You must be at least 16 years old to create an account.</li>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
              <li>You must provide accurate, current, and complete information when creating an account.</li>
              <li>Recruiter accounts are subject to admin approval before full access is granted.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </Section>

          <Section heading="4. Acceptable Use">
            You agree not to:
            <ul style={ul}>
              <li>Post false, misleading, or fraudulent job listings.</li>
              <li>Impersonate any person or entity.</li>
              <li>Harvest or scrape user data from the platform.</li>
              <li>Use automated bots or scripts to interact with the Service.</li>
              <li>Upload malicious files, viruses, or harmful code.</li>
              <li>Harass, abuse, or threaten other users.</li>
              <li>Circumvent or attempt to circumvent any access controls or security features.</li>
              <li>Use the Service for any unlawful purpose or in violation of any regulations.</li>
            </ul>
          </Section>

          <Section heading="5. Job Listings and Applications">
            Recruiters are solely responsible for the accuracy and legality of job listings they post. GIU Nexus does not guarantee the accuracy of any listing or the outcome of any application. We reserve the right to remove any listing that violates these Terms or applicable law without notice.
          </Section>

          <Section heading="6. AI-Generated Content">
            The Service uses AI to provide job recommendations, AI match scores, and cover letter suggestions. These are provided for informational purposes only and do not constitute professional career advice. AI-generated content may contain errors. You assume full responsibility for relying on or submitting AI-generated content.
          </Section>

          <Section heading="7. Intellectual Property">
            The Service and its original content, features, and functionality are and will remain the exclusive property of GIU Nexus and its licensors. You may not copy, modify, distribute, sell, or lease any part of the Service without our express written permission. Content you upload (e.g., CVs, cover letters) remains your property, but you grant us a limited licence to display it to relevant recruiters as part of the Service.
          </Section>

          <Section heading="8. Privacy">
            Your use of the Service is also governed by our <Link to="/privacy" style={link}>Privacy Policy</Link>, which is incorporated into these Terms by reference.
          </Section>

          <Section heading="9. Disclaimers">
            The Service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. GIU Nexus does not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components.
          </Section>

          <Section heading="10. Limitation of Liability">
            To the maximum extent permitted by applicable law, GIU Nexus and its affiliates, officers, employees, agents, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages — including loss of profits, data, goodwill, or other intangible losses — arising out of or related to your use of the Service, even if we have been advised of the possibility of such damages.
          </Section>

          <Section heading="11. Indemnification">
            You agree to defend, indemnify, and hold harmless GIU Nexus and its affiliates from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Service.
          </Section>

          <Section heading="12. Termination">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease. All provisions of these Terms that by their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, and limitations of liability.
          </Section>

          <Section heading="13. Governing Law">
            These Terms shall be governed by and construed in accordance with the laws of the Arab Republic of Egypt, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Cairo, Egypt.
          </Section>

          <Section heading="14. Changes to Terms">
            We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the "Last updated" date at the top of this page. Your continued use of the Service after changes take effect constitutes your acceptance of the revised Terms.
          </Section>

          <Section heading="15. Contact Us">
            Questions about the Terms of Service should be sent to:<br /><br />
            <strong>GIU Nexus — Legal</strong><br />
            German International University, New Administrative Capital, Egypt<br />
            Email: <a href="mailto:legal@giunexus.app" style={link}>legal@giunexus.app</a>
          </Section>
        </div>

        <div style={footer}>
          <Link to="/privacy" style={link}>Privacy Policy</Link>
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
