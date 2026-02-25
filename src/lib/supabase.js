// ── src/lib/supabase.js ────────────────────────────────────────────

const BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!BASE || !KEY) {
  console.error("❌ Missing Supabase env vars. BASE:", BASE, "KEY:", KEY ? "set" : "missing");
} else {
  console.log("✅ Supabase connected to:", BASE);
}

// ── Safe response parser ───────────────────────────────────────────
async function parseResponse(res, fallbackMsg) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(fallbackMsg + (text.length < 200 ? ": " + text : ""));
    throw new Error(fallbackMsg);
  }
  if (!res.ok) {
    throw new Error(data.error_description || data.message || data.msg || fallbackMsg);
  }
  return data;
}

// ── Headers ────────────────────────────────────────────────────────
const headers = (token) => ({
  "Content-Type":  "application/json",
  "apikey":        KEY,
  "Authorization": `Bearer ${token || KEY}`,
  "Prefer":        "return=representation",
});

// ── Session helpers ────────────────────────────────────────────────
export function getSession() {
  try { return JSON.parse(localStorage.getItem("sb_session") || "null"); }
  catch { return null; }
}
function saveSession(s) { localStorage.setItem("sb_session", JSON.stringify(s)); }
function clearSession()  { localStorage.removeItem("sb_session"); }
function token()         { return getSession()?.access_token || KEY; }

// ── Auto-refresh expired token ─────────────────────────────────────
async function refreshSession() {
  const session      = getSession();
  const refreshToken = session?.refresh_token;
  if (!refreshToken) { clearSession(); return null; }
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=refresh_token`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "apikey": KEY },
    body:    JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) { clearSession(); return null; }
  const data = await res.json();
  saveSession(data);
  return data.access_token;
}

// ── AUTH ───────────────────────────────────────────────────────────

export async function sbSignUp(email, password) {
  const res = await fetch(`${BASE}/auth/v1/signup`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "apikey": KEY },
    body:    JSON.stringify({ email, password }),
  });
  const data = await parseResponse(res, "Sign up failed");
  if (data.access_token) saveSession(data);
  return data;
}

export async function sbSignIn(email, password) {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "apikey": KEY },
    body:    JSON.stringify({ email, password }),
  });
  const data = await parseResponse(res, "Invalid email or password");
  saveSession(data);
  return data;
}

export async function sbSignOut() {
  const t = getSession()?.access_token;
  if (t) {
    await fetch(`${BASE}/auth/v1/logout`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", "apikey": KEY, "Authorization": `Bearer ${t}` },
    }).catch(() => {});
  }
  clearSession();
}

export async function sbResetPassword(email) {
  const res = await fetch(`${BASE}/auth/v1/recover`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", "apikey": KEY },
    body:    JSON.stringify({ email }),
  });
  await parseResponse(res, "Password reset failed");
  return true;
}

// ── DATA ───────────────────────────────────────────────────────────

export async function sbGet(table, params = {}) {
  const q = new URLSearchParams(params).toString();
  let res = await fetch(`${BASE}/rest/v1/${table}${q ? "?" + q : ""}`, {
    headers: headers(token()),
  });
  if (res.status === 401) {
    const newToken = await refreshSession();
    if (!newToken) throw new Error("Session expired. Please log in again.");
    res = await fetch(`${BASE}/rest/v1/${table}${q ? "?" + q : ""}`, {
      headers: headers(newToken),
    });
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sbInsert(table, data) {
  const res = await fetch(`${BASE}/rest/v1/${table}`, {
    method:  "POST",
    headers: headers(token()),
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sbUpdate(table, id, data) {
  const res = await fetch(`${BASE}/rest/v1/${table}?id=eq.${id}`, {
    method:  "PATCH",
    headers: headers(token()),
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sbDelete(table, id) {
  const res = await fetch(`${BASE}/rest/v1/${table}?id=eq.${id}`, {
    method:  "DELETE",
    headers: { ...headers(token()), "Prefer": "return=minimal" },
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

// ── PROFILE ────────────────────────────────────────────────────────

export async function sbGetProfile() {
  const uid = getSession()?.user?.id;
  if (!uid) return null;
  const res = await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
    headers: headers(token()),
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export async function sbUpsertProfile(data) {
  const uid = getSession()?.user?.id;
  const res = await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
    method:  "PATCH",
    headers: headers(token()),
    body:    JSON.stringify(data),
  });
  if (!res.ok) {
    const res2 = await fetch(`${BASE}/rest/v1/profiles`, {
      method:  "POST",
      headers: headers(token()),
      body:    JSON.stringify({ ...data, id: uid }),
    });
    if (!res2.ok) throw new Error(await res2.text());
    const rows = await res2.json();
    return rows[0];
  }
  const rows = await res.json();
  return rows[0];
}

// ── ROLES ──────────────────────────────────────────────────────────

export async function sbGetMyRole() {
  const res = await fetch(`${BASE}/rest/v1/rpc/get_my_role`, {
    method:  "POST",
    headers: headers(token()),
    body:    JSON.stringify({}),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data || null;
}

export async function sbGetRoles() {
  const res = await fetch(`${BASE}/rest/v1/roles?order=id.asc`, {
    headers: headers(token()),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function sbGetAllUsers() {
  const profilesRes = await fetch(
    `${BASE}/rest/v1/profiles?select=id,full_name,cds_number,phone,account_type`,
    { headers: headers(token()) }
  );
  if (!profilesRes.ok) throw new Error(await profilesRes.text());
  const profiles = await profilesRes.json();

  const rolesRes = await fetch(
    `${BASE}/rest/v1/user_roles?select=user_id,role_id,is_active,assigned_at,roles(code,name)&order=assigned_at.desc`,
    { headers: headers(token()) }
  );
  if (!rolesRes.ok) throw new Error(await rolesRes.text());
  const userRoles = await rolesRes.json();

  return profiles.map(p => {
    const active   = userRoles.find(r => r.user_id === p.id && r.is_active);
    const fallback = userRoles.find(r => r.user_id === p.id);
    const ur       = active || fallback;
    return {
      ...p,
      role_id:     ur?.role_id         ?? null,
      role_code:   active?.roles?.code ?? null,
      role_name:   active?.roles?.name ?? "No Role",
      assigned_at: ur?.assigned_at     ?? null,
      is_active:   active ? true       : false,
    };
  });
}

/**
 * sbAssignRole(userId, roleId)
 * Calls the assign_user_role() DB function which runs as SECURITY DEFINER
 * — bypasses RLS entirely, handles deactivate + upsert internally.
 */
export async function sbAssignRole(userId, roleId) {
  const res = await fetch(`${BASE}/rest/v1/rpc/assign_user_role`, {
    method:  "POST",
    headers: headers(token()),
    body:    JSON.stringify({
      target_user_id: userId,
      target_role_id: roleId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to assign role");
  }
  return true;
}

/**
 * sbDeactivateRole(userId)
 * Calls the deactivate_user_role() DB function which runs as SECURITY DEFINER.
 */
export async function sbDeactivateRole(userId) {
  const res = await fetch(`${BASE}/rest/v1/rpc/deactivate_user_role`, {
    method:  "POST",
    headers: headers(token()),
    body:    JSON.stringify({ target_user_id: userId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to deactivate user");
  }
  return true;
}

/**
 * sbAdminCreateUser(email, password)
 * Calls the create-user Edge Function which uses the service role key
 * to create users via the Admin API — bypasses public signup restriction.
 * The current SA/AD session is NOT affected.
 */
export async function sbAdminCreateUser(email, password) {
  const res = await fetch(`${BASE}/functions/v1/create-user`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token()}`,
      "apikey":        KEY,
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseResponse(res, "Failed to create user");
  return data;
}
