import { Link } from "react-router-dom";

const PAGES = {
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    body: "This page is a placeholder for the NEXUS privacy policy. Add details here about data collection, account information, application activity, analytics, and user rights before release.",
  },
  terms: {
    eyebrow: "Terms",
    title: "Terms of Service",
    body: "This page is a placeholder for the NEXUS terms of service. Add details here about platform use, account responsibilities, recruiter activity, job listings, and acceptable conduct before release.",
  },
  contact: {
    eyebrow: "Contact",
    title: "Contact",
    body: "This page is a placeholder for NEXUS contact information. Add support channels, business inquiries, response expectations, and escalation details before release.",
  },
};

function PublicInfoPage({ type }) {
  const page = PAGES[type];

  return (
    <section
      style={{
        minHeight: "60vh",
        background:
          "radial-gradient(circle at top right, rgba(0,229,204,0.12), transparent 34%), #030303",
        padding: "96px 6% 80px",
      }}
    >
      <div
        style={{
          maxWidth: 820,
          margin: "0 auto",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 4,
          background: "rgba(8,12,24,0.58)",
          padding: "clamp(28px, 5vw, 48px)",
        }}
      >
        <span className="nexus-eyebrow">{page.eyebrow}</span>
        <h1 className="nexus-display-md" style={{ marginTop: 14 }}>
          {page.title}
        </h1>
        <p
          className="nexus-body-lg"
          style={{ marginTop: 20, lineHeight: 1.8, maxWidth: 680 }}
        >
          {page.body}
        </p>
        <Link to="/" className="nexus-btn secondary" style={{ marginTop: 32 }}>
          Back Home
        </Link>
      </div>
    </section>
  );
}

export function PrivacyPage() {
  return <PublicInfoPage type="privacy" />;
}

export function TermsPage() {
  return <PublicInfoPage type="terms" />;
}

export function ContactPage() {
  return <PublicInfoPage type="contact" />;
}
