import { useState, useMemo } from "react";
import { sbInsert, sbUpdate, sbDelete } from "../lib/supabase";
import { C, fmt, fmtInt, Btn, StatCard, SectionCard, Modal, ActionMenu, TransactionFormModal, ImportTransactionsModal } from "../components/ui";

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function TransactionsPage({ companies, transactions, setTransactions, showToast }) {
  const [search, setSearch]         = useState("");
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [modal, setModal]           = useState({ open: false, type: "confirm", title: "", message: "", targetId: null });
  const [formModal, setFormModal]   = useState({ open: false, transaction: null });
  const [importModal, setImportModal] = useState(false);

  // ── Stats ──────────────────────────────────────────────────────
  const buys         = transactions.filter(t => t.type === "Buy");
  const sells        = transactions.filter(t => t.type === "Sell");
  const totalBuyVal  = buys.reduce((s, t)  => s + Number(t.total || 0), 0);
  const totalSellVal = sells.reduce((s, t) => s + Number(t.total || 0), 0);

  // ── Search ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions.filter(t =>
      t.company_name?.toLowerCase().includes(q) ||
      t.type?.toLowerCase().includes(q) ||
      t.date?.includes(q) ||
      t.remarks?.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  // ── Save (Insert or Update) ────────────────────────────────────
  const handleFormConfirm = async ({ date, companyId, type, qty, price, fees, remarks, total }) => {
    const isEdit = !!formModal.transaction;
    const company = companies.find(c => c.id === companyId);
    setSaving(true);
    try {
      if (isEdit) {
        const rows = await sbUpdate("transactions", formModal.transaction.id, {
          date, company_id: companyId, company_name: company?.name,
          type, qty: Number(qty), price: Number(price),
          total, fees: fees ? Number(fees) : null, remarks: remarks || null,
        });
        setTransactions(p => p.map(t => t.id === formModal.transaction.id ? rows[0] : t));
        showToast("Transaction updated!", "success");
      } else {
        const rows = await sbInsert("transactions", {
          date, company_id: companyId, company_name: company?.name,
          type, qty: Number(qty), price: Number(price),
          total, fees: fees ? Number(fees) : null, remarks: remarks || null,
        });
        setTransactions(p => [rows[0], ...p]);
        showToast("Transaction recorded!", "success");
      }
      setFormModal({ open: false, transaction: null });
    } catch (e) { showToast("Error: " + e.message, "error"); }
    setSaving(false);
  };

  // ── Delete ─────────────────────────────────────────────────────
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

  // ── Bulk Import ────────────────────────────────────────────────
  const handleImport = async (rows) => {
    const inserted = [];
    for (const row of rows) {
      const result = await sbInsert("transactions", row);
      inserted.push(result[0]);
    }
    setTransactions(p => [...inserted.reverse(), ...p]);
    showToast(`✅ Successfully imported ${inserted.length} transactions!`, "success");
  };

  return (
    <div>
      {/* Modals */}
      <Modal type={modal.type} title={modal.open ? modal.title : ""} message={modal.message} onConfirm={confirmDelete} onClose={() => setModal({ ...modal, open: false })} />
      {formModal.open && (
        <TransactionFormModal
          key={formModal.transaction?.id || "new"}
          transaction={formModal.transaction}
          companies={companies}
          onConfirm={handleFormConfirm}
          onClose={() => setFormModal({ open: false, transaction: null })}
        />
      )}
      {importModal && (
        <ImportTransactionsModal
          companies={companies}
          onImport={handleImport}
          onClose={() => setImportModal(false)}
        />
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Transactions" value={transactions.length} sub={`${buys.length} buys · ${sells.length} sells`} icon="📋" color={C.navy} />
        <StatCard label="Total Bought"       value={`TZS ${fmt(totalBuyVal)}`}  sub={`${buys.length} buy orders`}  icon="📥" color={C.green} />
        <StatCard label="Total Sold"         value={`TZS ${fmt(totalSellVal)}`} sub={`${sells.length} sell orders`} icon="📤" color={C.red} />
        <StatCard label="Search Results"     value={filtered.length} sub={search ? `Matching "${search}"` : "Showing all"} icon="🔍" color={C.gold} />
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.gray400 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company, type, date or remarks..."
            style={{ width: "100%", border: `1.5px solid ${C.gray200}`, borderRadius: 8, padding: "9px 12px 9px 36px", fontSize: 14, outline: "none", fontFamily: "inherit", color: C.text, boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.navy}
            onBlur={e  => e.target.style.borderColor = C.gray200}
          />
        </div>
        {search && <Btn variant="secondary" onClick={() => setSearch("")}>Clear</Btn>}
        <Btn variant="navy" icon="+" onClick={() => setFormModal({ open: true, transaction: null })}>Record Transaction</Btn>
        <Btn variant="primary" icon="⬆️" onClick={() => setImportModal(true)}>Import Transactions</Btn>
      </div>

      {/* Table */}
      <SectionCard title={`Transaction History (${filtered.length}${search ? ` of ${transactions.length}` : ""})`} subtitle="All buy and sell transactions">
        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: C.gray400 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No transactions yet</div>
            <div style={{ fontSize: 13 }}>Click "Record Transaction" to add your first buy or sell</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.gray400 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>No results for "{search}"</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try a different search term</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: C.gray50 }}>
                  {[
                    { label: "#",            align: "left",  px: 8  },
                    { label: "Date",         align: "left",  px: 12 },
                    { label: "Company",      align: "left",  px: 12 },
                    { label: "Type",         align: "left",  px: 12 },
                    { label: "Qty",          align: "right", px: 12 },
                    { label: "Price/Share",  align: "right", px: 12 },
                    { label: "Total Amount", align: "right", px: 12 },
                    { label: "Fees",         align: "right", px: 12 },
                    { label: "Grand Total",  align: "right", px: 12 },
                    { label: "Remarks",      align: "left",  px: 12 },
                    { label: "Actions",      align: "right", px: 12 },
                  ].map(h => (
                    <th key={h.label} style={{ padding: `10px ${h.px}px`, textAlign: h.align, color: C.gray400, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.gray200}`, whiteSpace: "nowrap" }}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => {
                  const gt    = Number(t.total || 0) + Number(t.fees || 0);
                  const isBuy = t.type === "Buy";
                  return (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.gray100}`, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      {/* # */}
                      <td style={{ padding: "10px 8px", color: C.gray400, fontWeight: 600, width: 28 }}>{i + 1}</td>

                      {/* Date */}
                      <td style={{ padding: "10px 12px", color: C.gray600, whiteSpace: "nowrap", fontSize: 13 }}>
                        {new Date(t.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>

                      {/* Company */}
                      <td style={{ padding: "10px 12px", minWidth: 120 }}>
                        <div style={{ fontWeight: 700, color: C.text }}>{t.company_name}</div>
                      </td>

                      {/* Type */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ background: isBuy ? C.greenBg : C.redBg, color: isBuy ? C.green : C.red, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${isBuy ? "#BBF7D0" : "#FECACA"}`, whiteSpace: "nowrap" }}>
                          {isBuy ? "▲ Buy" : "▼ Sell"}
                        </span>
                      </td>

                      {/* Qty */}
                      <td style={{ padding: "10px 12px", fontWeight: 600, textAlign: "right" }}>{fmtInt(t.qty)}</td>

                      {/* Price/Share */}
                      <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ background: C.greenBg, color: C.green, padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                          {fmt(t.price)}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: "10px 12px", fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>{fmt(t.total)}</td>

                      {/* Fees */}
                      <td style={{ padding: "10px 12px", color: C.gray600, textAlign: "right", whiteSpace: "nowrap" }}>
                        {t.fees ? fmt(t.fees) : <span style={{ color: C.gray400 }}>—</span>}
                      </td>

                      {/* Grand Total */}
                      <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ background: isBuy ? C.greenBg : C.redBg, color: isBuy ? C.green : C.red, padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 800, border: `1px solid ${isBuy ? "#BBF7D0" : "#FECACA"}` }}>
                          {fmt(gt)}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td style={{ padding: "10px 12px", color: C.gray600, maxWidth: 120, fontSize: 12 }}>
                        {t.remarks || <span style={{ color: C.gray400 }}>—</span>}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <ActionMenu actions={[
                          { icon: "✏️", label: "Edit Transaction", onClick: () => setFormModal({ open: true, transaction: t }) },
                          { icon: "🗑️", label: deleting === t.id ? "Deleting..." : "Delete", danger: true, onClick: () => del(t.id) },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals Footer */}
              <tfoot>
                <tr style={{ background: C.navy + "06", borderTop: `2px solid ${C.gray200}` }}>
                  <td colSpan={6} style={{ padding: "14px 12px", fontWeight: 700, color: C.gray600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>TOTALS</td>
                  <td style={{ padding: "14px 12px", textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>▲ {fmt(filtered.filter(t => t.type === "Buy").reduce((s, t) => s + Number(t.total || 0), 0))}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.red }}>▼ {fmt(filtered.filter(t => t.type === "Sell").reduce((s, t) => s + Number(t.total || 0), 0))}</div>
                  </td>
                  <td style={{ padding: "14px 12px", fontWeight: 700, color: C.text, textAlign: "right" }}>
                    {fmt(filtered.reduce((s, t) => s + Number(t.fees || 0), 0))}
                  </td>
                  <td style={{ padding: "14px 12px", textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>▲ {fmt(filtered.filter(t => t.type === "Buy").reduce((s, t) => s + Number(t.total || 0) + Number(t.fees || 0), 0))}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.red }}>▼ {fmt(filtered.filter(t => t.type === "Sell").reduce((s, t) => s + Number(t.total || 0) + Number(t.fees || 0), 0))}</div>
                  </td>
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
