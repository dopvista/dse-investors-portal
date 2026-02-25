// ── src/pages/ProfileSetupPage.jsx ────────────────────────────────
import { useState, useEffect } from "react";
import { sbSignOut, sbGetProfile } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

const ACCOUNT_TYPES = ["Individual", "Joint", "Corporate"];

export default function ProfileSetupPage({ session, onComplete, onCancel }) {
  const email = session?.user?.email || session?.email || "";
  const uid   = session?.user?.id    || session?.id    || "";

  const [form, setForm] = useState({
    full_name:    "",
    cds_number:   "",
    phone:        "",
    account_type: "Individual",
  });
  const [cdsLocked,   setCdsLocked]   = useState(false); // true when CDS was pre-seeded
  const [saving,      setSaving]      = useState(false);
  const [cancelling,  setCancelling]  = useState(false);
  const [checking,    setChecking]    = useState(true);  // loading pre-seeded profile
  const [error,       setError]       = useState("");

  const BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
  const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const tok  = session?.access_token || KEY;

  // ── On mount: fetch any pre-seeded profile row ───────────────────
  // The edge function seeds { id, cds_number, account_type } when SA/AD
  // creates a new user. If cds_number is already set we lock that field.
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
          headers: {
            "Content-Type":  "application/json",
            "apikey":        KEY,
            "Authorization": `Bearer ${tok}`,
          },
        });
        if (res.ok) {
          const rows = await res.json();
          const p    = rows[0];
          if (p) {
            setForm(prev => ({
              ...prev,
              cds_number:   p.cds_number   || "",
              account_type: p.account_type || "Individual",
              full_name:    p.full_name    || "",
              phone:        p.phone        || "",
            }));
            // Lock CDS if it was pre-seeded by the edge function
            if (p.cds_number) setCdsLocked(true);
          }
        }
      } catch (_) {
        // Non-fatal — user just fills everything in manually
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.full_name.trim())  return setError("Full name is required");
    if (!form.cds_number.trim()) return setError("CDS number is required");
    if (!form.phone.trim())      return setError("Phone number is required");
    setSaving(true);
    try {
      // Try PATCH first (profile row already exists from edge function seed)
      const patchRes = await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        KEY,
          "Authorization": `Bearer ${tok}`,
          "Prefer":        "return=representation",
        },
        body: JSON.stringify({
          full_name:    form.full_name.trim(),
          cds_number:   form.cds_number.trim(),
          phone:        form.phone.trim(),
          account_type: form.account_type,
        }),
      });

      if (patchRes.ok) {
        const rows = await patchRes.json();
        // PATCH returns empty array if no row matched — fall through to INSERT
        if (rows && rows.length > 0) {
          onComplete(rows[0]);
          return;
        }
      }

      // No existing row — INSERT fresh
      const insertRes = await fetch(`${BASE}/rest/v1/profiles`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "apikey":        KEY,
          "Authorization": `Bearer ${tok}`,
          "Prefer":        "return=representation",
        },
        body: JSON.stringify({
          id:           uid,
          full_name:    form.full_name.trim(),
          cds_number:   form.cds_number.trim(),
          phone:        form.phone.trim(),
          account_type: form.account_type,
        }),
      });

      if (!insertRes.ok) throw new Error(await insertRes.text());
      const rows = await insertRes.json();
      onComplete(rows[0] || { ...form, id: uid });

    } catch (err) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    await sbSignOut();
    if (onCancel) onCancel();
    else window.location.reload();
  };

  // ── Shared styles ──────────────────────────────────────────────
  const inp = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: C.gray50, color: C.text, transition: "border 0.2s",
    boxSizing: "border-box",
  };

  const inpLocked = {
    ...inp,
    background:  "#f0fdf4",
    border:      `1.5px solid #bbf7d0`,
    color:       C.green,
    fontWeight:  700,
    cursor:      "not-allowed",
  };

  const lbl = (text, required) => (
    <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
      {text} {required && <span style={{ color: C.red }}>*</span>}
    </label>
  );

  // ── Loading pre-seeded data ──────────────────────────────────────
  if (checking) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.navy }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.2)`, borderTop: `2px solid ${C.green}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.navy, fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to   { transform: rotate(360deg); } }
        input::placeholder { color: #9ca3af; }
      `}</style>

      <div style={{
        background: C.white, borderRadius: 20, padding: "40px 36px",
        width: "100%", maxWidth: 480,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        animation: "fadeIn 0.35s ease",
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={logo} alt="DSE" style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover", marginBottom: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }} />
          <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>Complete Your Profile</div>
          <div style={{ fontSize: 13, color: C.gray400, marginTop: 4 }}>Signed in as {email}</div>

          {/* CDS locked notice — shown when CDS was pre-assigned */}
          {cdsLocked ? (
            <div style={{ marginTop: 10, background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              🔒 CDS {form.cds_number} has been assigned to your account
            </div>
          ) : (
            <div style={{ marginTop: 10, background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#16a34a" }}>
              Please fill in your details to continue
            </div>
          )}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{ background: "#fef2f2", border: `1px solid #fecaca`, color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            {lbl("Full Name", true)}
            <input
              style={inp} type="text" placeholder="e.g. Naomi Maguya"
              value={form.full_name} onChange={e => set("full_name", e.target.value)}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200}
            />
          </div>

          {/* CDS Number — locked if pre-assigned, editable otherwise */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              {lbl("CDS Number", true)}
              {cdsLocked && (
                <span style={{ fontSize: 11, color: C.green, fontWeight: 700, background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 6, padding: "2px 8px" }}>
                  🔒 Pre-assigned
                </span>
              )}
            </div>
            <input
              style={cdsLocked ? inpLocked : inp}
              type="text"
              placeholder="e.g. CDS-647305"
              value={form.cds_number}
              onChange={e => { if (!cdsLocked) set("cds_number", e.target.value); }}
              readOnly={cdsLocked}
              onFocus={e => { if (!cdsLocked) e.target.style.borderColor = C.green; }}
              onBlur={e  => { if (!cdsLocked) e.target.style.borderColor = C.gray200; }}
            />
            {cdsLocked && (
              <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>
                This CDS number was assigned by your administrator and cannot be changed.
              </div>
            )}
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            {lbl("Phone Number", true)}
            <input
              style={inp} type="tel" placeholder="e.g. +255713262087"
              value={form.phone} onChange={e => set("phone", e.target.value)}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e  => e.target.style.borderColor = C.gray200}
            />
          </div>

          {/* Account Type */}
          <div style={{ marginBottom: 28 }}>
            {lbl("Account Type", true)}
            <div style={{ display: "flex", gap: 10 }}>
              {ACCOUNT_TYPES.map(t => (
                <button key={t} type="button" onClick={() => set("account_type", t)} style={{
                  flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid`,
                  borderColor: form.account_type === t ? C.green : C.gray200,
                  background:  form.account_type === t ? `${C.green}12` : C.white,
                  color:       form.account_type === t ? C.green : C.gray400,
                  fontWeight:  form.account_type === t ? 700 : 500,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={saving || cancelling} style={{
            width: "100%", padding: "13px", borderRadius: 10, border: "none",
            background: saving ? C.gray200 : C.green, color: C.white,
            fontWeight: 700, fontSize: 15, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "background 0.2s", marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            {saving ? (
              <>
                <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Saving...
              </>
            ) : "Continue to Portal →"}
          </button>

          {/* Cancel */}
          <button type="button" onClick={handleCancel} disabled={saving || cancelling} style={{
            width: "100%", padding: "11px", borderRadius: 10,
            border: `1.5px solid ${C.gray200}`, background: C.white,
            color: C.gray400, fontWeight: 600, fontSize: 14,
            cursor: cancelling ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#dc2626"; e.currentTarget.style.color = "#dc2626"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.gray200;  e.currentTarget.style.color = C.gray400;  }}
          >
            {cancelling ? "Signing out..." : "Cancel & Sign Out"}
          </button>

          <div style={{ fontSize: 12, color: C.gray400, textAlign: "center", marginTop: 12 }}>
            You can update your details later in My Profile
          </div>
        </form>

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${C.gray200}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.gray400, fontWeight: 500 }}>Manage Your Investments Digitally</span>
        </div>
      </div>
    </div>
  );
}
