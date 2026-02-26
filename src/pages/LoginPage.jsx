import { useState, useEffect } from "react";
import { sbSignIn, sbResetPassword } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

// Add your high-quality advert images here
const ADVERTS = [
  { 
    id: 1, 
    title: "Market Insights", 
    sub: "Real-time data at your fingertips.", 
    image: "https://images.unsplash.com/photo-1611974717482-480928224732?q=80&w=2000&auto=format&fit=crop" 
  },
  { 
    id: 2, 
    title: "Secure Investing", 
    sub: "Your assets are protected with DSE.", 
    image: "https://images.unsplash.com/photo-1551288049-bbda38a5f9a2?q=80&w=2000&auto=format&fit=crop" 
  }
];

export default function LoginPage({ onLogin }) {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeAd, setActiveAd] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAd((prev) => (prev + 1) % ADVERTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const inputStyle = {
    width: "100%", padding: "14px", borderRadius: "8px", border: `1px solid ${C.gray200}`,
    background: "#F9FAFB", marginBottom: "16px", fontSize: "14px", outline: "none"
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await sbSignIn(email, password);
      onLogin(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* ── LEFT: The Full-Height Scrolling Ad ── */}
      <div style={{
        flex: 1.2, position: "relative", transition: "all 0.5s ease",
        display: "flex", alignItems: "flex-end", padding: "60px"
      }}>
        {/* Animated Background Image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(to top, ${C.navy}CC, transparent), url(${ADVERTS[activeAd].image})`,
          backgroundSize: "cover", backgroundPosition: "center",
          transition: "background-image 1s ease-in-out", zIndex: 1
        }} />

        <div style={{ position: "relative", zIndex: 2, color: "white" }}>
          <h1 style={{ fontSize: "48px", fontWeight: "bold", marginBottom: "10px" }}>{ADVERTS[activeAd].title}</h1>
          <p style={{ fontSize: "18px", opacity: 0.9 }}>{ADVERTS[activeAd].sub}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "20px" }}>
            {ADVERTS.map((_, i) => (
              <div key={i} style={{ width: i === activeAd ? 30 : 10, height: 6, borderRadius: 3, background: "white", opacity: i === activeAd ? 1 : 0.5, transition: "0.3s" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: The Clean Login Section ── */}
      <div style={{
        flex: 0.8, background: "white", display: "flex", 
        flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px"
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <img src={logo} style={{ width: "80px", marginBottom: "20px" }} alt="Logo" />
            <h2 style={{ color: C.navy, fontSize: "28px", fontWeight: "800" }}>DSE Investors Portal</h2>
            <p style={{ color: C.gray400 }}>Enter your credentials to continue</p>
          </div>

          {error && <div style={{ color: "red", marginBottom: "15px", fontSize: "13px" }}>{error}</div>}

          <form onSubmit={handleLogin}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: C.navy }}>Email Address</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
            
            <label style={{ fontSize: "13px", fontWeight: "600", color: C.navy }}>Password</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "14px", background: C.navy, color: "white", 
              border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer",
              fontSize: "16px"
            }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
