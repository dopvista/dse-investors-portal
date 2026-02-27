// ── src/pages/SystemSettingsPage.jsx ─────────────────────────────
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { C } from "../components/ui";
import ImageCropModal from "../components/ImageCropModal";
import { sbGetSiteSettings, sbSaveSiteSettings, sbUploadSlideImage } from "../lib/supabase";

// ── Shared input style ────────────────────────────────────────────
const inp = (extra = {}) => ({
  width: "100%", padding: "9px 12px", borderRadius: 9, fontSize: 13,
  border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
  background: C.white, color: C.text, transition: "border 0.2s",
  boxSizing: "border-box", ...extra,
});
const focusGreen = e => e.target.style.borderColor = C.green;
const blurGray   = e => e.target.style.borderColor = C.gray200;

const DEFAULT_SLIDES = [
  { label: "DAR ES SALAAM STOCK EXCHANGE", title: "Secure Investing",  sub: "Your assets are protected with DSE.",        image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1280&q=80", color: "#064e3b" },
  { label: "DAR ES SALAAM STOCK EXCHANGE", title: "Smart Portfolio",   sub: "Track all your holdings in one place.",      image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1280&q=80", color: "#1e3a5f" },
  { label: "DAR ES SALAAM STOCK EXCHANGE", title: "Real-time Data",    sub: "Stay ahead of the market with live insights.",image: "https://images.unsplash.com/photo-1642790551116-18a150d248c6?auto=format&fit=crop&w=1280&q=80", color: "#3b1f5e" },
];

const DEFAULT_SETTINGS = { interval: 5000, slides: DEFAULT_SLIDES };

// ── Slide color presets ───────────────────────────────────────────
const COLOR_PRESETS = [
  { label: "Forest",  value: "#064e3b" },
  { label: "Navy",    value: "#1e3a5f" },
  { label: "Purple",  value: "#3b1f5e" },
  { label: "Gold",    value: "#78350f" },
  { label: "Slate",   value: "#1e293b" },
  { label: "Teal",    value: "#134e4a" },
];

// ── Field wrapper ─────────────────────────────────────────────────
function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.navy, display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

// ── Live preview of a slide ───────────────────────────────────────
function SlidePreview({ slide }) {
  return (
    <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", background: slide.color || "#064e3b", border: `1px solid ${C.gray200}` }}>
      {slide.image && (
        <img src={slide.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${slide.color || "#064e3b"}cc 0%, transparent 100%)` }} />
      <div style={{ position: "absolute", inset: 0, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {slide.label && <div style={{ color: "#D4AF37", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{slide.label}</div>}
        {slide.title && <div style={{ color: "#fff", fontSize: 14, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{slide.title}</div>}
        {slide.sub   && <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 10, lineHeight: 1.5 }}>{slide.sub}</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function SystemSettingsPage({ role, session, showToast }) {
  const [activeMenu, setActiveMenu] = useState("login_page");
  const [settings,   setSettings]   = useState(DEFAULT_SETTINGS);
  const [loading,    setLoading]     = useState(true);
  const [saving,     setSaving]      = useState(false);
  const [activeSlide,setActiveSlide] = useState(0);
  const [cropSrc,    setCropSrc]     = useState(null);
  const [cropIdx,    setCropIdx]     = useState(null);
  const [uploading,  setUploading]   = useState(null); // slide index being uploaded
  const fileRefs = [useRef(), useRef(), useRef()];

  if (!["SA"].includes(role)) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🔒</div>
        <div style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Access Restricted</div>
        <div style={{ fontSize: 12, color: C.gray400, marginTop: 4 }}>Only Super Admins can access System Settings.</div>
      </div>
    </div>
  );

  // ── Load settings on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await sbGetSiteSettings("login_page");
        if (data) setSettings(data);
      } catch (e) {
        showToast("Failed to load settings: " + e.message, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Slide field change ──────────────────────────────────────────
  const setSlideField = (idx, field, value) => {
    setSettings(prev => {
      const slides = prev.slides.map((s, i) => i === idx ? { ...s, [field]: value } : s);
      return { ...prev, slides };
    });
  };

  // ── File select → open crop modal ──────────────────────────────
  const handleFileSelect = (e, idx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { showToast("Image must be under 15MB", "error"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setCropSrc(ev.target.result); setCropIdx(idx); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Crop confirm → upload → save URL ───────────────────────────
  const handleCropConfirm = async (blob) => {
    setCropSrc(null);
    setUploading(cropIdx);
    try {
      const url = await sbUploadSlideImage(blob, cropIdx + 1, session);
      setSlideField(cropIdx, "image", url);
      showToast(`Slide ${cropIdx + 1} image uploaded!`, "success");
    } catch (err) {
      showToast("Upload failed: " + err.message, "error");
    } finally {
      setUploading(null);
      setCropIdx(null);
    }
  };

  // ── Save all settings ───────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const uid = session?.user?.id;
      await sbSaveSiteSettings("login_page", settings, uid);
      showToast("Settings saved! Login page updated.", "success");
    } catch (err) {
      showToast("Save failed: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Interval label ──────────────────────────────────────────────
  const intervalSec = (settings.interval / 1000).toFixed(0);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center", color: C.gray400 }}>
        <div style={{ width: 20, height: 20, border: `3px solid ${C.gray200}`, borderTop: `3px solid ${C.green}`, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
        <div style={{ fontSize: 12 }}>Loading settings...</div>
      </div>
    </div>
  );

  return (
    <div style={{ height: "calc(100vh - 118px)", display: "flex", gap: 14, overflow: "hidden" }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .ss-scroll::-webkit-scrollbar { width: 4px; }
        .ss-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .ss-scroll { scrollbar-width: thin; scrollbar-color: #e5e7eb transparent; }
        .speed-slider { -webkit-appearance: none; width: 100%; height: 5px; background: ${C.gray200}; border-radius: 5px; outline: none; }
        .speed-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: ${C.green}; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
        input::placeholder { color: #9ca3af; }
      `}</style>

      {/* ── Left sidebar menu ── */}
      <div style={{ width: 180, flexShrink: 0, background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, padding: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: C.gray400, textTransform: "uppercase", letterSpacing: "0.07em", padding: "6px 10px 8px" }}>Settings</div>

        {[
          { id: "login_page", icon: "🖼️", label: "Login Page" },
          // Future items can be added here
          // { id: "email",      icon: "✉️",  label: "Email Templates" },
          // { id: "roles",      icon: "🔑",  label: "Roles & Permissions" },
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMenu(item.id)} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
            borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit",
            textAlign: "left", width: "100%", transition: "all 0.15s",
            background: activeMenu === item.id ? `${C.navy}10` : "transparent",
            color: activeMenu === item.id ? C.navy : C.gray400,
            fontWeight: activeMenu === item.id ? 700 : 500,
            fontSize: 12,
            borderLeft: activeMenu === item.id ? `3px solid ${C.navy}` : "3px solid transparent",
          }}>
            <span>{item.icon}</span> {item.label}
          </button>
        ))}
      </div>

      {/* ── Right content ── */}
      <div className="ss-scroll" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 2 }}>

        {/* ── Section header ── */}
        <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ background: "linear-gradient(135deg, #0c2548 0%, #0B1F3A 60%, #080f1e 100%)", padding: "16px 22px" }}>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 15 }}>🖼️ Login Page</div>
            <div style={{ color: C.gold, fontSize: 11, marginTop: 3, fontWeight: 500 }}>Customize the slideshow shown on the login screen</div>
          </div>
        </div>

        {/* ── Rotation speed ── */}
        <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, padding: "18px 20px", flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
            ⏱ Slide Rotation Speed
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, color: C.gray400, whiteSpace: "nowrap" }}>2s</span>
            <input
              type="range" min="2000" max="10000" step="500"
              value={settings.interval}
              className="speed-slider"
              onChange={e => setSettings(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
            />
            <span style={{ fontSize: 11, color: C.gray400, whiteSpace: "nowrap" }}>10s</span>
            <div style={{ background: `${C.green}15`, border: `1px solid ${C.green}40`, borderRadius: 8, padding: "4px 12px", minWidth: 52, textAlign: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{intervalSec}s</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: C.gray400, marginTop: 8 }}>
            Each slide stays visible for {intervalSec} seconds before rotating to the next
          </div>
        </div>

        {/* ── Slide tabs ── */}
        <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>

          {/* Tab headers */}
          <div style={{ display: "flex", borderBottom: `1px solid ${C.gray200}` }}>
            {settings.slides.map((s, i) => (
              <button key={i} onClick={() => setActiveSlide(i)} style={{
                flex: 1, padding: "12px 8px", border: "none", cursor: "pointer",
                fontFamily: "inherit", fontSize: 12, fontWeight: activeSlide === i ? 700 : 500,
                color: activeSlide === i ? C.navy : C.gray400,
                background: activeSlide === i ? C.white : C.gray50,
                borderBottom: activeSlide === i ? `2px solid ${C.navy}` : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                Slide {i + 1}
                {s.title && <div style={{ fontSize: 9, marginTop: 2, color: activeSlide === i ? C.green : C.gray400, fontWeight: 500 }}>{s.title}</div>}
              </button>
            ))}
          </div>

          {/* Active slide editor */}
          {settings.slides.map((slide, idx) => idx !== activeSlide ? null : (
            <div key={idx} style={{ padding: "20px", animation: "fadeIn 0.2s ease" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* ── Left: image upload ── */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Slide Image</div>

                  {/* Preview box */}
                  <div
                    onClick={() => !uploading && fileRefs[idx].current?.click()}
                    style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "16/9", background: slide.color || "#064e3b", border: `2px dashed ${C.gray200}`, cursor: uploading === idx ? "wait" : "pointer", transition: "border-color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = C.green}
                    onMouseLeave={e => e.currentTarget.style.borderColor = C.gray200}
                  >
                    {slide.image && (
                      <img src={slide.image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
                    )}

                    {/* Upload overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: uploading === idx ? 1 : 0, transition: "opacity 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                      onMouseLeave={e => e.currentTarget.style.opacity = uploading === idx ? "1" : "0"}>
                      {uploading === idx ? (
                        <>
                          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                          <div style={{ width: 24, height: 24, border: "3px solid rgba(255,255,255,0.3)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: 8 }} />
                          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
                          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Click to change image</span>
                          <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 10, marginTop: 3 }}>JPG, PNG, WEBP — max 15MB</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileRefs[idx]}
                    type="file" accept="image/*"
                    style={{ display: "none" }}
                    onChange={e => handleFileSelect(e, idx)}
                  />

                  <div style={{ fontSize: 11, color: C.gray400, marginTop: 6 }}>
                    Click the image to upload a new photo. It will be cropped to 16:9 (1280×720px).
                  </div>

                  {/* Overlay color */}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Overlay Color</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {COLOR_PRESETS.map(p => (
                        <button key={p.value} onClick={() => setSlideField(idx, "color", p.value)}
                          title={p.label}
                          style={{ width: 28, height: 28, borderRadius: 7, border: slide.color === p.value ? `2.5px solid ${C.green}` : `2px solid ${C.gray200}`, background: p.value, cursor: "pointer", transition: "border 0.15s", boxShadow: slide.color === p.value ? `0 0 0 2px ${C.green}44` : "none" }} />
                      ))}
                      {/* Custom color picker */}
                      <div style={{ position: "relative", width: 28, height: 28 }}>
                        <input type="color" value={slide.color || "#064e3b"}
                          onChange={e => setSlideField(idx, "color", e.target.value)}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                        <div style={{ width: 28, height: 28, borderRadius: 7, border: `2px dashed ${C.gray300}`, background: slide.color || "#064e3b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>✏️</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Right: text fields + preview ── */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Slide Text</div>

                  <Field label="Label (small gold text)">
                    <input style={inp()} placeholder="e.g. DAR ES SALAAM STOCK EXCHANGE"
                      value={slide.label || ""}
                      onChange={e => setSlideField(idx, "label", e.target.value)}
                      onFocus={focusGreen} onBlur={blurGray} />
                  </Field>

                  <Field label="Title (large white text)">
                    <input style={inp()} placeholder="e.g. Secure Investing"
                      value={slide.title || ""}
                      onChange={e => setSlideField(idx, "title", e.target.value)}
                      onFocus={focusGreen} onBlur={blurGray} />
                  </Field>

                  <Field label="Subtitle">
                    <textarea style={{ ...inp(), resize: "vertical", minHeight: 64, lineHeight: 1.5 }}
                      placeholder="e.g. Your assets are protected with DSE."
                      value={slide.sub || ""}
                      onChange={e => setSlideField(idx, "sub", e.target.value)}
                      onFocus={focusGreen} onBlur={blurGray} />
                  </Field>

                  {/* Mini preview */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.navy, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Live Preview</div>
                    <SlidePreview slide={slide} />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* ── Save button ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingBottom: 16, flexShrink: 0 }}>
          <button onClick={() => {
            setSettings(DEFAULT_SETTINGS);
            showToast("Reset to defaults", "success");
          }} style={{ padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray400, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.gray200; e.currentTarget.style.color = C.gray400; }}>
            Reset to Defaults
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: saving ? C.gray200 : C.green, color: C.white, fontWeight: 700, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: saving ? "none" : `0 2px 10px ${C.green}44`, display: "flex", alignItems: "center", gap: 8 }}>
            {saving ? (
              <>
                <div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                Saving...
              </>
            ) : "💾 Save Changes"}
          </button>
        </div>

      </div>

      {/* ── Crop modal ── */}
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          slideIndex={cropIdx + 1}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); setCropIdx(null); }}
        />
      )}
    </div>
  );
}
