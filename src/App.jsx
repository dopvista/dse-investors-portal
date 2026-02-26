import { useState, useEffect } from "react";
import { sbGet, sbGetTransactions, getSession, sbSignOut, sbGetProfile, sbGetMyRole } from "./lib/supabase";
import { C, Toast } from "./components/ui";
import CompaniesPage from "./pages/CompaniesPage";
import TransactionsPage from "./pages/TransactionsPage";
import LoginPage from "./pages/LoginPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UserManagementPage from "./pages/UserManagementPage";
import UserMenu from "./components/UserMenu";
import logo from "./assets/logo.jpg";

// ── Role-based nav visibility ──────────────────────────────────────
const NAV = [
  { id: "companies",       label: "Portfolio",       icon: "📊", roles: ["SA","AD","DE","VR","RO"] },
  { id: "transactions",    label: "Transactions",    icon: "📋", roles: ["SA","AD","DE","VR","RO"] },
  { id: "user-management", label: "User Management", icon: "👥", roles: ["SA","AD"] },
];

// ── Role display config ────────────────────────────────────────────
export { ROLE_META } from "./lib/constants";

export default function App() {
  const [session, setSession]           = useState(undefined);
  const [profile, setProfile]           = useState(undefined);
  const [role, setRole]                 = useState(null);
  const [tab, setTab]                   = useState("companies");
  const [companies, setCompanies]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [dbError, setDbError]           = useState(null);
  const [toast, setToast]               = useState({ msg: "", type: "" });
  const [recoveryMode, setRecoveryMode] = useState(false); // ← password reset flow

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  // ── Check session on mount — also intercepts recovery tokens ────
  useEffect(() => {
    // Detect #type=recovery in the URL hash (from password reset email)
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const accessToken = params.get("access_token");
      if (accessToken) {
        localStorage.setItem("sb_recovery_token", accessToken);
        window.history.replaceState(null, "", window.location.pathname); // clean URL
        setRecoveryMode(true);
        setSession(null); // ensure we don't try to load app data
        return;
      }
    }
    const s = getSession();
    setSession(s || null);
  }, []);

  // ── Load profile + role + data once session confirmed ────────────
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        // Pass the fresh access_token explicitly to avoid stale localStorage
        // race condition where a previous user's session is still in storage
        const freshToken = session?.access_token;
        // Fetch role first — needed to filter transactions correctly
        const [p, r, c] = await Promise.all([
          sbGetProfile(freshToken),
          sbGetMyRole(freshToken),
          sbGet("companies"),
        ]);
        const t = await sbGetTransactions(r);
        setProfile(p);
        setRole(r);
        setCompanies(c);
        setTransactions(t);
      } catch (e) {
        setDbError(e.message);
      }
      setLoading(false);
    })();
  }, [session]);

  const handleLogin    = (s) => setSession(s);
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

  // ── Password recovery mode — intercept before everything else ────
  if (recoveryMode) return (
    <ResetPasswordPage onDone={() => {
      setRecoveryMode(false);
      localStorage.removeItem("sb_recovery_token");
    }} />
  );

  // ── Checking session ─────────────────────────────────────────────
  if (session === undefined) return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif", background: "radial-gradient(ellipse at 60% 40%, #0c2548 0%, #0B1F3A 50%, #080f1e 100%)" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.4; transform:scale(0.95); } 50% { opacity:1; transform:scale(1); } }
      `}</style>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "-80px", right: "-80px", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,132,61,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-100px", left: "-60px", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: C.white }}>
        <div style={{ animation: "pulse 1.8s ease-in-out infinite", marginBottom: 20 }}>
          <img src={logo} alt="DSE" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: "0.01em" }}>DSE Investors Portal</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>Checking your session...</div>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, opacity: 0.3, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── Not logged in ────────────────────────────────────────────────
  if (!session) return <LoginPage onLogin={handleLogin} />;

  // ── Loading data ─────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif", background: "radial-gradient(ellipse at 60% 40%, #0c2548 0%, #0B1F3A 50%, #080f1e 100%)" }}>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:0.4; transform:scale(0.95); } 50% { opacity:1; transform:scale(1); } }
        @keyframes bar   { 0% { width:"0%" } 100% { width:"100%" } }
      `}</style>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "-80px", right: "-80px", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,132,61,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-100px", left: "-60px", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", color: C.white, minWidth: 240 }}>
        <div style={{ animation: "pulse 1.8s ease-in-out infinite", marginBottom: 22 }}>
          <img src={logo} alt="DSE" style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", border: "3px solid rgba(255,255,255,0.15)" }} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "0.01em" }}>DSE Investors Portal</div>
        <div style={{ color: C.gold, fontWeight: 600, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 4 }}>DAR ES SALAAM STOCK EXCHANGE</div>

        {/* Progress bar */}
        <div style={{ margin: "20px auto 0", width: 180, height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: "100%", background: `linear-gradient(90deg, ${C.green}, ${C.gold})`, borderRadius: 4, animation: "bar 2s ease-in-out infinite" }} />
        </div>

        <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.15)", borderTop: `2px solid ${C.green}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          Loading your portfolio...
        </div>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: C.green, opacity: 0.3, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
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
  if (!profile) return (
    <ProfileSetupPage session={session} onComplete={handleProfileDone} onCancel={handleSignOut} />
  );

  // ── Filter nav by role ────────────────────────────────────────────
  const visibleNav = NAV.filter(item => !role || item.roles.includes(role));
  const counts = { companies: companies.length, transactions: transactions.length };
  const now = new Date();

  // ── App shell ─────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", fontFamily: "'Inter', system-ui, sans-serif", background: C.gray50, overflow: "hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Sidebar ── */}
      <div style={{ width: 240, display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh", overflowY: "auto", position: "relative",
        background: "radial-gradient(ellipse at 60% 40%, #0c2548 0%, #0B1F3A 50%, #080f1e 100%)" }}>
        {/* Dot grid overlay */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ padding: "24px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="DI" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.35)" }} />
            <div>
              <div style={{ color: C.white, fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>DSE Investors</div>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 15, marginTop: 1 }}>Portal</div>
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

        <div style={{ margin: "0 16px 12px", display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 7, height: 7, background: C.green, borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Supabase connected</span>
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 16px" }} />

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

        <UserMenu
          profile={profile}
          session={session}
          role={role}
          onSignOut={handleSignOut}
          onOpenProfile={() => setTab("profile")}
        />
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>
        <div style={{ background: C.white, borderBottom: `1px solid ${C.gray200}`, padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: C.text }}>
              {tab === "profile"         && "My Profile"}
              {tab === "user-management" && "User Management"}
              {tab !== "profile" && tab !== "user-management" && NAV.find(n => n.id === tab)?.label}
            </div>
            <div style={{ fontSize: 12, color: C.gray400, marginTop: 1 }}>
              {tab === "companies"       && "Your CDS portfolio holdings"}
              {tab === "transactions"    && "Record and view all buy/sell activity"}
              {tab === "profile"         && "Manage your personal information"}
              {tab === "user-management" && "Manage system users and assign roles"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Stats pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.navy + "0a", border: `1px solid ${C.navy}18`, borderRadius: 8, padding: "4px 10px" }}>
                <span style={{ fontSize: 12 }}>🏢</span>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1 }}>Holdings</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{companies.length}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, background: C.green + "0d", border: `1px solid ${C.green}20`, borderRadius: 8, padding: "4px 10px" }}>
                <span style={{ fontSize: 12 }}>📋</span>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.05em", lineHeight: 1 }}>Transactions</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.green, lineHeight: 1.2 }}>{transactions.length}</div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ width: 1, height: 36, background: C.gray200 }} />

            {/* CDS badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: `linear-gradient(135deg, ${C.navy}, #1e3a5f)`, borderRadius: 12, padding: "6px 14px 6px 10px", boxShadow: "0 2px 10px rgba(11,31,58,0.25)" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔒</div>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", lineHeight: 1 }}>CDS Account</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.white, letterSpacing: "0.04em", lineHeight: 1.3 }}>{profile?.cds_number || "—"}</div>
              </div>
            </div>


          </div>
        </div>

        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {tab === "companies"       && <CompaniesPage      companies={companies}    setCompanies={setCompanies}    transactions={transactions} showToast={showToast} role={role} profile={profile} />}
          {tab === "transactions"    && <TransactionsPage   companies={companies}    transactions={transactions}     setTransactions={setTransactions}               showToast={showToast} role={role} cdsNumber={profile?.cds_number} />}
          {tab === "profile"         && <ProfilePage profile={profile} setProfile={setProfile} session={session} role={role} email={session?.user?.email || session?.email || ""} showToast={showToast} />}
          {tab === "user-management" && <UserManagementPage role={role} showToast={showToast} profile={profile} />}
        </div>
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
