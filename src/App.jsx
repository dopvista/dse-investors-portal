import { useState, useEffect } from "react";
import { sbGet } from "./lib/supabase";
import { C, Toast, Spinner } from "./components/ui";
import CompaniesPage from "./pages/CompaniesPage";
import TransactionsPage from "./pages/TransactionsPage";

const NAV = [
  { id: "companies",    label: "Holdings",     icon: "🏢" },
  { id: "transactions", label: "Transactions", icon: "📋" },
  // ── Add future pages here ──────────────────────────────────────
  // { id: "portfolio",   label: "Portfolio",    icon: "📊" },
  // { id: "reports",     label: "Reports",      icon: "📄" },
  // { id: "settings",    label: "Settings",     icon: "⚙️" },
];

export default function App() {
  const [tab, setTab]               = useState("companies");
  const [companies, setCompanies]   = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [dbError, setDbError]       = useState(null);
  const [toast, setToast]           = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  useEffect(() => {
    (async () => {
      try {
        const [c, t] = await Promise.all([sbGet("companies"), sbGet("transactions")]);
        setCompanies(c);
        setTransactions(t);
      } catch (e) {
        setDbError(e.message);
      }
      setLoading(false);
    })();
  }, []);

  // ── Loading screen ────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.navy, fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center", color: C.white }}>
        <img src="/logo.jpg" alt="DSE Investors Portal" style={{ width: 72, height: 72, borderRadius: 16, marginBottom: 20, objectFit: "cover", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }} />
        <div style={{ fontWeight: 600, fontSize: 16 }}>DSE Investors Portal</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.2)`, borderTop: `2px solid ${C.green}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Connecting to database...
        </div>
      </div>
    </div>
  );

  // ── Error screen ──────────────────────────────────────────────
  if (dbError) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.gray50, fontFamily: "system-ui" }}>
      <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 16, padding: 40, maxWidth: 440, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: C.red, margin: "0 0 8px", fontSize: 18 }}>Database Connection Error</h3>
        <p style={{ color: C.gray600, fontSize: 14, lineHeight: 1.6 }}>{dbError}</p>
      </div>
    </div>
  );

  const counts = { companies: companies.length, transactions: transactions.length };
  const now = new Date();

  // ── App shell ─────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: C.gray50 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <div style={{ width: 240, background: C.navy, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>

        {/* Logo */}
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img
              src="/logo.jpg"
              alt="DI"
              style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }}
            />
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>DSE Investors</div>
              <div style={{ color: C.gold, fontWeight: 600, fontSize: 11 }}>Portal</div>
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 16px" }} />

        {/* Date / Time */}
        <div style={{ padding: "16px 24px" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Market Session</div>
          <div style={{ color: C.white, fontSize: 15, fontWeight: 700, marginTop: 4 }}>
            {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
            {now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, border: `1px solid ${C.green}44`, borderRadius: 20, padding: "4px 10px" }}>
            <div style={{ width: 6, height: 6, background: C.green, borderRadius: "50%" }} />
            <span style={{ color: C.green, fontSize: 11, fontWeight: 600 }}>Live</span>
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 16px" }} />

        {/* Nav links */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 12px", marginBottom: 8 }}>Navigation</div>
          {NAV.map(item => {
            const active = tab === item.id;
            return (
              <button key={item.id} onClick={() => setTab(item.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "11px 14px", borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 4,
                background: active ? `${C.green}22` : "transparent",
                borderLeft: `3px solid ${active ? C.green : "transparent"}`,
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 17 }}>{item.icon}</span>
                <span style={{ color: active ? C.white : "rgba(255,255,255,0.55)", fontWeight: active ? 700 : 500, fontSize: 14, flex: 1, textAlign: "left" }}>{item.label}</span>
                {counts[item.id] !== undefined && (
                  <span style={{ background: active ? C.green : "rgba(255,255,255,0.1)", color: active ? C.white : "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10 }}>
                    {counts[item.id]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, background: C.green, borderRadius: "50%" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Supabase connected</span>
          </div>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 6 }}>DSE Investors Portal v1.0</div>
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.gray200}`, padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>
              {NAV.find(n => n.id === tab)?.label}
            </div>
            <div style={{ fontSize: 12, color: C.gray400, marginTop: 1 }}>
              {tab === "companies" ? "Manage your DSE registered companies" : "Record and view all buy/sell activity"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{companies.length} Holdings</div>
              <div style={{ fontSize: 12, color: C.gray400 }}>{transactions.length} Transactions</div>
            </div>
            {/* Logo avatar */}
            <img
              src="/logo.jpg"
              alt="DI"
              style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexShrink: 0 }}
            />
          </div>
        </div>

        {/* Page renderer */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {tab === "companies" && <CompaniesPage companies={companies} setCompanies={setCompanies} transactions={transactions} showToast={showToast} />}
          {tab === "transactions" && <TransactionsPage companies={companies} transactions={transactions} setTransactions={setTransactions} showToast={showToast} />}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
