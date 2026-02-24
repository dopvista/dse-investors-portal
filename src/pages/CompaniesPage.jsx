import { useState } from "react";
import { sbInsert, sbUpdate, sbDelete, sbGet } from "../lib/supabase";
import { C, fmt, Btn, FInput, FTextarea, StatCard, SectionCard, Modal, PriceHistoryModal, UpdatePriceModal } from "../components/ui";

export default function CompaniesPage({ companies, setCompanies, transactions, showToast }) {
  const empty = { name: "", price: "", remarks: "" };
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [modal, setModal] = useState({ open: false, type: "confirm", title: "", message: "", targetId: null });
  const [historyModal, setHistoryModal] = useState({ open: false, company: null, history: [] });
  const [loadingHistory, setLoadingHistory] = useState(null);
  const [updateModal, setUpdateModal] = useState({ open: false, company: null });

  const totalAvg = companies.length
    ? companies.reduce((s, c) => s + Number(c.price || 0), 0) / companies.length
    : 0;

  // ── Register / Edit Company ────────────────────────────────────
  const submit = async () => {
    if (!form.name.trim() || !form.price) {
      setModal({ open: true, type: "warning", title: "Missing Required Fields", message: "Please fill in both Company Name and Current Price before saving.", targetId: null });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const rows = await sbUpdate("companies", editId, { name: form.name, price: Number(form.price), remarks: form.remarks });
        setCompanies(p => p.map(c => c.id === editId ? rows[0] : c));
        showToast("Company updated!", "success");
      } else {
        const rows = await sbInsert("companies", { name: form.name, price: Number(form.price), remarks: form.remarks });
        setCompanies(p => [rows[0], ...p]);
        showToast("Company registered!", "success");
      }
      setForm(empty); setEditId(null); setShowForm(false);
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setSaving(false);
  };

  const startEdit = (c) => {
    setForm({ name: c.name, price: c.price, remarks: c.remarks || "" });
    setEditId(c.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancel = () => { setForm(empty); setEditId(null); setShowForm(false); };

  // ── Delete Company ─────────────────────────────────────────────
  const del = (id) => {
    const hasTransactions = transactions.some(t => t.company_id === id);
    const company = companies.find(c => c.id === id);
    if (hasTransactions) {
      setModal({ open: true, type: "warning", title: "Cannot Delete Company", message: `"${company.name}" has existing transactions. You must delete all its transactions before removing this company.`, targetId: null });
    } else {
      setModal({ open: true, type: "confirm", title: "Delete Company", message: `Are you sure you want to delete "${company.name}"? This action cannot be undone.`, targetId: id });
    }
  };

  const confirmDelete = async () => {
    const id = modal.targetId;
    setModal({ ...modal, open: false });
    setDeleting(id);
    try {
      await sbDelete("companies", id);
      setCompanies(p => p.filter(c => c.id !== id));
      showToast("Company deleted.", "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setDeleting(null);
  };

  // ── Update Price ───────────────────────────────────────────────
  const openUpdateModal = (company) => setUpdateModal({ open: true, company });

  const confirmUpdatePrice = async ({ newPrice, datetime, reason }) => {
    const company = updateModal.company;
    const oldPrice = Number(company.price);
    const changeAmount = newPrice - oldPrice;
    const changePct = oldPrice !== 0 ? (changeAmount / oldPrice) * 100 : 0;

    setUpdateModal({ open: false, company: null });
    setUpdating(company.id);
    try {
      await sbInsert("price_history", {
        company_id: company.id,
        company_name: company.name,
        old_price: oldPrice,
        new_price: newPrice,
        change_amount: changeAmount,
        change_percent: changePct,
        notes: reason || null,
        updated_by: "Admin",
        created_at: new Date(datetime).toISOString(),
      });

      const rows = await sbUpdate("companies", company.id, {
        price: newPrice,
        previous_price: oldPrice,
      });

      setCompanies(prev => prev.map(c => c.id === company.id ? rows[0] : c));
      showToast("Price updated!", "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setUpdating(null);
  };

  // ── View Price History ─────────────────────────────────────────
  const viewHistory = async (company) => {
    setLoadingHistory(company.id);
    try {
      const history = await sbGet("price_history", { "company_id": `eq.${company.id}`, "order": "created_at.desc" });
      setHistoryModal({ open: true, company, history });
    } catch (e) { showToast("Error loading history: " + e.message, "error"); }
    setLoadingHistory(null);
  };

  return (
    <div>
      {/* Modals */}
      <Modal
        type={modal.type}
        title={modal.open ? modal.title : ""}
        message={modal.message}
        onConfirm={confirmDelete}
        onClose={() => setModal({ ...modal, open: false })}
      />
      <PriceHistoryModal
        company={historyModal.open ? historyModal.company : null}
        history={historyModal.history}
        onClose={() => setHistoryModal({ open: false, company: null, history: [] })}
      />
      <UpdatePriceModal
        key={updateModal.company?.id}
        company={updateModal.open ? updateModal.company : null}
        onConfirm={confirmUpdatePrice}
        onClose={() => setUpdateModal({ open: false, company: null })}
      />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Holdings" value={companies.length} sub="Registered companies" icon="🏢" color={C.navy} />
        <StatCard label="Avg. Share Price" value={`TZS ${fmt(totalAvg)}`} sub="Across all holdings" icon="📈" color={C.green} />
        <StatCard label="Last Updated" value={new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} sub="Today's date" icon="📅" color={C.gold} />
      </div>

      {/* Register / Edit Form */}
      {showForm ? (
        <SectionCard title={editId ? "✏️ Edit Company" : "➕ Register New Company"}>
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FInput label="Company Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Tanzania Breweries" />
              <FInput label="Current Price (TZS)" required type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              <div style={{ gridColumn: "span 2" }}>
                <FTextarea label="Remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes about this company..." />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn loading={saving} onClick={submit} icon="💾">{editId ? "Update Company" : "Register Company"}</Btn>
              <Btn variant="secondary" onClick={cancel}>Cancel</Btn>
            </div>
          </div>
        </SectionCard>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <Btn onClick={() => setShowForm(true)} icon="+" variant="navy">Register New Company</Btn>
        </div>
      )}

      {/* Holdings Table */}
      <SectionCard title={`Holdings (${companies.length})`} subtitle="All registered companies and their current prices">
        {companies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: C.gray400 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No companies yet</div>
            <div style={{ fontSize: 13 }}>Register your first holding above</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.gray50 }}>
                  {["#", "Company Name", "Previous Price", "Current Price", "Remarks", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 18px", textAlign: ["Previous Price", "Current Price"].includes(h) ? "right" : "left", color: C.gray400, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.gray200}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c, i) => {
                  const priceUp = c.previous_price != null ? Number(c.price) >= Number(c.previous_price) : null;
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${C.gray100}`, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "14px 18px", color: C.gray400, fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "14px 18px", fontWeight: 700, color: C.text }}>{c.name}</td>

                      {/* Previous Price */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        {c.previous_price != null
                          ? <span style={{ color: C.gray400, fontSize: 13 }}>{fmt(c.previous_price)}</span>
                          : <span style={{ color: C.gray400 }}>—</span>}
                      </td>

                      {/* Current Price */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                          <span style={{ background: C.greenBg, color: C.green, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                            {fmt(c.price)}
                          </span>
                          {priceUp !== null && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: priceUp ? C.green : C.red }}>
                              {priceUp ? "▲" : "▼"}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "14px 18px", color: C.gray600, maxWidth: 180, fontSize: 13 }}>{c.remarks || <span style={{ color: C.gray400 }}>—</span>}</td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Btn variant="primary" style={{ padding: "6px 12px", fontSize: 12 }} loading={updating === c.id} onClick={() => openUpdateModal(c)}>💰 Price</Btn>
                          <Btn variant="secondary" style={{ padding: "6px 12px", fontSize: 12 }} loading={loadingHistory === c.id} onClick={() => viewHistory(c)}>📈 History</Btn>
                          <Btn variant="secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => startEdit(c)}>✏️ Edit</Btn>
                          <Btn variant="danger" style={{ padding: "6px 12px", fontSize: 12 }} loading={deleting === c.id} onClick={() => del(c.id)}>🗑</Btn>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
