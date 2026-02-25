// ... (keep all your imports and sub-components exactly as they are)

export default function ProfilePage({ profile, setProfile, showToast, session, role, email: emailProp }) {
  // ... (keep all your existing logic/state)

  return (
    /* Main Wrapper: Locked to viewport height, no horizontal overflow */
    <div style={{ 
      maxWidth: 1100, 
      margin: "0 auto", 
      height: "calc(100vh - 140px)", // Adjusted to give some breathing room at the bottom
      display: "flex", 
      flexDirection: "column", 
      overflow: "hidden",
      padding: "0 10px" // Prevents edges touching the window
    }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
        
        /* Custom scrollbar for columns to keep them "invisible" or thin */
        .profile-column::-webkit-scrollbar { width: 4px; }
        .profile-column::-webkit-scrollbar-track { background: transparent; }
        .profile-column::-webkit-scrollbar-thumb { background: ${C.gray200}; borderRadius: 10px; }
        .profile-column { scrollbar-width: thin; scrollbar-color: ${C.gray200} transparent; }
      `}</style>

      {/* Modals */}
      {cropSrc && (
        <AvatarCropModal imageSrc={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />
      )}
      {showPwModal && (
        <ChangePasswordModal email={email} session={session} uid={session?.user?.id || profile?.id} onClose={() => setShowPwModal(false)} showToast={showToast} />
      )}

      {/* ── Page header ── */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        marginBottom: 20, 
        flexShrink: 0 // Crucial: prevents header from collapsing
      }}>
        <div style={{ fontSize: 13, color: C.gray400 }}>
          Manage your personal information and security settings
          {lastSaved && <span style={{ marginLeft: 10 }}>· Last saved {lastSaved}</span>}
        </div>
        <button
          onClick={handleSave} disabled={saving}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10, border: "none",
            background: saving ? C.gray200 : C.green, color: C.white,
            fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer",
            fontFamily: "inherit", transition: "all 0.2s",
            boxShadow: saving ? "none" : `0 4px 12px ${C.green}44`,
          }}
        >
          {saving
            ? <><div style={{ width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Saving...</>
            : <><span>💾</span> Save Changes</>
          }
        </button>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "280px 1fr", 
        gap: 18, 
        flex: 1, // Takes up remaining vertical space
        overflow: "hidden", // Prevents grid from expanding the parent
        minHeight: 0 // Important for Firefox to allow inner scrolling
      }}>

        {/* ══ LEFT COLUMN ══ */}
        <div className="profile-column" style={{ 
          overflowY: "auto", 
          overflowX: "hidden",
          height: "100%", 
          paddingRight: 6,
          paddingBottom: 20 // Extra space so bottom shadow isn't cut
        }}>
          {/* Profile card */}
          <div style={{ background: C.white, border: `1px solid ${C.gray200}`, borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: 60, background: `linear-gradient(135deg, ${C.navy} 0%, #1e3a5f 100%)` }} />
            <div style={{ padding: "0 16px 16px", marginTop: -32 }}>
              {/* Avatar section logic... */}
              <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
                 <div style={{
                  width: 68, height: 68, borderRadius: "50%",
                  border: `3px solid ${C.white}`, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  background: avatarPreview ? "transparent" : C.navy,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", cursor: "pointer", fontSize: 22, fontWeight: 800, color: C.white,
                  position: "relative",
                }} onClick={() => !uploadingAvatar && fileRef.current.click()}>
                  {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                  {uploadingAvatar && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>
                      <div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </div>
                  )}
                </div>
                <div onClick={() => fileRef.current.click()} style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: C.green, border: `2px solid ${C.white}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10 }}>📷</div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} />
              </div>

              <div style={{ fontWeight: 800, fontSize: 15, color: C.text }}>{form.full_name || "Your Name"}</div>
              <div style={{ fontWeight: 700, fontSize: 11, color: C.gray400, marginTop: 2 }}>{email}</div>
              
              <div style={{ marginTop: 8, marginBottom: 12 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: roleMeta.color + "12", border: `1px solid ${roleMeta.color}22`, borderRadius: 20, padding: "3px 10px" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: roleMeta.color }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: roleMeta.color }}>{roleMeta.label}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: `1px solid #bbf7d0`, borderRadius: 8, padding: "6px 10px", marginBottom: 12 }}>
                <span style={{ fontSize: 12 }}>🔒</span>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: C.green, textTransform: "uppercase" }}>CDS Number</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{profile?.cds_number || "—"}</div>
                </div>
              </div>

              {/* Progress bar logic... */}
              <div style={{ marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: C.gray400, textTransform: "uppercase" }}>Profile complete</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: completionColor }}>{completion}%</span>
                </div>
                <div style={{ height: 5, background: C.gray100, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${completion}%`, background: completionColor, transition: "width 0.5s ease" }} />
                </div>
              </div>
            </div>
          </div>

          <Section title="Account Type" icon="🏦">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: `${C.green}0d`, border: `1.5px solid ${C.green}22`, borderRadius: 9 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: C.green }}>{accountType}</div>
                <div style={{ fontSize: 10, color: C.gray400 }}>{cdsUserCount} user{cdsUserCount !== 1 ? "s" : ""} on this CDS</div>
              </div>
              <div style={{ fontSize: 18 }}>{accountType === "Corporate" ? "🏢" : "👤"}</div>
            </div>
          </Section>

          <Section title="Security" icon="🔐">
            <button
              onClick={() => setShowPwModal(true)}
              style={{
                width: "100%", padding: "8px", borderRadius: 9,
                border: `1.5px solid ${C.gray200}`, background: C.white,
                color: C.text, fontWeight: 600, fontSize: 12,
                cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              🔑 Change Password
            </button>
            <div style={{ marginTop: 10, display: "flex", gap: 3, alignItems: "center" }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i <= (PW_MAX_DAILY - remainingPwChanges(session?.user?.id || profile?.id)) ? C.navy : C.gray100 }} />
              ))}
              <span style={{ fontSize: 9, color: C.gray400, marginLeft: 4 }}>{remainingPwChanges(session?.user?.id || profile?.id)}/{PW_MAX_DAILY}</span>
            </div>
          </Section>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="profile-column" style={{ 
          overflowY: "auto", 
          overflowX: "hidden",
          height: "100%", 
          paddingRight: 6,
          paddingBottom: 20
        }}>
          <Section title="Account Information" icon="👤">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Full Name" required>
                <input style={inp()} type="text" value={form.full_name} onChange={e => set("full_name", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
              </Field>
              <Field label="Phone Number" required>
                <input style={inp()} type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
              </Field>
              <Field label="Gender">
                <select style={{ ...inp(), cursor: "pointer" }} value={form.gender} onChange={e => set("gender", e.target.value)} onFocus={focusGreen} onBlur={blurGray}>
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Date of Birth">
                <input style={inp()} type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
              </Field>
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="National ID (NIDA)">
                  <input style={inp()} type="text" value={form.national_id} onChange={e => set("national_id", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
                </Field>
              </div>
            </div>
          </Section>

          <Section title="Contact Details" icon="📍">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Nationality">
                <CountrySelect value={form.nationality} onChange={v => set("nationality", v)} />
              </Field>
              <Field label="Postal Address">
                <input style={inp()} type="text" value={form.postal_address} onChange={e => set("postal_address", e.target.value)} onFocus={focusGreen} onBlur={blurGray} />
              </Field>
            </div>
          </Section>

          {/* Photo tip footer */}
          <div style={{ background: `${C.gold}10`, border: `1px solid ${C.gold}30`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📷</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, color: C.text, marginBottom: 2 }}>Profile Picture Tip</div>
              <div style={{ fontSize: 11, color: C.gray400, lineHeight: 1.5 }}>
                Click your avatar to upload. Use the crop tool to center your face. High-quality JPEGs work best.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
