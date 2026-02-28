import { useState, useEffect } from "react";
import { sbSignIn, sbResetPassword } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

// Fallback slides used when no settings are loaded
const DEFAULT_SLIDES = [
  { id: 1, title: "Market Insights", sub: "Real-time data at your fingertips.", color: C.navy, image: "https://images.unsplash.com/photo-1611974717482-480928224732?auto=format&fit=crop&q=80" },
  { id: 2, title: "Secure Investing", sub: "Your assets are protected with DSE.", color: "#064e3b", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80" },
  { id: 3, title: "Digital Future", sub: "Managing investments has never been easier.", color: "#78350f", image: "https://images.unsplash.com/photo-1551288049-bbda38a5f9a2?auto=format&fit=crop&q=80" },
];

export default function LoginPage({ onLogin, loginSettings }) {
  // Use settings from DB, fall back to defaults
  const ADVERTS = (loginSettings?.slides || DEFAULT_SLIDES).map((s, i) => ({ ...s, id: i + 1 }));
  const INTERVAL = loginSettings?.interval || 5000;
  const ANIMATED = loginSettings?.animated ?? true;

  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeAd, setActiveAd] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering) return;
    const t = setInterval(() => setActiveAd(p => (p + 1) % ADVERTS.length), INTERVAL);
    return () => clearInterval(t);
  }, [isHovering, INTERVAL, ADVERTS.length]);

  const inpStyle = {
    width: "100%", padding: "14px 18px", borderRadius: 14,
    fontSize: 15, fontFamily: "'Inter', sans-serif",
    background: "rgba(255,255,255,0.07)",
    border: "1.5px solid rgba(0,249,255,0.35)",
    color: "#fff",
    outline: "none",
    transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
    boxShadow: "0 0 0 0 rgba(0,249,255,0.2)",
    backdropFilter: "blur(8px)",
  };

  const Label = ({ text }) => (
    <label style={{ 
      fontSize: 13, fontWeight: 600, color: "#a5f3fc", 
      display: "block", marginBottom: 6, letterSpacing: "0.5px",
      textTransform: "uppercase" 
    }}>{text}</label>
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim() || !password.trim()) return setError("Email and password are required");
    setLoading(true);
    try { const data = await sbSignIn(email.trim(), password); onLogin(data); }
    catch (err) { setError(err.message || "Invalid email or password"); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim()) return setError("Enter your email address");
    setLoading(true);
    try { await sbResetPassword(email.trim()); setSuccess("Password reset email sent. Check your inbox."); }
    catch (err) { setError(err.message || "Password reset failed"); }
    finally { setLoading(false); }
  };

  const SubmitBtn = ({ label, loadingLabel }) => (
    <button type="submit" disabled={loading} style={{
      width: "100%", padding: "14px", borderRadius: 14, border: "none",
      background: loading 
        ? "rgba(255,255,255,0.1)" 
        : "linear-gradient(90deg, #00ff9d, #00f9ff)",
      color: "#fff",
      fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
      boxShadow: "0 0 30px rgba(0,249,255,0.5)",
      transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 0 50px rgba(0,249,255,0.8)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(0,249,255,0.5)"; }}
    >
      {loading ? <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />{loadingLabel}</> : label}
    </button>
  );

  return (
    <div style={{ 
      minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", 
      fontFamily: "'Inter', sans-serif", padding: 20, boxSizing: "border-box", position: "relative", overflow: "hidden",
      background: "radial-gradient(ellipse at 50% 30%, #0a1428 0%, #05080f 60%, #02050a 100%)"
    }}>
      {/* === 2050 STARFIELD (3 parallax layers) === */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
        backgroundSize: "180px 180px", opacity: 0.18, animation: "starDrift 220s linear infinite" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, #e0f2fe 1px, transparent 1px)",
        backgroundSize: "95px 95px", opacity: 0.25, animation: "starDrift 140s linear infinite reverse" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, #67e8f9 0.8px, transparent 1px)",
        backgroundSize: "48px 48px", opacity: 0.22, animation: "starDrift 65s linear infinite" }} />

      {/* Glow orbs upgraded to plasma energy */}
      <div style={{ position: "absolute", top: "-120px", right: "-140px", width: 520, height: 520, borderRadius: "50%", 
        background: "radial-gradient(circle, rgba(103,232,249,0.22) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-160px", left: "-100px", width: 580, height: 580, borderRadius: "50%", 
        background: "radial-gradient(circle, rgba(165,243,252,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes kenBurns { 0% { transform:scale(1); } 100% { transform:scale(1.08); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes starDrift { from { background-position: 0 0; } to { background-position: 1200px 800px; } }
        @keyframes scanline { 0% { top: -30px; } 100% { top: 100%; } }
        @keyframes floatCard { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-18px); } }
        ${ANIMATED ? ".ad-bg { animation: kenBurns 9s ease-in-out infinite alternate; }" : ""}
        input:focus { 
          border-color: #67e8f9 !important; 
          box-shadow: 0 0 0 4px rgba(103,232,249,0.35) !important;
          background: rgba(255,255,255,0.12) !important;
        }
        input::placeholder { color: #64748b; }
        .neon-text { text-shadow: 0 0 8px #fff, 0 0 20px #67e8f9, 0 0 40px #67e8f9; }
      `}</style>

      {/* MAIN HOLOGRAPHIC CARD */}
      <div style={{
        width: "min(1140px, 94vw)",
        background: "rgba(15, 23, 42, 0.82)",
        borderRadius: 32,
        boxShadow: "0 40px 90px -15px rgba(103,232,249,0.35), inset 0 0 80px rgba(255,255,255,0.06)",
        display: "grid",
        gridTemplateColumns: "1.62fr 1fr",
        overflow: "hidden",
        border: "1px solid rgba(103,232,249,0.25)",
        backdropFilter: "blur(32px)",
        animation: "floatCard 7s ease-in-out infinite",
      }}>
        {/* ── LEFT: HOLOGRAPHIC PORTAL SLIDER (full bleed, zero margin) ── */}
        <div style={{ 
          position: "relative", 
          background: ADVERTS[activeAd].color, 
          transition: "background 1s ease", 
          overflow: "hidden",
          height: "100%" 
        }}>
          {ADVERTS.map((ad, i) => (
            <div 
              key={ad.id} 
              className={ANIMATED ? "ad-bg" : ""} 
              style={{ 
                position: "absolute", 
                inset: 0, 
                opacity: i === activeAd ? 1 : 0, 
                backgroundImage: `url(${ad.image})`, 
                backgroundSize: "cover", 
                backgroundPosition: "center", 
                backgroundRepeat: "no-repeat",
                transition: "opacity 1.3s ease" 
              }} 
            />
          ))}

          {/* Cyber grid overlay */}
          <div style={{ 
            position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
            backgroundImage: "linear-gradient(rgba(103,232,249,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.035) 1px, transparent 1px)",
            backgroundSize: "44px 44px"
          }} />

          {/* Holographic scan line */}
          <div style={{ 
            position: "absolute", left: 0, width: "100%", height: "3px", zIndex: 4, pointerEvents: "none",
            background: "linear-gradient(90deg, transparent, #67e8f9, transparent)",
            boxShadow: "0 0 25px #67e8f9",
            animation: "scanline 3.2s linear infinite"
          }} />

          {/* Dynamic energy overlay */}
          <div style={{ 
            position: "absolute", inset: 0, zIndex: 2,
            background: `linear-gradient(135deg, ${ADVERTS[activeAd]?.color || "#0a1428"}aa 0%, transparent 65%)`,
            transition: "background 1s ease"
          }} />

          {/* Title + subtitle (neon glow) */}
          <div style={{ 
            position: "absolute", inset: 0, display: "flex", flexDirection: "column", 
            justifyContent: "center", padding: "0 42px", zIndex: 5 
          }}>
            {ADVERTS.map((ad, i) => (
              <div key={ad.id} style={{ display: i === activeAd ? "block" : "none", animation: "fadeIn 0.9s ease-out" }}>
                <h2 className="neon-text" style={{ 
                  fontSize: "clamp(26px, 3.8vw, 38px)", fontWeight: 900, color: "#fff", 
                  margin: "0 0 8px 0", lineHeight: 1.15, letterSpacing: "-0.5px" 
                }}>{ad.title}</h2>
                <p style={{ 
                  fontSize: 15.5, color: "rgba(224,242,254,0.92)", lineHeight: 1.5, 
                  maxWidth: 310, margin: 0, fontWeight: 400 
                }}>{ad.sub}</p>
              </div>
            ))}
          </div>

          {/* Holographic dots */}
          <div style={{ position: "absolute", bottom: 32, left: 42, zIndex: 6, display: "flex", gap: 10 }}>
            {ADVERTS.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setActiveAd(i)} 
                onMouseEnter={() => setIsHovering(true)} 
                onMouseLeave={() => setIsHovering(false)}
                style={{ 
                  width: i === activeAd ? 34 : 7, 
                  height: 5, 
                  borderRadius: 999, 
                  background: i === activeAd ? "#67e8f9" : "rgba(255,255,255,0.35)", 
                  boxShadow: i === activeAd ? "0 0 18px #67e8f9" : "none",
                  transition: "all 0.4s cubic-bezier(0.23, 1, 0.32, 1)", 
                  cursor: "pointer", 
                  border: "none", 
                  padding: 0 
                }} 
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT: NEURO-FORM (glass + neon) ── */}
        <div style={{ 
          background: "transparent", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          padding: "0 48px" 
        }}>
          <div style={{ width: "100%", maxWidth: "360px", margin: "0 auto" }}>
            {/* Header with glowing logo */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <img 
                src={logo} 
                alt="DSE" 
                style={{ 
                  width: 58, height: 58, borderRadius: 16, objectFit: "cover", 
                  marginBottom: 12, 
                  filter: "drop-shadow(0 0 22px #67e8f9)",
                  transition: "filter 0.4s"
                }} 
              />
              <div style={{ fontWeight: 900, fontSize: 19, color: "#fff", letterSpacing: "-0.4px" }}>
                DSE INVESTORS PORTAL
              </div>
              <div style={{ fontSize: 13, color: "#67e8f9", marginTop: 4, fontWeight: 500, letterSpacing: "1.5px" }}>
                NEURO-LINK • 2050
              </div>
              <div style={{ fontSize: 12.5, color: "#94a3b8", marginTop: 6 }}>
                {view === "login" ? "Sign in to your quantum account" : "Reset neural access"}
              </div>
              {view === "reset" && (
                <div style={{ marginTop: 12, background: "rgba(103,232,249,0.1)", border: "1px solid rgba(103,232,249,0.3)", 
                  borderRadius: 12, padding: "10px 14px", fontSize: 12, color: "#67e8f9", fontWeight: 500 }}>
                  A secure reset link will be transmitted to your neural implant
                </div>
              )}
            </div>

            {/* Banners (neon style) */}
            {error && <div style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.4)", color: "#fda4af", 
              borderRadius: 12, padding: "10px 16px", fontSize: 13, marginBottom: 16, boxShadow: "0 0 12px rgba(248,113,113,0.3)" }}>{error}</div>}
            {success && <div style={{ background: "rgba(103,232,249,0.12)", border: "1px solid rgba(103,232,249,0.4)", color: "#67e8f9", 
              borderRadius: 12, padding: "10px 16px", fontSize: 13, marginBottom: 16, boxShadow: "0 0 12px rgba(103,232,249,0.3)" }}>{success}</div>}

            {/* Login form */}
            {view === "login" && (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  <Label text="NEURAL ID (EMAIL)" />
                  <input style={inpStyle} type="email" placeholder="you@neural.dse" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div style={{ marginBottom: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Label text="QUANTUM PASSCODE" />
                    <button type="button" onClick={() => { setView("reset"); setError(""); setSuccess(""); }}
                      style={{ fontSize: 12, color: "#67e8f9", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                      FORGOT PASSCODE?
                    </button>
                  </div>
                  <input style={inpStyle} type="password" placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                <SubmitBtn label="CONNECT TO GRID →" loadingLabel="ESTABLISHING LINK..." />
              </form>
            )}

            {/* Reset form */}
            {view === "reset" && (
              <form onSubmit={handleReset}>
                <div style={{ marginBottom: 22 }}>
                  <Label text="NEURAL ID (EMAIL)" />
                  <input style={inpStyle} type="email" placeholder="you@neural.dse" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <SubmitBtn label="TRANSMIT RESET PULSE" loadingLabel="SENDING PULSE..." />
                </div>
                <button type="button" onClick={() => { setView("login"); setError(""); setSuccess(""); }}
                  style={{ width: "100%", padding: "13px", borderRadius: 14, border: "1.5px solid rgba(148,163,184,0.4)", 
                    background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 14, cursor: "pointer",
                    transition: "all 0.3s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#67e8f9"; e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.4)"; e.currentTarget.style.color = "#94a3b8"; }}>
                  ← RETURN TO GRID
                </button>
              </form>
            )}

            {/* Footer */}
            <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid rgba(103,232,249,0.15)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 7, height: 7, background: "#67e8f9", borderRadius: "50%", boxShadow: "0 0 12px #67e8f9", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500, letterSpacing: "0.6px" }}>MANAGE YOUR ASSETS ACROSS THE MULTIVERSE</span>
              </div>
              <div style={{ textAlign: "center", fontSize: 10.5, color: "#64748b", fontWeight: 500 }}>
                © 2050 <span style={{ color: "#67e8f9", fontWeight: 700 }}>DOPVISTA NEURO-HUB</span> • POWERED BY STARLINK QUANTUM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
