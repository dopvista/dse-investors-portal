import { useState, useEffect } from "react";
import { sbSignIn, sbResetPassword } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

const ADVERTS = [
  { id: 1, title: "Market Insights",   sub: "Real-time data at your fingertips.",              color: C.navy,    image: "https://images.unsplash.com/photo-1611974717482-480928224732?auto=format&fit=crop&q=80" },
  { id: 2, title: "Secure Investing",  sub: "Your assets are protected with DSE.",             color: "#064e3b", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80" },
  { id: 3, title: "Digital Future",    sub: "Managing investments has never been easier.",     color: "#78350f", image: "https://images.unsplash.com/photo-1551288049-bbda38a5f9a2?auto=format&fit=crop&q=80" },
  { id: 4, title: "Wealth Legacy",     sub: "Smart investing for generations.",                color: "#1e3a5f", image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&q=80" },
];

export default function LoginPage({ onLogin }) {
  const [view, setView]         = useState("login");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [activeAd, setActiveAd] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (isHovering) return;
    const t = setInterval(() => setActiveAd(p => (p + 1) % ADVERTS.length), 5000);
    return () => clearInterval(t);
  }, [isHovering]);

  const inpStyle = {
    width: "100%", padding: "5px 9px", borderRadius: 8, fontSize: 11,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "'Inter', sans-serif",
    background: C.gray50, color: C.text, transition: "border 0.2s", boxSizing: "border-box",
  };

  const Label = ({ text }) => (
    <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 5 }}>{text}</label>
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
      width: "100%", padding: "6px", borderRadius: 8, border: "none",
      background: loading ? C.gray200 : C.green, color: C.white,
      fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    }}>
      {loading ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />{loadingLabel}</> : label}
    </button>
  );

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: C.navy, fontFamily: "'Inter', sans-serif", padding: 16, boxSizing: "border-box" }}>
      <style>{`
        @keyframes fadeIn  { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        @keyframes kenBurns { 0% { transform:scale(1); } 100% { transform:scale(1.1); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        .ad-bg { animation: kenBurns 8s ease-in-out infinite alternate; }
        input:focus { border-color: ${C.green} !important; }
        input::placeholder { color: #9ca3af; }
      `}</style>

      <div style={{
        width: "min(960px, 90vw)",
        height: "min(400px, 80vh)",      /* ← fixed height instead of aspect ratio */
        background: "white",
        borderRadius: 28,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
        display: "grid",
        gridTemplateColumns: "1.4fr 0.9fr",
        overflow: "hidden",
      }}>

        {/* ── LEFT: Photo slider ── */}
        <div style={{ position: "relative", background: ADVERTS[activeAd].color, transition: "background 1s ease", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
          {ADVERTS.map((ad, i) => (
            <div key={ad.id} className="ad-bg" style={{ position: "absolute", inset: 0, opacity: i === activeAd ? 0.25 : 0, backgroundImage: `url(${ad.image})`, backgroundSize: "cover", backgroundPosition: "center", transition: "opacity 1.2s ease" }} />
          ))}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: C.gold, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>DAR ES SALAAM STOCK EXCHANGE</div>
            {ADVERTS.map((ad, i) => (
              <div key={ad.id} style={{ display: i === activeAd ? "block" : "none", animation: "fadeIn 0.8s ease-out" }}>
                <h2 style={{ fontSize: "clamp(18px, 2.8vw, 26px)", fontWeight: 800, color: "white", margin: "0 0 6px 0", lineHeight: 1.2, textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>{ad.title}</h2>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.5, maxWidth: 280, margin: 0 }}>{ad.sub}</p>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              {ADVERTS.map((_, i) => (
                <button key={i} onClick={() => setActiveAd(i)} onMouseEnter={() => setIsHovering(true)} onMouseLeave={() => setIsHovering(false)}
                  style={{ width: i === activeAd ? 28 : 6, height: 4, borderRadius: 2, background: "white", opacity: i === activeAd ? 0.8 : 0.3, transition: "all 0.3s", cursor: "pointer", border: "none", padding: 0 }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        <div style={{ background: "white", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 18px" }}>
          <div style={{ width: "100%" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <img src={logo} alt="DSE" style={{ width: 30, height: 30, borderRadius: 8, objectFit: "cover", marginBottom: 5, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }} />
              <div style={{ fontWeight: 800, fontSize: 13, color: C.text }}>DSE Investors Portal</div>
              <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{view === "login" ? "Sign in to your account" : "Reset your password"}</div>
              {view === "reset" && (
                <div style={{ marginTop: 4, background: `${C.gold}18`, border: `1px solid ${C.gold}55`, borderRadius: 8, padding: "5px 8px", fontSize: 10, color: C.gold, fontWeight: 600 }}>
                  Enter your email to receive a password reset link
                </div>
              )}
            </div>

            {/* Banners */}
            {error   && <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 10, padding: "5px 8px", fontSize: 10, marginBottom: 8 }}>{error}</div>}
            {success && <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: 10, padding: "5px 8px", fontSize: 10, marginBottom: 8 }}>{success}</div>}

            {/* Login form */}
            {view === "login" && (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 12 }}>
                  <Label text="Email Address" />
                  <input style={inpStyle} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Password</label>
                    <button type="button" onClick={() => { setView("reset"); setError(""); setSuccess(""); }}
                      style={{ fontSize: 11, color: C.green, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}>
                      Forgot password?
                    </button>
                  </div>
                  <input style={inpStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                </div>
                <SubmitBtn label="Sign In →" loadingLabel="Signing in..." />
              </form>
            )}

            {/* Reset form */}
            {view === "reset" && (
              <form onSubmit={handleReset}>
                <div style={{ marginBottom: 18 }}>
                  <Label text="Email Address" />
                  <input style={inpStyle} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <SubmitBtn label="Send Reset Email" loadingLabel="Sending..." />
                </div>
                <button type="button" onClick={() => { setView("login"); setError(""); setSuccess(""); }}
                  style={{ width: "100%", padding: "5px", borderRadius: 8, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray400, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.gray400; }}>
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* Footer */}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.gray200}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: C.gray400, fontWeight: 500 }}>Manage Your Investments Digitally</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
