import { useState, useEffect } from "react";

const SUPABASE_URL = "https://isfhvxyltwlswctcfcku.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZmh2eHlsdHdsc3djdGNmY2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODA2OTEsImV4cCI6MjA4NzQ1NjY5MX0.Jo_Y8kI60mOAcR71hus7fHBkAYZUi5Fwt1OITmeyJ6w";
const ACCENT = "#2563eb";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation"
};

async function sbGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?order=created_at.desc${params}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers, body: JSON.stringify(data) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function sbDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(await res.text());
}

function formatNum(n) {
  return Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Badge({ type }) {
  return (
    <span style={{
      background: type === "Buy" ? "#dcfce7" : "#fee2e2",
      color: type === "Buy" ? "#15803d" : "#b91c1c",
      borderRadius: 4, padding: "2px 10px", fontSize: 12, fontWeight: 600
    }}>{type}</span>
  );
}

function Spinner() {
  return <div style={{ width: 18, height: 18, border: "2px solid #e5e7eb", borderTop: `2px solid ${ACCENT}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />;
}

function Input({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</label>}
      <input {...props} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px", fontSize: 14, outline: "none", background: props.readOnly ? "#f9fafb" : "#fff", color: "#111827", width: "100%", boxSizing: "border-box", ...props.style }} />
    </div>
  );
}
function Select({ label, children, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</label>}
      <select {...props} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px", fontSize: 14, outline: "none", background: "#fff", color: "#111827", width: "100%", boxSizing: "border-box" }}>{children}</select>
    </div>
  );
}
function Textarea({ label, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {label && <label style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{label}</label>}
      <textarea {...props} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "8px 10px", fontSize: 14, outline: "none", background: "#fff", color: "#111827", width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 60, ...props.style }} />
    </div>
  );
}
function Btn({ children, variant = "primary", loading, ...props }) {
  const styles = {
    primary: { background: ACCENT, color: "#fff", border: "none" },
    secondary: { background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb" },
    danger: { background: "#fee2e2", color: "#b91c1c", border: "none" },
  };
  return (
    <button {...props} disabled={loading || props.disabled} style={{ padding: "8px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6, ...styles[variant], ...props.style }}>
      {loading && <Spinner />}{children}
    </button>
  );
}

function Toast({ msg, type }) {
  if (!msg) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: type === "error" ? "#fee2e2" : "#dcfce7", color: type === "error" ? "#b91c1c" : "#15803d", padding: "12px 20px", borderRadius: 8, fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      {msg}
    </div>
  );
}

// --- Companies Page ---
function CompaniesPage({ companies, setCompanies, showToast }) {
  const empty = { name: "", price: "", remarks: "" };
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [editPrice, setEditPrice] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [updatingPrice, setUpdatingPrice] = useState(null);

  const submit = async () => {
    if (!form.name.trim() || !form.price) return alert("Name and Current Price are required.");
    setSaving(true);
    try {
      if (editId) {
        const rows = await sbUpdate("companies", editId, { name: form.name, price: Number(form.price), remarks: form.remarks });
        setCompanies(prev => prev.map(c => c.id === editId ? rows[0] : c));
        showToast("Company updated!", "success");
      } else {
        const rows = await sbInsert("companies", { name: form.name, price: Number(form.price), remarks: form.remarks });
        setCompanies(prev => [rows[0], ...prev]);
        showToast("Company registered!", "success");
      }
      setForm(empty); setEditId(null);
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm("Delete this company? Related transactions may also be affected.")) return;
    setDeleting(id);
    try {
      await sbDelete("companies", id);
      setCompanies(prev => prev.filter(c => c.id !== id));
      showToast("Company deleted.", "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setDeleting(null);
  };

  const updatePrice = async (id) => {
    const p = editPrice[id];
    if (!p) return;
    setUpdatingPrice(id);
    try {
      const rows = await sbUpdate("companies", id, { price: Number(p) });
      setCompanies(prev => prev.map(c => c.id === id ? rows[0] : c));
      setEditPrice(prev => { const x = { ...prev }; delete x[id]; return x; });
      showToast("Price updated!", "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setUpdatingPrice(null);
  };

  const startEdit = (c) => { setForm({ name: c.name, price: c.price, remarks: c.remarks || "" }); setEditId(c.id); };
  const cancelEdit = () => { setForm(empty); setEditId(null); };

  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#111827" }}>{editId ? "Edit Company" : "Register New Company"}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="Company Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tanzania Breweries" />
          <Input label="Current Price (TZS) *" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
          <div style={{ gridColumn: "span 2" }}>
            <Textarea label="Remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes..." />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Btn loading={saving} onClick={submit}>{editId ? "Update Company" : "Register Company"}</Btn>
          {editId && <Btn variant="secondary" onClick={cancelEdit}>Cancel</Btn>}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "#111827" }}>Registered Holdings ({companies.length})</h3>
        </div>
        {companies.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>No companies registered yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Company Name", "Current Price (TZS)", "Update Price", "Remarks", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827" }}>{c.name}</td>
                  <td style={{ padding: "12px 16px", color: ACCENT, fontWeight: 600 }}>{formatNum(c.price)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <input type="number" value={editPrice[c.id] || ""} onChange={e => setEditPrice(p => ({ ...p, [c.id]: e.target.value }))}
                        placeholder="New price" style={{ border: "1px solid #e5e7eb", borderRadius: 5, padding: "5px 8px", fontSize: 13, width: 100 }} />
                      <Btn variant="secondary" style={{ padding: "5px 10px" }} loading={updatingPrice === c.id} onClick={() => updatePrice(c.id)}>Update</Btn>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6b7280", maxWidth: 200 }}>{c.remarks || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn variant="secondary" style={{ padding: "4px 10px" }} onClick={() => startEdit(c)}>Edit</Btn>
                      <Btn variant="danger" style={{ padding: "4px 10px" }} loading={deleting === c.id} onClick={() => del(c.id)}>Delete</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// --- Transactions Page ---
function TransactionsPage({ companies, transactions, setTransactions, showToast }) {
  const today = new Date().toISOString().split("T")[0];
  const empty = { date: today, companyId: "", type: "Buy", qty: "", price: "", fees: "", remarks: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const total = (Number(form.qty) || 0) * (Number(form.price) || 0);

  const submit = async () => {
    if (!form.date || !form.companyId || !form.qty || !form.price) return alert("Date, Company, Quantity, and Price are required.");
    const company = companies.find(c => c.id === form.companyId);
    setSaving(true);
    try {
      const rows = await sbInsert("transactions", {
        date: form.date, company_id: form.companyId, company_name: company?.name,
        type: form.type, qty: Number(form.qty), price: Number(form.price),
        total, fees: form.fees ? Number(form.fees) : null, remarks: form.remarks || null
      });
      setTransactions(prev => [rows[0], ...prev]);
      showToast("Transaction recorded!", "success");
      setForm(empty);
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm("Delete this transaction?")) return;
    setDeleting(id);
    try {
      await sbDelete("transactions", id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      showToast("Transaction deleted.", "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setDeleting(null);
  };

  return (
    <div>
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 16, color: "#111827" }}>Record New Transaction</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Input label="Date *" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Select label="Company *" value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}>
            <option value="">Select company...</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label="Transaction Type *" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
          </Select>
          <Input label="Quantity *" type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
          <Input label="Price per Share (TZS) *" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
          <Input label="Total Amount (TZS)" readOnly value={total ? formatNum(total) : ""} placeholder="Auto-calculated" />
          <Input label="Other Fees (TZS)" type="number" value={form.fees} onChange={e => setForm(f => ({ ...f, fees: e.target.value }))} placeholder="0.00" />
          <div style={{ gridColumn: "span 2" }}>
            <Textarea label="Remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes..." style={{ minHeight: 42 }} />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Btn loading={saving} onClick={submit}>Record Transaction</Btn>
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <h3 style={{ margin: 0, fontSize: 16, color: "#111827" }}>Transaction History ({transactions.length})</h3>
        </div>
        {transactions.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>No transactions recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f9fafb" }}>
                  {["Date", "Company", "Type", "Quantity", "Price/Share", "Total Amount", "Other Fees", "Remarks", ""].map(h => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: 12, borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>{t.date}</td>
                    <td style={{ padding: "11px 14px", fontWeight: 600, color: "#111827" }}>{t.company_name}</td>
                    <td style={{ padding: "11px 14px" }}><Badge type={t.type} /></td>
                    <td style={{ padding: "11px 14px" }}>{Number(t.qty).toLocaleString()}</td>
                    <td style={{ padding: "11px 14px" }}>{formatNum(t.price)}</td>
                    <td style={{ padding: "11px 14px", fontWeight: 600 }}>{formatNum(t.total)}</td>
                    <td style={{ padding: "11px 14px" }}>{t.fees ? formatNum(t.fees) : "—"}</td>
                    <td style={{ padding: "11px 14px", color: "#6b7280", maxWidth: 150 }}>{t.remarks || "—"}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <Btn variant="danger" style={{ padding: "3px 10px" }} loading={deleting === t.id} onClick={() => del(t.id)}>Del</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// --- App ---
export default function App() {
  const [tab, setTab] = useState("companies");
  const [companies, setCompanies] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const [c, t] = await Promise.all([sbGet("companies"), sbGet("transactions")]);
        setCompanies(c);
        setTransactions(t);
      } catch (e) {
        setError("Could not connect to database. Please check your Supabase tables are created.");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "system-ui" }}>
      <div style={{ textAlign: "center" }}>
        <Spinner />
        <p style={{ color: "#6b7280", marginTop: 12 }}>Connecting to database...</p>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", fontFamily: "system-ui" }}>
      <div style={{ background: "#fff", border: "1px solid #fca5a5", borderRadius: 10, padding: 32, maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <h3 style={{ color: "#b91c1c", margin: "0 0 8px" }}>Database Connection Error</h3>
        <p style={{ color: "#6b7280", fontSize: 14 }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 32, height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: ACCENT, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>DI</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>DSE Investors Portal</span>
          </div>
          <nav style={{ display: "flex", gap: 0 }}>
            {[{ id: "companies", label: "Companies" }, { id: "transactions", label: "Transactions" }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "0 16px", height: 60, border: "none", background: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600,
                color: tab === t.id ? ACCENT : "#6b7280",
                borderBottom: tab === t.id ? `2px solid ${ACCENT}` : "2px solid transparent"
              }}>{t.label}</button>
            ))}
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, background: "#22c55e", borderRadius: "50%" }} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>Connected to Supabase</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {tab === "companies"
          ? <CompaniesPage companies={companies} setCompanies={setCompanies} showToast={showToast} />
          : <TransactionsPage companies={companies} transactions={transactions} setTransactions={setTransactions} showToast={showToast} />}
      </div>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
