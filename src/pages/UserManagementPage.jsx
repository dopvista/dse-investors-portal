import { useState, useEffect, useRef } from "react";
import { sbGetAllUsers, sbGetRoles, sbAssignRole, sbDeactivateRole, sbAdminCreateUser } from "../lib/supabase";
import { C } from "../components/ui";

// ── Role badge config ──────────────────────────────────────────────
const ROLE_META = {
  SA: { label: "Super Admin",   bg: "#0A254012", border: "#0A254025", text: "#0A2540" },
  AD: { label: "Admin",        bg: "#1E3A5F12", border: "#1E3A5F25", text: "#1E3A5F" },
  DE: { label: "Data Entrant", bg: "#1D4ED812", border: "#1D4ED825", text: "#1D4ED8" },
  VR: { label: "Verifier",     bg: "#065F4612", border: "#065F4625", text: "#065F46" },
  RO: { label: "Read Only",    bg: "#37415112", border: "#37415125", text: "#374151" },
};

// ── Role badge ─────────────────────────────────────────────────────
const RoleBadge = ({ code }) => {
  const m = ROLE_META[code];
  if (!m) return <span style={{ fontSize: 11, color: C.gray400, fontWeight: 600 }}>NO ROLE</span>;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
      background: m.bg, border: `1px solid ${m.border}`, color: m.text,
      letterSpacing: "0.03em", whiteSpace: "nowrap", textTransform: "uppercase"
    }}>
      {m.label}
    </span>
  );
};

// ── Initials avatar ────────────────────────────────────────────────
const AVATAR_COLORS = ["#0A2540","#1E3A5F","#1D4ED8","#065F46","#374151","#7C3AED","#B45309","#0369A1"];
const Avatar = ({ name, size = 36, active }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[(name || "").charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: 10,
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 800, fontSize: size * 0.35, color: "#fff",
      }}>
        {initials}
      </div>
      <div style={{
        position: 'absolute', bottom: -1, right: -1, width: 10, height: 10,
        borderRadius: '50%', border: `2px solid #fff`,
        background: active ? C.green : C.gray300
      }} />
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: C.white, border: `1px solid ${C.gray100}`, borderRadius: 16,
    padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
    boxShadow: "0 2px 10px rgba(0,0,0,0.03)", flex: 1, minWidth: 150,
  }}>
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: C.gray400, marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</div>
    </div>
  </div>
);

// ── Role Dropdown ──────────────────────────────────────────────────
function RoleDropdown({ user, roles, onAssign }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const handleSelect = async (role) => {
    setOpen(false);
    setSaving(true);
    await onAssign(user.id, role.id);
    setSaving(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} disabled={saving} style={{
        display: "flex", alignItems: "center", gap: 4, padding: "4px 8px",
        borderRadius: 6, border: `1px solid ${C.gray200}`, background: "#fff",
        cursor: saving ? "not-allowed" : "pointer", fontSize: 10, fontWeight: 700, 
        color: C.gray400, textTransform: 'uppercase'
      }}>
        {saving ? "..." : "Edit ▾"}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 5px)", right: 0, zIndex: 999,
          background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 10,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)", minWidth: 180, overflow: "hidden",
        }}>
          {roles.map(r => (
            <button key={r.id} onClick={() => handleSelect(r)} style={{
              width: "100%", padding: "10px 14px", border: "none", background: "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              fontFamily: "inherit", textAlign: "left",
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.gray50}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <span style={{
                fontSize: 9, fontWeight: 800, padding: "2px 5px", borderRadius: 4,
                background: ROLE_META[r.code]?.bg, color: ROLE_META[r.code]?.text,
              }}>{r.code}</span>
              <span style={{ fontSize: 13, color: C.text, flex: 1 }}>{r.name}</span>
              {user.role_code === r.code && <span style={{ color: C.green, fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Invite Modal ───────────────────────────────────────────────────
function InviteModal({ roles, onClose, onSuccess, showToast }) {
  const [form, setForm] = useState({ email: "", password: "", role_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inpStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", background: C.gray50,
    color: C.text, boxSizing: "border-box", transition: 'all 0.2s'
  };

  const handleSubmit = async () => {
    if (!form.email || !form.password || !form.role_id) return setError("All fields are required");
    setSaving(true);
    try {
      const result = await sbAdminCreateUser(form.email, form.password);
      const uid = result?.user?.id || result?.id;
      if (uid) await sbAssignRole(uid, parseInt(form.role_id));
      showToast("User invited successfully", "success");
      onSuccess();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,37,64,0.4)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 32, width: "100%", maxWidth: 400, boxShadow: "0 30px 60px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800 }}>Invite User</h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: C.gray400 }}>New users will receive their credentials via email.</p>
        
        {error && <div style={{ background: "#fef2f2", color: C.red, padding: 12, borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>EMAIL ADDRESS</label>
          <input style={inpStyle} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>TEMP PASSWORD</label>
          <input style={inpStyle} type="text" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: C.text }}>ASSIGN ROLE</label>
          <select style={inpStyle} value={form.role_id} onChange={e => setForm({...form, role_id: e.target.value})}>
            <option value="">Select a role...</option>
            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <button onClick={handleSubmit} disabled={saving} style={{
          width: "100%", padding: 14, borderRadius: 12, border: "none",
          background: saving ? C.gray200 : C.green, color: "#fff", fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer"
        }}>
          {saving ? "Inviting..." : "Send Invitation"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════
const UserManagementPage = ({ role, showToast }) => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([sbGetAllUsers(), sbGetRoles()]);
      setUsers(u);
      setRoles(r);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      await sbAssignRole(userId, roleId);
      showToast("User role updated", "success");
      loadData();
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) await sbDeactivateRole(user.id);
      else await sbAssignRole(user.id, user.role_id);
      showToast("Status updated", "success");
      loadData();
    } catch (e) { showToast(e.message, "error"); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search || (u.full_name || "").toLowerCase().includes(q) || (u.cds_number || "").toLowerCase().includes(q);
    const matchRole = filterRole === "ALL" || u.role_code === filterRole;
    return matchSearch && matchRole;
  });

  if (role !== "SA") return <div style={{ padding: 40, textAlign: 'center', color: C.gray400 }}>Access Denied</div>;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text }}>Users</h1>
          <p style={{ margin: "4px 0 0", color: C.gray400, fontSize: 14 }}>Manage system access and permissions</p>
        </div>
        <button onClick={() => setShowInvite(true)} style={{
          background: C.green, color: "#fff", border: "none", padding: "12px 24px",
          borderRadius: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${C.green}40`
        }}>+ Invite New User</button>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 32, overflowX: 'auto', paddingBottom: 8 }}>
        <StatCard label="Total" value={users.length} color="#0A2540" icon="👥" />
        <StatCard label="Active" value={users.filter(u=>u.is_active).length} color={C.green} icon="✅" />
        <StatCard label="Admins" value={users.filter(u=>u.role_code==='SA').length} color="#7C3AED" icon="🛡️" />
      </div>

      <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${C.gray100}`, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
        <div style={{ padding: 20, borderBottom: `1px solid ${C.gray100}`, display: 'flex', gap: 12 }}>
          <input 
            placeholder="Search by name or CDS..." 
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: "10px 16px", borderRadius: 10, border: `1px solid ${C.gray200}`, fontSize: 14, outline: 'none' }}
          />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ padding: "10px", borderRadius: 10, border: `1px solid ${C.gray200}`, outline: 'none' }}>
            <option value="ALL">All Roles</option>
            {Object.keys(ROLE_META).map(k => <option key={k} value={k}>{ROLE_META[k].label}</option>)}
          </select>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#fafbfc", borderBottom: `1px solid ${C.gray100}` }}>
                <th style={{ padding: "14px 20px", fontSize: 11, color: C.gray400 }}>USER</th>
                <th style={{ padding: "14px 20px", fontSize: 11, color: C.gray400 }}>CDS / CONTACT</th>
                <th style={{ padding: "14px 20px", fontSize: 11, color: C.gray400 }}>ROLE</th>
                <th style={{ padding: "14px 20px", fontSize: 11, color: C.gray400 }}>JOINED</th>
                <th style={{ padding: "14px 20px", fontSize: 11, color: C.gray400, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${C.gray50}`, opacity: u.is_active ? 1 : 0.6 }}>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={u.full_name} active={u.is_active} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{u.full_name || "New User"}</div>
                        <div style={{ fontSize: 12, color: C.gray400 }}>{u.account_type || "Individual"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{u.cds_number || "—"}</div>
                    <div style={{ fontSize: 11, color: C.gray400 }}>{u.phone || "No Phone"}</div>
                  </td>
                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <RoleBadge code={u.role_code} />
                      {u.is_active && <RoleDropdown user={u} roles={roles} onAssign={handleAssignRole} />}
                    </div>
                  </td>
                  <td style={{ padding: "16px 20px", fontSize: 12, color: C.gray400 }}>
                    {u.assigned_at ? new Date(u.assigned_at).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "16px 20px", textAlign: 'right' }}>
                    <button onClick={() => handleToggleActive(u)} style={{
                      background: u.is_active ? "#fff1f2" : "#f0fdf4",
                      color: u.is_active ? C.red : C.green,
                      border: "none", padding: "6px 12px", borderRadius: 8,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer'
                    }}>
                      {u.is_active ? "DEACTIVATE" : "ACTIVATE"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInvite && <InviteModal roles={roles} onClose={() => setShowInvite(false)} onSuccess={loadData} showToast={showToast} />}
    </div>
  );
};

export default UserManagementPage;
