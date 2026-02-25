// ── src/pages/ProfilePage.jsx ─────────────────────────────────────
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { C } from "../components/ui";
import { ROLE_META } from "../lib/constants";
import AvatarCropModal from "../components/AvatarCropModal";

const BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Password change rate limit (3 per day, stored in localStorage) ─
const PW_MAX_DAILY  = 3;

// ── Per-user key so counters don't bleed between accounts ─────────
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
    form.postal_address, form.national_id, form.date_of_birth,
    form.gender, avatarPreview || profile?.avatar_url,
  ];
  const filled = fields.filter(f => f && String(f).trim()).length;
  return Math.round((filled / fields.length) * 100);
}

// ── Section card ──────────────────────────────────────────────────
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

// ── Field wrapper ────────────────────────────────────────────────
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

// ── Searchable country dropdown ───────────────────────────────────
function CountrySelect({ value, onChange }) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const ref                 = useRef();

  const filtered = useMemo(() =>
    COUNTRIES.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const inp = {
    width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 14,
    border: `1.5px solid ${open ? C.green : C.gray200}`, outline: "none",
    fontFamily: "inherit", background: C.white, color: C.text,
    transition: "border 0.2s", boxSizing: "border-box", cursor: "pointer",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <div
        onClick={() => { setOpen(o => !o); setSearch(""); }}
        style={{ ...inp, display: "flex", alignItems: "center", justifyContent: "space-between", userSelect: "none" }}
      >
        <span style={{ color: value ? C.text : "#9ca3af" }}>{value || "Select country"}</span>
        <span style={{ fontSize: 11, color: C.gray400, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: C.white, border: `1.5px solid ${C.green}`,
          borderRadius: 10, zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          overflow: "hidden",
        }}>
          {/* Search input */}
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.gray100}` }}>
            <input
              autoFocus
              placeholder="🔍 Search country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13,
                border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
          {/* List */}
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px 14px", color: C.gray400, fontSize: 13 }}>No results</div>
            ) : filtered.map((c, i) => (
              <div
                key={c}
                onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                style={{
                  padding: "9px 14px", fontSize: 13, cursor: "pointer",
                  background: c === value ? `${C.green}12` : "transparent",
                  color: c === value ? C.green : C.text,
                  fontWeight: c === value ? 700 : 400,
                  borderBottom: i === 0 && c === "Tanzania" ? `1px solid ${C.gray100}` : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (c !== value) e.currentTarget.style.background = C.gray50; }}
                onMouseLeave={e => { if (c !== value) e.currentTarget.style.background = "transparent"; }}
              >
                {c === "Tanzania" ? "🇹🇿 " : ""}{c}
                {c === value && <span style={{ float: "right" }}>✓</span>}
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
  // Steps: "send" → "verify" → "done"
  const [step,      setStep]      = useState("send");
  const [otpSent,   setOtpSent]   = useState(false);
  const [otp,       setOtp]       = useState("");
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [show,      setShow]      = useState({ new: false, confirm: false });
  const [countdown, setCountdown] = useState(0);
  const remaining                 = remainingPwChanges(uid);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Password strength
  const strength = (p) => {
    if (!p) return { score: 0, label: "", color: C.gray200 };
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return [
      { score: 0, label: "",       color: C.gray200  },
      { score: 1, label: "Weak",   color: "#ef4444"  },
      { score: 2, label: "Fair",   color: "#f97316"  },
      { score: 3, label: "Good",   color: "#eab308"  },
      { score: 4, label: "Strong", color: C.green    },
    ][s];
  };
  const pw = strength(newPw);

  const inp = (extra = {}) => ({
    width: "100%", padding: "10px 13px", borderRadius: 9, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: C.white, color: C.text, transition: "border 0.2s",
    boxSizing: "border-box", ...extra,
  });

  // ── Step 1: Send OTP ────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (remainingPwChanges(uid) <= 0) {
      setError(`You have reached the maximum of ${PW_MAX_DAILY} password changes today. Try again tomorrow.`);
      return;
    }
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/v1/otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "apikey": KEY },
        body:    JSON.stringify({ email, type: "email" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error_description || d.message || "Failed to send code");
      }
      setOtpSent(true);
      setStep("verify");
      setCountdown(300); // 5 min before resend allowed
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP + update password ───────────────────────
  const handleVerifyAndUpdate = async () => {
    setError("");
    if (otp.length < 8)              return setError("Enter the 8-digit code from your email");
    if (newPw.length < 6)            return setError("New password must be at least 6 characters");
    if (newPw !== confirmPw)         return setError("Passwords do not match");
    if (remainingPwChanges(uid) <= 0) return setError("Daily password change limit reached");

    setLoading(true);
    try {
      // Step 1: Verify OTP — just validates the code, we don't need the returned session
      const verifyRes = await fetch(`${BASE}/auth/v1/verify`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "apikey": KEY },
        body:    JSON.stringify({ email, token: otp, type: "email" }),
      });

      // Log full response for debugging
      const verifyText = await verifyRes.text();
      console.log("Verify response:", verifyRes.status, verifyText);

      if (!verifyRes.ok) {
        let d = {};
        try { d = JSON.parse(verifyText); } catch(_) {}
        throw new Error(d.error_description || d.message || "Invalid or expired code. Please request a new one.");
      }

      // Step 2: Use the existing logged-in session token to update password
      // The user is already authenticated — OTP was just a second factor check
      const existingToken = session?.access_token;
      if (!existingToken) throw new Error("Session expired. Please sign in again.");

      const updateRes = await fetch(`${BASE}/auth/v1/user`, {
        method:  "PUT",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        KEY,
          "Authorization": `Bearer ${existingToken}`,
        },
        body: JSON.stringify({ password: newPw }),
      });

      const updateText = await updateRes.text();
      console.log("Update response:", updateRes.status, updateText);

      if (!updateRes.ok) {
        let d = {};
        try { d = JSON.parse(updateText); } catch(_) {}
        throw new Error(d.error_description || d.message || "Failed to update password");
      }

      // Increment rate limit counter
      incrementPwChanges(uid);
      const newRemaining = remainingPwChanges(uid);

      setStep("done");
      showToast(`Password updated! ${newRemaining} change${newRemaining !== 1 ? "s" : ""} remaining today.`, "success");

      setTimeout(() => onClose(), 2500);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inpReadOnly = {
    ...inp(), background: C.gray50, color: C.gray400,
    cursor: "not-allowed", fontWeight: 600, border: `1.5px solid ${C.gray100}`,
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0, background: "rgba(10,37,64,0.55)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(2px)",
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: C.white, borderRadius: 18, width: "100%", maxWidth: 420,
            margin: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
            animation: "fadeIn 0.25s ease", overflow: "hidden",
          }}
        >
          {/* Modal header */}
          <div style={{ background: C.navy, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 16 }}>Change Password</div>
              <div style={{ color: C.gold, fontSize: 12, marginTop: 2, fontWeight: 600 }}>
                {remaining > 0
                  ? `${remaining} of ${PW_MAX_DAILY} changes remaining today`
                  : "⚠️ Daily limit reached"}
              </div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>

          <div style={{ padding: "24px" }}>

            {/* ── Step: send ── */}
            {step === "send" && (
              <>
                <p style={{ color: C.gray600, fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>
                  For security, we'll send a one-time verification code to your email address before allowing a password change.
                </p>

                {/* Email display */}
                <Field label="Your Email Address">
                  <div style={inpReadOnly}>📧 {email}</div>
                </Field>

                {error && <div style={{ background: "#fef2f2", border: `1px solid #fecaca`, color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{error}</div>}

                {remaining <= 0 ? (
                  <div style={{ background: "#fef2f2", border: `1px solid #fecaca`, color: "#dc2626", borderRadius: 10, padding: "12px 14px", fontSize: 13, textAlign: "center" }}>
                    ⚠️ You have reached the maximum of {PW_MAX_DAILY} password changes today.<br />
                    <span style={{ fontWeight: 600 }}>Please try again tomorrow.</span>
                  </div>
                ) : (
                  <button onClick={handleSendOtp} disabled={loading} style={{
                    width: "100%", padding: "13px", borderRadius: 10, border: "none",
                    background: loading ? C.gray200 : C.green, color: C.white,
                    fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {loading
                      ? <><div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Sending...</>
                      : "📧 Send Verification Code"}
                  </button>
                )}
              </>
            )}

            {/* ── Step: verify ── */}
            {step === "verify" && (
              <>
                <div style={{ background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#16a34a", fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span>✉️</span>
                  <span>An 8-digit code has been sent to <strong>{email}</strong>. Enter it below along with your new password.</span>
                </div>

                {/* OTP input */}
                <Field label="Verification Code">
                  <input
                    style={inp({ letterSpacing: "0.3em", fontWeight: 800, fontSize: 18, textAlign: "center" })}
                    type="text" inputMode="numeric" maxLength={8}
                    placeholder="00000000"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                    onFocus={e => e.target.style.borderColor = C.green}
                    onBlur={e  => e.target.style.borderColor = C.gray200}
                  />
                  {/* Resend */}
                  <div style={{ fontSize: 12, marginTop: 6, color: C.gray400 }}>
                    {countdown > 0
                      ? `Resend available in ${Math.floor(countdown/60)}:${String(countdown%60).padStart(2,"0")}`
                      : <button type="button" onClick={() => { setCountdown(300); handleSendOtp(); }} style={{ background: "none", border: "none", color: C.green, fontWeight: 700, cursor: "pointer", fontSize: 12, padding: 0, fontFamily: "inherit" }}>Resend code</button>
                    }
                  </div>
                </Field>

                {/* New password */}
                <Field label="New Password">
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ ...inp(), paddingRight: 44 }}
                      type={show.new ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={newPw} onChange={e => setNewPw(e.target.value)}
                      onFocus={e => e.target.style.borderColor = C.green}
                      onBlur={e  => e.target.style.borderColor = C.gray200}
                    />
                    <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: C.gray400 }}>
                      {show.new ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {newPw && (
                    <div style={{ marginTop: 7 }}>
                      <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
                        {[1,2,3,4].map(i => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= pw.score ? pw.color : C.gray200, transition: "background 0.3s" }} />
                        ))}
                      </div>
                      {pw.label && <div style={{ fontSize: 11, color: pw.color, fontWeight: 600 }}>{pw.label} password</div>}
                    </div>
                  )}
                </Field>

                {/* Confirm password */}
                <Field label="Confirm Password">
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ ...inp(), paddingRight: 44 }}
                      type={show.confirm ? "text" : "password"}
                      placeholder="Repeat new password"
                      value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                      onFocus={e => e.target.style.borderColor = C.green}
                      onBlur={e  => e.target.style.borderColor = C.gray200}
                    />
                    <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 15, color: C.gray400 }}>
                      {show.confirm ? "🙈" : "👁️"}
                    </button>
                  </div>
                  {confirmPw && (
                    <div style={{ fontSize: 11, marginTop: 5, fontWeight: 600, color: newPw === confirmPw ? C.green : C.red }}>
                      {newPw === confirmPw ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </div>
                  )}
                </Field>

                {error && <div style={{ background: "#fef2f2", border: `1px solid #fecaca`, color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{error}</div>}

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleVerifyAndUpdate} disabled={loading} style={{
                    flex: 2, padding: "12px", borderRadius: 10, border: "none",
                    background: loading ? C.gray200 : C.green, color: C.white,
                    fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    {loading
                      ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Updating...</>
                      : "🔑 Save New Password"}
                  </button>
                  <button onClick={onClose} style={{
                    flex: 1, padding: "12px", borderRadius: 10, border: `1.5px solid ${C.gray200}`,
                    background: C.white, color: C.gray400, fontWeight: 600, fontSize: 14,
                    cursor: "pointer", fontFamily: "inherit",
                  }}>Cancel</button>
                </div>
              </>
            )}

            {/* ── Step: done ── */}
            {step === "done" && (
              <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
                <div style={{
                  width: 64, height: 64, background: `${C.green}15`,
                  border: `2px solid ${C.green}`, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px", fontSize: 28,
                }}>✓</div>
                <div style={{ fontWeight: 800, fontSize: 16, color: C.text, marginBottom: 6 }}>Password Updated!</div>
                <div style={{ fontSize: 13, color: C.gray400 }}>Your password has been changed successfully.</div>
                <div style={{ fontSize: 12, color: C.gray400, marginTop: 6 }}>
                  {remainingPwChanges(uid)} of {PW_MAX_DAILY} changes remaining today
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
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

// ── Main ProfilePage ──────────────────────────────────────────────
export default function ProfilePage({ profile, setProfile, showToast, session, role, email: emailProp }) {
  const email = emailProp || session?.user?.email || session?.email || profile?.email || "";

  const [form, setForm] = useState({
    full_name:      profile?.full_name      || "",
    phone:          profile?.phone          || "",
    account_type:   profile?.account_type   || "Individual",
    nationality:    profile?.nationality    || "",
    postal_address: profile?.postal_address || "",
    national_id:    profile?.national_id    || "",
    date_of_birth:  profile?.date_of_birth  || "",
    gender:         profile?.gender         || "",
  });

  // ── Avatar state ────────────────────────────────────────────────
  const [avatarPreview,  setAvatarPreview]  = useState(profile?.avatar_url || null);
  const [cropSrc,        setCropSrc]        = useState(null);   // raw image for crop modal
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [showPwModal,    setShowPwModal]    = useState(false);
  const fileRef = useRef();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // ── Clean up old generic pw counter key (migration) ─────────────
  useEffect(() => {
    localStorage.removeItem("dse_pw_changes");
  }, []);

  const completion      = useMemo(() => calcCompletion(form, avatarPreview), [form, avatarPreview]);
  const completionColor = completion >= 80 ? C.green : completion >= 50 ? "#f59e0b" : C.red;
  const roleMeta        = ROLE_META[role] || { label: role || "User", color: C.gray400 };
  const initials        = (form.full_name || email).split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const lastSaved       = profile?.updated_at
    ? new Date(profile.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  // ── File selected → open crop modal ─────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast("Image must be under 10MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setCropSrc(ev.target.result); // open crop modal
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  // ── Crop confirmed → resize → upload to Supabase Storage ──────
  const handleCropConfirm = async (blob) => {
    setCropSrc(null);
    setUploadingAvatar(true);
    try {
      const uid      = session?.user?.id || profile?.id;
      const tok      = session?.access_token || KEY;
      const fileName = uid; // overwrite same file = auto-replace

      // Upload blob to avatars/{uid}
      const uploadRes = await fetch(
        `${BASE}/storage/v1/object/avatars/${fileName}`,
        {
          method:  "POST",
          headers: {
            "Authorization": `Bearer ${tok}`,
            "Content-Type":  "image/jpeg",
            "x-upsert":      "true", // overwrite existing
          },
          body: blob,
        }
      );

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.message || err.error || "Upload failed");
      }

      // Build public URL
      const publicUrl = `${BASE}/storage/v1/object/public/avatars/${fileName}?t=${Date.now()}`;

      // Save avatar_url to profile row
      const patchRes = await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
        method:  "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        KEY,
          "Authorization": `Bearer ${tok}`,
          "Prefer":        "return=representation",
        },
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

  const ACCOUNT_TYPES = ["Individual", "Joint", "Corporate"];
  const GENDERS       = ["Male", "Female", "Prefer not to say"];
  const focusGreen    = (e) => e.target.style.borderColor = C.green;
  const blurGray      = (e) => e.target.style.borderColor = C.gray200;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
      `}</style>

      {/* ── Password modal ── */}
      {/* ── Crop modal ── */}
      {cropSrc && (
        <AvatarCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}

      {showPwModal && (
        <ChangePasswordModal
          email={email}
          session={session}
          uid={session?.user?.id || profile?.id}
          onClose={() => setShowPwModal(false)}
          showToast={showToast}
        />
      )}

      {/* ── Page header — NO repeated title, just subtitle + save ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: C.gray400 }}>
          Manage your personal information and security settings
          {lastSaved && <span style={{ marginLeft: 10 }}>· Last saved {lastSaved}</span>}
        </div>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "11px 24px", borderRadius: 10, border: "none",
            background: saving ? C.gray200 : C.green, color: C.white,
            fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "all 0.2s",
            boxShadow: saving ? "none" : `0 4px 12px ${C.green}44`,
          }}
        >
          {saving
            ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving...</>
            : <><span>💾</span> Save Changes</>
          }
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 20, alignItems: "start" }}>

        {/* ══ LEFT COLUMN ══ */}
        <div>

          {/* Profile card */}
          <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
            <div style={{ height: 72, background: `linear-gradient(135deg, ${C.navy} 0%, #1e3a5f 100%)` }} />
            <div style={{ padding: "0 20px 20px", marginTop: -36 }}>

              {/* Avatar — no email below name, just name + role */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  border: `3px solid ${C.white}`, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  background: avatarPreview ? "transparent" : C.navy,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", cursor: "pointer", fontSize: 24, fontWeight: 800, color: C.white,
                  position: "relative",
                }} onClick={() => !uploadingAvatar && fileRef.current.click()}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials}
                  {uploadingAvatar && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                      <div style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </div>
                  )}
                </div>
                <div onClick={() => fileRef.current.click()} style={{
                  position: "absolute", bottom: 0, right: 0, width: 24, height: 24,
                  borderRadius: "50%", background: C.green, border: `2px solid ${C.white}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", fontSize: 11,
                }}>📷</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} />
              </div>

              {/* Name + role only — no email here */}
              <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>{form.full_name || "Your Name"}</div>
              <div style={{ marginTop: 8, marginBottom: 14 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: roleMeta.color + "18", border: `1px solid ${roleMeta.color}33`, borderRadius: 20, padding: "4px 12px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: roleMeta.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: roleMeta.color }}>{roleMeta.label}</span>
                </div>
              </div>

              {/* CDS pill — only here, not in right column */}
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

          {/* Account type */}
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
                }}>{t}</button>
              ))}
            </div>
          </Section>

          {/* Security — email only here, no duplication */}
          <Section title="Security" icon="🔐">
            <Field label="Email Address">
              <div style={{ ...inpReadOnly, display: "flex", alignItems: "center", gap: 8 }}>
                <span>📧</span><span style={{ fontSize: 13 }}>{email || "—"}</span>
              </div>
              <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>Email cannot be changed</div>
            </Field>

            <button
              onClick={() => setShowPwModal(true)}
              style={{
                width: "100%", padding: "10px", borderRadius: 9,
                border: `1.5px solid ${C.gray200}`, background: C.white,
                color: C.text, fontWeight: 600, fontSize: 13,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.white; e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.text; }}
            >
              🔑 Change Password
            </button>

            {/* Daily limit indicator */}
            <div style={{ marginTop: 10, display: "flex", gap: 4, alignItems: "center" }}>
              {[1,2,3].map(i => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 4,
                  background: i <= (PW_MAX_DAILY - remainingPwChanges(session?.user?.id || profile?.id)) ? C.navy : C.gray100,
                  transition: "background 0.3s",
                }} />
              ))}
              <span style={{ fontSize: 10, color: C.gray400, marginLeft: 6, whiteSpace: "nowrap" }}>
                {remainingPwChanges(session?.user?.id || profile?.id)}/{PW_MAX_DAILY} changes today
              </span>
            </div>
          </Section>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div>
          {/* Account Information — no CDS field here */}
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

              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="National ID (NIDA)">
                  <input style={inp()} type="text" placeholder="e.g. 19820618114670000123"
                    value={form.national_id} onChange={e => set("national_id", e.target.value)}
                    onFocus={focusGreen} onBlur={blurGray} />
                </Field>
              </div>
            </div>
          </Section>

          {/* Contact Details */}
          <Section title="Contact Details" icon="📍">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Field label="Nationality">
                <CountrySelect
                  value={form.nationality}
                  onChange={v => set("nationality", v)}
                />
              </Field>
              <Field label="Postal Address">
                <input style={inp()} type="text" placeholder="e.g. P.O. Box 1234, Dar es Salaam"
                  value={form.postal_address} onChange={e => set("postal_address", e.target.value)}
                  onFocus={focusGreen} onBlur={blurGray} />
              </Field>
            </div>
          </Section>

          {/* Photo tip */}
          <div style={{ background: `${C.gold}12`, border: `1px solid ${C.gold}44`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>📷</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: C.text, marginBottom: 3 }}>Profile Picture</div>
              <div style={{ fontSize: 12, color: C.gray400, lineHeight: 1.6 }}>
                Click your avatar to upload a photo. You'll be able to crop and position it before saving. Stored permanently at 200×200px.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
