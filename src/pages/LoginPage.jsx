import { useState, useEffect } from "react";
import { sbSignIn, sbResetPassword } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

// Rotating backgrounds themed for Finance/Tanzania
const BACKGROUNDS = [
  "https://images.unsplash.com/photo-1611974714158-f8949973fc42?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=2070",
  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=2070",
];

export default function LoginPage({ onLogin }) {
  const [view, setView] = useState("login"); // "login" or "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bgIndex, setBgIndex] = useState(0);

  // Background Rotation Logic (Ken Burns effect)
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUNDS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim() || !password.trim()) return setError("Email and password are required");
    setLoading(true);
    try {
      const data = await sbSignIn(email.trim(), password);
      onLogin(data);
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!email.trim()) return setError("Enter your email address");
    setLoading(true);
    try {
      await sbResetPassword(email.trim());
      setSuccess("Reset link sent! Please check your inbox.");
    } catch (err) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "12px 14px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: C.gray50, color: C.text, transition: "all 0.2s",
    boxSizing: "border-box",
  };

  const lbl = (text) => (
    <label style={{ fontSize: 12, fontWeight: 700, color: C.gray600, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.03em" }}>
      {text}
    </label>
  );

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.navy, position: "relative", overflow: "hidden",
      fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
    }}>
      
      {/* ── Background Slideshow Layer ── */}
      {BACKGROUNDS.map((src, i) => (
        <div
          key={src}
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `linear-gradient(rgba(11, 31, 58, 0.75), rgba(11, 31, 58, 0.9)), url(${src})`,
            backgroundSize: "cover", backgroundPosition: "center",
            transition: "opacity 2s ease-in-out, transform 10s linear",
            opacity: i === bgIndex ? 1 : 0,
            transform: i === bgIndex ? "scale(1.08)" : "scale(1)",
            zIndex: 1,
          }}
        />
      ))}

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
        input::placeholder { color: #9ca3af; }
        .view-container { animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .eye-btn:hover { color: ${C.green} !important; }
      `}</style>

      {/* ── Main Login Card ── */}
      <div style={{
        background: C.white, borderRadius: 24, padding: "44px 40px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 32px 80px rgba(0,0,0,0.45)",
        position: "relative", zIndex: 10,
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src={logo} alt="DSE"
            style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover", marginBottom: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <div style={{ fontWeight: 800, fontSize: 22, color: C.navy }}>Investors Portal</div>
          <div style={{ fontSize: 13, color: C.gray400, marginTop: 4 }}>
            {view === "login" ? "Sign in to manage your holdings" : "Account Recovery"}
          </div>
        </div>

        {/* ── Status Banners ── */}
        {error && (
          <div style={{ background: C.redBg, border: `1px solid ${C.red}22`, color: C.red, borderRadius: 10, padding: "12px", fontSize: 13, marginBottom: 20, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div style={{ background: C.greenBg, border: `1px solid ${C.green}22`, color: C.green, borderRadius: 10, padding: "12px", fontSize: 13, marginBottom: 20, fontWeight: 500 }}>
            ✓ {success}
          </div>
        )}

        {/* ── Animated Form Container ── */}
        <div key={view} className="view-container">
          {view === "login" ? (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 18 }}>
                {lbl("Email Address")}
                <input
                  style={inp} type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e  => e.target.style.borderColor = C.gray200}
                />
              </div>

              <div style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  {lbl("Password")}
                  <button
                    type="button"
                    onClick={() => { setView("reset"); setError(""); setSuccess(""); }}
                    style={{ fontSize: 12, color: C.green, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                
                <div style={{ position: "relative" }}>
                  <input
                    style={{ ...inp, paddingRight: 45 }}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    onFocus={e => e.target.style.borderColor = C.green}
                    onBlur={e  => e.target.style.borderColor = C.gray200}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", padding: 4,
                      fontSize: 16, color: C.gray400, transition: "color 0.2s", display: "flex"
                    }}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: loading ? C.gray200 : `linear-gradient(135deg, ${C.green}, ${C.greenLight})`,
                color: C.white, fontWeight: 700, fontSize: 15,
                cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit", transition: "all 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: loading ? "none" : `0 8px 20px ${C.green}44`,
              }}>
                {loading ? (
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : "Sign In →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset}>
              <p style={{ fontSize: 13, color: C.gray600, lineHeight: 1.5, marginBottom: 20 }}>
                Enter your registered email address and we'll send you a link to reset your password.
              </p>
              <div style={{ marginBottom: 24 }}>
                {lbl("Email Address")}
                <input
                  style={inp} type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                  onFocus={e => e.target.style.borderColor = C.green}
                  onBlur={e  => e.target.style.borderColor = C.gray200}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none",
                background: loading ? C.gray200 : C.green, color: C.white,
                fontWeight: 700, fontSize: 15, cursor: loading ? "wait" : "pointer",
                fontFamily: "inherit", transition: "background 0.2s", marginBottom: 12,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {loading ? "Sending..." : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => { setView("login"); setError(""); setSuccess(""); }}
                style={{
                  width: "100%", background: "none", border: "none",
                  color: C.gray400, fontWeight: 600, fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                ← Back to Login
              </button>
            </form>
          )}
        </div>

        {/* ── Footer Branding ── */}
        <div style={{
          marginTop: 32, paddingTop: 24,
          borderTop: `1px solid ${C.gray100}`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <div style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.navy, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Dar es Salaam Stock Exchange
          </span>
        </div>
      </div>
    </div>
  );
}
