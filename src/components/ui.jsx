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
  gray600: "#475569",
  gray800: "#1E293B",
  text: "#0F172A",
};

// ─── Helpers ──────────────────────────────────────────────────────
export const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtInt = (n) => Number(n || 0).toLocaleString("en-US");

// ─── Spinner ──────────────────────────────────────────────────────
export function Spinner({ size = 18, color = C.white }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid rgba(255,255,255,0.3)`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
      flexShrink: 0,
    }} />
  );
}

// ─── Toast ────────────────────────────────────────────────────────
export function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28,
      background: type === "error" ? C.red : C.green,
      color: C.white, padding: "14px 22px", borderRadius: 10,
      fontSize: 14, fontWeight: 500, zIndex: 9999,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <span>{type === "error" ? "✕" : "✓"}</span>{msg}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color = C.green, icon }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.gray200}`,
      borderRadius: 14, padding: "20px 24px",
      display: "flex", alignItems: "center", gap: 16,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{
        width: 46, height: 46, background: color + "18",
        borderRadius: 12, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 12, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: C.gray600, marginTop: 4 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────
export function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.gray200}`,
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 24,
    }}>
      {title && (
        <div style={{
          padding: "18px 24px", borderBottom: `1px solid ${C.gray100}`,
          background: C.gray50,
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.gray400, marginTop: 2 }}>{subtitle}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// ─── Form Primitives ─────────────────────────────────────────────
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
  border: `1.5px solid ${C.gray200}`, borderRadius: 8,
  padding: "10px 12px", fontSize: 14, outline: "none",
  background: readOnly ? C.gray50 : C.white,
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

// ─── Price History Modal ──────────────────────────────────────────
export function PriceHistoryModal({ company, history, onClose }) {
  if (!company) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 680, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 16px", borderBottom: `1px solid ${C.gray200}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>📈 Price History</div>
            <div style={{ fontSize: 13, color: C.gray400, marginTop: 2 }}>{company.name}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current Price</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.green }}>TZS {fmt(company.price)}</div>
            </div>
            <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${C.gray200}`, background: C.gray50, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 20px", color: C.gray400 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ fontWeight: 600 }}>No price history yet</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Price changes will appear here after the first update</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.gray50, position: "sticky", top: 0 }}>
                  {["#", "Date & Time", "Old Price", "New Price", "Change", "Change %", "Notes", "Updated By"].map(h => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: ["Old Price", "New Price", "Change", "Change %"].includes(h) ? "right" : "left", color: C.gray400, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.gray200}`, whiteSpace: "nowrap" }}>{h}</th>
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
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap", color: C.gray600 }}>
                        <div style={{ fontWeight: 600, color: C.text }}>{new Date(h.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                        <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{new Date(h.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: C.gray600 }}>{fmt(h.old_price)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: C.text }}>{fmt(h.new_price)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: up ? C.green : C.red }}>
                        {up ? "▲" : "▼"} {fmt(Math.abs(h.change_amount))}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <span style={{ background: up ? C.greenBg : C.redBg, color: up ? C.green : C.red, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {up ? "+" : ""}{Number(h.change_percent).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: C.gray600, maxWidth: 160 }}>{h.notes || <span style={{ color: C.gray400 }}>—</span>}</td>
                      <td style={{ padding: "12px 16px", color: C.gray600 }}>
                        <span style={{ background: C.navy + "12", color: C.navy, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{h.updated_by}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 28px", borderTop: `1px solid ${C.gray200}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: C.gray50 }}>
          <div style={{ fontSize: 12, color: C.gray400 }}>{history.length} price update{history.length !== 1 ? "s" : ""} recorded</div>
          <Btn variant="secondary" onClick={onClose}>Close</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────
export function Modal({ type = "confirm", title, message, onConfirm, onClose }) {
  if (!title) return null;
  const isWarn = type === "warning";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: C.white, borderRadius: 16, padding: 32, maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", animation: "fadeIn 0.15s ease" }}>
        {/* Icon */}
        <div style={{ width: 52, height: 52, borderRadius: 14, background: isWarn ? C.redBg : "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, marginBottom: 16 }}>
          {isWarn ? "🚫" : "🗑️"}
        </div>
        {/* Title */}
        <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 8 }}>{title}</div>
        {/* Message */}
        <div style={{ fontSize: 14, color: C.gray600, lineHeight: 1.6, marginBottom: 24 }}>{message}</div>
        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {isWarn ? (
            <Btn variant="secondary" onClick={onClose}>Close</Btn>
          ) : (
            <>
              <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
              <Btn variant="danger" onClick={onConfirm} style={{ background: C.red, color: C.white, border: "none" }}>Yes, Delete</Btn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────
export function Btn({ children, variant = "primary", loading, icon, ...props }) {
  const variants = {
    primary: { background: `linear-gradient(135deg, ${C.green}, ${C.greenLight})`, color: C.white, border: "none", boxShadow: "0 4px 12px rgba(0,132,61,0.3)" },
    secondary: { background: C.white, color: C.gray800, border: `1.5px solid ${C.gray200}` },
    danger: { background: C.redBg, color: C.red, border: `1.5px solid #FECACA` },
    navy: { background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`, color: C.white, border: "none", boxShadow: "0 4px 12px rgba(11,31,58,0.3)" },
  };
  return (
    <button {...props} disabled={loading || props.disabled} style={{
      padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: loading ? "wait" : "pointer",
      display: "inline-flex", alignItems: "center", gap: 7,
      transition: "opacity 0.2s", fontFamily: "inherit",
      ...variants[variant], ...props.style,
    }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
      {loading
        ? <Spinner size={14} color={variant === "primary" || variant === "navy" ? C.white : C.green} />
        : icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
