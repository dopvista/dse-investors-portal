import { useState, useRef, useEffect } from "react";
import { C } from "./ui";

// ── User Data (placeholder — will come from Supabase Auth later) ──
const USER = {
  name: "Michael Luzigah",
  cds: "CDS-0023948-X",
  role: "Investor",
  initials: "ML",
};

// ── Menu Items (easily extendable as features are built) ──────────
const MENU_ITEMS = [
  { icon: "👤", label: "My Profile",    sub: "View & edit profile",      soon: false },
  { icon: "🔑", label: "Reset Password", sub: "Change your password",     soon: true  },
  { icon: "🔄", label: "Switch Account", sub: "Manage multiple accounts", soon: true  },
  { icon: "🎨", label: "Change Theme",   sub: "Light / Dark / Custom",    soon: true  },
  { icon: "🌐", label: "Language",       sub: "English (default)",        soon: true  },
  { icon: "⚙️", label: "Preferences",   sub: "Notifications & display",  soon: true  },
  { divider: true },
  { icon: "🚪", label: "Sign Out",       sub: "Exit your session",        soon: false, danger: true },
];

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", marginTop: "auto" }}>

      {/* ── Popup Menu (slides up) ───────────────────────────── */}
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 12, right: 12,
          background: "#1a2f4a", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, boxShadow: "0 -16px 48px rgba(0,0,0,0.5)", zIndex: 9999,
          overflow: "hidden",
        }}>

          {/* Menu header — full profile */}
          <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `linear-gradient(135deg, ${C.gold}, #f97316)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 16, color: C.navy, flexShrink: 0,
              }}>
                {USER.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {USER.name}
                </div>
                <div style={{ color: C.gold, fontSize: 11, fontWeight: 600, marginTop: 1 }}>{USER.cds}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 1 }}>{USER.role}</div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "8px 0" }}>
            {MENU_ITEMS.map((item, i) => {
              if (item.divider) return (
                <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "6px 0" }} />
              );
              return (
                <button
                  key={i}
                  onClick={() => !item.soon && setOpen(false)}
                  style={{
                    width: "100%", padding: "10px 18px", border: "none", background: "none",
                    cursor: item.soon ? "default" : "pointer", display: "flex",
                    alignItems: "center", gap: 12, textAlign: "left",
                    fontFamily: "inherit", opacity: item.soon ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!item.soon) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.danger ? "#f87171" : C.white }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                      {item.sub}
                    </div>
                  </div>
                  {item.soon && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: C.gold,
                      background: "rgba(245,158,11,0.15)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: 6, padding: "2px 7px", flexShrink: 0,
                    }}>
                      SOON
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Version footer */}
          <div style={{ padding: "10px 18px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
              DSE Investors Portal v1.0
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Strip (always visible at sidebar bottom) ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", padding: "14px 16px", border: "none",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: open ? "rgba(255,255,255,0.06)" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
          transition: "background 0.2s", fontFamily: "inherit",
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
        onMouseLeave={e => { if (!open) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `linear-gradient(135deg, ${C.gold}, #f97316)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 13, color: C.navy, flexShrink: 0,
          boxShadow: "0 2px 8px rgba(245,158,11,0.35)",
        }}>
          {USER.initials}
        </div>

        {/* Name + CDS */}
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {USER.name}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {USER.cds}
          </div>
        </div>

        {/* Chevron */}
        <span style={{
          color: "rgba(255,255,255,0.3)", fontSize: 12, flexShrink: 0,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>▲</span>
      </button>
    </div>
  );
}
