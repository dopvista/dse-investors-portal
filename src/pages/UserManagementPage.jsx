// ── src/pages/UserManagementPage.jsx ──────────────────────────────
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { sbGetAllUsers, sbGetRoles, sbAssignRole, sbDeactivateRole, sbAdminCreateUser } from "../lib/supabase";
import { C } from "../components/ui";

const BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

const ROLE_META = {
  SA: { label: "Super Admin",  bg: "#0A254015", border: "#0A254040", text: "#0A2540" },
  AD: { label: "Admin",        bg: "#1E3A5F15", border: "#1E3A5F40", text: "#1E3A5F" },
  DE: { label: "Data Entrant", bg: "#1D4ED815", border: "#1D4ED840", text: "#1D4ED8" },
  VR: { label: "Verifier",     bg: "#065F4615", border: "#065F4640", text: "#065F46" },
  RO: { label: "Read Only",    bg: "#37415115", border: "#37415140", text: "#374151" },
};

// ── Shared input style (mirrors ProfilePage) ──────────────────────
const inp = (extra = {}) => ({
  width: "100%", padding: "7px 10px", borderRadius: 8, fontSize: 12,
  border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
  background: C.white, color: C.text, transition: "border 0.2s",
  boxSizing: "border-box", ...extra,
});
const focusGreen = e => e.target.style.borderColor = C.green;
const blurGray   = e => e.target.style.borderColor = C.gray200;

// ── Modal portal — navy header matching ProfilePage modals ─────────
function Modal({ title, subtitle, onClose, children, footer }) {
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(10,37,64,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.white, borderRadius: 18, width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.3)", overflow: "hidden", animation: "fadeIn 0.2s ease" }}>
        <div style={{ background: C.navy, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 15 }}>{title}</div>
            {subtitle && <div style={{ color: C.gold, fontSize: 11, marginTop: 2, fontWeight: 500 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "14px 20px 0" }}>{children}</div>
        {footer && <div style={{ display: "flex", gap: 8, padding: "14px 20px" }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

function CancelBtn({ onClose }) {
  return <button onClick={onClose} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.text, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>;
}
function ConfirmBtn({ onClick, label, color, saving }) {
  return <button onClick={onClick} disabled={saving} style={{ flex: 2, padding: "9px", borderRadius: 9, border: "none", background: saving ? C.gray200 : (color || C.green), color: C.white, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>{saving ? "Saving..." : label}</button>;
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 10, fontWeight: 700, color: C.gray400, display: "block", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}{required && <span style={{ color: "#dc2626", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MODAL — Change Role
// ═══════════════════════════════════════════════════════
function ChangeRoleModal({ user, roles, callerRole, onClose, onSave, showToast }) {
  const available = callerRole === "SA" ? roles : roles.filter(r => ["DE","VR","RO"].includes(r.code));
  const [sel, setSel] = useState(roles.find(r => r.code === user.role_code)?.id ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!sel) return showToast("Select a role", "error");
    setSaving(true);
    try { await onSave(user.id, parseInt(sel)); onClose(); }
    catch (e) { showToast(e.message, "error"); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Change Role" subtitle={`Assigning to ${user.full_name || "user"}`} onClose={onClose}
      footer={<><CancelBtn onClose={onClose} /><ConfirmBtn onClick={handleSave} label="✓ Save Role" saving={saving} /></>}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: C.gray50, border: `1px solid ${C.gray200}`, marginBottom: 12 }}>
        <UserAvatar name={user.full_name} isActive={user.is_active} size={34} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{user.full_name || "User"}</div>
          <div style={{ fontSize: 10, color: C.gray400 }}>{user.cds_number || "No CDS"}</div>
        </div>
        {user.role_code && <RoleBadge code={user.role_code} />}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Select New Role</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 4 }}>
        {available.map(r => {
          const m = ROLE_META[r.code];
          const checked = String(sel) === String(r.id);
          return (
            <button key={r.id} onClick={() => setSel(r.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", textAlign: "left", border: `2px solid ${checked ? m.text : C.gray200}`, background: checked ? m.bg : C.white, transition: "all 0.15s" }}>
              <div style={{ width: 15, height: 15, borderRadius: "50%", border: `2px solid ${checked ? m.text : C.gray300}`, background: checked ? m.text : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {checked && <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.white }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{r.name}</div>
                {r.description && <div style={{ fontSize: 10, color: C.gray400, marginTop: 1 }}>{r.description}</div>}
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: m.bg, border: `1px solid ${m.border}`, color: m.text }}>{r.code}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// MODAL — Toggle Status
// ═══════════════════════════════════════════════════════
function ToggleStatusModal({ user, onClose, onConfirm }) {
  const [saving, setSaving] = useState(false);
  const deactivating = user.is_active;
  const handleConfirm = async () => { setSaving(true); await onConfirm(user); setSaving(false); onClose(); };

  return (
    <Modal title={deactivating ? "Deactivate User" : "Reactivate User"} onClose={onClose}
      footer={<><CancelBtn onClose={onClose} /><ConfirmBtn onClick={handleConfirm} label={deactivating ? "Yes, Deactivate" : "Yes, Reactivate"} color={deactivating ? "#dc2626" : "#16a34a"} saving={saving} /></>}>
      <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>{deactivating ? "🚫" : "✅"}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>
          {deactivating ? `Deactivate ${user.full_name}?` : `Reactivate ${user.full_name}?`}
        </div>
        <div style={{ fontSize: 12, color: C.gray400, lineHeight: 1.6 }}>
          {deactivating
            ? "This user will lose access immediately. Their data is preserved and they can be reactivated anytime."
            : "This user will regain access with their previous role restored."}
        </div>
      </div>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════
// MODAL — Invite User
// ═══════════════════════════════════════════════════════
function InviteModal({ roles, callerRole, callerCds, onClose, onSuccess, showToast }) {
  const isAdmin = callerRole === "AD";
  const [form, setForm]     = useState({ email: "", password: "", cds_number: isAdmin ? callerCds : "", role_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.email.trim())       return setError("Email is required");
    if (!form.password.trim())    return setError("Temporary password is required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (!form.cds_number.trim())  return setError("CDS Number is required");
    if (!form.role_id)            return setError("Please select a role");
    setSaving(true);
    try {
      const result = await sbAdminCreateUser(form.email, form.password);
      const uid = result?.user?.id || result?.id;
      if (uid) {
        await sbAssignRole(uid, parseInt(form.role_id));
        // Save CDS number to the new user's profile
        await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Prefer": "return=minimal" },
          body: JSON.stringify({ cds_number: form.cds_number.trim().toUpperCase() }),
        });
      }
      showToast("User created successfully!", "success");
      onSuccess(); onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Invite New User" subtitle="Create an account and assign a role" onClose={onClose}
      footer={<><CancelBtn onClose={onClose} /><ConfirmBtn onClick={handleSubmit} label="✉️ Create & Invite" saving={saving} /></>}>
      {error && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 10 }}>{error}</div>}
      <Field label="Email Address" required>
        <input style={inp()} type="email" placeholder="user@example.com"
          value={form.email} onChange={e => set("email", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
      </Field>
      <Field label="CDS Number" required>
        <input
          style={isAdmin ? { ...inp(), background: "#f9fafb", color: C.gray400, cursor: "not-allowed", border: `1.5px solid ${C.gray100}` } : inp()}
          type="text" placeholder="e.g. CDS-647305"
          value={form.cds_number}
          onChange={e => { if (!isAdmin) set("cds_number", e.target.value); }}
          readOnly={isAdmin}
          onFocus={isAdmin ? null : focusGreen}
          onBlur={isAdmin ? null : blurGray}
        />
        <div style={{ fontSize: 10, color: isAdmin ? C.green : C.gray400, marginTop: 3, fontWeight: isAdmin ? 600 : 400 }}>
          {isAdmin ? "Auto-filled from your account — users will share your CDS" : "Enter the user's own CDS number"}
        </div>
      </Field>
      <Field label="Temporary Password" required>
        <input style={inp()} type="text" placeholder="Min. 6 characters"
          value={form.password} onChange={e => set("password", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
        <div style={{ fontSize: 10, color: C.gray400, marginTop: 3 }}>Share this with the user — they can change it after first login</div>
      </Field>
      <Field label="Assign Role" required>
        <select style={{ ...inp(), cursor: "pointer" }} value={form.role_id} onChange={e => set("role_id", e.target.value)} onFocus={focusGreen} onBlur={blurGray}>
          <option value="">Select a role...</option>
          {roles.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
        </select>
      </Field>
    </Modal>
  );
}

// ── Role badge ─────────────────────────────────────────────────────
function RoleBadge({ code }) {
  const m = ROLE_META[code];
  if (!m) return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309" }}>No Role</span>;
  return <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: m.bg, border: `1px solid ${m.border}`, color: m.text, whiteSpace: "nowrap" }}>{m.label}</span>;
}

// ── User avatar with active status dot ────────────────────────────
const AVATAR_COLORS = ["#0A2540","#1E3A5F","#1D4ED8","#065F46","#374151","#7C3AED","#B45309","#0369A1"];
function UserAvatar({ name, isActive, size = 34 }) {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const color    = AVATAR_COLORS[(name || "").charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ position: "relative", flexShrink: 0, width: size, height: size }}>
      <div style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), background: `linear-gradient(135deg, ${color}, ${color}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: Math.round(size * 0.35), color: "#fff" }}>{initials}</div>
      <div style={{ position: "absolute", bottom: -1, right: -1, width: 9, height: 9, borderRadius: "50%", border: `2px solid ${C.white}`, background: isActive ? "#16a34a" : "#d1d5db" }} />
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 90 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 10, color: C.gray400, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

const GRID = "28px 1.5fr 0.9fr 0.8fr 0.8fr 1.1fr 1.3fr 90px 110px";

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════
export default function UserManagementPage({ role, showToast, profile }) {
  const [users, setUsers]               = useState([]);
  const [roles, setRoles]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [search, setSearch]             = useState("");
  const [filterRole, setFilterRole]     = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [inviteOpen, setInviteOpen]     = useState(false);
  const [changeRoleUser, setChangeRoleUser] = useState(null);
  const [toggleUser, setToggleUser]     = useState(null);

  if (!["SA","AD"].includes(role)) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🔒</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Access Restricted</div>
        <div style={{ fontSize: 12, color: C.gray400, marginTop: 4 }}>Only Admins and Super Admins can manage users.</div>
      </div>
    </div>
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([sbGetAllUsers(), sbGetRoles()]);
      setUsers(u); setRoles(r);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAssignRole = async (userId, roleId) => {
    await sbAssignRole(userId, roleId);
    showToast(`Role updated to ${roles.find(r => r.id === roleId)?.name || "role"}`, "success");
    await loadData();
  };

  const handleToggleActive = async (user) => {
    if (user.is_active) {
      await sbDeactivateRole(user.id);
      showToast(`${user.full_name} deactivated`, "success");
    } else {
      if (!user.role_id) { showToast("No previous role — assign a role first", "error"); return; }
      await sbAssignRole(user.id, user.role_id);
      showToast(`${user.full_name} reactivated`, "success");
    }
    await loadData();
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || (u.full_name||"").toLowerCase().includes(q) || (u.cds_number||"").toLowerCase().includes(q) || (u.phone||"").toLowerCase().includes(q);
    const matchRole   = filterRole === "ALL" || u.role_code === filterRole || (filterRole === "" && !u.role_code);
    const matchStatus = filterStatus === "ALL" || (filterStatus === "ACTIVE" && u.is_active) || (filterStatus === "INACTIVE" && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  const total       = users.length;
  const activeCount = users.filter(u => u.is_active).length;
  const noRoleCount = users.filter(u => !u.role_code).length;
  const rCounts     = Object.fromEntries(Object.keys(ROLE_META).map(c => [c, users.filter(u => u.role_code === c).length]));

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center", color: C.gray400 }}>
        <div style={{ width: 20, height: 20, border: `3px solid ${C.gray200}`, borderTop: `3px solid ${C.green}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
        <div style={{ fontSize: 12 }}>Loading users...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 12, padding: 14, fontSize: 12 }}>⚠️ {error}</div>
  );

  return (
    <div style={{ height: "calc(100vh - 118px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .um-scroll::-webkit-scrollbar { width: 4px; }
        .um-scroll::-webkit-scrollbar-track { background: transparent; }
        .um-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .um-scroll { scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
        input::placeholder { color: #9ca3af; }
      `}</style>

      {/* ── Stats row ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexShrink: 0, flexWrap: "wrap" }}>
        <StatCard label="Total Users"   value={total}           color="#0A2540" icon="👥" />
        <StatCard label="Active"        value={activeCount}     color={C.green} icon="✅" />
        <StatCard label="No Role"       value={noRoleCount}     color={C.gold}  icon="⚠️" />
        <StatCard label="Super Admins"  value={rCounts.SA || 0} color="#0A2540" icon="🔑" />
        <StatCard label="Data Entrants" value={rCounts.DE || 0} color="#1D4ED8" icon="✏️" />
        <StatCard label="Verifiers"     value={rCounts.VR || 0} color="#065F46" icon="✔️" />
      </div>

      {/* ── Filters + Invite ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexShrink: 0, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
          <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: C.gray400, pointerEvents: "none" }}>🔍</span>
          <input placeholder="Search by name, CDS or phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={inp({ paddingLeft: 28 })} onFocus={focusGreen} onBlur={blurGray} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} onFocus={focusGreen} onBlur={blurGray}
          style={{ ...inp(), width: "auto", cursor: "pointer" }}>
          <option value="ALL">All Roles</option>
          {Object.entries(ROLE_META).map(([c,m]) => <option key={c} value={c}>{m.label}</option>)}
          <option value="">No Role</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} onFocus={focusGreen} onBlur={blurGray}
          style={{ ...inp(), width: "auto", cursor: "pointer" }}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <span style={{ fontSize: 11, color: C.gray400, background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 8, padding: "5px 10px", whiteSpace: "nowrap" }}>
          {filtered.length}/{total}
        </span>
        <button onClick={() => setInviteOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
          borderRadius: 8, border: "none", background: C.green, color: C.white,
          fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          boxShadow: `0 2px 8px ${C.green}44`, whiteSpace: "nowrap",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          + Invite User
        </button>
      </div>

      {/* ── Table ── */}
      <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, overflow: "hidden", flex: 1, display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }}>
        <div style={{ overflowX: "auto", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: GRID, padding: "8px 14px", minWidth: 900, borderBottom: `1px solid ${C.gray100}`, background: C.gray50, flexShrink: 0 }}>
          {["#","User","CDS Number","Account Type","Role","Phone Number","Email Address","Created","Actions"].map((h, i) => (
            <div key={i} style={{ fontSize: 9, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
          ))}
        </div>

        {/* Scrollable body */}
        <div className="um-scroll" style={{ overflowY: "auto", flex: 1 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: C.gray400 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              <div style={{ fontSize: 13 }}>No users match your search</div>
            </div>
          ) : filtered.map((user, idx) => (
            <div key={user.id} style={{
              display: "grid", gridTemplateColumns: GRID,
              padding: "9px 14px", minWidth: 900, borderBottom: `1px solid ${C.gray100}`,
              alignItems: "center", transition: "background 0.12s",
              opacity: user.is_active ? 1 : 0.5,
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

              <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600 }}>{idx + 1}</div>

              {/* User */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <UserAvatar name={user.full_name} isActive={user.is_active} size={32} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.full_name || "New User"}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 20, flexShrink: 0, background: user.is_active ? "#f0fdf4" : "#fef2f2", border: `1px solid ${user.is_active ? "#bbf7d0" : "#fecaca"}`, color: user.is_active ? "#16a34a" : "#dc2626" }}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* CDS Number */}
              <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{user.cds_number || <span style={{ color: C.gray400 }}>—</span>}</div>

              {/* Account Type */}
              <div style={{ fontSize: 11, color: C.text }}>{user.account_type || <span style={{ color: C.gray400 }}>—</span>}</div>

              {/* Role */}
              <div><RoleBadge code={user.role_code} /></div>

              {/* Phone */}
              <div style={{ fontSize: 11, color: C.text }}>{user.phone || <span style={{ color: C.gray400 }}>—</span>}</div>

              {/* Email */}
              <div style={{ fontSize: 10, color: C.gray400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email || "—"}</div>

              {/* Created */}
              <div style={{ fontSize: 10, color: C.gray400 }}>
                {user.assigned_at ? new Date(user.assigned_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
              </div>

              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={() => setChangeRoleUser(user)} style={{ padding: "4px 9px", borderRadius: 7, border: `1px solid ${C.gray200}`, background: C.white, color: C.text, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.green; e.currentTarget.style.color = C.green; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.text; }}>
                  ✏️ Role
                </button>
                {user.role_code && (
                  <button onClick={() => setToggleUser(user)} style={{ padding: "4px 9px", borderRadius: 7, border: "none", background: user.is_active ? "#fef2f2" : "#f0fdf4", color: user.is_active ? "#dc2626" : "#16a34a", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                    {user.is_active ? "🚫" : "✅"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {inviteOpen     && <InviteModal roles={roles} callerRole={role} callerCds={profile?.cds_number || ""} onClose={() => setInviteOpen(false)} onSuccess={loadData} showToast={showToast} />}
      {changeRoleUser && <ChangeRoleModal user={changeRoleUser} roles={roles} callerRole={role} onClose={() => setChangeRoleUser(null)} onSave={async (uid, rid) => { await handleAssignRole(uid, rid); setChangeRoleUser(null); }} showToast={showToast} />}
      {toggleUser     && <ToggleStatusModal user={toggleUser} onClose={() => setToggleUser(null)} onConfirm={async u => { await handleToggleActive(u); setToggleUser(null); }} />}
    </div>
  );
}
