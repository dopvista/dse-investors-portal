// ── src/pages/ProfilePage.jsx ─────────────────────────────────────
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { C } from "../components/ui";
import { ROLE_META } from "../lib/constants";
import AvatarCropModal from "../components/AvatarCropModal";

const BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;
const PW_MAX_DAILY = 3;
const pwKey = (uid) => `dse_pw_changes_${uid || "unknown"}`;

function getPwChanges(uid) {
  try {
    const raw = JSON.parse(localStorage.getItem(pwKey(uid)) || "{}");
    const today = new Date().toDateString();
    if (raw.date !== today) return { date: today, count: 0 };
    return raw;
  } catch { return { date: new Date().toDateString(), count: 0 }; }
}
function incrementPwChanges(uid) {
  const data = getPwChanges(uid);
  const next = { date: data.date, count: data.count + 1 };
  localStorage.setItem(pwKey(uid), JSON.stringify(next));
  return next.count;
}
function remainingPwChanges(uid) {
  return PW_MAX_DAILY - getPwChanges(uid).count;
}

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

const GENDERS = ["Male", "Female", "Prefer not to say"];

function calcCompletion(form, avatarPreview) {
  const fields = [form.full_name, form.phone, form.nationality, form.postal_address, form.national_id, form.date_of_birth, form.gender, avatarPreview];
  return Math.round((fields.filter(f => f && String(f).trim()).length / fields.length) * 100);
}

// ── Shared input styles ───────────────────────────────────────────
const inp = (extra = {}) => ({
  width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12,
  border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
  background: C.white, color: C.text, transition: "border 0.2s",
  boxSizing: "border-box", ...extra,
});
const focusGreen = (e) => e.target.style.borderColor = C.green;
const blurGray   = (e) => e.target.style.borderColor = C.gray200;

// ── Section card ──────────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 12, marginBottom: 8 }}>
      <div style={{ padding: "7px 12px", borderBottom: `1px solid ${C.gray100}`, display: "flex", alignItems: "center", gap: 6, background: C.gray50, borderRadius: "12px 12px 0 0" }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 10, color: C.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</span>
      </div>
      <div style={{ padding: "10px 12px" }}>{children}</div>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.gray400, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Searchable country dropdown ───────────────────────────────────
function CountrySelect({ value, onChange }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef();

  const filtered = useMemo(() =>
    COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase())), [search]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => { setOpen(o => !o); setSearch(""); }} style={{
        ...inp(), display: "flex", alignItems: "center", justifyContent: "space-between",
        cursor: "pointer", userSelect: "none",
        borderColor: open ? C.green : C.gray200,
      }}>
        <span style={{ color: value ? C.text : "#9ca3af" }}>{value || "Select country"}</span>
        <span style={{ fontSize: 10, color: C.gray400, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0,
          background: C.white, border: `1.5px solid ${C.green}`, borderRadius: 10,
          zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.gray100}` }}>
            <input autoFocus placeholder="🔍 Search country..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 7, fontSize: 12, border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <div style={{ maxHeight: 180, overflowY: "auto" }}>
            {filtered.length === 0
              ? <div style={{ padding: "10px 12px", color: C.gray400, fontSize: 12 }}>No results</div>
              : filtered.map((c, i) => (
                <div key={c} onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                  style={{ padding: "7px 12px", fontSize: 12, cursor: "pointer", background: c === value ? `${C.green}12` : "transparent", color: c === value ? C.green : C.text, fontWeight: c === value ? 700 : 400, borderBottom: i === 0 && c === "Tanzania" ? `1px solid ${C.gray100}` : "none" }}
                  onMouseEnter={e => { if (c !== value) e.currentTarget.style.background = C.gray50; }}
                  onMouseLeave={e => { if (c !== value) e.currentTarget.style.background = "transparent"; }}>
                  {c === "Tanzania" ? "🇹🇿 " : ""}{c}{c === value && <span style={{ float: "right" }}>✓</span>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Change Password Modal ─────────────────────────────────────────
function ChangePasswordModal({ email, session, uid, onClose, showToast }) {
  const [step, setStep]           = useState("send");
  const [otp, setOtp]             = useState("");
  const [newPw, setNewPw]         = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [show, setShow]           = useState({ new: false, confirm: false });
  const [countdown, setCountdown] = useState(0);
  const remaining                 = remainingPwChanges(uid);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const strength = (p) => {
    if (!p) return { score: 0, label: "", color: C.gray200 };
    let s = 0;
    if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
    return [{ score:0,label:"",color:C.gray200 },{ score:1,label:"Weak",color:"#ef4444" },{ score:2,label:"Fair",color:"#f97316" },{ score:3,label:"Good",color:"#eab308" },{ score:4,label:"Strong",color:C.green }][s];
  };
  const pw = strength(newPw);

  const mInp = (extra = {}) => ({ width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 14, border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit", background: C.white, color: C.text, transition: "border 0.2s", boxSizing: "border-box", ...extra });

  const handleSendOtp = async () => {
    if (remaining <= 0) { setError(`Maximum ${PW_MAX_DAILY} changes/day reached. Try tomorrow.`); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/v1/otp`, { method: "POST", headers: { "Content-Type": "application/json", "apikey": KEY }, body: JSON.stringify({ email, type: "email" }) });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error_description || d.message || "Failed to send code"); }
      setStep("verify"); setCountdown(300);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const handleVerifyAndUpdate = async () => {
    setError("");
    if (otp.length < 8)              return setError("Enter the 8-digit code from your email");
    if (newPw.length < 6)            return setError("Password must be at least 6 characters");
    if (newPw !== confirmPw)         return setError("Passwords do not match");
    if (remainingPwChanges(uid) <= 0) return setError("Daily limit reached");
    setLoading(true);
    try {
      const verifyRes  = await fetch(`${BASE}/auth/v1/verify`, { method: "POST", headers: { "Content-Type": "application/json", "apikey": KEY }, body: JSON.stringify({ email, token: otp, type: "email" }) });
      const verifyText = await verifyRes.text();
      if (!verifyRes.ok) { let d = {}; try { d = JSON.parse(verifyText); } catch(_){} throw new Error(d.error_description || d.message || "Invalid or expired code"); }
      const tok = session?.access_token;
      if (!tok) throw new Error("Session expired. Please sign in again.");
      const updateRes = await fetch(`${BASE}/auth/v1/user`, { method: "PUT", headers: { "Content-Type": "application/json", "apikey": KEY, "Authorization": `Bearer ${tok}` }, body: JSON.stringify({ password: newPw }) });
      if (!updateRes.ok) { const d = await updateRes.json().catch(() => ({})); throw new Error(d.error_description || d.message || "Failed to update password"); }
      incrementPwChanges(uid);
      setStep("done");
      showToast(`Password updated! ${remainingPwChanges(uid)} change${remainingPwChanges(uid) !== 1 ? "s" : ""} remaining today.`, "success");
      setTimeout(() => onClose(), 2500);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(10,37,64,0.55)", zIndex: 200, backdropFilter: "blur(2px)" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onMouseDown={e => e.stopPropagation()}>
        <div style={{ background: C.white, borderRadius: 18, overflow: "hidden", width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", animation: "fadeIn 0.25s ease" }}>
          <div style={{ background: C.navy, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 16 }}>Change Password</div>
              <div style={{ color: C.gold, fontSize: 11, marginTop: 2 }}>Verify your identity with a one-time code</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>

          <div style={{ padding: "24px" }}>
            {error && <div style={{ background: "#fef2f2", border: `1px solid #fecaca`, borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: 13, marginBottom: 16 }}>{error}</div>}

            {step === "send" && (
              <>
                <p style={{ fontSize: 13, color: C.gray400, marginBottom: 20 }}>For security, we'll send a one-time verification code to your email before allowing a password change.</p>
                <div style={{ background: C.gray50, border: `1px solid ${C.gray100}`, borderRadius: 9, padding: "10px 13px", fontSize: 13, color: C.gray400, marginBottom: 20 }}>📧 {email}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleSendOtp} disabled={loading || remaining <= 0} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: loading || remaining <= 0 ? C.gray200 : C.green, color: C.white, fontWeight: 700, fontSize: 14, cursor: loading || remaining <= 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                    {loading ? "Sending..." : "Send Verification Code"}
                  </button>
                  <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray400, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                </div>
                {remaining <= 0 && <div style={{ fontSize: 12, color: C.red, marginTop: 10, textAlign: "center" }}>Daily limit reached. Try again tomorrow.</div>}
              </>
            )}

            {step === "verify" && (
              <>
                <p style={{ fontSize: 13, color: C.gray400, marginBottom: 16 }}>An 8-digit code has been sent to <strong>{email}</strong>. Enter it below along with your new password.</p>
                <Field label="Verification Code">
                  <input style={mInp({ letterSpacing: "0.2em", fontWeight: 700, textAlign: "center", fontSize: 18 })} type="text" inputMode="numeric" maxLength={8} placeholder="00000000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))} />
                </Field>
                <Field label="New Password">
                  <div style={{ position: "relative" }}>
                    <input style={mInp({ paddingRight: 44 })} type={show.new ? "text" : "password"} placeholder="At least 6 characters" value={newPw} onChange={e => setNewPw(e.target.value)} />
                    <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.gray400 }}>{show.new ? "🙈" : "👁"}</button>
                  </div>
                  {newPw && (
                    <div style={{ marginTop: 6, display: "flex", gap: 3 }}>
                      {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= pw.score ? pw.color : C.gray100 }} />)}
                      <span style={{ fontSize: 10, color: pw.color, marginLeft: 6, fontWeight: 700 }}>{pw.label}</span>
                    </div>
                  )}
                </Field>
                <Field label="Confirm New Password">
                  <div style={{ position: "relative" }}>
                    <input style={mInp({ paddingRight: 44 })} type={show.confirm ? "text" : "password"} placeholder="Repeat new password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                    <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.gray400 }}>{show.confirm ? "🙈" : "👁"}</button>
                  </div>
                </Field>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={handleVerifyAndUpdate} disabled={loading} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: loading ? C.gray200 : C.green, color: C.white, fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                    {loading ? "Verifying..." : "Update Password"}
                  </button>
                  <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray400, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
                </div>
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <button onClick={countdown > 0 ? null : handleSendOtp} disabled={countdown > 0} style={{ background: "none", border: "none", fontSize: 12, color: countdown > 0 ? C.gray400 : C.green, cursor: countdown > 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                    {countdown > 0 ? `Resend in ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")}` : "Resend code"}
                  </button>
                </div>
              </>
            )}

            {step === "done" && (
              <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                <div style={{ width: 64, height: 64, background: `${C.green}15`, border: `2px solid ${C.green}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>✓</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 6 }}>Password Updated!</div>
                <div style={{ fontSize: 13, color: C.gray400 }}>Your password has been changed successfully.</div>
                <div style={{ fontSize: 12, color: C.gray400, marginTop: 6 }}>{remainingPwChanges(uid)} of {PW_MAX_DAILY} changes remaining today</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main ProfilePage ──────────────────────────────────────────────
export default function ProfilePage({ profile, setProfile, showToast, session, role, email: emailProp }) {
  const email = emailProp || session?.user?.email || session?.email || profile?.email || "";

  const [form, setForm] = useState({
    full_name:      profile?.full_name      || "",
    phone:          profile?.phone          || "",
    nationality:    profile?.nationality    || "",
    postal_address: profile?.postal_address || "",
    national_id:    profile?.national_id    || "",
    date_of_birth:  profile?.date_of_birth  || "",
    gender:         profile?.gender         || "",
  });

  const [avatarPreview,   setAvatarPreview]   = useState(profile?.avatar_url || null);
  const [cropSrc,         setCropSrc]         = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [showPwModal,     setShowPwModal]     = useState(false);
  const [cdsUserCount,    setCdsUserCount]    = useState(1);
  const fileRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Clean up old generic key
  useEffect(() => { localStorage.removeItem("dse_pw_changes"); }, []);

  // Fetch CDS user count via RPC (bypasses RLS)
  useEffect(() => {
    if (!profile?.cds_number) return;
    const tok = session?.access_token || KEY;
    fetch(`${BASE}/rest/v1/rpc/get_cds_user_count`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": KEY, "Authorization": `Bearer ${tok}` },
      body: JSON.stringify({ cds: profile.cds_number }),
    })
      .then(r => r.json())
      .then(count => setCdsUserCount(typeof count === "number" ? count : 1))
      .catch(() => setCdsUserCount(1));
  }, [profile?.cds_number]);

  const accountType     = cdsUserCount > 1 ? "Corporate" : "Individual";
  const completion      = useMemo(() => calcCompletion(form, avatarPreview), [form, avatarPreview]);
  const completionColor = completion >= 80 ? C.green : completion >= 50 ? "#f59e0b" : C.red;
  const roleMeta        = ROLE_META[role] || { label: role || "User", color: C.gray400 };
  const initials        = (form.full_name || email).split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const lastSaved       = profile?.updated_at
    ? new Date(profile.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast("Image must be under 10MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropConfirm = async (blob) => {
    setCropSrc(null);
    setUploadingAvatar(true);
    try {
      const uid = session?.user?.id || profile?.id;
      const tok = session?.access_token || KEY;
      const uploadRes = await fetch(`${BASE}/storage/v1/object/avatars/${uid}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tok}`, "Content-Type": "image/jpeg", "x-upsert": "true" },
        body: blob,
      });
      if (!uploadRes.ok) { const err = await uploadRes.json().catch(() => ({})); throw new Error(err.message || "Upload failed"); }
      const publicUrl = `${BASE}/storage/v1/object/public/avatars/${uid}?t=${Date.now()}`;
      const patchRes = await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": KEY, "Authorization": `Bearer ${tok}`, "Prefer": "return=representation" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });
      if (!patchRes.ok) throw new Error("Failed to save avatar URL");
      const rows = await patchRes.json();
      setProfile(rows[0] || { ...profile, avatar_url: publicUrl });
      setAvatarPreview(publicUrl);
      showToast("Profile picture updated!", "success");
    } catch (err) {
      showToast("Upload failed: " + err.message, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) { showToast("Full name is required", "error"); return; }
    if (!form.phone.trim())     { showToast("Phone number is required", "error"); return; }
    setSaving(true);
    try {
      const tok = session?.access_token || KEY;
      const uid = session?.user?.id || profile?.id;
      const res = await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "apikey": KEY, "Authorization": `Bearer ${tok}`, "Prefer": "return=representation" },
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

  const uid = session?.user?.id || profile?.id;

  return (
    <div style={{ height: "calc(100vh - 118px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        .pcol::-webkit-scrollbar { width: 3px; }
        .pcol::-webkit-scrollbar-track { background: transparent; }
        .pcol::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .pcol { scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
      `}</style>

      {/* Modals */}
      {cropSrc     && <AvatarCropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />}
      {showPwModal && <ChangePasswordModal email={email} session={session} uid={uid} onClose={() => setShowPwModal(false)} showToast={showToast} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: C.gray400 }}>
          Manage your personal information and security settings
          {lastSaved && <span style={{ marginLeft: 8 }}>· Last saved {lastSaved}</span>}
        </div>
        <button onClick={handleSave} disabled={saving} style={{
          display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 9,
          border: "none", background: saving ? C.gray200 : C.green, color: C.white,
          fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "inherit", boxShadow: saving ? "none" : `0 4px 12px ${C.green}44`,
        }}>
          {saving
            ? <><div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Saving...</>
            : <>💾 Save Changes</>}
        </button>
      </div>

      {/* Two-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 12, flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* ── LEFT COLUMN ── */}
        <div className="pcol" style={{ overflowY: "auto", overflowX: "hidden", paddingRight: 3, paddingBottom: 8 }}>

          {/* Profile card */}
          <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
            <div style={{ height: 44, background: `linear-gradient(135deg, ${C.navy} 0%, #1e3a5f 100%)` }} />
            <div style={{ padding: "0 12px 12px", marginTop: -24 }}>

              {/* Avatar */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 6 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%", border: `3px solid ${C.white}`,
                  boxShadow: "0 3px 10px rgba(0,0,0,0.15)", background: avatarPreview ? "transparent" : C.navy,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", cursor: "pointer", fontSize: 16, fontWeight: 800, color: C.white, position: "relative",
                }} onClick={() => !uploadingAvatar && fileRef.current.click()}>
                  {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                  {uploadingAvatar && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                      <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </div>
                  )}
                </div>
                <div onClick={() => fileRef.current.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 17, height: 17, borderRadius: "50%", background: C.green, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 8 }}>📷</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} />
              </div>

              <div style={{ fontWeight: 800, fontSize: 13, color: C.text, lineHeight: 1.2 }}>{form.full_name || "Your Name"}</div>
              <div style={{ fontSize: 10, color: C.gray400, marginTop: 2, marginBottom: 6, fontWeight: 500 }}>{email}</div>

              <div style={{ marginBottom: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: roleMeta.color + "15", border: `1px solid ${roleMeta.color}25`, borderRadius: 20, padding: "2px 8px" }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: roleMeta.color, display: "inline-block" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: roleMeta.color }}>{roleMeta.label}</span>
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 8, padding: "5px 8px", marginBottom: 8 }}>
                <span>🔒</span>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.05em" }}>CDS Number</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{profile?.cds_number || "—"}</div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.04em" }}>Profile complete</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: completionColor }}>{completion}%</span>
              </div>
              <div style={{ height: 4, background: C.gray100, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${completion}%`, background: completionColor, borderRadius: 10, transition: "width 0.5s ease" }} />
              </div>
              {completion < 100 && <div style={{ fontSize: 9, color: C.gray400, marginTop: 3 }}>{completion < 50 ? "Fill in more details" : "Almost there"}</div>}
            </div>
          </div>

          {/* Account Type */}
          <Section title="Account Type" icon="🏦">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: `${C.green}0d`, border: `1.5px solid ${C.green}22`, borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.green }}>{accountType}</div>
                <div style={{ fontSize: 9, color: C.gray400, marginTop: 1 }}>{cdsUserCount} user{cdsUserCount !== 1 ? "s" : ""} on this CDS</div>
              </div>
              <span style={{ fontSize: 18 }}>{accountType === "Corporate" ? "🏢" : "👤"}</span>
            </div>
          </Section>

          {/* Security */}
          <Section title="Security" icon="🔐">
            <button onClick={() => setShowPwModal(true)} style={{
              width: "100%", padding: "7px", borderRadius: 8, border: `1.5px solid ${C.gray200}`,
              background: C.white, color: C.text, fontWeight: 600, fontSize: 12,
              cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.text; }}>
              🔑 Change Password
            </button>
            <div style={{ marginTop: 8, display: "flex", gap: 3, alignItems: "center" }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i <= (PW_MAX_DAILY - remainingPwChanges(uid)) ? C.navy : C.gray100 }} />
              ))}
              <span style={{ fontSize: 9, color: C.gray400, marginLeft: 4, whiteSpace: "nowrap" }}>{remainingPwChanges(uid)}/{PW_MAX_DAILY} today</span>
            </div>
          </Section>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="pcol" style={{ overflowY: "auto", overflowX: "clip", paddingRight: 3, paddingBottom: 8 }}>

          <Section title="Account Information" icon="👤">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Full Name" required>
                <input style={inp()} type="text" placeholder="e.g. Michael Luzigah"
                  value={form.full_name} onChange={e => set("full_name", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
              </Field>
              <Field label="Phone Number" required>
                <input style={inp()} type="tel" placeholder="e.g. +255713262087"
                  value={form.phone} onChange={e => set("phone", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
              </Field>
              <Field label="Gender">
                <select style={{ ...inp(), cursor: "pointer" }} value={form.gender} onChange={e => set("gender", e.target.value)} onFocus={focusGreen} onBlur={blurGray}>
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Date of Birth">
                <input style={inp()} type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="National ID (NIDA)">
                  <input style={inp()} type="text" placeholder="e.g. 19820618114670000123"
                    value={form.national_id} onChange={e => set("national_id", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Contact Details" icon="📍">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Field label="Nationality">
                <CountrySelect value={form.nationality} onChange={v => set("nationality", v)} />
              </Field>
              <div style={{ alignSelf: "start" }}>
                <Field label="Postal Address">
                  <input style={inp({ padding: "5px 10px" })} type="text" placeholder="e.g. P.O. Box 1234, Dar es Salaam"
                    value={form.postal_address} onChange={e => set("postal_address", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
                </Field>
              </div>
            </div>
          </Section>

          {/* Photo tip */}
          <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>📷</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 11, color: C.text }}>Profile Picture</div>
              <div style={{ fontSize: 10, color: C.gray400, lineHeight: 1.4 }}>Click your avatar to upload. Use the crop tool to center your face. Stored permanently at 200×200px.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
