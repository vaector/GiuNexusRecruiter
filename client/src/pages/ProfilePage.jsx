import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { profileAPI } from "../services/api";

const ProfilePage = () => {
  const { setUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [extractError, setExtractError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setPageError("");
        const response = await profileAPI.getMyProfile();
        const user = response.data?.user || null;

        if (!isMounted) return;

        setProfile(user);
        if (user) {
          setUser?.(user);
        }
      } catch (error) {
        if (!isMounted) return;

        setPageError(error.response?.data?.message || "Failed to load your profile.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleExtractSkills = async () => {
    setExtractError("");
    setStatusMessage("");

    try {
      setIsExtracting(true);
      const response = await profileAPI.extractSkills();
      const skills = response.data?.skills || response.data?.extracted || [];

      setProfile((currentProfile) => {
        const nextProfile = currentProfile ? { ...currentProfile, skills } : currentProfile;
        if (nextProfile) {
          setUser?.(nextProfile);
        }
        return nextProfile;
      });

      setStatusMessage("Skills updated from your bio.");
    } catch (error) {
      if (error.response?.status === 400) {
        setExtractError(error.response?.data?.message || "Bio is empty. Add a bio before extracting skills.");
        return;
      }

      setExtractError(error.response?.data?.message || "Unable to extract skills right now.");
    } finally {
      setIsExtracting(false);
    }
  };

  const avatarUrl = profile?.profilePicture;
  const initials = (profile?.name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const skills = Array.isArray(profile?.skills) ? profile.skills : [];

  if (loading) {
    return (
      <ProfileShell>
        <section className="profile-state-card">
          <p className="nexus-eyebrow">Job Seeker Profile</p>
          <h1>Loading profile</h1>
          <p>Your profile data is being synced.</p>
        </section>
      </ProfileShell>
    );
  }

  if (pageError) {
    return (
      <ProfileShell>
        <section className="profile-state-card">
          <p className="nexus-eyebrow">Job Seeker Profile</p>
          <h1>Profile unavailable</h1>
          <p>{pageError}</p>
          <button type="button" className="nexus-btn primary profile-state-action" onClick={() => window.location.reload()}>
            Try again
          </button>
        </section>
      </ProfileShell>
    );
  }

  return (
    <ProfileShell>
      <div className="profile-header">
        <p className="nexus-eyebrow">Job Seeker Profile</p>
        <h1>Your profile and extracted skills</h1>
        <p>
          Review your profile details and extract skill chips directly from your bio.
        </p>
      </div>

      <div className="profile-shell">
        <aside className="profile-summary-card">
          <div className="profile-avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${profile?.name || "Profile"} profile`} />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <h2>{profile?.name || "Unnamed profile"}</h2>
          <p>{profile?.bio?.trim() ? profile.bio : "No bio added yet."}</p>

          <button
            type="button"
            className="nexus-btn primary profile-extract-btn"
            onClick={handleExtractSkills}
            disabled={isExtracting}
          >
            {isExtracting ? "Extracting skills..." : "Extract skills from bio"}
          </button>

          {extractError ? (
            <div className="profile-alert error" role="alert" aria-live="assertive">
              {extractError}
            </div>
          ) : null}

          {statusMessage ? (
            <div className="profile-alert success" role="status" aria-live="polite">
              {statusMessage}
            </div>
          ) : null}
        </aside>

        <section className="profile-details-card">
          <div className="profile-section">
            <div className="profile-section-title">Bio</div>
            <p className="profile-bio">
              {profile?.bio?.trim() ? profile.bio : "No bio available."}
            </p>
          </div>

          <div className="profile-section">
            <div className="profile-section-title">Skill Chips</div>
            {skills.length > 0 ? (
              <div className="profile-skills">
                {skills.map((skill) => (
                  <span className="profile-skill-chip" key={skill}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="profile-bio">No skills extracted yet.</p>
            )}
          </div>
        </section>
      </div>
    </ProfileShell>
  );
};

const ProfileShell = ({ children }) => (
  <main className="profile-page">
    <div className="profile-grid" aria-hidden="true" />
    <div className="profile-container">{children}</div>

    <style>{`
      .profile-page {
        min-height: calc(100vh - 64px);
        position: relative;
        overflow: hidden;
        padding: clamp(6rem, 11vh, 7.5rem) clamp(1rem, 4vw, 3rem) clamp(3rem, 7vh, 5rem);
        background:
          linear-gradient(135deg, rgba(0, 229, 204, 0.08), transparent 34%),
          radial-gradient(circle at 78% 16%, rgba(0, 229, 204, 0.12), transparent 28%),
          var(--bg-base);
      }

      .profile-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 42px 42px;
        mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 75%, transparent);
        opacity: 0.35;
      }

      .profile-container {
        width: min(1040px, 100%);
        margin: 0 auto;
        position: relative;
        z-index: 1;
      }

      .profile-header {
        margin-bottom: 1.5rem;
      }

      .profile-header h1,
      .profile-state-card h1 {
        max-width: 760px;
        margin-top: 0.75rem;
        font-family: var(--font-display);
        font-size: clamp(1.85rem, 4vw, 3rem);
        line-height: 1.08;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-primary);
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }

      .profile-header p:not(.nexus-eyebrow),
      .profile-state-card p:not(.nexus-eyebrow) {
        max-width: 660px;
        margin-top: 0.9rem;
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1.7;
      }

      .profile-shell {
        display: grid;
        grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
        gap: clamp(1rem, 3vw, 1.5rem);
        align-items: start;
      }

      .profile-summary-card,
      .profile-details-card,
      .profile-state-card {
        border: 1px solid var(--border-glow);
        border-radius: var(--rounded-md);
        background: var(--bg-surface-solid);
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.48), 0 0 1px rgba(0, 229, 204, 0.3);
        padding: clamp(1.25rem, 3vw, 1.5rem);
        backdrop-filter: blur(22px);
        -webkit-backdrop-filter: blur(22px);
      }

      .profile-summary-card {
        position: sticky;
        top: 88px;
      }

      .profile-avatar {
        width: 104px;
        height: 104px;
        border-radius: 50%;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.25);
        border: 1px solid var(--accent-mid);
        display: grid;
        place-items: center;
        margin-bottom: 1rem;
        box-shadow: 0 0 24px var(--accent-glow);
      }

      .profile-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .profile-avatar span {
        color: var(--accent);
        font-family: var(--font-mono);
        font-size: 1.65rem;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .profile-summary-card h2 {
        margin-bottom: 0.55rem;
        font-family: var(--font-display);
        font-size: clamp(1.25rem, 3vw, 1.6rem);
        line-height: 1.15;
        color: var(--text-primary);
        text-transform: uppercase;
        letter-spacing: 0;
        overflow-wrap: anywhere;
      }

      .profile-summary-card > p,
      .profile-bio {
        color: var(--text-muted);
        line-height: 1.75;
        white-space: pre-wrap;
      }

      .profile-extract-btn {
        width: 100%;
        min-height: 46px;
        margin-top: 1.25rem;
      }

      .profile-alert {
        margin-top: 0.9rem;
        padding: 0.85rem 0.95rem;
        border-radius: var(--rounded-md);
        font-size: 0.86rem;
        line-height: 1.5;
      }

      .profile-alert.error {
        border: 1px solid rgba(255, 78, 110, 0.35);
        background: rgba(255, 78, 110, 0.08);
        color: #ff8ca3;
      }

      .profile-alert.success {
        border: 1px solid var(--accent-mid);
        background: var(--accent-dim);
        color: var(--accent);
      }

      .profile-section + .profile-section {
        margin-top: 1.85rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-glass);
      }

      .profile-section-title {
        margin-bottom: 0.75rem;
        color: var(--text-secondary);
        font-family: var(--font-mono);
        font-size: 0.68rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }

      .profile-skills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }

      .profile-skill-chip {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        border: 1px solid var(--accent-mid);
        border-radius: var(--rounded-pill);
        background: var(--accent-dim);
        color: var(--accent);
        padding: 0.35rem 0.75rem;
        font-family: var(--font-mono);
        font-size: 0.68rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .profile-state-card {
        width: min(560px, 100%);
        margin: 0 auto;
        text-align: center;
      }

      .profile-state-card h1,
      .profile-state-card p {
        margin-left: auto;
        margin-right: auto;
      }

      .profile-state-action {
        min-height: 46px;
        margin-top: 1.4rem;
      }

      @media (max-width: 860px) {
        .profile-shell {
          grid-template-columns: 1fr;
        }

        .profile-summary-card {
          position: static;
        }
      }

      @media (max-width: 520px) {
        .profile-page {
          padding: 5.5rem 1rem 2rem;
        }

        .profile-summary-card,
        .profile-details-card,
        .profile-state-card {
          padding: 1.25rem;
        }

        .profile-header h1,
        .profile-state-card h1 {
          font-size: clamp(1.5rem, 9vw, 2.1rem);
          line-height: 1.12;
        }
      }
    `}</style>
  </main>
);

export default ProfilePage;
