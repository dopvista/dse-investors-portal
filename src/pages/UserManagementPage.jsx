// ── src/pages/UserManagementPage.jsx ──────────────────────────────
import { useState, useEffect, useRef } from "react";
import { sbGetAllUsers, sbGetRoles, sbAssignRole, sbDeactivateRole, sbAdminCreateUser } from "../lib/supabase";
import { C } from "../components/ui";

// ── Role badge config ──────────────────────────────────────────────
const ROLE_META = {
  SA: { label: "Super Admin",  bg: "#0A254015", border: "#0A254040", text: "#0A2540" },
  AD: { label: "Admin",        bg: "#1E3A5F15", border: "#1E3A5F40", text: "#1E3A5F" },
  DE: { label: "Data Entrant", bg: "#1D4ED815", border: "#1D4ED840", text: "#1D4ED8" },
  VR: { label: "Verifier",     bg: "#065F4615", border: "#065F4640", text: "#065F46" },
  RO: { label: "Read Only",    bg: "#37415115", border: "#37415140", text: "#374151" },
};

// ── Role badge ─────────────────────────────────────────────────────
const RoleBadge = ({ code }) => {
  const m = ROLE_META[code];
  if (!m) return <span style={{ fontSize: 12, color: C.gray400 }}>No Role</span>;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
      background: m.bg, border: `1px solid ${m.border}`, color: m.text,
      letterSpacing: "0.03em", whiteSpace: "nowrap",
    }}>
      {m.label}
    </span>
  );
};

// ── Initials avatar ────────────────────────────────────────────────
const AVATAR_COLORS = ["#0A2540","#1E3A5F","#1D4ED8","#065F46","#374151","#7C3AED","#B45309","#0369A1"];
const Avatar = ({ name, size = 34 }) => {
  const initials = (name || "?").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[(name || "").charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: `linear-gradient(135deg, ${color}, ${color}99)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.35, color: "#fff",
    }}>
      {initials}
    </div>
  );
};

// ── Stat card ──────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14,
    padding: "16px 20px", display: "flex", alignItems: "center", gap: 14,
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)", flex: 1, minWidth: 120,
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
      background: `${color}20`, border: `1px solid ${color}30`,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.gray400, marginTop: 3 }}>{label}</div>
    </div>
  </div>
);

// ── Invite Modal ───────────────────────────────────────────────────
function InviteModal({ roles, onClose, onSuccess, showToast }) {
  const [form, setForm]     = useState({ email: "", password: "", role_id: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const inp = {
    width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: C.gray50, color: C.text, transition: "border 0.2s", boxSizing: "border-box",
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.email.trim())       return setError("Email is required");
    if (!form.password.trim())    return setError("Temporary password is required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (!form.role_id)            return setError("Please select a role");

    setSaving(true);
    try {
      const result = await sbAdminCreateUser(form.email, form.password);
      const uid = result?.user?.id || result?.id;
      if (uid) {
        await sbAssignRole(uid, parseInt(form.role_id));
      }
      showToast("User created successfully!", "success");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: C.white, borderRadius: 20, padding: "32px 28px",
        width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
      }} onClick={e => e.stopPropagation()}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>Invite New User</div>
            <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>Create account and assign a role</div>
          </div>
          <button onClick={onClose} style={{
            background: C.gray50, border: "none", cursor: "pointer",
            borderRadius: 8, width: 32, height: 32, fontSize: 16, color: C.gray400,
          }}>✕</button>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
            Email Address <span style={{ color: C.red }}>*</span>
          </label>
          <input style={inp} type="email" placeholder="user@example.com"
            value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            onFocus={e => e.target.style.borderColor = C.green}
            onBlur={e  => e.target.style.borderColor = C.gray200} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
            Temporary Password <span style={{ color: C.red }}>*</span>
          </label>
          <input style={inp} type="text" placeholder="Min. 6 characters"
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            onFocus={e => e.target.style.borderColor = C.green}
            onBlur={e  => e.target.style.borderColor = C.gray200} />
          <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>
            Share this with the user — they can change it after first login
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
            Assign Role <span style={{ color: C.red }}>*</span>
          </label>
          <select style={{ ...inp, cursor: "pointer" }}
            value={form.role_id} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))}
            onFocus={e => e.target.style.borderColor = C.green}
            onBlur={e  => e.target.style.borderColor = C.gray200}>
            <option value="">Select a role...</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${C.gray200}`,
            background: C.white, color: C.text, fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            flex: 2, padding: "11px", borderRadius: 10, border: "none",
            background: saving ? C.gray200 : C.green, color: C.white,
            fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "background 0.2s",
          }}>
            {saving ? "Creating..." : "✉️ Create & Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Inline role change dropdown ────────────────────────────────────
function RoleDropdown({ user, roles, onAssign }) {
  const [open, setOpen]     = useState(false);
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
        display: "flex", alignItems: "center", gap: 5, padding: "4px 9px",
        borderRadius: 8, border: `1px solid ${C.gray200}`, background: C.white,
        cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit",
        fontSize: 11, color: C.gray400, transition: "all 0.15s",
      }}
        onMouseEnter={e => { if (!saving) e.currentTarget.style.borderColor = C.green; }}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.gray200}
      >
        {saving ? "..." : "Change ▾"}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 999,
          background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 170, overflow: "hidden",
        }}>
          {roles.map(r => (
            <button key={r.id} onClick={() => handleSelect(r)} style={{
              width: "100%", padding: "9px 14px", border: "none", background: "none",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              fontFamily: "inherit", textAlign: "left",
            }}
              onMouseEnter={e => e.currentTarget.style.background = C.gray50}
              onMouseLeave={e => e.currentTarget.style.background = "none"}
            >
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 6,
                background: ROLE_META[r.code]?.bg, border: `1px solid ${ROLE_META[r.code]?.border}`,
                color: ROLE_META[r.code]?.text,
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

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function UserManagementPage({ role, showToast }) {
  const [users, setUsers]             = useState([]);
  const [roles, setRoles]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [search, setSearch]           = useState("");
  const [filterRole, setFilterRole]   = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showInvite, setShowInvite]   = useState(false);

  // ── Guard: SA only ─────────────────────────────────────────────
  if (role !== "SA") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>Access Restricted</div>
          <div style={{ fontSize: 14, color: C.gray400, marginTop: 6 }}>Only Super Admins can manage users.</div>
        </div>
      </div>
    );
  }

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, r] = await Promise.all([sbGetAllUsers(), sbGetRoles()]);
      setUsers(u);
      setRoles(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleAssignRole = async (userId, roleId) => {
    try {
      await sbAssignRole(userId, roleId);
      const name = roles.find(r => r.id === roleId)?.name || "role";
      showToast(`Role updated to ${name}`, "success");
      await loadData();
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await sbDeactivateRole(user.id);
        showToast(`${user.full_name} deactivated`, "success");
      } else {
        if (!user.role_id) {
          showToast("No previous role — assign a role first", "error");
          return;
        }
        await sbAssignRole(user.id, user.role_id);
        showToast(`${user.full_name} reactivated`, "success");
      }
      await loadData();
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  };

  // ── Filter logic ───────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      (u.full_name  || "").toLowerCase().includes(q) ||
      (u.cds_number || "").toLowerCase().includes(q) ||
      (u.phone      || "").toLowerCase().includes(q);
    const matchRole   = filterRole   === "ALL" || u.role_code === filterRole || (filterRole === "" && !u.role_code);
    const matchStatus = filterStatus === "ALL" ||
      (filterStatus === "ACTIVE"   &&  u.is_active) ||
      (filterStatus === "INACTIVE" && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  // ── Stats ──────────────────────────────────────────────────────
  const total       = users.length;
  const activeCount = users.filter(u => u.is_active).length;
  const noRoleCount = users.filter(u => !u.role_code).length;
  const rCounts     = Object.fromEntries(
    Object.keys(ROLE_META).map(code => [code, users.filter(u => u.role_code === code).length])
  );

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center", color: C.gray400 }}>
        <div style={{ width: 24, height: 24, border: `3px solid ${C.gray200}`, borderTop: `3px solid ${C.green}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        Loading users...
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 12, padding: 20 }}>
      ⚠️ {error}
    </div>
  );

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: C.text }}>User Management</div>
          <div style={{ fontSize: 13, color: C.gray400, marginTop: 3 }}>
            Manage system users and assign roles
          </div>
        </div>
        <button onClick={() => setShowInvite(true)} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
          borderRadius: 10, border: "none", background: C.green, color: C.white,
          fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
          boxShadow: "0 2px 8px rgba(22,163,74,0.3)",
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          + Invite User
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total Users"   value={total}              color="#0A2540" icon="👥" />
        <StatCard label="Active"        value={activeCount}        color={C.green} icon="✅" />
        <StatCard label="No Role"       value={noRoleCount}        color={C.gold}  icon="⚠️" />
        <StatCard label="Super Admins"  value={rCounts.SA || 0}    color="#0A2540" icon="🔑" />
        <StatCard label="Data Entrants" value={rCounts.DE || 0}    color="#1D4ED8" icon="✏️" />
        <StatCard label="Verifiers"     value={rCounts.VR || 0}    color="#065F46" icon="✔️" />
      </div>

      {/* ── Search + filters ────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray400, pointerEvents: "none" }}>🔍</span>
          <input placeholder="Search by name, CDS or phone..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10, fontSize: 13,
              border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
              background: C.white, color: C.text, boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = C.green}
            onBlur={e  => e.target.style.borderColor = C.gray200}
          />
        </div>

        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{
          padding: "10px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer",
          border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
          background: C.white, color: C.text,
        }}>
          <option value="ALL">All Roles</option>
          {Object.entries(ROLE_META).map(([code, m]) => (
            <option key={code} value={code}>{m.label}</option>
          ))}
          <option value="">No Role</option>
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
          padding: "10px 14px", borderRadius: 10, fontSize: 13, cursor: "pointer",
          border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
          background: C.white, color: C.text,
        }}>
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>

        <div style={{
          padding: "10px 14px", fontSize: 13, color: C.gray400,
          background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 10,
        }}>
          {filtered.length} of {total} users
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "36px 1.8fr 120px 130px 110px 180px 100px 90px 110px",
          padding: "11px 20px", borderBottom: `1px solid ${C.gray100}`,
          background: C.gray50,
        }}>
          {["#","User","CDS","Phone","Account","Role","Since","Status","Actions"].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.07em" }}>
              {h}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: C.gray400 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontSize: 14 }}>No users match your search</div>
          </div>
        ) : filtered.map((user, idx) => (
          <div key={user.id} style={{
            display: "grid",
            gridTemplateColumns: "36px 1.8fr 120px 130px 110px 180px 100px 90px 110px",
            padding: "13px 20px", borderBottom: `1px solid ${C.gray100}`,
            alignItems: "center", transition: "background 0.15s",
            opacity: user.is_active ? 1 : 0.55,
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {/* # */}
            <div style={{ fontSize: 12, color: C.gray400, fontWeight: 600 }}>{idx + 1}</div>

            {/* User */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <Avatar name={user.full_name} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.full_name || "—"}
                </div>
                <div style={{ fontSize: 11, color: C.gray400, marginTop: 1 }}>
                  {user.account_type || "Individual"}
                </div>
              </div>
            </div>

            {/* CDS */}
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
              {user.cds_number || <span style={{ color: C.gray400 }}>—</span>}
            </div>

            {/* Phone */}
            <div style={{ fontSize: 12, color: C.gray600 }}>
              {user.phone || <span style={{ color: C.gray400 }}>—</span>}
            </div>

            {/* Account */}
            <div style={{ fontSize: 12, color: C.gray600 }}>{user.account_type || "—"}</div>

            {/* Role + change */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <RoleBadge code={user.role_code} />
              {user.is_active && (
                <RoleDropdown user={user} roles={roles} onAssign={handleAssignRole} />
              )}
            </div>

            {/* Since */}
            <div style={{ fontSize: 11, color: C.gray400 }}>
              {user.assigned_at
                ? new Date(user.assigned_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
                : "—"}
            </div>

            {/* Status */}
            <div>
              {user.role_code ? (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
                  background: user.is_active ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${user.is_active ? "#bbf7d0" : "#fecaca"}`,
                  color: user.is_active ? "#16a34a" : "#dc2626",
                }}>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "#fffbeb", border: "1px solid #fde68a", color: "#b45309" }}>
                  No Role
                </span>
              )}
            </div>

            {/* Actions */}
            <div>
              {user.role_code ? (
                <button onClick={() => handleToggleActive(user)} style={{
                  padding: "5px 10px", borderRadius: 8, border: "none",
                  cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 600,
                  background: user.is_active ? "#fef2f2" : "#f0fdf4",
                  color: user.is_active ? "#dc2626" : "#16a34a",
                  transition: "opacity 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "0.75"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  {user.is_active ? "Deactivate" : "Reactivate"}
                </button>
              ) : (
                <span style={{ fontSize: 11, color: C.gray400 }}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Invite modal ─────────────────────────────────────────── */}
      {showInvite && (
        <InviteModal
          roles={roles}
          onClose={() => setShowInvite(false)}
          onSuccess={loadData}
          showToast={showToast}
        />
      )}
    </div>
  );
}
