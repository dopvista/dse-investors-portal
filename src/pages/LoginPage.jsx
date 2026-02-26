import { useState, useEffect } from "react";
import { sbSignIn, sbResetPassword } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

// Placeholder Adverts - Replace these with your actual image paths
const ADVERTS = [
  { id: 1, title: "Market Insights", sub: "Real-time data at your fingertips.", color: C.navy },
  { id: 2, title: "Secure Investing", sub: "Your assets are protected with DSE.", color: C.green },
  { id: 3, title: "Digital Future", sub: "Managing investments has never been easier.", color: C.gold },
];

export default function LoginPage({ onLogin }) {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeAd, setActiveAd] = useState(0);

  // Auto-scroll logic for adverts
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAd((prev) => (prev + 1) % ADVERTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const inpStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: "#fff", color: C.text, transition: "all 0.2s ease",
    boxSizing: "border-box", marginTop: 6
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
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f3f4f6", fontFamily: "'Inter', sans-serif", padding: 20,
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slide { from { opacity:0.5; filter: blur(5px); } to { opacity:1; filter: blur(0); } }
        .ad-transition { animation: slide 0.8s ease-out; }
      `}</style>

      <div style={{
        display: "flex", width: "100%", maxWidth: 1000, minHeight: 600,
        background: C.white, borderRadius: 24, overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      }}>
        
        {/* ── Left Side: Photo/Ad Scroll ── */}
        <div style={{
          flex: 1, background: ADVERTS[activeAd].color, position: "relative",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: 40, color: C.white, transition: "background 1s ease",
        }}>
          {/* Overlay Pattern */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, 
            backgroundImage: `radial-gradient(${C.white} 1px, transparent 1px)`, backgroundSize: '20px 20px' }} />
          
          <div className="ad-transition" key={activeAd}>
            <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
              {ADVERTS[activeAd].title}
            </h2>
            <p style={{ fontSize: 16, opacity: 0.9, maxWidth: 300, marginBottom: 40 }}>
              {ADVERTS[activeAd].sub}
            </p>
          </div>

          {/* Dots Indicator */}
          <div style={{ display: "flex", gap: 8 }}>
            {ADVERTS.map((_, i) => (
              <div key={i} style={{ 
                width: i === activeAd ? 24 : 8, height: 8, borderRadius: 4, 
                background: C.white, opacity: i === activeAd ? 1 : 0.4, transition: "all 0.3s" 
              }} />
            ))}
          </div>
        </div>

        {/* ── Right Side: Form ── */}
        <div style={{ flex: 1, padding: "60px 50px", display: "flex", flexDirection: "column" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <img src={logo} alt="Logo" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16 }} />
            <h1 style={{ fontSize: 24, fontWeight: 800, color: C.navy, margin: 0 }}>DSE Investors Portal</h1>
            <p style={{ color: C.gray400, fontSize: 14, marginTop: 8 }}>Welcome back! Please enter your details.</p>
          </div>

          {error && <div style={{ padding: 12, borderRadius: 8, background: "#fef2f2", color: "#dc2626", fontSize: 13, marginBottom: 20, border: "1px solid #fee2e2" }}>{error}</div>}
          {success && <div style={{ padding: 12, borderRadius: 8, background: "#f0fdf4", color: "#16a34a", fontSize: 13, marginBottom: 20, border: "1px solid #dcfce7" }}>{success}</div>}

          {view === "login" ? (
            <form onSubmit={handleLogin} style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Email Address</label>
                <input 
                  style={inpStyle} type="email" placeholder="name@company.com" 
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Password</label>
                <input 
                  style={inpStyle} type="password" placeholder="••••••••" 
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div style={{ textAlign: "right", marginBottom: 30 }}>
                <button type="button" onClick={() => setView("reset")} 
                  style={{ background: "none", border: "none", color: C.green, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: loading ? C.gray200 : C.navy, color: C.white,
                fontWeight: 700, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
                transition: "transform 0.1s active",
              }}>
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>
          ) : (
            /* Reset Password View */
            <form onSubmit={handleLogin} style={{ animation: "fadeIn 0.4s ease" }}>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Email Address</label>
                <input style={inpStyle} type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <button style={{ width: "100%", padding: "14px", borderRadius: 12, background: C.green, color: C.white, border: "none", fontWeight: 700, cursor: "pointer", marginBottom: 16 }}>
                Send Reset Link
              </button>
              <button type="button" onClick={() => setView("login")} style={{ width: "100%", background: "none", border: "none", color: C.gray400, fontWeight: 600, cursor: "pointer" }}>
                ← Back to Login
              </button>
            </form>
          )}

          <div style={{ marginTop: "auto", textAlign: "center", borderTop: `1px solid ${C.gray100}`, paddingTop: 24 }}>
            <span style={{ fontSize: 12, color: C.gray400 }}>© 2026 Dar es Salaam Stock Exchange</span>
          </div>
        </div>
      </div>
    </div>
  );
}
