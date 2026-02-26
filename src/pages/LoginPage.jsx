import { useState, useEffect } from "react";
import { sbSignIn, sbResetPassword } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

const ADVERTS = [
  { 
    id: 1, 
    title: "Market Insights", 
    sub: "Real-time data at your fingertips.", 
    color: C.navy,
    image: "https://images.unsplash.com/photo-1611974717482-480928224732?auto=format&fit=crop&q=80" // Optional image
  },
  { 
    id: 2, 
    title: "Secure Investing", 
    sub: "Your assets are protected with DSE.", 
    color: "#064e3b", // Deep forest green
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80"
  },
  { 
    id: 3, 
    title: "Digital Future", 
    sub: "Managing investments has never been easier.", 
    color: "#78350f", // Deep amber/gold
    image: "https://images.unsplash.com/photo-1551288049-bbda38a5f9a2?auto=format&fit=crop&q=80"
  },
];

export default function LoginPage({ onLogin }) {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeAd, setActiveAd] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAd((prev) => (prev + 1) % ADVERTS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const inpStyle = {
    width: "100%", padding: "14px 18px", borderRadius: 12, fontSize: 15,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: "#f9fafb", color: C.text, transition: "all 0.2s ease",
    boxSizing: "border-box", marginTop: 8
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim() || !password.trim()) return setError("Credentials required");
    setLoading(true);
    try {
      const data = await sbSignIn(email.trim(), password);
      onLogin(data);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: "100vh", width: "100vw", display: "flex", 
      overflow: "hidden", fontFamily: "'Inter', sans-serif"
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes zoom { from { transform: scale(1.1); } to { transform: scale(1); } }
        .ad-bg { animation: zoom 10s infinite alternate; }
      `}</style>

      {/* ── LEFT SIDE: Full Height Slider ── */}
      <div style={{
        flex: "1.2", position: "relative", display: "flex", 
        flexDirection: "column", justifyContent: "center", padding: "0 10%",
        background: ADVERTS[activeAd].color, color: C.white, transition: "background 1.2s ease",
      }}>
        {/* Background Overlay for Image/Pattern */}
        <div style={{ 
          position: "absolute", inset: 0, opacity: 0.3, 
          backgroundImage: `url(${ADVERTS[activeAd].image})`, 
          backgroundSize: 'cover', backgroundPosition: 'center' 
        }} className="ad-bg" />
        
        <div style={{ position: "relative", zIndex: 2 }}>
          <div key={activeAd} style={{ animation: "fadeIn 0.8s ease-out" }}>
            <div style={{ background: C.gold, height: 4, width: 60, marginBottom: 24, borderRadius: 2 }} />
            <h2 style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 900, marginBottom: 20, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              {ADVERTS[activeAd].title}
            </h2>
            <p style={{ fontSize: "clamp(16px, 1.5vw, 20px)", opacity: 0.85, maxWidth: 500, lineHeight: 1.6 }}>
              {ADVERTS[activeAd].sub}
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
            {ADVERTS.map((_, i) => (
              <div key={i} onClick={() => setActiveAd(i)} style={{ 
                width: i === activeAd ? 40 : 12, height: 6, borderRadius: 3, 
                background: C.white, opacity: i === activeAd ? 1 : 0.3, 
                transition: "all 0.4s", cursor: "pointer"
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: Login Form ── */}
      <div style={{ 
        flex: "0.8", background: C.white, display: "flex", 
        flexDirection: "column", justifyContent: "center", padding: "0 8%",
        boxShadow: "-10px 0 50px rgba(0,0,0,0.05)", zIndex: 10
      }}>
        <div style={{ maxWidth: 400, width: "100%", margin: "0 auto" }}>
          <div style={{ textAlign: "left", marginBottom: 40 }}>
            <img src={logo} alt="Logo" style={{ width: 70, height: 70, borderRadius: 18, marginBottom: 24, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }} />
            <h1 style={{ fontSize: 32, fontWeight: 800, color: C.navy, margin: 0, letterSpacing: "-0.01em" }}>Portal Login</h1>
            <p style={{ color: C.gray400, fontSize: 15, marginTop: 10 }}>Access your investment dashboard.</p>
          </div>

          {error && <div style={{ padding: "14px", borderRadius: 12, background: "#fef2f2", color: "#dc2626", fontSize: 14, marginBottom: 24, border: "1px solid #fee2e2" }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Email Address</label>
              <input style={inpStyle} type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Password</label>
              <input style={inpStyle} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div style={{ textAlign: "right", marginBottom: 32 }}>
              <button type="button" onClick={() => setView("reset")} 
                style={{ background: "none", border: "none", color: C.green, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "16px", borderRadius: 12, border: "none",
              background: loading ? C.gray200 : C.navy, color: C.white,
              fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s", boxShadow: "0 4px 12px rgba(0,43,91,0.2)"
            }}>
              {loading ? "Verifying..." : "Sign In →"}
            </button>
          </form>

          <p style={{ marginTop: 40, textAlign: "center", fontSize: 13, color: C.gray400 }}>
            © 2026 Dar es Salaam Stock Exchange. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
