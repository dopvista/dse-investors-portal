// ── src/pages/ProfilePage.jsx ──────────────────────────────────────
// Full profile edit page — accessible from UserMenu → My Profile
import { useState } from "react";
import { sbUpsertProfile } from "../lib/supabase";
import { C, Btn, SectionCard } from "../components/ui";

const ACCOUNT_TYPES = ["Individual", "Joint", "Corporate"];
const GENDERS       = ["Male", "Female", "Prefer not to say"];

export default function ProfilePage({ profile, setProfile, showToast }) {
  const [form, setForm]     = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [edited, setEdited] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setEdited(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await sbUpsertProfile(form);
      setProfile(updated || form);
      setEdited(false);
      showToast("Profile updated!", "success");
    } catch (err) {
      showToast("Error: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Shared input style ─────────────────────────────────────────
  const inp = (disabled) => ({
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: disabled ? C.gray50 : C.white, color: disabled ? C.gray400 : C.text,
    transition: "border 0.2s", cursor: disabled ? "not-allowed" : "text",
  });

  const Field = ({ label, required, children }) => (
    <div style={{ marginBottom: 20 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
        {label} {required && <span style={{ color: C.red }}>*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: C.text }}>My Profile</div>
          <div style={{ fontSize: 13, color: C.gray400, marginTop: 3 }}>Manage your personal information</div>
        </div>
        {edited && (
          <Btn variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "💾 Save Changes"}
          </Btn>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

        {/* ── Mandatory Info ── */}
        <SectionCard title="Account Information" style={{ gridColumn: "1 / -1" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <Field label="Full Name" required>
              <input style={inp(false)} value={form.full_name || ""} onChange={e => set("full_name", e.target.value)}
                placeholder="Full legal name"
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200} />
            </Field>

            <Field label="CDS Number" required>
              <input style={inp(false)} value={form.cds_number || ""} onChange={e => set("cds_number", e.target.value)}
                placeholder="e.g. CDS-647305"
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200} />
            </Field>

            <Field label="Phone Number" required>
              <input style={inp(false)} value={form.phone || ""} onChange={e => set("phone", e.target.value)}
                placeholder="e.g. +255713262087"
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200} />
            </Field>

            <Field label="Account Type" required>
              <div style={{ display: "flex", gap: 8 }}>
                {ACCOUNT_TYPES.map(t => (
                  <button key={t} type="button" onClick={() => set("account_type", t)} style={{
                    flex: 1, padding: "10px 0", borderRadius: 10, border: "1.5px solid",
                    borderColor: form.account_type === t ? C.green : C.gray200,
                    background: form.account_type === t ? `${C.green}12` : C.white,
                    color: form.account_type === t ? C.green : C.gray400,
                    fontWeight: form.account_type === t ? 700 : 500,
                    fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </SectionCard>

        {/* ── Personal Details ── */}
        <SectionCard title="Personal Details">
          <Field label="National ID (NIDA)">
            <input style={inp(false)} value={form.national_id || ""} onChange={e => set("national_id", e.target.value)}
              placeholder="e.g. 19820618114670000123"
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200} />
          </Field>

          <Field label="Date of Birth">
            <input style={inp(false)} type="date" value={form.date_of_birth || ""}
              onChange={e => set("date_of_birth", e.target.value)}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200} />
          </Field>

          <Field label="Gender">
            <select style={{ ...inp(false), cursor: "pointer" }} value={form.gender || ""}
              onChange={e => set("gender", e.target.value)}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200}>
              <option value="">Select gender</option>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
        </SectionCard>

        {/* ── Contact Details ── */}
        <SectionCard title="Contact Details">
          <Field label="Nationality">
            <input style={inp(false)} value={form.nationality || ""} onChange={e => set("nationality", e.target.value)}
              placeholder="e.g. Tanzanian"
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200} />
          </Field>

          <Field label="Postal Address">
            <textarea style={{ ...inp(false), resize: "vertical", minHeight: 80 }}
              value={form.postal_address || ""} onChange={e => set("postal_address", e.target.value)}
              placeholder="e.g. P.O. Box 1234, Dar es Salaam"
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200} />
          </Field>
        </SectionCard>

      </div>

      {/* Save button at bottom */}
      {edited && (
        <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
          <Btn variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "💾 Save Changes"}
          </Btn>
        </div>
      )}
    </div>
  );
}
