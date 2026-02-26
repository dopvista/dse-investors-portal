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

export async function sbGetProfile(sessionToken) {
  // Accept explicit token to avoid stale localStorage session race condition
  const session = sessionToken ? null : getSession();
  const uid     = sessionToken
    ? JSON.parse(atob(sessionToken.split(".")[1])).sub   // decode JWT sub
    : session?.user?.id;
  if (!uid) return null;
  const tok = sessionToken || token();
  const res = await fetch(`${BASE}/rest/v1/profiles?id=eq.${uid}`, {
    headers: headers(tok),
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

export async function sbGetMyRole(sessionToken) {
  // Accept explicit token to avoid stale localStorage session race condition
  const tok = sessionToken || token();
  const res = await fetch(`${BASE}/rest/v1/rpc/get_my_role`, {
    method:  "POST",
    headers: headers(tok),
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
  const res = await fetch(`${BASE}/rest/v1/rpc/get_all_users`, {
    method:  "POST",
    headers: headers(token()),
    body:    JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to fetch users");
  }
  return res.json();
}

/**
 * sbAssignRole(userId, roleId)
 * Calls assign_user_role() DB function (SECURITY DEFINER).
 * Enforces CDS scoping server-side — AD can only assign within their CDS.
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
 * Calls deactivate_user_role() DB function (SECURITY DEFINER).
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
 * sbAdminCreateUser(email, password, cdsNumber)
 *
 * Calls the create-user Edge Function which uses the service role key
 * to create users via the Admin API — bypasses public signup restriction.
 *
 * cdsNumber behaviour:
 *   SA — required, passed explicitly, user is created under that CDS
 *   AD — optional/ignored, the edge function derives it server-side
 *        from the caller's own profile so it cannot be spoofed
 *
 * After creating the auth user the edge function also seeds a partial
 * profile row { id, cds_number, account_type: 'Individual' } so the
 * new user lands on ProfileSetupPage with CDS pre-filled and locked.
 */
export async function sbAdminCreateUser(email, password, cdsNumber) {
  const res = await fetch(`${BASE}/functions/v1/create-user`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${token()}`,
      "apikey":        KEY,
    },
    body: JSON.stringify({
      email,
      password,
      cds_number: cdsNumber || null,
    }),
  });
  const data = await parseResponse(res, "Failed to create user");
  return data;
}

// ── TRANSACTIONS (workflow) ────────────────────────────────────────

/**
 * sbGetTransactions()
 * Fetches transactions filtered by the caller's role:
 *   SA/AD  → all transactions
 *   DE     → only their own (created_by = me), all statuses
 *   VR     → only confirmed (ready to review)
 *   RO     → only verified (final approved)
 */
export async function sbGetTransactions(role) {
  let url = `${BASE}/rest/v1/transactions?order=date.desc,created_at.desc`;
  if (role === "VR") url += "&status=eq.confirmed";
  if (role === "RO") url += "&status=eq.verified";
  // DE filter is enforced by RLS (created_by = auth.uid())

  const res = await fetch(url, { headers: headers(token()) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * sbInsertTransaction(data)
 * Creates a new transaction with status=pending and created_by=current user.
 */
export async function sbInsertTransaction(data) {
  const uid = getSession()?.user?.id;
  const res = await fetch(`${BASE}/rest/v1/transactions`, {
    method:  "POST",
    headers: headers(token()),
    body:    JSON.stringify({
      ...data,
      status:     "pending",
      created_by: uid,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * sbConfirmTransaction(id)
 * DE confirms a pending transaction → status becomes confirmed.
 */
export async function sbConfirmTransaction(id) {
  const res = await fetch(`${BASE}/rest/v1/transactions?id=eq.${id}`, {
    method:  "PATCH",
    headers: headers(token()),
    body:    JSON.stringify({
      status:       "confirmed",
      confirmed_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * sbVerifyTransactions(ids)
 * VR verifies one or more confirmed transactions → status becomes verified.
 * ids: array of transaction UUIDs
 */
export async function sbVerifyTransactions(ids) {
  const uid = getSession()?.user?.id;
  const idList = `(${ids.map(id => `"${id}"`).join(",")})`;
  const res = await fetch(`${BASE}/rest/v1/transactions?id=in.${idList}`, {
    method:  "PATCH",
    headers: headers(token()),
    body:    JSON.stringify({
      status:      "verified",
      verified_by: uid,
      verified_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * sbRejectTransactions(ids, comment)
 * VR rejects one or more confirmed transactions → status becomes rejected.
 * ids:     array of transaction UUIDs
 * comment: required rejection reason
 */
export async function sbRejectTransactions(ids, comment) {
  const uid = getSession()?.user?.id;
  const idList = `(${ids.map(id => `"${id}"`).join(",")})`;
  const res = await fetch(`${BASE}/rest/v1/transactions?id=in.${idList}`, {
    method:  "PATCH",
    headers: headers(token()),
    body:    JSON.stringify({
      status:             "rejected",
      rejection_comment:  comment,
      rejected_by:        uid,
      rejected_at:        new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * sbUpdateTransaction(id, data)
 * DE edits a pending transaction. Only allowed when status = pending.
 */
export async function sbUpdateTransaction(id, data) {
  const res = await fetch(`${BASE}/rest/v1/transactions?id=eq.${id}`, {
    method:  "PATCH",
    headers: headers(token()),
    body:    JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * sbDeleteTransaction(id)
 * Only allowed for SA/AD (any status) or DE (pending only).
 * RLS enforces this server-side.
 */
export async function sbDeleteTransaction(id) {
  const res = await fetch(`${BASE}/rest/v1/transactions?id=eq.${id}`, {
    method:  "DELETE",
    headers: { ...headers(token()), "Prefer": "return=minimal" },
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

// ── PORTFOLIO & CDS PRICES ─────────────────────────────────────────

/**
 * sbGetPortfolio(cdsNumber)
 * Returns companies where the given CDS has at least one transaction,
 * joined with that CDS group's own price from cds_prices.
 * Price will be null if they haven't set one yet.
 */
export async function sbGetPortfolio(cdsNumber) {
  if (!cdsNumber) return [];

  // Get distinct company_ids that this CDS has transacted
  const txRes = await fetch(
    `${BASE}/rest/v1/transactions?cds_number=eq.${encodeURIComponent(cdsNumber)}&select=company_id,company_name&order=company_name.asc`,
    { headers: headers(token()) }
  );
  if (!txRes.ok) throw new Error(await txRes.text());
  const txRows = await txRes.json();

  // Deduplicate company_ids
  const seen = new Set();
  const uniqueCompanies = txRows.filter(t => {
    if (seen.has(t.company_id)) return false;
    seen.add(t.company_id);
    return true;
  });
  if (!uniqueCompanies.length) return [];

  // Fetch company details for those ids
  const ids = uniqueCompanies.map(t => t.company_id);
  const idList = `(${ids.map(id => `"${id}"`).join(",")})`;
  const coRes = await fetch(
    `${BASE}/rest/v1/companies?id=in.${idList}&order=name.asc`,
    { headers: headers(token()) }
  );
  if (!coRes.ok) throw new Error(await coRes.text());
  const companies = await coRes.json();

  // Fetch this CDS's prices
  const prRes = await fetch(
    `${BASE}/rest/v1/cds_prices?cds_number=eq.${encodeURIComponent(cdsNumber)}`,
    { headers: headers(token()) }
  );
  if (!prRes.ok) throw new Error(await prRes.text());
  const prices = await prRes.json();

  // Merge — attach CDS price to each company (null if not set)
  const priceMap = {};
  prices.forEach(p => { priceMap[p.company_id] = p; });

  return companies.map(c => ({
    ...c,
    cds_price:              priceMap[c.id]?.price             ?? null,
    cds_previous_price:     priceMap[c.id]?.previous_price    ?? null,
    cds_updated_by:         priceMap[c.id]?.updated_by        ?? null,
    cds_updated_at:         priceMap[c.id]?.updated_at        ?? null,
    cds_price_id:           priceMap[c.id]?.id                ?? null,
    cds_price_created_by_id:priceMap[c.id]?.created_by_id     ?? null,
  }));
}

/**
 * sbUpsertCdsPrice({ companyId, companyName, cdsNumber, newPrice, oldPrice, reason, updatedBy })
 * Creates or updates the CDS-scoped price for a company.
 * Also writes to cds_price_history for a full audit trail.
 */
export async function sbUpsertCdsPrice({ companyId, companyName, cdsNumber, newPrice, oldPrice, reason, updatedBy, datetime }) {
  const changeAmount  = oldPrice != null ? newPrice - oldPrice : null;
  const changePct     = oldPrice != null && oldPrice !== 0 ? (changeAmount / oldPrice) * 100 : null;
  const ts            = datetime ? new Date(datetime).toISOString() : new Date().toISOString();

  const currentUserId = getSession()?.user?.id;

  // Upsert into cds_prices (insert or update by company_id + cds_number)
  // created_by_id is set only on first insert — never overwritten on update
  const upsertRes = await fetch(`${BASE}/rest/v1/cds_prices?on_conflict=company_id,cds_number`, {
    method:  "POST",
    headers: { ...headers(token()), "Prefer": "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify({
      company_id:      companyId,
      cds_number:      cdsNumber,
      price:           newPrice,
      previous_price:  oldPrice ?? null,
      updated_by:      updatedBy,
      notes:           reason || null,
      updated_at:      ts,
      created_by_id:   currentUserId,  // ignored on update by RLS/trigger
    }),
  });
  if (!upsertRes.ok) throw new Error(await upsertRes.text());
  const upserted = await upsertRes.json();

  // Write history record
  const histRes = await fetch(`${BASE}/rest/v1/cds_price_history`, {
    method:  "POST",
    headers: headers(token()),
    body: JSON.stringify({
      company_id:     companyId,
      company_name:   companyName,
      cds_number:     cdsNumber,
      old_price:      oldPrice ?? null,
      new_price:      newPrice,
      change_amount:  changeAmount,
      change_percent: changePct,
      notes:          reason || null,
      updated_by:     updatedBy,
      created_at:     ts,
    }),
  });
  if (!histRes.ok) throw new Error(await histRes.text());

  return upserted[0] || upserted;
}

/**
 * sbGetCdsPriceHistory(companyId, cdsNumber)
 * Returns price history for a specific company scoped to a CDS number.
 */
export async function sbGetCdsPriceHistory(companyId, cdsNumber) {
  const res = await fetch(
    `${BASE}/rest/v1/cds_price_history?company_id=eq.${companyId}&cds_number=eq.${encodeURIComponent(cdsNumber)}&order=created_at.desc`,
    { headers: headers(token()) }
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * sbGetAllCompanies()
 * SA-only: returns the full master company list for the register/manage view.
 */
export async function sbGetAllCompanies() {
  const res = await fetch(`${BASE}/rest/v1/companies?order=name.asc`, {
    headers: headers(token()),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
