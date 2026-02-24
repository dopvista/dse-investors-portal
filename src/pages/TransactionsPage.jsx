import { useState } from "react";
import { sbInsert, sbDelete } from "../lib/supabase";
import { C, fmt, fmtInt, Btn, FInput, FSelect, FTextarea, StatCard, SectionCard, Modal } from "../components/ui";

export default function TransactionsPage({ companies, transactions, setTransactions, showToast }) {
  const today = new Date().toISOString().split("T")[0];
  const empty = { date: today, companyId: "", type: "Buy", qty: "", price: "", fees: "", remarks: "" };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "", targetId: null });

  const total = (Number(form.qty) || 0) * (Number(form.price) || 0);
  const grandTotal = total + (Number(form.fees) || 0);

  const buys = transactions.filter(t => t.type === "Buy");
  const sells = transactions.filter(t => t.type === "Sell");
  const totalBuyVal = buys.reduce((s, t) => s + Number(t.total || 0), 0);
  const totalSellVal = sells.reduce((s, t) => s + Number(t.total || 0), 0);

  const submit = async () => {
    if (!form.date || !form.companyId || !form.qty || !form.price) {
      setModal({ open: true, type: "warning", title: "Missing Required Fields", message: "Please fill in Date, Company, Quantity and Price per Share before recording the transaction.", targetId: null });
      return;
    }
    const company = companies.find(c => c.id === form.companyId);
    setSaving(true);
    try {
      const rows = await sbInsert("transactions", {
        date: form.date,
        company_id: form.companyId,
        company_name: company?.name,
        type: form.type,
        qty: Number(form.qty),
        price: Number(form.price),
        total,
        fees: form.fees ? Number(form.fees) : null,
        remarks: form.remarks || null,
      });
      setTransactions(p => [rows[0], ...p]);
      showToast("Transaction recorded!", "success");
      setForm(empty); setShowForm(false);
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setSaving(false);
  };

  const del = (id) => {
    const tx = transactions.find(t => t.id === id);
    setModal({ open: true, type: "confirm", title: "Delete Transaction", message: `Are you sure you want to delete this ${tx?.type} transaction for "${tx?.company_name}" on ${tx?.date}? This action cannot be undone.`, targetId: id });
  };

  const confirmDelete = async () => {
    const id = modal.targetId;
    setModal({ ...modal, open: false });
    setDeleting(id);
    try {
      await sbDelete("transactions", id);
      setTransactions(p => p.filter(t => t.id !== id));
      showToast("Transaction deleted.", "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setDeleting(null);
  };

  return (
    <div>
      <Modal
        type={modal.type}
        title={modal.open ? modal.title : ""}
        message={modal.message}
        onConfirm={confirmDelete}
        onClose={() => setModal({ ...modal, open: false })}
      />
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Transactions" value={transactions.length} sub={`${buys.length} buys · ${sells.length} sells`} icon="📋" color={C.navy} />
        <StatCard label="Total Bought" value={`TZS ${fmt(totalBuyVal)}`} sub={`${buys.length} buy orders`} icon="📥" color={C.green} />
        <StatCard label="Total Sold" value={`TZS ${fmt(totalSellVal)}`} sub={`${sells.length} sell orders`} icon="📤" color={C.red} />
        <StatCard label="Net Position" value={`TZS ${fmt(totalBuyVal - totalSellVal)}`} sub="Bought minus sold" icon="⚖️" color={C.gold} />
      </div>

      {/* Form Toggle */}
      {showForm ? (
        <SectionCard title="📝 Record New Transaction">
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <FInput label="Date" required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <FSelect label="Company" required value={form.companyId} onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}>
                <option value="">Select company...</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </FSelect>
              <FSelect label="Transaction Type" required value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="Buy">🟢 Buy</option>
                <option value="Sell">🔴 Sell</option>
              </FSelect>
              <FInput label="Quantity" required type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="0" />
              <FInput label="Price per Share (TZS)" required type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              <FInput label="Other Fees (TZS)" type="number" value={form.fees} onChange={e => setForm(f => ({ ...f, fees: e.target.value }))} placeholder="0.00" />
            </div>

            {/* Auto-calc summary */}
            {total > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, margin: "20px 0", background: C.navy + "08", border: `1px solid ${C.navy}20`, borderRadius: 10, padding: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Shares Total</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 4 }}>TZS {fmt(total)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fees</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 4 }}>TZS {fmt(form.fees || 0)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.gray400, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Grand Total</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.green, marginTop: 4 }}>TZS {fmt(grandTotal)}</div>
                </div>
              </div>
            )}

            <FTextarea label="Remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Optional notes..." style={{ minHeight: 56, marginTop: 4 }} />

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn loading={saving} onClick={submit} icon="✓">Record Transaction</Btn>
              <Btn variant="secondary" onClick={() => { setForm(empty); setShowForm(false); }}>Cancel</Btn>
            </div>
          </div>
        </SectionCard>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <Btn onClick={() => setShowForm(true)} icon="+" variant="navy">Record New Transaction</Btn>
        </div>
      )}

      {/* Table */}
      <SectionCard title={`Transaction History (${transactions.length})`} subtitle="All buy and sell transactions">
        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: C.gray400 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No transactions yet</div>
            <div style={{ fontSize: 13 }}>Record your first buy or sell above</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.gray50 }}>
                  {["#", "Date", "Company", "Type", "Qty", "Price/Share", "Total Amount", "Fees", "Grand Total", "Remarks", ""].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: ["Qty", "Price/Share", "Total Amount", "Fees", "Grand Total"].includes(h) ? "right" : "left", color: C.gray400, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.gray200}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => {
                  const gt = Number(t.total || 0) + Number(t.fees || 0);
                  const isBuy = t.type === "Buy";
                  return (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.gray100}`, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "13px 16px", color: C.gray400, fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: "13px 16px", color: C.gray600, whiteSpace: "nowrap" }}>{t.date}</td>
                      <td style={{ padding: "13px 16px", fontWeight: 700, color: C.text, whiteSpace: "nowrap" }}>{t.company_name}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <span style={{
                          background: isBuy ? C.greenBg : C.redBg,
                          color: isBuy ? C.green : C.red,
                          padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                          border: `1px solid ${isBuy ? "#BBF7D0" : "#FECACA"}`,
                        }}>{isBuy ? "▲ Buy" : "▼ Sell"}</span>
                      </td>
                      <td style={{ padding: "13px 16px", fontWeight: 600, textAlign: "right" }}>{fmtInt(t.qty)}</td>
                      <td style={{ padding: "13px 16px", textAlign: "right" }}>{fmt(t.price)}</td>
                      <td style={{ padding: "13px 16px", fontWeight: 600, textAlign: "right" }}>{fmt(t.total)}</td>
                      <td style={{ padding: "13px 16px", color: C.gray600, textAlign: "right" }}>{t.fees ? fmt(t.fees) : <span style={{ color: C.gray400 }}>—</span>}</td>
                      <td style={{ padding: "13px 16px", fontWeight: 700, color: isBuy ? C.green : C.red, textAlign: "right" }}>{fmt(gt)}</td>
                      <td style={{ padding: "13px 16px", color: C.gray600, maxWidth: 140, fontSize: 12 }}>{t.remarks || <span style={{ color: C.gray400 }}>—</span>}</td>
                      <td style={{ padding: "13px 16px" }}>
                        <Btn variant="danger" style={{ padding: "5px 10px", fontSize: 11 }} loading={deleting === t.id} onClick={() => del(t.id)}>🗑</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: C.navy + "06", borderTop: `2px solid ${C.gray200}` }}>
                  <td colSpan={6} style={{ padding: "14px 16px", fontWeight: 700, color: C.gray600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Totals</td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: C.text, textAlign: "right" }}>{fmt(transactions.reduce((s, t) => s + Number(t.total || 0), 0))}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 700, color: C.text, textAlign: "right" }}>{fmt(transactions.reduce((s, t) => s + Number(t.fees || 0), 0))}</td>
                  <td style={{ padding: "14px 16px", fontWeight: 800, color: C.navy, textAlign: "right" }}>{fmt(transactions.reduce((s, t) => s + Number(t.total || 0) + Number(t.fees || 0), 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
