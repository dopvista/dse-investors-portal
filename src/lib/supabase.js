// ── src/lib/supabase.js ────────────────────────────────────────────

const BASE = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, "");
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!BASE || !KEY) {
  console.error("❌ Missing Supabase env vars. BASE:", BASE, "KEY:", KEY ? "set" : "missing");
} else {
  console.log("✅ Supabase connected to:", BASE);
}

// ── Safe response parser ───────────────────────────────────────────
// Parse JSON first, THEN throw — so the throw isn't caught by its own
// catch block and turned into a raw-JSON error string.
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
  const res = await fetch(`${BASE}/rest/v1/${table}${q ? "?" + q : ""}`, {
    headers: headers(token()),
  });
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
    // No row exists yet — insert instead
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

/**
 * sbGetMyRole()
 * Calls the get_my_role() Postgres function we created in Supabase.
 * Returns the role code string: 'SA' | 'AD' | 'DE' | 'VR' | 'RO' | null
 * Called once after login and stored in App state.
 */
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

/**
 * sbGetAllUsers()
 * Fetches all profiles joined with their active role.
 * Only Super Admins can see all rows — RLS returns only own row for everyone else.
 * Returns array of: { id, full_name, cds_number, phone, account_type,
 *                     role_id, role_code, role_name, assigned_at, is_active }
 */
export async function sbGetAllUsers() {
  // Fetch all profiles
  const profilesRes = await fetch(
    `${BASE}/rest/v1/profiles?select=id,full_name,cds_number,phone,account_type`,
    { headers: headers(token()) }
  );
  if (!profilesRes.ok) throw new Error(await profilesRes.text());
  const profiles = await profilesRes.json();

  // Fetch all active user_roles joined with role details
  const rolesRes = await fetch(
    `${BASE}/rest/v1/user_roles?select=user_id,role_id,is_active,assigned_at,roles(code,name)&is_active=eq.true`,
    { headers: headers(token()) }
  );
  if (!rolesRes.ok) throw new Error(await rolesRes.text());
  const userRoles = await rolesRes.json();

  // Merge role info onto each profile
  return profiles.map(p => {
    const ur = userRoles.find(r => r.user_id === p.id);
    return {
      ...p,
      role_id:     ur?.role_id     ?? null,
      role_code:   ur?.roles?.code ?? null,
      role_name:   ur?.roles?.name ?? "No Role",
      assigned_at: ur?.assigned_at ?? null,
      is_active:   ur?.is_active   ?? false,
    };
  });
}

/**
 * sbAssignRole(userId, roleId)
 * Assigns a role to a user. Deactivates any existing active role first
 * so a user only ever has one active role at a time.
 * Only Super Admins can do this — enforced by RLS.
 */
export async function sbAssignRole(userId, roleId) {
  const assignerId = getSession()?.user?.id;

  // Step 1 — deactivate any existing active role for this user
  const deactivateRes = await fetch(
    `${BASE}/rest/v1/user_roles?user_id=eq.${userId}&is_active=eq.true`,
    {
      method:  "PATCH",
      headers: { ...headers(token()), "Prefer": "return=minimal" },
      body:    JSON.stringify({ is_active: false }),
    }
  );
  if (!deactivateRes.ok) throw new Error(await deactivateRes.text());

  // Step 2 — insert the new role assignment
  const res = await fetch(`${BASE}/rest/v1/user_roles`, {
    method:  "POST",
    headers: headers(token()),
    body:    JSON.stringify({
      user_id:     userId,
      role_id:     roleId,
      assigned_by: assignerId,
      is_active:   true,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * sbDeactivateRole(userId)
 * Removes the active role from a user by setting is_active = false.
 * Does NOT delete the record — the history is preserved for audit trail.
 * Only Super Admins can do this — enforced by RLS.
 */
export async function sbDeactivateRole(userId) {
  const res = await fetch(
    `${BASE}/rest/v1/user_roles?user_id=eq.${userId}&is_active=eq.true`,
    {
      method:  "PATCH",
      headers: { ...headers(token()), "Prefer": "return=minimal" },
      body:    JSON.stringify({ is_active: false }),
    }
  );
  if (!res.ok) throw new Error(await res.text());
  return true;
}
