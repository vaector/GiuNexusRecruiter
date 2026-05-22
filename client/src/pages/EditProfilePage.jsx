import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { profileAPI } from "../services/api";

export default function EditProfilePage() {
  const { setUser } = useContext(AuthContext);
  const [form, setForm] = useState({ name: "", bio: "" });
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await profileAPI.getMyProfile();
        const user = res.data.user || {};
        setForm({ name: user.name || "", bio: user.bio || "" });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("bio", form.bio);
      if (profilePicture) data.append("profilePicture", profilePicture);
      const res = await profileAPI.updateMyProfile(data);
      setUser?.(res.data.user);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <EditProfileShell>
      <div className="ep-header">
        <p className="nexus-eyebrow">Account</p>
        <h1>Edit profile</h1>
        <p>Update your personal details and profile picture.</p>
      </div>

      {loading ? (
        <section className="ep-state-card">
          <p className="nexus-eyebrow">Loading</p>
          <h2>Retrieving profile</h2>
          <p>Your profile data is being loaded.</p>
        </section>
      ) : (
        <form className="ep-card" onSubmit={submit}>
          {error && <div className="ep-error">{error}</div>}
          {message && <div className="ep-success">{message}</div>}

          <section className="ep-form-section">
            <h2 className="ep-section-title">Personal Information</h2>
            <div className="ep-grid-2">
              <div className="ep-field">
                <label className="ep-label">Name <span className="ep-required">*</span></label>
                <input className="ep-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="ep-field">
                <label className="ep-label">Profile picture</label>
                <input className="ep-input" type="file" accept="image/*" onChange={(e) => setProfilePicture(e.target.files?.[0] || null)} />
              </div>
            </div>
          </section>

          <section className="ep-form-section">
            <h2 className="ep-section-title">About</h2>
            <div className="ep-field">
              <label className="ep-label">Bio</label>
              <textarea className="ep-input ep-textarea" rows={6} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
          </section>

          <div className="ep-submit-row">
            <button className="nexus-btn primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      )}
    </EditProfileShell>
  );
}

const EditProfileShell = ({ children }) => (
  <main className="ep-page">
    <div className="ep-bg-grid" aria-hidden="true" />
    <div className="ep-vignette" aria-hidden="true" />
    <div className="ep-grain" aria-hidden="true" />
    <div className="ep-container">{children}</div>

    <style>{`
      .ep-page {
        min-height: calc(100vh - 64px);
        position: relative;
        overflow: hidden;
        padding: clamp(6rem, 11vh, 7.5rem) clamp(1rem, 4vw, 3rem) clamp(3rem, 7vh, 5rem);
        background:
          linear-gradient(135deg, rgba(0, 229, 204, 0.08), transparent 34%),
          radial-gradient(circle at 78% 16%, rgba(0, 229, 204, 0.12), transparent 28%),
          var(--bg-base);
      }

      .ep-bg-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
        opacity: 0.35;
      }

      .ep-grain {
        position: absolute;
        inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        opacity: 0.05;
        pointer-events: none;
        z-index: 0;
      }

      .ep-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.6) 120%);
        pointer-events: none;
        z-index: 0;
      }

      .ep-container {
        width: min(780px, 100%);
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }

      .ep-header {
        margin-bottom: 1.5rem;
      }

      .ep-header h1 {
        font-family: var(--font-display);
        font-size: clamp(1.85rem, 4vw, 3rem);
        line-height: 1.08;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-primary);
        letter-spacing: 0;
        overflow-wrap: anywhere;
        margin-top: 0.75rem;
      }

      .ep-header p:not(.nexus-eyebrow),
      .ep-state-card p:not(.nexus-eyebrow) {
        max-width: 680px;
        margin-top: 0.9rem;
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1.7;
      }

      .ep-card {
        border: 1px solid var(--border-glow);
        border-radius: var(--rounded-md);
        background: var(--bg-surface-solid);
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48), 0 0 1px rgba(0, 229, 204, 0.3);
        padding: clamp(1.5rem, 3vw, 2rem);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .ep-state-card {
        border: 1px solid var(--border-glow);
        border-radius: var(--rounded-md);
        background: var(--bg-surface-solid);
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48), 0 0 1px rgba(0, 229, 204, 0.3);
        padding: clamp(1.25rem, 3vw, 1.5rem);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
        width: min(620px, 100%);
        margin: 0 auto;
        text-align: center;
      }

      .ep-state-card h2 {
        margin-top: 0.7rem;
        font-family: var(--font-display);
        font-size: clamp(1.35rem, 3vw, 1.8rem);
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0;
      }

      .ep-error {
        background: rgba(255, 60, 80, 0.1);
        border: 1px solid rgba(255, 60, 80, 0.3);
        color: #ff9aa5;
        border-radius: 4px;
        padding: 0.85rem 1rem;
        font-size: 0.86rem;
      }

      .ep-success {
        background: rgba(0, 229, 204, 0.08);
        border: 1px solid rgba(0, 229, 204, 0.3);
        color: var(--accent);
        border-radius: 4px;
        padding: 0.85rem 1rem;
        font-size: 0.86rem;
      }

      .ep-form-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .ep-section-title {
        font-size: 0.7rem;
        font-family: var(--font-mono);
        font-weight: 600;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--accent);
        margin: 0;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--border-glass);
      }

      .ep-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .ep-field {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }

      .ep-label {
        font-family: var(--font-mono);
        font-size: 0.65rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-secondary);
      }

      .ep-required {
        color: var(--accent);
        font-weight: 700;
      }

      .ep-input {
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-primary);
        border-radius: 4px;
        padding: 0.65rem 0.75rem;
        font-size: 0.9rem;
        font-family: inherit;
        outline: none;
        transition: border-color 0.15s;
        width: 100%;
        box-sizing: border-box;
      }

      .ep-input:focus {
        border-color: rgba(0, 229, 204, 0.45);
      }

      .ep-input::placeholder {
        color: var(--text-tertiary);
      }

      .ep-textarea {
        resize: vertical;
        min-height: 120px;
      }

      .ep-submit-row {
        display: flex;
        justify-content: flex-end;
        padding-top: 0.5rem;
      }

      @media (max-width: 620px) {
        .ep-page {
          padding: 5.5rem 1rem 2rem;
        }

        .ep-header h1 {
          font-size: clamp(1.5rem, 9vw, 2.1rem);
          line-height: 1.12;
        }

        .ep-grid-2 {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  </main>
);
