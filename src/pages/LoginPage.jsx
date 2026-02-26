import { useState, useEffect } from "react";
import { sbSignIn, sbResetPassword } from "../lib/supabase";
import { C } from "../components/ui";
import logo from "../assets/logo.jpg";

const ADVERTS = [
  { 
    id: 1, 
    title: "市场洞察", 
    titleEn: "Market Insights",
    sub: "实时数据，触手可及", 
    subEn: "Real-time data at your fingertips",
    color: C.navy,
    image: "https://images.unsplash.com/photo-1611974717482-480928224732?auto=format&fit=crop&q=80"
  },
  { 
    id: 2, 
    title: "安全投资", 
    titleEn: "Secure Investing",
    sub: "您的资产，DSE守护", 
    subEn: "Your assets are protected with DSE",
    color: "#064e3b",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80"
  },
  { 
    id: 3, 
    title: "数字未来", 
    titleEn: "Digital Future",
    sub: "投资管理，前所未有的便捷", 
    subEn: "Managing investments has never been easier",
    color: "#78350f",
    image: "https://images.unsplash.com/photo-1551288049-bbda38a5f9a2?auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    title: "财富传承",
    titleEn: "Wealth Legacy",
    sub: "智慧投资，代代相传",
    subEn: "Smart investing for generations",
    color: "#1e3a5f",
    image: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&q=80"
  }
];

export default function LoginPage({ onLogin }) {
  const [view, setView] = useState("login");
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

  const inpStyle = {
    width: "100%",
    padding: "16px 20px",
    borderRadius: 16,
    fontSize: 15,
    border: `2px solid ${C.gray200}`,
    outline: "none",
    fontFamily: "'Inter', sans-serif",
    background: "#ffffff",
    color: C.text,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxSizing: "border-box",
    marginTop: 8,
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!email.trim() || !password.trim()) return setError("请填写所有字段 / All fields required");
    setLoading(true);
    try {
      const data = await sbSignIn(email.trim(), password);
      onLogin(data);
    } catch (err) {
      setError(err.message || "登录失败 / Invalid credentials");
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
      padding: 20,
      boxSizing: "border-box"
    }}>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes kenBurns {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .login-container {
          animation: scaleIn 0.6s ease-out;
        }
        .ad-image {
          animation: kenBurns 8s ease-in-out infinite alternate;
        }
        .input-focus:focus {
          border-color: ${C.gold} !important;
          box-shadow: 0 0 0 4px ${C.gold}20 !important;
        }
        .shimmer-button {
          position: relative;
          overflow: hidden;
        }
        .shimmer-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* Main Container */}
      <div className="login-container" style={{
        maxWidth: 1200,
        width: "100%",
        background: "white",
        borderRadius: 48,
        boxShadow: "0 50px 100px -20px rgba(0,0,0,0.3), 0 30px 60px -30px rgba(0,43,91,0.5)",
        display: "grid",
        gridTemplateColumns: "1.2fr 0.9fr",
        overflow: "hidden",
        position: "relative"
      }}>
        
        {/* Decorative Elements */}
        <div style={{
          position: "absolute",
          top: 20,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          zIndex: 20,
          pointerEvents: "none"
        }}>
          <div style={{
            width: 60,
            height: 60,
            background: `url(${logo}) center/cover`,
            borderRadius: 20,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            border: "3px solid white"
          }} />
          <div style={{
            display: "flex",
            gap: 8
          }}>
            {["中", "EN"].map(lang => (
              <div key={lang} style={{
                width: 40,
                height: 40,
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(10px)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                pointerEvents: "auto",
                border: "1px solid rgba(255,255,255,0.3)"
              }}>
                {lang}
              </div>
            ))}
          </div>
        </div>

        {/* LEFT SIDE: Photo Gallery */}
        <div style={{
          position: "relative",
          background: ADVERTS[activeAd].color,
          transition: "background 1s ease",
          overflow: "hidden",
          padding: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}>
          {/* Background Images */}
          {ADVERTS.map((ad, index) => (
            <div
              key={ad.id}
              className="ad-image"
              style={{
                position: "absolute",
                inset: 0,
                opacity: index === activeAd ? 0.4 : 0,
                backgroundImage: `url(${ad.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: "opacity 1.5s ease",
                filter: "brightness(0.8)"
              }}
            />
          ))}

          {/* Content */}
          <div style={{ position: "relative", zIndex: 10 }}>
            {ADVERTS.map((ad, index) => (
              <div
                key={ad.id}
                style={{
                  display: index === activeAd ? "block" : "none",
                  animation: "slideIn 0.8s ease-out"
                }}
              >
                {/* Chinese Title */}
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.gold,
                  letterSpacing: 2,
                  marginBottom: 16,
                  textTransform: "uppercase"
                }}>
                  达累斯萨拉姆证券交易所
                </div>
                
                <h2 style={{
                  fontSize: "clamp(36px, 5vw, 56px)",
                  fontWeight: 800,
                  color: "white",
                  marginBottom: 8,
                  lineHeight: 1.1,
                  textShadow: "0 4px 20px rgba(0,0,0,0.2)"
                }}>
                  {ad.title}
                </h2>
                
                <h3 style={{
                  fontSize: "clamp(20px, 3vw, 28px)",
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.9)",
                  marginBottom: 16,
                  fontFamily: "'Inter', sans-serif"
                }}>
                  {ad.titleEn}
                </h3>
                
                <div style={{
                  width: 80,
                  height: 3,
                  background: C.gold,
                  marginBottom: 24,
                  borderRadius: 2
                }} />
                
                <p style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: 1.8,
                  maxWidth: 400,
                  marginBottom: 8,
                  fontWeight: 400
                }}>
                  {ad.sub}
                </p>
                
                <p style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.6)",
                  fontStyle: "italic"
                }}>
                  {ad.subEn}
                </p>
              </div>
            ))}

            {/* Navigation Dots */}
            <div style={{
              display: "flex",
              gap: 12,
              marginTop: 60
            }}>
              {ADVERTS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveAd(i)}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  style={{
                    width: i === activeAd ? 60 : 12,
                    height: 6,
                    borderRadius: 3,
                    background: "white",
                    opacity: i === activeAd ? 1 : 0.3,
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    border: "none",
                    padding: 0
                  }}
                />
              ))}
            </div>

            {/* Scroll Indicator */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 40,
              opacity: 0.6
            }}>
              <div style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                color: "white"
              }}>
                ↓
              </div>
              <span style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: 1
              }}>
                滑动浏览 / SWIPE TO EXPLORE
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div style={{
          background: "white",
          padding: 60,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}>
          <div style={{ maxWidth: 360, width: "100%", margin: "0 auto" }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
              <h1 style={{
                fontSize: 36,
                fontWeight: 800,
                color: C.navy,
                margin: "0 0 8px 0",
                letterSpacing: "-0.02em"
              }}>
                欢迎回来
              </h1>
              <p style={{
                fontSize: 14,
                color: C.gray400,
                margin: 0
              }}>
                Welcome back · 请登录您的账户
              </p>
            </div>

            {/* Error/Success Messages */}
            {error && (
              <div style={{
                padding: "14px 18px",
                borderRadius: 16,
                background: "#fef2f2",
                color: "#dc2626",
                fontSize: 14,
                marginBottom: 24,
                border: "1px solid #fee2e2",
                display: "flex",
                alignItems: "center",
                gap: 10
              }}>
                <span style={{ fontSize: 20 }}>⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Email Field */}
              <div style={{ marginBottom: 24 }}>
                <label style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  display: "flex",
                  justifyContent: "space-between"
                }}>
                  <span>电子邮箱 / Email</span>
                  <span style={{ color: C.gray400, fontWeight: 400 }}>必填</span>
                </label>
                <input
                  className="input-focus"
                  style={inpStyle}
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: 16 }}>
                <label style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: C.text,
                  display: "flex",
                  justifyContent: "space-between"
                }}>
                  <span>密码 / Password</span>
                  <span style={{ color: C.gray400, fontWeight: 400 }}>必填</span>
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

              {/* Forgot Password */}
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 32
              }}>
                <button
                  type="button"
                  onClick={() => setView("reset")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.green,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "4px 0",
                    borderBottom: `2px solid transparent`,
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.target.style.borderBottomColor = C.green}
                  onMouseLeave={e => e.target.style.borderBottomColor = "transparent"}
                >
                  忘记密码? / Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="shimmer-button"
                style={{
                  width: "100%",
                  padding: "18px",
                  borderRadius: 20,
                  border: "none",
                  background: loading ? C.gray200 : `linear-gradient(135deg, ${C.navy} 0%, #002d61 100%)`,
                  color: "white",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  boxShadow: loading ? "none" : "0 10px 25px -5px rgba(0,43,91,0.3)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {loading ? "登录中..." : "登录系统 · SIGN IN"}
              </button>

              {/* Additional Links */}
              <div style={{
                marginTop: 30,
                textAlign: "center"
              }}>
                <p style={{
                  fontSize: 13,
                  color: C.gray400,
                  margin: 0
                }}>
                  需要帮助? 联系支持 / Need help? Contact support
                </p>
              </div>

              {/* Security Badge */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 30,
                padding: "12px",
                background: "#f8fafc",
                borderRadius: 16,
                fontSize: 12,
                color: C.gray400
              }}>
                <span style={{ fontSize: 16 }}>🔒</span>
                <span>256-bit SSL 加密安全连接</span>
              </div>
            </form>

            {/* Footer */}
            <p style={{
              marginTop: 30,
              textAlign: "center",
              fontSize: 12,
              color: C.gray400,
              borderTop: `1px solid ${C.gray200}`,
              paddingTop: 20
            }}>
              © 2026 达累斯萨拉姆证券交易所 · 保留所有权利
              <br />
              <span style={{ fontSize: 11 }}>
                Dar es Salaam Stock Exchange. All rights reserved.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
