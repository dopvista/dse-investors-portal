// ── src/components/UserMenu.jsx ────────────────────────────────────
// ... (imports and logic remain the same)

{/* Header — profile info */}
<div style={{ padding: "16px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
    <div style={{
      width: 48, height: 48, borderRadius: 12,
      background: `linear-gradient(135deg, ${C.gold}, #f97316)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: 18, color: C.navy, flexShrink: 0,
      marginTop: 2
    }}>
      {initials}
    </div>
    
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Name */}
      <div style={{ 
        color: C.white, 
        fontWeight: 700, 
        fontSize: 15, 
        whiteSpace: "nowrap", 
        overflow: "hidden", 
        textOverflow: "ellipsis" 
      }}>
        {fullName}
      </div>

      {/* Email - Adjusted to fill */}
      <div style={{ 
        color: "rgba(255,255,255,0.45)", 
        fontSize: 11, 
        marginTop: 2, 
        wordBreak: "break-all",
        display: "-webkit-box",
        WebkitLineClamp: 1,
        WebkitBoxOrient: "vertical",
        overflow: "hidden"
      }}>
        {email}
      </div>

      {/* CDS Number - Moved here, styled like email but larger */}
      <div style={{ 
        color: C.gold, 
        fontSize: 13, 
        fontWeight: 600, 
        marginTop: 6,
        letterSpacing: "0.02em"
      }}>
        <span style={{ 
          color: "rgba(255,255,255,0.25)", 
          fontSize: 10, 
          textTransform: "uppercase", 
          marginRight: 8,
          fontWeight: 700 
        }}>
          CDS
        </span>
        {cds}
      </div>
    </div>
  </div>
</div>

// ... (rest of the menu items and profile strip remain the same)
