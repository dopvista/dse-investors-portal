const SUPABASE_URL = "https://isfhvxyltwlswctcfcku.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZmh2eHlsdHdsc3djdGNmY2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODA2OTEsImV4cCI6MjA4NzQ1NjY5MX0.Jo_Y8kI60mOAcR71hus7fHBkAYZUi5Fwt1OITmeyJ6w";

const hdrs = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

export async function sbGet(table, query = "") {
  const url = query
    ? `${SUPABASE_URL}/rest/v1/${table}?${query}`
    : `${SUPABASE_URL}/rest/v1/${table}?order=created_at.desc`;
  const r = await fetch(url, { headers: hdrs });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function sbInsert(table, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers: hdrs, body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function sbUpdate(table, id, data) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH", headers: hdrs, body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function sbDelete(table, id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE", headers: hdrs,
  });
  if (!r.ok) throw new Error(await r.text());
}
