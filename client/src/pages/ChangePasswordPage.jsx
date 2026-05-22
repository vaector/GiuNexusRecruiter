// Form with currentPassword, newPassword, confirmNewPassword
// Calls PATCH /api/v1/profile/change-password
// Shows inline error for incorrect current password
import { useState } from "react";
import { profileAPI } from "../services/api";

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (form.newPassword !== form.confirmNewPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setSaving(true);
    try {
      await profileAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage("Password updated.");
      setForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "6rem 1.5rem 3rem" }}>
      <p className="nexus-eyebrow">Security</p>
      <h1 style={{ margin: "0.25rem 0 1rem" }}>Change password</h1>
      <form className="nexus-glass-panel" onSubmit={submit} style={{ display: "grid", gap: "1rem" }}>
        {error && <p style={{ color: "#ef4444" }}>{error}</p>}
        {message && <p style={{ color: "var(--accent)" }}>{message}</p>}
        <input
          className="nexus-input"
          type="password"
          placeholder="Current password"
          value={form.currentPassword}
          onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
          required
        />
        <input
          className="nexus-input"
          type="password"
          placeholder="New password"
          value={form.newPassword}
          onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
          required
          minLength={6}
        />
        <input
          className="nexus-input"
          type="password"
          placeholder="Confirm new password"
          value={form.confirmNewPassword}
          onChange={(event) => setForm({ ...form, confirmNewPassword: event.target.value })}
          required
          minLength={6}
        />
        <button className="nexus-btn primary" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Update password"}
        </button>
      </form>
    </section>
  );
}