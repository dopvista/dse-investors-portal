// ── src/pages/LoginPage.jsx ───────────────────────────────────────
import { useState } from "react";
import { sbSignIn, sbResetPassword } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

export default function LoginPage({ onLogin }) {
  const [view,     setView]     = useState("login");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const inp = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: C.gray50, color: C.text, transition: "border 0.2s",
    boxSizing: "border-box",
  };

  const lbl = (text) => (
    <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
      {text}
    </label>
  );

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
      setSuccess("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.navy, fontFamily: "'Inter', system-ui, sans-serif", padding: 20,
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to   { transform: rotate(360deg); } }
        input::placeholder { color: #9ca3af; }
      `}</style>

      <div style={{
        background: C.white, borderRadius: 20, padding: "40px 36px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        animation: "fadeIn 0.35s ease",
      }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src={logo} alt="DSE"
            style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover", marginBottom: 14, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
          />
          <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>DSE Investors Portal</div>
          <div style={{ fontSize: 13, color: C.gray400, marginTop: 4 }}>
            {view === "login" ? "Sign in to your account" : "Reset your password"}
          </div>

          {/* Gold strip — reset view only */}
          {view === "reset" && (
            <div style={{
              marginTop: 10,
              background: `${C.gold}18`, border: `1px solid ${C.gold}55`,
              borderRadius: 8, padding: "8px 14px",
              fontSize: 12, color: C.gold, fontWeight: 600,
            }}>
              Enter your email to receive a password reset link
            </div>
          )}
        </div>

        {/* ── Banners ── */}
        {error && (
          <div style={{ background: "#fef2f2", border: `1px solid #fecaca`, color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#f0fdf4", border: `1px solid #bbf7d0`, color: "#16a34a", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>
            {success}
          </div>
        )}

        {/* ══ Login form ══════════════════════════════════════════ */}
        {view === "login" && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
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
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Password</label>
                <button
                  type="button"
                  onClick={() => { setView("reset"); setError(""); setSuccess(""); }}
                  style={{ fontSize: 12, color: C.green, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <input
                style={inp} type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password"
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: loading ? C.gray200 : C.green, color: C.white,
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Signing in...
                </>
              ) : "Sign In →"}
            </button>
          </form>
        )}

        {/* ══ Reset form ═══════════════════════════════════════════ */}
        {view === "reset" && (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: 28 }}>
              {lbl("Email Address")}
              <input
                style={inp} type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px", borderRadius: 10, border: "none",
              background: loading ? C.gray200 : C.green, color: C.white,
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background 0.2s", marginBottom: 10,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {loading ? (
                <>
                  <div style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Sending...
                </>
              ) : "Send Reset Email"}
            </button>

            <button
              type="button"
              onClick={() => { setView("login"); setError(""); setSuccess(""); }}
              style={{
                width: "100%", padding: "11px", borderRadius: 10,
                border: `1.5px solid ${C.gray200}`, background: C.white,
                color: C.gray400, fontWeight: 600, fontSize: 14,
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.gray400; }}
            >
              ← Back to Sign In
            </button>
          </form>
        )}

        {/* ── Footer ── */}
        <div style={{
          marginTop: 28, paddingTop: 20,
          borderTop: `1px solid ${C.gray200}`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <div style={{ width: 6, height: 6, background: C.green, borderRadius: "50%", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: C.gray400, fontWeight: 500 }}>
            Manage Your Investments Digitally
          </span>
        </div>
      </div>
    </div>
  );
}
