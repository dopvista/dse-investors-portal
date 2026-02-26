import { useState, useEffect } from "react";
import { sbSignIn } from "../lib/supabase";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const inpStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    fontSize: 15,
    border: `1.5px solid ${C.gray200}`,
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    background: "#fff",
    color: C.text,
    transition: "border 0.2s",
    boxSizing: "border-box",
    marginTop: 4
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) return setError("All fields are required");
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
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)",
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
        .input-focus:focus {
          border-color: ${C.gold};
        }
      `}</style>

      {/* Main card with 16:9 aspect ratio */}
      <div style={{
        width: "min(1000px, 90vw)",
        aspectRatio: "16/9",
        background: "white",
        borderRadius: 32,
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        display: "grid",
        gridTemplateColumns: "1.2fr 0.9fr",
        overflow: "hidden"
      }}>
        
        {/* LEFT: Photo slider - vertically centered */}
        <div style={{
          position: "relative",
          background: ADVERTS[activeAd].color,
          transition: "background 1s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 48px"
        }}>
          {/* Background image */}
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

          {/* Text content */}
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: C.gold,
              letterSpacing: 1.2,
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
                  fontSize: "clamp(28px, 4vw, 42px)",
                  fontWeight: 800,
                  color: "white",
                  margin: "0 0 8px 0",
                  lineHeight: 1.2,
                  textShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}>
                  {ad.title}
                </h2>
                <p style={{
                  fontSize: 15,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.5,
                  maxWidth: 320,
                  margin: 0
                }}>
                  {ad.sub}
                </p>
              </div>
            ))}

            {/* Minimal dots */}
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

        {/* RIGHT: Login form - vertically centered */}
        <div style={{
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 40px"
        }}>
          <div style={{ width: "100%" }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{
                fontSize: 28,
                fontWeight: 800,
                color: C.navy,
                margin: "0 0 4px 0"
              }}>
                Welcome Back
              </h1>
              <p style={{
                fontSize: 14,
                color: C.gray400,
                margin: 0
              }}>
                Please sign in to your account
              </p>
            </div>

            {error && (
              <div style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: 13,
                marginBottom: 18,
                border: "1px solid #fee2e2"
              }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                  Email Address
                </label>
                <input
                  className="input-focus"
                  style={inpStyle}
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                  Password
                </label>
                <input
                  className="input-focus"
                  style={inpStyle}
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 22
              }}>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: C.green,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 2
                  }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: 14,
                  border: "none",
                  background: loading ? C.gray200 : C.navy,
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  boxShadow: loading ? "none" : "0 6px 16px -6px rgba(0,43,91,0.3)"
                }}
              >
                {loading ? "Signing in..." : "Sign In →"}
              </button>

              <p style={{
                marginTop: 18,
                textAlign: "center",
                fontSize: 12,
                color: C.gray400
              }}>
                Need help? <a href="#" style={{ color: C.green, textDecoration: "none" }}>Contact support</a>
              </p>
            </form>

            <p style={{
              marginTop: 20,
              textAlign: "center",
              fontSize: 11,
              color: C.gray300,
              borderTop: `1px solid ${C.gray200}`,
              paddingTop: 14
            }}>
              © 2026 Dar es Salaam Stock Exchange. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
