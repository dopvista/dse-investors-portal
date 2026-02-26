// ── src/components/UserMenu.jsx ───────────────────────────────────
import { useState, useRef, useEffect } from "react";
import { C } from "./ui";

const MENU_ITEMS = [
  { icon: "👤", label: "My Profile",     sub: "View & edit profile",      soon: false, action: "profile" },
  { icon: "🔑", label: "Reset Password", sub: "Change your password",     soon: true  },
  { icon: "🔄", label: "Switch Account", sub: "Manage multiple accounts", soon: true  },
  { icon: "🎨", label: "Change Theme",   sub: "Light / Dark / Custom",    soon: true  },
  { icon: "🌐", label: "Language",       sub: "English (default)",        soon: true  },
  { icon: "⚙️", label: "Preferences",   sub: "Notifications & display",  soon: true  },
  { divider: true },
  { icon: "🚪", label: "Sign Out",       sub: "Exit your session",        soon: false, danger: true, action: "signout" },
];

export default function UserMenu({ profile, session, role, onSignOut, onOpenProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const name       = profile?.full_name  || session?.user?.email?.split("@")[0] || "User";
  const cds        = profile?.cds_number || "—";
  const avatarUrl  = profile?.avatar_url || null;
  const initials   = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const ROLE_LABEL = { SA: "Super Admin", AD: "Admin", DE: "Data Entrant", VR: "Verifier", RO: "Read Only" };
  const roleLabel  = ROLE_LABEL[role] || role || "—";

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const Avatar = ({ size = 36, radius = 10, fontSize = 13 }) => (
    <div style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0, overflow: "hidden",
      background: avatarUrl ? "transparent" : `linear-gradient(135deg, ${C.gold}, #f97316)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize, color: C.navy,
      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative", marginTop: "auto", zIndex: 1 }}>

      {/* ── Popup Menu ── */}
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: 12, right: 12,
          background: "#111e30", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, boxShadow: "0 -16px 48px rgba(0,0,0,0.6)", zIndex: 9999,
          overflow: "hidden",
        }}>
          {/* Menu header */}
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar size={44} radius={12} fontSize={16} />
              <div style={{ minWidth: 0 }}>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                <div style={{ color: C.gold, fontSize: 11, fontWeight: 600, marginTop: 1 }}>{cds}</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 1 }}>{roleLabel}</div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div style={{ padding: "6px 0" }}>
            {MENU_ITEMS.map((item, i) => {
              if (item.divider) return <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />;
              return (
                <button key={i}
                  onClick={() => {
                    if (item.soon) return;
                    setOpen(false);
                    if (item.action === "profile") onOpenProfile?.();
                    if (item.action === "signout") onSignOut?.();
                  }}
                  style={{
                    width: "100%", padding: "9px 16px", border: "none", background: "none",
                    cursor: item.soon ? "default" : "pointer", display: "flex",
                    alignItems: "center", gap: 10, textAlign: "left",
                    fontFamily: "inherit", opacity: item.soon ? 0.45 : 1,
                  }}
                  onMouseEnter={e => { if (!item.soon) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                >
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: item.danger ? "#f87171" : C.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{item.sub}</div>
                  </div>
                  {item.soon && <span style={{ fontSize: 9, fontWeight: 700, color: C.gold, background: `${C.gold}22`, border: `1px solid ${C.gold}44`, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>SOON</span>}
                </button>
              );
            })}
          </div>

          {/* Version */}
          <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 10, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
            DSE Investors Portal v1.0
          </div>
        </div>
      )}

      {/* ── Profile strip (always visible) ── */}
      <div style={{ margin: "0 8px 8px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8 }}>
        <button onClick={() => setOpen(o => !o)} style={{
          width: "100%", padding: "10px 12px", borderRadius: 10, border: "none",
          background: open ? "rgba(255,255,255,0.08)" : "transparent",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
          transition: "background 0.2s", fontFamily: "inherit",
        }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = open ? "rgba(255,255,255,0.08)" : "transparent"; }}
        >
          <Avatar size={36} radius={10} fontSize={13} />
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cds}</div>
          </div>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}>▲</span>
        </button>
      </div>
    </div>
  );
}
