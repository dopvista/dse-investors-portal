import { useState, useRef, useEffect } from "react";

// ─── DSE Brand Colors ─────────────────────────────────────────────
export const C = {
  navy: "#0B1F3A",
  navyLight: "#132844",
  green: "#00843D",
  greenLight: "#00a34c",
  gold: "#F59E0B",
  red: "#EF4444",
  redBg: "#FEF2F2",
  greenBg: "#F0FDF4",
  white: "#FFFFFF",
  gray50: "#F8FAFC",
  gray100: "#F1F5F9",
  gray200: "#E2E8F0",
  gray400: "#94A3B8",
  gray500: "#64748B",
  gray600: "#475569",
  gray800: "#1E293B",
  text: "#0F172A",
};

// ─── Helpers ──────────────────────────────────────────────────────
export const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtInt = (n) => Number(n || 0).toLocaleString("en-US");

// ─── Spinner ──────────────────────────────────────────────────────
export function Spinner({ size = 18, color = "#fff" }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid rgba(255,255,255,0.3)`, borderTop: `2px solid ${color}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />
  );
}

// ─── Toast ────────────────────────────────────────────────────────
export function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 28, right: 28, background: type === "error" ? C.red : C.green, color: C.white, padding: "14px 22px", borderRadius: 10, fontSize: 14, fontWeight: 500, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: 10 }}>
      <span>{type === "error" ? "✕" : "✓"}</span>{msg}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = C.green, icon }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ width: 44, height: 44, background: color + "18", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.gray600, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────
export function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 24 }}>
      {title && (
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.gray100}`, background: C.gray50 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>{subtitle}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// ─── Form Primitives ──────────────────────────────────────────────
function FormField({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: C.gray600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}{required && <span style={{ color: C.red, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle = (readOnly) => ({
  border: `1.5px solid ${C.gray200}`, borderRadius: 8, padding: "10px 12px",
  fontSize: 14, outline: "none", background: readOnly ? C.gray50 : C.white,
  color: C.text, width: "100%", boxSizing: "border-box",
  transition: "border-color 0.2s", fontFamily: "inherit",
});

export function FInput({ label, required, ...props }) {
  return (
    <FormField label={label} required={required}>
      <input {...props} style={{ ...inputStyle(props.readOnly), ...props.style }}
        onFocus={e => !props.readOnly && (e.target.style.borderColor = C.green)}
        onBlur={e => (e.target.style.borderColor = C.gray200)} />
    </FormField>
  );
}

export function FSelect({ label, required, children, ...props }) {
  return (
    <FormField label={label} required={required}>
      <select {...props} style={{ ...inputStyle(false), cursor: "pointer", ...props.style }}
        onFocus={e => (e.target.style.borderColor = C.green)}
        onBlur={e => (e.target.style.borderColor = C.gray200)}>
        {children}
      </select>
    </FormField>
  );
}

export function FTextarea({ label, required, ...props }) {
  return (
    <FormField label={label} required={required}>
      <textarea {...props} style={{ ...inputStyle(false), resize: "vertical", minHeight: 72, ...props.style }}
        onFocus={e => (e.target.style.borderColor = C.green)}
        onBlur={e => (e.target.style.borderColor = C.gray200)} />
    </FormField>
  );
}

// ─── Button ───────────────────────────────────────────────────────
export function Btn({ children, variant = "primary", loading, icon, ...props }) {
  const variants = {
    primary:   { background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`, color: C.white, border: "none", boxShadow: "0 4px 12px rgba(0,132,61,0.3)" },
    secondary: { background: C.white, color: C.gray800, border: `1.5px solid ${C.gray200}` },
    danger:    { background: C.redBg, color: C.red, border: `1.5px solid #FECACA` },
    navy:      { background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`, color: C.white, border: "none", boxShadow: "0 4px 12px rgba(11,31,58,0.3)" },
  };
  return (
    <button {...props} disabled={loading || props.disabled} style={{ padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer", display: "inline-flex", alignItems: "center", gap: 7, transition: "opacity 0.2s", fontFamily: "inherit", ...variants[variant], ...props.style }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
      {loading ? <Spinner size={14} color={variant === "primary" || variant === "navy" ? C.white : C.green} /> : icon && <span>{icon}</span>}
      {children}
    </button>
  );
}

// ─── Action Menu (⋯ dropdown) ─────────────────────────────────────
export function ActionMenu({ actions }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const handleScroll = () => setOpen(false);
    document.addEventListener("mousedown", handle);
    document.addEventListener("scroll", handleScroll, true);
    return () => { document.removeEventListener("mousedown", handle); document.removeEventListener("scroll", handleScroll, true); };
  }, [open]);

  const handleOpen = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const dropdownHeight = actions.length * 41;
      const spaceBelow = window.innerHeight - rect.bottom;
      const goUp = spaceBelow < dropdownHeight;
      setPos({ top: goUp ? rect.top - dropdownHeight : rect.bottom + 4, left: rect.right - 160 });
    }
    setOpen(o => !o);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button onClick={handleOpen} style={{ width: 32, height: 32, borderRadius: 8, border: `1.5px solid ${C.gray200}`, background: open ? C.gray100 : C.white, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: C.gray600 }}>⋯</button>
      {open && (
        <div style={{ position: "fixed", top: pos.top, left: pos.left, background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: 9999, minWidth: 160, overflow: "hidden" }}>
          {actions.map((a, i) => (
            <button key={i} onClick={() => { setOpen(false); a.onClick(); }} style={{ width: "100%", padding: "10px 16px", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500, color: a.danger ? C.red : C.text, textAlign: "left", borderBottom: i < actions.length - 1 ? `1px solid ${C.gray100}` : "none", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = a.danger ? C.redBg : C.gray50}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <span>{a.icon}</span>{a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ─── MODAL SHELL (shared structure for ALL modals) ────────────────
// ═══════════════════════════════════════════════════════════════════
//
//  Every modal in this system uses this shell. The anatomy is:
//
//  ┌─────────────────────────────────┐  ← white card, rounded-16, shadow
//  │  HEADER  title / subtitle / ✕  │  ← white bg, border-bottom
//  ├─────────────────────────────────┤
//  │  BODY    (children)             │  ← scrollable if maxHeight set
//  ├─────────────────────────────────┤
//  │  FOOTER  action buttons         │  ← gray50 bg, border-top
//  └─────────────────────────────────┘
//
function ModalShell({ title, subtitle, headerRight, onClose, footer, children, maxWidth = 460, maxHeight }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth, display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", ...(maxHeight ? { maxHeight } : {}) }}>

        {/* ── Header ── */}
        <div style={{ padding: "22px 28px 16px", borderBottom: `1px solid ${C.gray200}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: C.gray400, marginTop: 3 }}>{subtitle}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: 16, flexShrink: 0 }}>
            {headerRight}
            <button
              onClick={onClose}
              style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.gray200}`, background: C.gray50, cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", color: C.gray600, flexShrink: 0 }}>
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", flex: 1 }}>
          {children}
        </div>

        {/* ── Footer ── */}
        {footer && (
          <div style={{ padding: "16px 28px", borderTop: `1px solid ${C.gray200}`, display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center", background: C.gray50, borderRadius: "0 0 16px 16px", flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal (confirm / warning) ────────────────────────────────────
export function Modal({ type = "confirm", title, message, onConfirm, onClose }) {
  if (!title) return null;
  const isWarn = type === "warning";
  return (
    <ModalShell
      title={
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: isWarn ? C.redBg : "#FFF7ED", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            {isWarn ? "🚫" : "🗑️"}
          </span>
          {title}
        </span>
      }
      onClose={onClose}
      maxWidth={420}
      footer={
        isWarn ? (
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
        ) : (
          <>
            <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn variant="danger" onClick={onConfirm} style={{ background: C.red, color: C.white, border: "none" }}>Yes, Delete</Btn>
          </>
        )
      }
    >
      <div style={{ fontSize: 14, color: C.gray600, lineHeight: 1.7 }}>{message}</div>
    </ModalShell>
  );
}

// ─── Company Form Modal ───────────────────────────────────────────
export function CompanyFormModal({ company, onConfirm, onClose }) {
  const isEdit = !!company;
  const [name, setName] = useState(company?.name || "");
  const [price, setPrice] = useState("");
  const [remarks, setRemarks] = useState(company?.remarks || "");
  const [error, setError] = useState("");

  const handle = () => {
    if (!name.trim()) { setError("Company name is required."); return; }
    if (!isEdit && (!price || Number(price) <= 0)) { setError("A valid opening price is required."); return; }
    setError("");
    onClose();
    onConfirm({ name: name.trim(), price: isEdit ? undefined : Number(price), remarks });
  };

  return (
    <ModalShell
      title={isEdit ? "✏️ Edit Company" : "➕ Register New Company"}
      subtitle={isEdit ? "To change the price use the 💰 Price button" : undefined}
      onClose={onClose}
      maxWidth={460}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant={isEdit ? "navy" : "primary"} onClick={handle} icon="💾">
            {isEdit ? "Save Changes" : "Register Company"}
          </Btn>
        </>
      }
    >
      {error && (
        <div style={{ background: C.redBg, border: `1px solid #FECACA`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}
      <FInput label="Company Name" required value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="e.g. Tanzania Breweries" autoFocus />
      {!isEdit && (
        <FInput label="Opening Price (TZS)" required type="number" value={price} onChange={e => { setPrice(e.target.value); setError(""); }} placeholder="0.00" />
      )}
      <FTextarea label="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Optional notes..." style={{ minHeight: 72 }} />
    </ModalShell>
  );
}

// ─── Update Price Modal ───────────────────────────────────────────
export function UpdatePriceModal({ company, onConfirm, onClose }) {
  const nowDate = new Date();
  const localDatetime = new Date(nowDate.getTime() - nowDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [newPrice, setNewPrice] = useState("");
  const [datetime, setDatetime] = useState(localDatetime);
  const [reason, setReason] = useState("Normal Price Change");
  const [error, setError] = useState("");

  if (!company) return null;

  const handleConfirm = () => {
    if (!newPrice || isNaN(Number(newPrice)) || Number(newPrice) <= 0) {
      setError("Please enter a valid price greater than 0.");
      return;
    }
    setError("");
    onConfirm({ newPrice: Number(newPrice), datetime, reason });
  };

  const changeAmt = newPrice ? Number(newPrice) - Number(company.price) : null;
  const changePct = changeAmt !== null && Number(company.price) !== 0 ? (changeAmt / Number(company.price)) * 100 : null;
  const up = changeAmt !== null ? changeAmt >= 0 : null;

  return (
    <ModalShell
      title="💰 Update Share Price"
      subtitle={company.name}
      onClose={onClose}
      maxWidth={440}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handleConfirm} icon="💾">Update Price</Btn>
        </>
      }
    >
      {/* Current Price display */}
      <div style={{ background: C.gray50, borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Price</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.navy }}>TZS {fmt(company.price)}</div>
      </div>

      {/* New Price input */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.gray600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          New Price (TZS) <span style={{ color: C.red }}>*</span>
        </label>
        <input
          type="number" value={newPrice} onChange={e => { setNewPrice(e.target.value); setError(""); }}
          placeholder="Enter new price..." autoFocus
          style={{ border: `1.5px solid ${error ? C.red : C.gray200}`, borderRadius: 8, padding: "10px 12px", fontSize: 15, fontWeight: 700, outline: "none", fontFamily: "inherit", color: C.text, width: "100%", boxSizing: "border-box" }}
          onFocus={e => !error && (e.target.style.borderColor = C.green)}
          onBlur={e => !error && (e.target.style.borderColor = C.gray200)}
        />
        {error && <div style={{ fontSize: 12, color: C.red }}>{error}</div>}
      </div>

      {/* Price movement preview */}
      {changeAmt !== null && newPrice && (
        <div style={{ background: up ? C.greenBg : C.redBg, border: `1px solid ${up ? "#BBF7D0" : "#FECACA"}`, borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: C.gray600, fontWeight: 600 }}>Price Movement</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: up ? C.green : C.red }}>{up ? "▲" : "▼"} TZS {fmt(Math.abs(changeAmt))}</span>
            <span style={{ background: up ? C.green : C.red, color: C.white, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{up ? "+" : ""}{changePct?.toFixed(2)}%</span>
          </div>
        </div>
      )}

      {/* Date & Time */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.gray600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Date & Time</label>
        <input
          type="datetime-local" value={datetime} onChange={e => setDatetime(e.target.value)}
          style={{ border: `1.5px solid ${C.gray200}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", color: C.text, width: "100%", boxSizing: "border-box" }}
          onFocus={e => (e.target.style.borderColor = C.green)}
          onBlur={e => (e.target.style.borderColor = C.gray200)}
        />
      </div>

      {/* Reason */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.gray600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Reason</label>
        <input
          type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for price change..."
          style={{ border: `1.5px solid ${C.gray200}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", color: C.text, width: "100%", boxSizing: "border-box" }}
          onFocus={e => (e.target.style.borderColor = C.green)}
          onBlur={e => (e.target.style.borderColor = C.gray200)}
        />
      </div>
    </ModalShell>
  );
}

// ─── Price History Modal ──────────────────────────────────────────
export function PriceHistoryModal({ company, history, onClose }) {
  if (!company) return null;
  return (
    <ModalShell
      title="📈 Price History"
      subtitle={company.name}
      headerRight={
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Price</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>TZS {fmt(company.price)}</div>
        </div>
      }
      onClose={onClose}
      maxWidth={680}
      maxHeight="80vh"
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <div style={{ fontSize: 12, color: C.gray400 }}>{history.length} price update{history.length !== 1 ? "s" : ""} recorded</div>
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
        </div>
      }
    >
      {history.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 20px", color: C.gray400 }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <div style={{ fontWeight: 600 }}>No price history yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Price changes will appear here after the first update</div>
        </div>
      ) : (
        <div style={{ overflowX: "auto", margin: "0 -28px", padding: "0 0 4px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.gray50 }}>
                {["#", "Date & Time", "Old Price", "New Price", "Change", "Change %", "Notes", "Updated By"].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: ["Old Price", "New Price", "Change", "Change %"].includes(h) ? "right" : "left", color: C.gray400, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.gray200}`, borderTop: `1px solid ${C.gray200}`, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => {
                const up = h.change_amount >= 0;
                return (
                  <tr key={h.id} style={{ borderBottom: `1px solid ${C.gray100}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "12px 16px", color: C.gray400, fontWeight: 600 }}>{i + 1}</td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, color: C.text }}>{new Date(h.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                      <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{new Date(h.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right", color: C.gray600 }}>{fmt(h.old_price)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: C.text }}>{fmt(h.new_price)}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: up ? C.green : C.red }}>{up ? "▲" : "▼"} {fmt(Math.abs(h.change_amount))}</td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <span style={{ background: up ? C.greenBg : C.redBg, color: up ? C.green : C.red, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                        {up ? "+" : ""}{Number(h.change_percent).toFixed(2)}%
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: C.gray600, maxWidth: 160 }}>{h.notes || <span style={{ color: C.gray400 }}>—</span>}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: C.navy + "12", color: C.navy, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{h.updated_by}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </ModalShell>
  );
}

// ─── Transaction Form Modal ───────────────────────────────────────
export function TransactionFormModal({ transaction, companies, onConfirm, onClose }) {
  const today = new Date().toISOString().split("T")[0];
  const isEdit = !!transaction;
  const [form, setForm] = useState(
    transaction
      ? { date: transaction.date, companyId: transaction.company_id, type: transaction.type, qty: transaction.qty, price: transaction.price, fees: transaction.fees || "", remarks: transaction.remarks || "" }
      : { date: today, companyId: "", type: "Buy", qty: "", price: "", fees: "", remarks: "" }
  );
  const [error, setError] = useState("");

  const total = (Number(form.qty) || 0) * (Number(form.price) || 0);
  const grandTotal = total + (Number(form.fees) || 0);

  const handle = () => {
    if (!form.date || !form.companyId || !form.qty || !form.price) {
      setError("Please fill in Date, Company, Quantity and Price per Share.");
      return;
    }
    setError("");
    onConfirm({ ...form, total, grandTotal });
  };

  return (
    <ModalShell
      title={isEdit ? "✏️ Edit Transaction" : "📝 Record New Transaction"}
      subtitle={isEdit ? "Update the details below and save" : "Record a new buy or sell order"}
      onClose={onClose}
      maxWidth={620}
      footer={
        <>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={handle} icon="💾">
            {isEdit ? "Save Changes" : "Record Transaction"}
          </Btn>
        </>
      }
    >
      {error && (
        <div style={{ background: C.redBg, border: `1px solid #FECACA`, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.red, fontWeight: 500 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <FInput label="Date" required type="date" value={form.date} onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setError(""); }} />
        <FSelect label="Company" required value={form.companyId} onChange={e => { setForm(f => ({ ...f, companyId: e.target.value })); setError(""); }}>
          <option value="">Select company...</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </FSelect>
        <FSelect label="Transaction Type" required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
          <option value="Buy">🟢 Buy</option>
          <option value="Sell">🔴 Sell</option>
        </FSelect>
        <FInput label="Quantity" required type="number" value={form.qty} onChange={e => { setForm(f => ({ ...f, qty: e.target.value })); setError(""); }} placeholder="0" />
        <FInput label="Price per Share (TZS)" required type="number" value={form.price} onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setError(""); }} placeholder="0.00" />
        <FInput label="Other Fees (TZS)" type="number" value={form.fees} onChange={e => setForm(f => ({ ...f, fees: e.target.value }))} placeholder="0.00" />
      </div>

      {/* Auto-calc summary */}
      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, background: C.gray50, border: `1px solid ${C.gray200}`, borderRadius: 10, padding: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Shares Total</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginTop: 4 }}>TZS {fmt(total)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fees</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginTop: 4 }}>TZS {fmt(form.fees || 0)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Grand Total</div>
            <div style={{ fontSize: 19, fontWeight: 800, color: C.green, marginTop: 4 }}>TZS {fmt(grandTotal)}</div>
          </div>
        </div>
      )}

      <FTextarea label="Remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes..." style={{ minHeight: 56 }} />
    </ModalShell>
  );
}
