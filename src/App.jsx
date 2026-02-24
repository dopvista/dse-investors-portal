import { useState, useEffect } from "react";
import { sbGet, getSession, sbSignOut, sbGetProfile, sbGetMyRole } from "./lib/supabase";
import { C, Toast } from "./components/ui";
import CompaniesPage from "./pages/CompaniesPage";
import TransactionsPage from "./pages/TransactionsPage";
import LoginPage from "./pages/LoginPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import ProfilePage from "./pages/ProfilePage";
import UserManagementPage from "./pages/UserManagementPage";
import UserMenu from "./components/UserMenu";
import logo from "./assets/logo.jpg";

// ── Role-based nav visibility ──────────────────────────────────────
// Each nav item declares which role codes can see it.
// SA and AD can see everything. DE, VR, RO have limited access.
const NAV = [
  { id: "companies",       label: "Holdings",         icon: "🏢", roles: ["SA","AD","DE","VR","RO"] },
  { id: "transactions",    label: "Transactions",     icon: "📋", roles: ["SA","AD","DE","VR","RO"] },
  { id: "user-management", label: "User Management",  icon: "👥", roles: ["SA"] },
  // { id: "portfolio",    label: "Portfolio",        icon: "📊", roles: ["SA","AD","RO"] },
  // { id: "reports",      label: "Reports",          icon: "📄", roles: ["SA","AD","VR","RO"] },
];

// ── Role display config (badge color + label) ──────────────────────
export const ROLE_META = {
  SA: { label: "Super Admin",  color: "#0A2540" },
  AD: { label: "Admin",        color: "#1E3A5F" },
  DE: { label: "Data Entrant", color: "#1D4ED8" },
  VR: { label: "Verifier",     color: "#065F46" },
  RO: { label: "Read Only",    color: "#374151" },
};

export default function App() {
  const [session, setSession]           = useState(undefined);
  const [profile, setProfile]           = useState(undefined);
  const [role, setRole]                 = useState(null);      // 'SA' | 'AD' | 'DE' | 'VR' | 'RO' | null
  const [tab, setTab]                   = useState("companies");
  const [companies, setCompanies]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [dbError, setDbError]           = useState(null);
  const [toast, setToast]               = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  // ── Check session on mount ───────────────────────────────────────
  useEffect(() => {
    const s = getSession();
    setSession(s || null);
  }, []);

  // ── Load profile + role + data once session confirmed ────────────
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const [p, r, c, t] = await Promise.all([
          sbGetProfile(),
          sbGetMyRole(),       // ← fetch role alongside everything else
          sbGet("companies"),
          sbGet("transactions"),
        ]);
        setProfile(p);
        setRole(r);            // e.g. 'SA', 'AD', 'DE', 'VR', 'RO'
        setCompanies(c);
        setTransactions(t);
      } catch (e) {
        setDbError(e.message);
      }
      setLoading(false);
    })();
  }, [session]);

  const handleLogin = (s) => setSession(s);

  const handleProfileDone = (p) => setProfile(p);

  const handleSignOut = async () => {
    await sbSignOut();
    setSession(null);
    setProfile(undefined);
    setRole(null);
    setCompanies([]);
    setTransactions([]);
    setLoading(true);
    setDbError(null);
  };

  // ── Checking session ─────────────────────────────────────────────
  if (session === undefined) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.navy }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.2)`, borderTop: `2px solid ${C.green}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  // ── Not logged in ────────────────────────────────────────────────
  if (!session) return <LoginPage onLogin={handleLogin} />;

  // ── Loading data ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.navy, fontFamily: "system-ui" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center", color: C.white }}>
        <img src={logo} alt="DSE" style={{ width: 72, height: 72, borderRadius: 16, marginBottom: 20, objectFit: "cover", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }} />
        <div style={{ fontWeight: 600, fontSize: 16 }}>DSE Investors Portal</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, border: `2px solid rgba(255,255,255,0.2)`, borderTop: `2px solid ${C.green}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Loading your portfolio...
        </div>
      </div>
    </div>
  );

  // ── DB Error ─────────────────────────────────────────────────────
  if (dbError) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.gray50, fontFamily: "system-ui" }}>
      <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 16, padding: 40, maxWidth: 440, textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: C.red, margin: "0 0 8px", fontSize: 18 }}>Database Connection Error</h3>
        <p style={{ color: C.gray600, fontSize: 14, lineHeight: 1.6 }}>{dbError}</p>
      </div>
    </div>
  );

  // ── No profile yet → show setup screen ───────────────────────────
  if (!profile) return <ProfileSetupPage session={session} onComplete={handleProfileDone} />;

  // ── Filter nav items by current user's role ───────────────────────
  const visibleNav = NAV.filter(item => !role || item.roles.includes(role));
  const counts = { companies: companies.length, transactions: transactions.length };
  const now = new Date();

  // ── App shell ─────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", fontFamily: "'Inter', system-ui, sans-serif", background: C.gray50, overflow: "hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <div style={{ width: 240, background: C.navy, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", overflowY: "auto" }}>

        {/* Logo */}
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="DI" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }} />
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>DSE Investors</div>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 13, marginTop: 1 }}>Portal</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
                <div style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", flexShrink: 0 }} />
                <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: 500 }}>
                  {now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  {" | "}
                  {now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Role badge — shows current user's role under logo */}
        {role && (
          <div style={{ margin: "0 16px 12px", padding: "6px 12px", borderRadius: 8, background: `${ROLE_META[role]?.color}33`, border: `1px solid ${ROLE_META[role]?.color}66`, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: ROLE_META[role]?.color, flexShrink: 0 }} />
            <span style={{ color: C.white, fontSize: 11, fontWeight: 600 }}>{ROLE_META[role]?.label}</span>
          </div>
        )}

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 16px" }} />

        {/* Nav — filtered by role */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 12px", marginBottom: 8 }}>Navigation</div>
          {visibleNav.map(item => {
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

        {/* Supabase status */}
        <div style={{ padding: "10px 24px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, background: C.green, borderRadius: "50%" }} />
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Supabase connected</span>
          </div>
        </div>

        {/* User Menu */}
        <UserMenu
          profile={profile}
          session={session}
          role={role}
          onSignOut={handleSignOut}
          onOpenProfile={() => setTab("profile")}
        />
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.gray200}`, padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>
              {tab === "profile"          && "My Profile"}
              {tab === "user-management"  && "User Management"}
              {tab !== "profile" && tab !== "user-management" && NAV.find(n => n.id === tab)?.label}
            </div>
            <div style={{ fontSize: 12, color: C.gray400, marginTop: 1 }}>
              {tab === "companies"       && "Manage your DSE registered companies"}
              {tab === "transactions"    && "Record and view all buy/sell activity"}
              {tab === "profile"         && "Manage your personal information"}
              {tab === "user-management" && "Manage system users and assign roles"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{companies.length} Holdings</div>
              <div style={{ fontSize: 12, color: C.gray400 }}>{transactions.length} Transactions</div>
            </div>
            <img src={logo} alt="DI" style={{ width: 38, height: 38, borderRadius: 10, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", flexShrink: 0 }} />
          </div>
        </div>

        {/* Page renderer */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {tab === "companies"       && <CompaniesPage     companies={companies}    setCompanies={setCompanies}       transactions={transactions} showToast={showToast} role={role} />}
          {tab === "transactions"    && <TransactionsPage  companies={companies}    transactions={transactions}        setTransactions={setTransactions}                showToast={showToast} role={role} />}
          {tab === "profile"         && <ProfilePage       profile={profile}        setProfile={setProfile}                                                            showToast={showToast} />}
          {tab === "user-management" && <UserManagementPage role={role}             showToast={showToast} />}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
