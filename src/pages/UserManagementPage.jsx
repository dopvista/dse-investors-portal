// ── Optimized Table Row Design ──────────────────────────────────────
{filtered.map((user, idx) => (
  <div key={user.id} style={{
    display: "grid",
    // Consolidated from 9 columns to 6 for better spacing
    gridTemplateColumns: "1.5fr 1fr 1fr 1.2fr 100px 80px",
    padding: "16px 20px",
    borderBottom: `1px solid ${C.gray100}`,
    alignItems: "center",
    background: user.is_active ? C.white : "#fafafa",
  }}>
    
    {/* 1. IDENTITY BLOCK (Merged User + Account Type) */}
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ position: 'relative' }}>
        <Avatar name={user.full_name} size={38} />
        <div style={{
          position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
          borderRadius: '50%', border: `2px solid ${C.white}`,
          background: user.is_active ? C.green : C.gray300
        }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{user.full_name || "New User"}</div>
        <div style={{ fontSize: 12, color: C.gray400 }}>{user.account_type || "Individual"}</div>
      </div>
    </div>

    {/* 2. CONTACT (Email/Phone merged or just CDS) */}
    <div style={{ fontSize: 13, color: C.gray600 }}>
       <div style={{ fontWeight: 500 }}>{user.cds_number || "No CDS"}</div>
       <div style={{ fontSize: 11, color: C.gray400 }}>{user.phone || 'No Phone'}</div>
    </div>

    {/* 3. ROLE (With integrated dropdown) */}
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <RoleBadge code={user.role_code} />
        {user.is_active && <RoleDropdown user={user} roles={roles} onAssign={handleAssignRole} />}
      </div>
    </div>

    {/* 4. ACTIVITY (Replacing 'Since' with a 'Last Login' or similar) */}
    <div style={{ fontSize: 12, color: C.gray400 }}>
       Added {new Date(user.assigned_at).toLocaleDateString()}
    </div>

    {/* 5. ACTIONS (Using Icon Buttons) */}
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
       <button 
         onClick={() => handleToggleActive(user)}
         style={{
           background: 'none', border: 'none', cursor: 'pointer',
           color: user.is_active ? C.red : C.green,
           fontSize: 18, padding: 8, borderRadius: 8
         }}
         title={user.is_active ? "Deactivate" : "Activate"}
       >
         {user.is_active ? "🚫" : "✅"}
       </button>
    </div>
  </div>
))}
