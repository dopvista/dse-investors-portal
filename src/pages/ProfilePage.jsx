// ── src/pages/ProfilePage.jsx ─────────────────────────────────────
import { useState, useRef, useMemo } from "react";
import { C } from "../components/ui";
import { ROLE_META } from "../App";

const BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Country list — Tanzania first, rest alphabetical ──────────────
const COUNTRIES = [
  "Tanzania",
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium",
  "Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei",
  "Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Cape Verde",
  "Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo",
  "Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica",
  "Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea",
  "Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia",
  "Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein",
  "Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta",
  "Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco",
  "Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal",
  "Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia",
  "Norway","Oman","Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay",
  "Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
  "Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa",
  "San Marino","São Tomé and Príncipe","Saudi Arabia","Senegal","Serbia","Seychelles",
  "Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa",
  "South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland",
  "Syria","Taiwan","Tajikistan","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago",
  "Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Vatican City",
  "Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

// ── Completion calculator ─────────────────────────────────────────
function calcCompletion(form, avatarPreview) {
  const fields = [
    form.full_name, form.phone, form.nationality,
    form.postal_address, form.nida, form.date_of_birth,
    form.gender, avatarPreview,
  ];
  const filled = fields.filter(f => f && String(f).trim()).length;
  return Math.round((filled / fields.length) * 100);
}

// ── Section card wrapper ──────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.gray100}`, display: "flex", alignItems: "center", gap: 8, background: C.gray50 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
      </div>
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
}

// ── Field row ────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: C.gray400, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Shared input style ────────────────────────────────────────────
const inp = (extra = {}) => ({
  width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 14,
  border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
  background: C.white, color: C.text, transition: "border 0.2s",
  boxSizing: "border-box", ...extra,
});

const inpReadOnly = {
  width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 14,
  border: `1.5px solid ${C.gray100}`, fontFamily: "inherit",
  background: C.gray50, color: C.gray400, boxSizing: "border-box",
  cursor: "not-allowed", fontWeight: 600,
};

export default function ProfilePage({ profile, setProfile, showToast, session, role }) {
  const email = session?.user?.email || session?.email || profile?.email || "";

  const [form, setForm] = useState({
    full_name:      profile?.full_name      || "",
    phone:          profile?.phone          || "",
    account_type:   profile?.account_type   || "Individual",
    nationality:    profile?.nationality    || "",
    postal_address: profile?.postal_address || "",
    nida:           profile?.nida           || "",
    date_of_birth:  profile?.date_of_birth  || "",
    gender:         profile?.gender         || "",
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [pwMode,        setPwMode]        = useState(false);
  const [pwForm,        setPwForm]        = useState({ current: "", next: "", confirm: "" });
  const [pwLoading,     setPwLoading]     = useState(false);
  const [showPw,        setShowPw]        = useState({ current: false, next: false, confirm: false });
  const fileRef = useRef();

  const set  = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setPw = (k, v) => setPwForm(p => ({ ...p, [k]: v }));

  const completion   = useMemo(() => calcCompletion(form, avatarPreview), [form, avatarPreview]);
  const completionColor = completion >= 80 ? C.green : completion >= 50 ? "#f59e0b" : C.red;

  const roleMeta  = ROLE_META[role] || { label: role || "User", color: C.gray400 };
  const initials  = (form.full_name || email).split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const lastSaved = profile?.updated_at
    ? new Date(profile.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  // ── Avatar upload ─────────────────────────────────────────────
  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast("Image must be under 2MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  // ── Save profile ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.full_name.trim()) { showToast("Full name is required", "error"); return; }
    if (!form.phone.trim())     { showToast("Phone number is required", "error"); return; }
    setSaving(true);
    try {
      const tok = session?.access_token || KEY;
      const uid = session?.user?.id || profile?.id;
      const res = await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
        method:  "PATCH",
        headers: {
          "Content-Type": "application/json", "apikey": KEY,
          "Authorization": `Bearer ${tok}`, "Prefer": "return=representation",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      const rows = await res.json();
      setProfile(rows[0] || { ...profile, ...form });
      showToast("Profile saved successfully!", "success");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ───────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.next || pwForm.next.length < 6) { showToast("New password must be at least 6 characters", "error"); return; }
    if (pwForm.next !== pwForm.confirm)          { showToast("Passwords do not match", "error"); return; }
    setPwLoading(true);
    try {
      const tok = session?.access_token || KEY;
      const res = await fetch(`${BASE}/auth/v1/user`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", "apikey": KEY, "Authorization": `Bearer ${tok}` },
        body:    JSON.stringify({ password: pwForm.next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error_description || d.message || "Failed to update password");
      }
      showToast("Password updated successfully!", "success");
      setPwMode(false);
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setPwLoading(false);
    }
  };

  const ACCOUNT_TYPES = ["Individual", "Joint", "Corporate"];
  const GENDERS       = ["Male", "Female", "Prefer not to say"];

  const focusGreen = (e) => e.target.style.borderColor = C.green;
  const blurGray   = (e) => e.target.style.borderColor = C.gray200;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder, textarea::placeholder, select::placeholder { color: #9ca3af; }
        select option { color: #111827; }
      `}</style>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: C.text }}>My Profile</div>
          <div style={{ fontSize: 13, color: C.gray400, marginTop: 2 }}>
            Manage your personal information and security settings
            {lastSaved && <span style={{ marginLeft: 10, color: C.gray400, fontSize: 12 }}>· Last saved {lastSaved}</span>}
          </div>
        </div>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 24px", borderRadius: 10, border: "none",
            background: saving ? C.gray200 : C.green, color: C.white,
            fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "all 0.2s", boxShadow: saving ? "none" : `0 4px 12px ${C.green}44`,
          }}
        >
          {saving
            ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving...</>
            : <><span style={{ fontSize: 15 }}>💾</span> Save Changes</>
          }
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

        {/* ══ LEFT COLUMN ═══════════════════════════════════════════ */}
        <div>

          {/* Profile card */}
          <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
            {/* Navy banner */}
            <div style={{ height: 72, background: `linear-gradient(135deg, ${C.navy} 0%, #1e3a5f 100%)` }} />

            <div style={{ padding: "0 20px 20px", marginTop: -36 }}>
              {/* Avatar */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  border: `3px solid ${C.white}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  background: avatarPreview ? "transparent" : C.navy,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", cursor: "pointer",
                  fontSize: 24, fontWeight: 800, color: C.white,
                }}
                  onClick={() => fileRef.current.click()}
                >
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials
                  }
                </div>
                {/* Camera overlay */}
                <div
                  onClick={() => fileRef.current.click()}
                  style={{
                    position: "absolute", bottom: 0, right: 0,
                    width: 24, height: 24, borderRadius: "50%",
                    background: C.green, border: `2px solid ${C.white}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", fontSize: 11,
                  }}
                >📷</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatar} />
              </div>

              <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{form.full_name || "Your Name"}</div>
              <div style={{ fontSize: 12, color: C.gray400, marginTop: 2, marginBottom: 10 }}>{email}</div>

              {/* Role badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: roleMeta.color + "18", border: `1px solid ${roleMeta.color}33`, borderRadius: 20, padding: "4px 12px", marginBottom: 14 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: roleMeta.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: roleMeta.color }}>{roleMeta.label}</span>
              </div>

              {/* CDS pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 8, padding: "7px 12px", marginBottom: 14 }}>
                <span style={{ fontSize: 13 }}>🔒</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.05em" }}>CDS Number</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>{profile?.cds_number || "—"}</div>
                </div>
              </div>

              {/* Completion bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile complete</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: completionColor }}>{completion}%</span>
                </div>
                <div style={{ height: 6, background: C.gray100, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${completion}%`, background: completionColor, borderRadius: 10, transition: "width 0.5s ease" }} />
                </div>
                {completion < 100 && (
                  <div style={{ fontSize: 11, color: C.gray400, marginTop: 5 }}>
                    {completion < 50 ? "Fill in more details to complete your profile" : "Almost there — a few fields remaining"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Account type card */}
          <Section title="Account Type" icon="🏦">
            <div style={{ display: "flex", gap: 8 }}>
              {ACCOUNT_TYPES.map(t => (
                <button key={t} type="button" onClick={() => set("account_type", t)} style={{
                  flex: 1, padding: "9px 0", borderRadius: 9,
                  border: `1.5px solid ${form.account_type === t ? C.green : C.gray200}`,
                  background: form.account_type === t ? `${C.green}12` : C.white,
                  color: form.account_type === t ? C.green : C.gray400,
                  fontWeight: form.account_type === t ? 700 : 500,
                  fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </Section>

          {/* Security section */}
          <Section title="Security" icon="🔐">
            {/* Email — read only */}
            <Field label="Email Address">
              <div style={{ ...inpReadOnly, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>📧</span>
                <span style={{ fontSize: 13 }}>{email || "—"}</span>
              </div>
              <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>Email cannot be changed</div>
            </Field>

            {!pwMode ? (
              <button
                onClick={() => setPwMode(true)}
                style={{
                  width: "100%", padding: "10px", borderRadius: 9,
                  border: `1.5px solid ${C.gray200}`, background: C.white,
                  color: C.text, fontWeight: 600, fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.background = C.navy; e.currentTarget.style.color = C.white; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.background = C.white; e.currentTarget.style.color = C.text; }}
              >
                🔑 Change Password
              </button>
            ) : (
              <div style={{ animation: "fadeIn 0.2s ease" }}>
                {[
                  { key: "next",    label: "New Password",     placeholder: "Min. 6 characters" },
                  { key: "confirm", label: "Confirm Password", placeholder: "Repeat new password" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 10, position: "relative" }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: C.gray400, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
                    <input
                      type={showPw[f.key] ? "text" : "password"}
                      placeholder={f.placeholder}
                      value={pwForm[f.key]}
                      onChange={e => setPw(f.key, e.target.value)}
                      style={{ ...inp(), paddingRight: 40 }}
                      onFocus={focusGreen} onBlur={blurGray}
                    />
                    <button type="button" onClick={() => setShowPw(s => ({ ...s, [f.key]: !s[f.key] }))}
                      style={{ position: "absolute", right: 10, bottom: 10, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: C.gray400 }}>
                      {showPw[f.key] ? "🙈" : "👁️"}
                    </button>
                  </div>
                ))}
                {pwForm.next && pwForm.confirm && (
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: pwForm.next === pwForm.confirm ? C.green : C.red }}>
                    {pwForm.next === pwForm.confirm ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={handleChangePassword} disabled={pwLoading} style={{
                    flex: 1, padding: "9px", borderRadius: 9, border: "none",
                    background: pwLoading ? C.gray200 : C.green, color: C.white,
                    fontWeight: 700, fontSize: 13, cursor: pwLoading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {pwLoading
                      ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Updating...</>
                      : "Update"}
                  </button>
                  <button onClick={() => { setPwMode(false); setPwForm({ current: "", next: "", confirm: "" }); }} style={{
                    flex: 1, padding: "9px", borderRadius: 9,
                    border: `1.5px solid ${C.gray200}`, background: C.white,
                    color: C.gray400, fontWeight: 600, fontSize: 13,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </Section>
        </div>

        {/* ══ RIGHT COLUMN ══════════════════════════════════════════ */}
        <div>

          {/* Account Information */}
          <Section title="Account Information" icon="👤">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Full Name" required>
                <input style={inp()} type="text" placeholder="e.g. Naomi Maguya"
                  value={form.full_name} onChange={e => set("full_name", e.target.value)}
                  onFocus={focusGreen} onBlur={blurGray} />
              </Field>

              <Field label="Phone Number" required>
                <input style={inp()} type="tel" placeholder="e.g. +255713262087"
                  value={form.phone} onChange={e => set("phone", e.target.value)}
                  onFocus={focusGreen} onBlur={blurGray} />
              </Field>

              <Field label="Gender">
                <select style={{ ...inp(), cursor: "pointer" }}
                  value={form.gender} onChange={e => set("gender", e.target.value)}
                  onFocus={focusGreen} onBlur={blurGray}>
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>

              <Field label="Date of Birth">
                <input style={inp()} type="date"
                  value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)}
                  onFocus={focusGreen} onBlur={blurGray} />
              </Field>

              <Field label="National ID (NIDA)">
                <input style={inp()} type="text" placeholder="e.g. 19820618114670000123"
                  value={form.nida} onChange={e => set("nida", e.target.value)}
                  onFocus={focusGreen} onBlur={blurGray} />
              </Field>

              <Field label="CDS Number">
                <div style={inpReadOnly}>
                  🔒 {profile?.cds_number || "—"}
                </div>
                <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>Assigned by administrator</div>
              </Field>
            </div>
          </Section>

          {/* Contact Details */}
          <Section title="Contact Details" icon="📍">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Nationality">
                <select
                  style={{ ...inp(), cursor: "pointer" }}
                  value={form.nationality}
                  onChange={e => set("nationality", e.target.value)}
                  onFocus={focusGreen} onBlur={blurGray}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Postal Address">
                <input style={inp()} type="text" placeholder="e.g. P.O. Box 1234, Dar es Salaam"
                  value={form.postal_address} onChange={e => set("postal_address", e.target.value)}
                  onFocus={focusGreen} onBlur={blurGray} />
              </Field>
            </div>
          </Section>

          {/* Profile photo tip */}
          <div style={{ background: `${C.gold}12`, border: `1px solid ${C.gold}44`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>Profile Picture</div>
              <div style={{ fontSize: 12, color: C.gray400, lineHeight: 1.6 }}>
                Click your avatar on the left to upload a photo. Max size 2MB. Your photo is stored temporarily and will reset on next login — permanent storage coming soon.
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
