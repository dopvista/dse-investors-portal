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
    image: "https://images.unsplash.com/photo-1611974717482-480928224732?auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    title: "Secure Investing",
    sub: "Your assets are protected with DSE.",
    color: "#064e3b",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    title: "Digital Future",
    sub: "Managing investments has never been easier.",
    color: "#78350f",
    image: "https://images.unsplash.com/photo-1551288049-bbda38a5f9a2?auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    title: "Wealth Legacy",
    sub: "Smart investing for generations.",
    color: "#1e3a5f",
    image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&q=80"
  }
];

export default function LoginPage({ onLogin }) {
  const [view, setView] = useState("login"); // "login" or "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeAd, setActiveAd] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let timer;
    if (!isHovering) {
      timer = setInterval(() => {
        setActiveAd((prev) => (prev + 1) % ADVERTS.length);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isHovering]);

  // ── Exact input style from old pages ─────────────────────────
  const inpStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: 10,
    fontSize: 14,
    border: `1.5px solid ${C.gray200}`,
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    background: C.gray50,
    color: C.text,
    transition: "border 0.2s",
    boxSizing: "border-box"
  };

  const labelStyle = (text) => (
    <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
      {text}
    </label>
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
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
    setError("");
    setSuccess("");
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
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: C.navy, // old page background
      fontFamily: "'Inter', sans-serif",
      padding: 16,
      boxSizing: "border-box"
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .ad-bg {
          animation: kenBurns 8s ease-in-out infinite alternate;
        }
        input:focus {
          border-color: ${C.green} !important;
        }
        input::placeholder {
          color: #9ca3af;
        }
      `}</style>

      {/* Main card – split with photo slider */}
      <div style={{
        width: "min(1000px, 90vw)",
        aspectRatio: "16/9",
        background: "white",
        borderRadius: 28,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
        display: "grid",
        gridTemplateColumns: "1.4fr 0.9fr",
        overflow: "hidden"
      }}>
        
        {/* ── LEFT SIDE: Photo slider (unchanged) ── */}
        <div style={{
          position: "relative",
          background: ADVERTS[activeAd].color,
          transition: "background 1s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 36px"
        }}>
          {ADVERTS.map((ad, index) => (
            <div
              key={ad.id}
              className="ad-bg"
              style={{
                position: "absolute",
                inset: 0,
                opacity: index === activeAd ? 0.25 : 0,
                backgroundImage: `url(${ad.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: "opacity 1.2s ease"
              }}
            />
          ))}

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.gold,
              letterSpacing: 1,
              marginBottom: 16,
              textTransform: "uppercase"
            }}>
              DAR ES SALAAM STOCK EXCHANGE
            </div>

            {ADVERTS.map((ad, index) => (
              <div
                key={ad.id}
                style={{
                  display: index === activeAd ? "block" : "none",
                  animation: "fadeIn 0.8s ease-out"
                }}
              >
                <h2 style={{
                  fontSize: "clamp(26px, 4vw, 38px)",
                  fontWeight: 800,
                  color: "white",
                  margin: "0 0 8px 0",
                  lineHeight: 1.2,
                  textShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}>
                  {ad.title}
                </h2>
                <p style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.5,
                  maxWidth: 300,
                  margin: 0
                }}>
                  {ad.sub}
                </p>
              </div>
            ))}

            <div style={{
              display: "flex",
              gap: 8,
              marginTop: 32
            }}>
              {ADVERTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveAd(i)}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  style={{
                    width: i === activeAd ? 28 : 6,
                    height: 4,
                    borderRadius: 2,
                    background: "white",
                    opacity: i === activeAd ? 0.8 : 0.3,
                    transition: "all 0.3s",
                    cursor: "pointer",
                    border: "none",
                    padding: 0
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE: Forms styled exactly like old pages ── */}
        <div style={{
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 32px"
        }}>
          <div style={{ width: "100%" }}>
            {/* Header with logo and title – exactly like old */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <img
                src={logo}
                alt="DSE"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  objectFit: "cover",
                  marginBottom: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
                }}
              />
              <div style={{ fontWeight: 800, fontSize: 20, color: C.text }}>
                DSE Investors Portal
              </div>
              <div style={{ fontSize: 13, color: C.gray400, marginTop: 4 }}>
                {view === "login" ? "Sign in to your account" : "Reset your password"}
              </div>

              {/* Gold hint strip for reset view */}
              {view === "reset" && (
                <div style={{
                  marginTop: 12,
                  background: `${C.gold}18`,
                  border: `1px solid ${C.gold}55`,
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: C.gold,
                  fontWeight: 600
                }}>
                  Enter your email to receive a password reset link
                </div>
              )}
            </div>

            {/* Error / Success banners – old style */}
            {error && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 18
              }}>
                {error}
              </div>
            )}
            {success && (
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#16a34a",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 18
              }}>
                {success}
              </div>
            )}

            {/* ── LOGIN FORM ── */}
            {view === "login" && (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  {labelStyle("Email Address")}
                  <input
                    style={inpStyle}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6
                  }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView("reset");
                        setError("");
                        setSuccess("");
                      }}
                      style={{
                        fontSize: 12,
                        color: C.green,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontWeight: 600,
                        padding: 0
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    style={inpStyle}
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 10,
                    border: "none",
                    background: loading ? C.gray200 : C.green,
                    color: C.white,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid #fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite"
                      }} />
                      Signing in...
                    </>
                  ) : "Sign In →"}
                </button>
              </form>
            )}

            {/* ── RESET FORM ── */}
            {view === "reset" && (
              <form onSubmit={handleReset}>
                <div style={{ marginBottom: 28 }}>
                  {labelStyle("Email Address")}
                  <input
                    style={inpStyle}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 10,
                    border: "none",
                    background: loading ? C.gray200 : C.green,
                    color: C.white,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    transition: "background 0.2s",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8
                  }}
                >
                  {loading ? (
                    <>
                      <div style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid #fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite"
                      }} />
                      Sending...
                    </>
                  ) : "Send Reset Email"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setError("");
                    setSuccess("");
                  }}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: 10,
                    border: `1.5px solid ${C.gray200}`,
                    background: C.white,
                    color: C.gray400,
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = C.navy;
                    e.currentTarget.style.color = C.navy;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = C.gray200;
                    e.currentTarget.style.color = C.gray400;
                  }}
                >
                  ← Back to Sign In
                </button>
              </form>
            )}

            {/* ── Footer with green dot (old style) ── */}
            <div style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: `1px solid ${C.gray200}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6
            }}>
              <div style={{
                width: 6,
                height: 6,
                background: C.green,
                borderRadius: "50%",
                flexShrink: 0
              }} />
              <span style={{ fontSize: 11, color: C.gray400, fontWeight: 500 }}>
                Manage Your Investments Digitally
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spin animation keyframes (added dynamically) */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
