// ── src/pages/ProfileSetupPage.jsx ────────────────────────────────
// Shown once after registration — collects mandatory profile fields
import { useState } from "react";
import { sbUpsertProfile } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

const ACCOUNT_TYPES = ["Individual", "Joint", "Corporate"];

export default function ProfileSetupPage({ session, onComplete }) {
  const email = session?.user?.email || session?.email || "";

  const [form, setForm] = useState({
    full_name:    "",
    cds_number:   "",
    phone:        "",
    account_type: "Individual",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.full_name.trim())  return setError("Full name is required");
    if (!form.cds_number.trim()) return setError("CDS number is required");
    if (!form.phone.trim())      return setError("Phone number is required");
    setSaving(true);
    try {
      const profile = await sbUpsertProfile(form);
      onComplete(profile);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Shared styles ──────────────────────────────────────────────
  const inp = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: C.gray50, color: C.text, transition: "border 0.2s",
  };
  const label = (text, required) => (
    <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
      {text} {required && <span style={{ color: C.red }}>*</span>}
    </label>
  );

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.navy, fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div style={{
        background: C.white, borderRadius: 20, padding: "40px 36px",
        width: "100%", maxWidth: 480,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        animation: "fadeIn 0.35s ease",
      }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={logo} alt="DSE" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover", marginBottom: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }} />
          <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>Complete Your Profile</div>
          <div style={{ fontSize: 13, color: C.gray400, marginTop: 4 }}>Signed in as {email}</div>
          <div style={{ marginTop: 10, background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#16a34a" }}>
            Please fill in your details to continue
          </div>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: `1px solid #fecaca`, color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            {label("Full Name", true)}
            <input style={inp} type="text" placeholder="e.g. Michael Luzigah" value={form.full_name}
              onChange={e => set("full_name", e.target.value)}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200} />
          </div>

          {/* CDS Number */}
          <div style={{ marginBottom: 16 }}>
            {label("CDS Number", true)}
            <input style={inp} type="text" placeholder="e.g. CDS-647305" value={form.cds_number}
              onChange={e => set("cds_number", e.target.value)}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200} />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            {label("Phone Number", true)}
            <input style={inp} type="tel" placeholder="e.g. +255713262087" value={form.phone}
              onChange={e => set("phone", e.target.value)}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200} />
          </div>

          {/* Account Type */}
          <div style={{ marginBottom: 28 }}>
            {label("Account Type", true)}
            <div style={{ display: "flex", gap: 10 }}>
              {ACCOUNT_TYPES.map(t => (
                <button key={t} type="button" onClick={() => set("account_type", t)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid`,
                  borderColor: form.account_type === t ? C.green : C.gray200,
                  background: form.account_type === t ? `${C.green}12` : C.white,
                  color: form.account_type === t ? C.green : C.gray400,
                  fontWeight: form.account_type === t ? 700 : 500,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  transition: "all 0.15s",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving} style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: saving ? C.gray200 : C.green, color: C.white,
            fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "background 0.2s",
          }}>
            {saving ? "Saving..." : "Continue to Portal →"}
          </button>

          <div style={{ fontSize: 12, color: C.gray400, textAlign: "center", marginTop: 12 }}>
            You can add more details later in My Profile
          </div>
        </form>
      </div>
    </div>
  );
}
