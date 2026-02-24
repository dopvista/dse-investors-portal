import { useState, useMemo } from "react";
import { sbInsert, sbUpdate, sbDelete } from "../lib/supabase";
import { C, fmt, fmtInt, Btn, StatCard, SectionCard, Modal, ActionMenu, TransactionFormModal, ImportTransactionsModal } from "../components/ui";

// ── Helper: safe date formatter (avoids UTC offset shifting date) ──
const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d.includes("T") ? d : d + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Main Page ──────────────────────────────────────────────────────
export default function TransactionsPage({ companies, transactions, setTransactions, showToast }) {
  const [search, setSearch]           = useState("");
  const [deleting, setDeleting]       = useState(null);
  const [modal, setModal]             = useState({ open: false, type: "confirm", title: "", message: "", targetId: null });
  const [formModal, setFormModal]     = useState({ open: false, transaction: null });
  const [importModal, setImportModal] = useState(false);

  // ── Stats (memoised) ──────────────────────────────────────────────
  const { buys, sells, totalBuyVal, totalSellVal } = useMemo(() => {
    const buys  = transactions.filter(t => t.type === "Buy");
    const sells = transactions.filter(t => t.type === "Sell");
    return {
      buys,
      sells,
      totalBuyVal:  buys.reduce((s, t)  => s + Number(t.total || 0), 0),
      totalSellVal: sells.reduce((s, t) => s + Number(t.total || 0), 0),
    };
  }, [transactions]);

  // ── Search (memoised) ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(t =>
      t.company_name?.toLowerCase().includes(q) ||
      t.type?.toLowerCase().includes(q) ||
      t.date?.includes(q) ||
      t.remarks?.toLowerCase().includes(q)
    );
  }, [transactions, search]);

  // ── Totals (memoised) ─────────────────────────────────────────────
  const totals = useMemo(() => ({
    buyAmount:  filtered.filter(t => t.type === "Buy").reduce((s, t)  => s + Number(t.total || 0), 0),
    sellAmount: filtered.filter(t => t.type === "Sell").reduce((s, t) => s + Number(t.total || 0), 0),
    fees:       filtered.reduce((s, t) => s + Number(t.fees || 0), 0),
    buyGrand:   filtered.filter(t => t.type === "Buy").reduce((s, t)  => s + Number(t.total || 0) + Number(t.fees || 0), 0),
    sellGrand:  filtered.filter(t => t.type === "Sell").reduce((s, t) => s + Number(t.total || 0) + Number(t.fees || 0), 0),
  }), [filtered]);

  // ── Save (Insert or Update) ───────────────────────────────────────
  const handleFormConfirm = async ({ date, companyId, type, qty, price, fees, remarks, total }) => {
    const isEdit  = !!formModal.transaction;
    const company = companies.find(c => c.id === companyId);
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
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────
  const del = (id) => {
    const tx = transactions.find(t => t.id === id);
    setModal({
      open: true, type: "confirm",
      title: "Delete Transaction",
      message: `Are you sure you want to delete this ${tx?.type} transaction for "${tx?.company_name}" on ${fmtDate(tx?.date)}? This cannot be undone.`,
      targetId: id,
    });
  };

  const confirmDelete = async () => {
    const id = modal.targetId;
    setModal({ ...modal, open: false });
    setDeleting(id);
    try {
      await sbDelete("transactions", id);
      setTransactions(p => p.filter(t => t.id !== id));
      showToast("Transaction deleted.", "success");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  // ── Bulk Import (parallel batches of 20) ─────────────────────────
  const handleImport = async (rows) => {
    const BATCH = 20;
    const inserted = [];
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch   = rows.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(row => sbInsert("transactions", row)));
      results.forEach(r => inserted.push(r[0]));
    }
    inserted.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(p => [...inserted, ...p]);
    showToast(`✅ Imported ${inserted.length} transaction${inserted.length !== 1 ? "s" : ""} successfully!`, "success");
  };

  // ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Modals ── */}
      <Modal
        type={modal.type}
        title={modal.open ? modal.title : ""}
        message={modal.message}
        onConfirm={confirmDelete}
        onClose={() => setModal({ ...modal, open: false })}
      />
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

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Transactions" value={transactions.length}         sub={`${buys.length} buys · ${sells.length} sells`}                  icon="📋" color={C.navy}  />
        <StatCard label="Total Bought"       value={`TZS ${fmt(totalBuyVal)}`}  sub={`${buys.length} buy order${buys.length !== 1 ? "s" : ""}`}        icon="📥" color={C.green} />
        <StatCard label="Total Sold"         value={`TZS ${fmt(totalSellVal)}`} sub={`${sells.length} sell order${sells.length !== 1 ? "s" : ""}`}     icon="📤" color={C.red}   />
        <StatCard label="Search Results"     value={filtered.length}             sub={search ? `Matching "${search}"` : "Showing all"}                  icon="🔍" color={C.gold}  />
      </div>

      {/* ── Toolbar ── */}
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
        <Btn variant="navy"    icon="+" onClick={() => setFormModal({ open: true, transaction: null })}>Record Transaction</Btn>
        <Btn variant="primary" icon="⬆️" onClick={() => setImportModal(true)}>Import Transactions</Btn>
      </div>

      {/* ── Table ── */}
      <SectionCard
        title={`Transaction History (${filtered.length}${search ? ` of ${transactions.length}` : ""})`}
        subtitle="All buy and sell transactions"
      >
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

                      <td style={{ padding: "10px 8px", color: C.gray400, fontWeight: 600, width: 28 }}>{i + 1}</td>

                      <td style={{ padding: "10px 12px", color: C.gray600, whiteSpace: "nowrap", fontSize: 13 }}>
                        {fmtDate(t.date)}
                      </td>

                      <td style={{ padding: "10px 12px", minWidth: 120 }}>
                        <div style={{ fontWeight: 700, color: C.text }}>{t.company_name}</div>
                      </td>

                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ background: isBuy ? C.greenBg : C.redBg, color: isBuy ? C.green : C.red, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, border: `1px solid ${isBuy ? "#BBF7D0" : "#FECACA"}` }}>
                          {isBuy ? "▲ Buy" : "▼ Sell"}
                        </span>
                      </td>

                      <td style={{ padding: "10px 12px", fontWeight: 600, textAlign: "right" }}>{fmtInt(t.qty)}</td>

                      <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ background: C.greenBg, color: C.green, padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                          {fmt(t.price)}
                        </span>
                      </td>

                      <td style={{ padding: "10px 12px", fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>{fmt(t.total)}</td>

                      <td style={{ padding: "10px 12px", color: C.gray600, textAlign: "right", whiteSpace: "nowrap" }}>
                        {t.fees ? fmt(t.fees) : <span style={{ color: C.gray400 }}>—</span>}
                      </td>

                      <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ background: isBuy ? C.greenBg : C.redBg, color: isBuy ? C.green : C.red, padding: "3px 10px", borderRadius: 20, fontSize: 13, fontWeight: 800, border: `1px solid ${isBuy ? "#BBF7D0" : "#FECACA"}` }}>
                          {fmt(gt)}
                        </span>
                      </td>

                      <td style={{ padding: "10px 12px", color: C.gray600, maxWidth: 140, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.remarks || <span style={{ color: C.gray400 }}>—</span>}
                      </td>

                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <ActionMenu actions={[
                          { icon: "✏️", label: "Edit Transaction",                                  onClick: () => setFormModal({ open: true, transaction: t }) },
                          { icon: "🗑️", label: deleting === t.id ? "Deleting..." : "Delete", danger: true, onClick: () => del(t.id) },
                        ]} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* ── Totals Footer ── */}
              <tfoot>
                <tr style={{ background: C.navy + "06", borderTop: `2px solid ${C.gray200}` }}>
                  <td colSpan={6} style={{ padding: "14px 12px", fontWeight: 700, color: C.gray600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>TOTALS</td>
                  <td style={{ padding: "14px 12px", textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>▲ {fmt(totals.buyAmount)}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.red   }}>▼ {fmt(totals.sellAmount)}</div>
                  </td>
                  <td style={{ padding: "14px 12px", fontWeight: 700, color: C.text, textAlign: "right", fontSize: 14 }}>
                    {fmt(totals.fees)}
                  </td>
                  <td style={{ padding: "14px 12px", textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>▲ {fmt(totals.buyGrand)}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.red   }}>▼ {fmt(totals.sellGrand)}</div>
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
