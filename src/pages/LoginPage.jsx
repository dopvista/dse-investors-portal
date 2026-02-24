// ── src/pages/LoginPage.jsx ────────────────────────────────────────
import { useState } from "react";
import { sbSignIn, sbSignUp, sbResetPassword } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

// ── Views: "login" | "register" | "reset" ─────────────────────────
export default function LoginPage({ onLogin }) {
  const [view, setView]       = useState("login");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const reset = () => { setError(""); setSuccess(""); };

  const handleLogin = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      const session = await sbSignIn(email, password);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    reset();
    if (password !== confirm) return setError("Passwords do not match");
    if (password.length < 6)  return setError("Password must be at least 6 characters");
    setLoading(true);
    try {
      const session = await sbSignUp(email, password);
      onLogin(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      await sbResetPassword(email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input style ─────────────────────────────────────────
  const inp = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
    border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
    background: C.gray50, color: C.text, transition: "border 0.2s",
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: C.navy, fontFamily: "'Inter', system-ui, sans-serif",
      padding: 20,
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div style={{
        background: C.white, borderRadius: 20, padding: "40px 36px",
        width: "100%", maxWidth: 420,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        animation: "fadeIn 0.35s ease",
      }}>

        {/* Logo + Title */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={logo} alt="DSE" style={{ width: 60, height: 60, borderRadius: 14, objectFit: "cover", boxShadow: "0 4px 16px rgba(0,0,0,0.2)", marginBottom: 14 }} />
          <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>DSE Investors Portal</div>
          <div style={{ fontSize: 13, color: C.gray400, marginTop: 4 }}>
            {view === "login"    && "Sign in to your account"}
            {view === "register" && "Create a new account"}
            {view === "reset"    && "Reset your password"}
          </div>
        </div>

        {/* Error / Success */}
        {error   && <div style={{ background: "#fef2f2", border: `1px solid #fecaca`, color: "#dc2626", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>{error}</div>}
        {success && <div style={{ background: "#f0fdf4", border: `1px solid #bbf7d0`, color: "#16a34a", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>{success}</div>}

        {/* ── LOGIN FORM ── */}
        {view === "login" && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Email</label>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Password</label>
              <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "12px", borderRadius: 10, border: "none",
              background: loading ? C.gray200 : C.green, color: C.white,
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background 0.2s",
            }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
              <button type="button" onClick={() => { setView("reset"); reset(); }} style={{ background: "none", border: "none", color: C.gray400, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Forgot password?
              </button>
              <button type="button" onClick={() => { setView("register"); reset(); }} style={{ background: "none", border: "none", color: C.green, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Create account →
              </button>
            </div>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {view === "register" && (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Email</label>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Password</label>
              <input style={inp} type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200} />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Confirm Password</label>
              <input style={inp} type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "12px", borderRadius: 10, border: "none",
              background: loading ? C.gray200 : C.green, color: C.white,
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit", transition: "background 0.2s",
            }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <button type="button" onClick={() => { setView("login"); reset(); }} style={{ background: "none", border: "none", color: C.gray400, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ← Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* ── RESET FORM ── */}
        {view === "reset" && (
          <form onSubmit={handleReset}>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Email</label>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required
                onFocus={e => e.target.style.borderColor = C.green}
                onBlur={e  => e.target.style.borderColor = C.gray200} />
            </div>
            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "12px", borderRadius: 10, border: "none",
              background: loading ? C.gray200 : C.green, color: C.white,
              fontWeight: 700, fontSize: 15, cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
            }}>
              {loading ? "Sending..." : "Send Reset Email"}
            </button>
            <div style={{ textAlign: "center", marginTop: 18 }}>
              <button type="button" onClick={() => { setView("login"); reset(); }} style={{ background: "none", border: "none", color: C.gray400, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ← Back to sign in
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
