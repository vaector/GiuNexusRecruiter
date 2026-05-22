// Form to update profile fields
// PATCH /api/v1/profile
// Fields: name, bio, profilePicture (file upload via form-data)
// LinkedIn, GitHub, portfolio URL inputs
// Notification preferences section:
//   - email notifications toggle
//   - inApp notifications toggle
// Accessible by any authenticated user
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
    <section style={{ maxWidth: 720, margin: "0 auto", padding: "6rem 1.5rem 3rem" }}>
      <p className="nexus-eyebrow">Account</p>
      <h1 style={{ margin: "0.25rem 0 1rem" }}>Edit profile</h1>
      {loading ? (
        <p>Loading profile...</p>
      ) : (
        <form className="nexus-glass-panel" onSubmit={submit} style={{ display: "grid", gap: "1rem" }}>
          {error && <p style={{ color: "#ef4444" }}>{error}</p>}
          {message && <p style={{ color: "var(--accent)" }}>{message}</p>}
          <label>
            <span>Name</span>
            <input className="nexus-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label>
            <span>Bio</span>
            <textarea className="nexus-input" rows={6} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
          </label>
          <label>
            <span>Profile picture</span>
            <input className="nexus-input" type="file" accept="image/*" onChange={(event) => setProfilePicture(event.target.files?.[0] || null)} />
          </label>
          <button className="nexus-btn primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>
      )}
    </section>
  );
}