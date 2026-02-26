// ── src/pages/TransactionsPage.jsx ───────────────────────────────
import { useState, useMemo, useEffect } from "react";
import {
  sbInsertTransaction, sbUpdateTransaction, sbDeleteTransaction,
  sbConfirmTransaction, sbVerifyTransactions, sbRejectTransactions,
} from "../lib/supabase";
import {
  C, fmt, fmtInt, fmtSmart,
  Btn, StatCard, SectionCard, Modal, ActionMenu,
  TransactionFormModal, ImportTransactionsModal,
} from "../components/ui";

// ── Safe date formatter ────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d.includes("T") ? d : d + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Status config ──────────────────────────────────────────────────
const STATUS = {
  pending:   { label: "Pending",   bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", icon: "🕐" },
  confirmed: { label: "Confirmed", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", icon: "✅" },
  verified:  { label: "Verified",  bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", icon: "✔️" },
  rejected:  { label: "Rejected",  bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", icon: "✖" },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.pending;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Reject Comment Modal ───────────────────────────────────────────
function RejectModal({ count, onConfirm, onClose }) {
  const [comment, setComment] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  const handleSubmit = async () => {
    if (!comment.trim()) return setErr("Rejection reason is required");
    setSaving(true);
    try { await onConfirm(comment.trim()); }
    catch (e) { setErr(e.message); setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, #1e3a5f)`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>✖ Reject Transaction{count > 1 ? "s" : ""}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>
              {count > 1 ? `${count} transactions selected` : "1 transaction selected"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: "20px" }}>
          {err && <div style={{ background: C.redBg, border: `1px solid #FECACA`, color: C.red, borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>{err}</div>}
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>
            Rejection Reason <span style={{ color: C.red }}>*</span>
          </label>
          <textarea
            value={comment}
            onChange={e => { setComment(e.target.value); setErr(""); }}
            placeholder="Explain why this transaction is being rejected..."
            rows={4}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14,
              border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit",
              resize: "vertical", color: C.text, boxSizing: "border-box",
            }}
            onFocus={e => e.target.style.borderColor = C.red}
            onBlur={e  => e.target.style.borderColor = C.gray200}
          />
          <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>This comment will be visible to the Data Entrant.</div>
        </div>
        {/* Footer */}
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray600, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !comment.trim()} style={{
            flex: 1, padding: "11px", borderRadius: 10, border: "none",
            background: saving || !comment.trim() ? C.gray200 : C.red,
            color: C.white, fontWeight: 700, fontSize: 13, cursor: saving || !comment.trim() ? "not-allowed" : "pointer", fontFamily: "inherit",
          }}>
            {saving ? "Rejecting..." : `Reject ${count > 1 ? `${count} Transactions` : "Transaction"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Action Modal ───────────────────────────────────────────
function ConfirmActionModal({ action, count = 1, company, onConfirm, onClose }) {
  const isVerify  = action === "verify";
  const isConfirm = action === "confirm";
  const accentColor = isVerify ? C.green : "#1D4ED8";
  const accentBg    = isVerify ? C.greenBg : "#EFF6FF";
  const accentBdr   = isVerify ? "#BBF7D0" : "#BFDBFE";
  const icon        = isVerify ? "✔" : "✅";
  const title       = isVerify
    ? `Verify Transaction${count > 1 ? "s" : ""}`
    : "Confirm Transaction";
  const subtitle    = count > 1
    ? `${count} transactions selected`
    : company ? `${company}` : "1 transaction selected";
  const description = isVerify
    ? `Verifying will mark ${count > 1 ? "these transactions" : "this transaction"} as verified and finalize them.`
    : "Confirming will send this transaction to the Verifier for review.";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,31,58,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, backdropFilter: "blur(2px)" }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden", animation: "fadeInUp 0.2s ease" }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, #1e3a5f)`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>{icon} {title}</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ padding: "20px" }}>
          <div style={{ background: accentBg, border: `1px solid ${accentBdr}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 18, marginTop: 1 }}>{isVerify ? "🔍" : "📋"}</span>
            <div style={{ fontSize: 13, color: accentColor, lineHeight: 1.5 }}>{description}</div>
          </div>
          <div style={{ fontSize: 13, color: C.gray600 }}>Are you sure you want to proceed?</div>
        </div>
        {/* Footer */}
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray600, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: accentColor, color: C.white, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {icon} {isVerify ? `Verify${count > 1 ? ` ${count}` : ""}` : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}


  const [search,      setSearch]      = useState("");
  const [typeFilter,  setTypeFilter]  = useState("All");
  const [statusFilter,setStatusFilter]= useState("All");
  const [selected,    setSelected]    = useState(new Set());
  const [deleting,    setDeleting]    = useState(null);
  const [confirming,  setConfirming]  = useState(null);
  const [verifying,   setVerifying]   = useState(false);
  const [rejectModal, setRejectModal] = useState(null); // null | { ids: [] }
  const [deleteModal, setDeleteModal] = useState(null);
  const [actionModal, setActionModal] = useState(null); // null | { action, ids, company }
  const [formModal,   setFormModal]   = useState({ open: false, transaction: null });
  const [importModal, setImportModal] = useState(false);

  const isDE   = role === "DE";
  const isVR   = role === "VR";
  const isRO   = role === "RO";
  const isSAAD = role === "SA" || role === "AD";

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const buys  = transactions.filter(t => t.type === "Buy");
    const sells = transactions.filter(t => t.type === "Sell");
    const pending   = transactions.filter(t => t.status === "pending").length;
    const confirmed = transactions.filter(t => t.status === "confirmed").length;
    const verified  = transactions.filter(t => t.status === "verified").length;
    const rejected  = transactions.filter(t => t.status === "rejected").length;
    return {
      total: transactions.length, buys: buys.length, sells: sells.length,
      totalBuyVal:  buys.reduce((s,t)  => s + Number(t.total||0), 0),
      totalSellVal: sells.reduce((s,t) => s + Number(t.total||0), 0),
      pending, confirmed, verified, rejected,
    };
  }, [transactions]);

  // ── Filter ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = transactions;
    if (typeFilter !== "All")   list = list.filter(t => t.type === typeFilter);
    if (statusFilter !== "All") list = list.filter(t => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.company_name?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q) ||
        t.date?.includes(q) ||
        t.remarks?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, search, typeFilter, statusFilter]);

  // ── Totals ────────────────────────────────────────────────────────
  const totals = useMemo(() => ({
    buyAmount:  filtered.filter(t => t.type==="Buy").reduce((s,t)  => s+Number(t.total||0),0),
    sellAmount: filtered.filter(t => t.type==="Sell").reduce((s,t) => s+Number(t.total||0),0),
    fees:       filtered.reduce((s,t) => s+Number(t.fees||0),0),
    buyGrand:   filtered.filter(t => t.type==="Buy").reduce((s,t)  => s+Number(t.total||0)+Number(t.fees||0),0),
    sellGrand:  filtered.filter(t => t.type==="Sell").reduce((s,t) => s+Number(t.total||0)+Number(t.fees||0),0),
  }), [filtered]);

  // ── Selection helpers ─────────────────────────────────────────────
  const selectableIds = filtered.filter(t => t.status === "confirmed").map(t => t.id);
  const allSelected   = selectableIds.length > 0 && selectableIds.every(id => selected.has(id));
  const someSelected  = selectableIds.some(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectableIds));
  };
  const toggleOne = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const selectedConfirmed = [...selected].filter(id => {
    const tx = transactions.find(t => t.id === id);
    return tx?.status === "confirmed";
  });

  // ── Save (Insert / Update) ────────────────────────────────────────
  const handleFormConfirm = async ({ date, companyId, type, qty, price, fees, remarks, total }) => {
    const isEdit  = !!formModal.transaction;
    const company = companies.find(c => c.id === companyId);
    const payload = {
      date, company_id: companyId, company_name: company?.name,
      type, qty: Number(qty), price: Number(price),
      total, fees: fees ? Number(fees) : null, remarks: remarks || null,
      cds_number: cdsNumber || null,
    };
    try {
      if (isEdit) {
        const rows = await sbUpdateTransaction(formModal.transaction.id, payload);
        setTransactions(p => p.map(t => t.id === formModal.transaction.id ? (rows[0] || { ...t, ...payload }) : t));
        showToast("Transaction updated!", "success");
      } else {
        const rows = await sbInsertTransaction(payload);
        setTransactions(p => [rows[0], ...p]);
        showToast("Transaction recorded!", "success");
      }
      setFormModal({ open: false, transaction: null });
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  };

  // ── Confirm (DE: pending → confirmed) ────────────────────────────
  const handleConfirm = async (id, company) => {
    setActionModal({ action: "confirm", ids: [id], company });
  };
  const doConfirm = async () => {
    const id = actionModal.ids[0];
    setActionModal(null);
    setConfirming(id);
    try {
      const rows = await sbConfirmTransaction(id);
      setTransactions(p => p.map(t => t.id === id ? (rows[0] || { ...t, status: "confirmed" }) : t));
      showToast("Transaction confirmed and sent to Verifier!", "success");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setConfirming(null);
    }
  };

  // ── Verify (VR/SA/AD) ────────────────────────────────────────────
  const handleVerify = async (ids, company) => {
    setActionModal({ action: "verify", ids, company: company || null });
  };
  const doVerify = async () => {
    const ids = actionModal.ids;
    setActionModal(null);
    setVerifying(true);
    try {
      await sbVerifyTransactions(ids);
      setTransactions(p => p.map(t => ids.includes(t.id) ? { ...t, status: "verified" } : t));
      setSelected(new Set());
      showToast(`${ids.length} transaction${ids.length > 1 ? "s" : ""} verified!`, "success");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setVerifying(false);
    }
  };

  // ── Reject (VR/SA/AD) ────────────────────────────────────────────
  const handleReject = async (comment) => {
    const ids = rejectModal.ids;
    await sbRejectTransactions(ids, comment);
    setTransactions(p => p.map(t => ids.includes(t.id) ? { ...t, status: "rejected", rejection_comment: comment } : t));
    setSelected(new Set());
    setRejectModal(null);
    showToast(`${ids.length} transaction${ids.length > 1 ? "s" : ""} rejected.`, "error");
  };

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const id = deleteModal.id;
    setDeleteModal(null);
    setDeleting(id);
    try {
      await sbDeleteTransaction(id);
      setTransactions(p => p.filter(t => t.id !== id));
      showToast("Transaction deleted.", "success");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  // ── Import ────────────────────────────────────────────────────────
  const handleImport = async (rows) => {
    const BATCH = 20;
    const inserted = [];
    for (let i = 0; i < rows.length; i += BATCH) {
      const results = await Promise.all(rows.slice(i, i + BATCH).map(row => sbInsertTransaction({ ...row, cds_number: cdsNumber || null })));
      results.forEach(r => inserted.push(r[0]));
    }
    inserted.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(p => [...inserted, ...p]);
    showToast(`✅ Imported ${inserted.length} transaction${inserted.length !== 1 ? "s" : ""} successfully!`, "success");
  };

  // ── Role-aware stat cards ─────────────────────────────────────────
  const statCards = useMemo(() => {
    if (isVR) return [
      { label: "Awaiting Review",  value: stats.confirmed, sub: "Confirmed by Data Entrant", icon: "📋", color: "#1D4ED8" },
      { label: "Verified Today",   value: stats.verified,  sub: "Approved transactions",     icon: "✔️", color: C.green  },
      { label: "Rejected",         value: stats.rejected,  sub: "Sent back for correction",  icon: "✖",  color: C.red    },
      { label: "Selected",         value: selected.size,   sub: selected.size > 0 ? "Ready to action" : "Use checkboxes below", icon: "☑️", color: C.gold },
    ];
    if (isDE) return [
      { label: "My Transactions",  value: stats.total,    sub: `${stats.pending} pending · ${stats.confirmed} confirmed`, icon: "📋", color: C.navy  },
      { label: "Total Bought",     value: `TZS ${fmtSmart(stats.totalBuyVal)}`,  sub: `${stats.buys} buy orders`,  icon: "📥", color: C.green },
      { label: "Total Sold",       value: `TZS ${fmtSmart(stats.totalSellVal)}`, sub: `${stats.sells} sell orders`, icon: "📤", color: C.red   },
      { label: "Pending Confirm",  value: stats.pending,  sub: "Awaiting your confirmation", icon: "🕐", color: C.gold  },
    ];
    if (isRO) return [
      { label: "Verified Records", value: stats.verified, sub: "Fully approved transactions", icon: "✔️", color: C.green },
      { label: "Total Bought",     value: `TZS ${fmtSmart(stats.totalBuyVal)}`,  sub: `${stats.buys} buy orders`,  icon: "📥", color: C.navy  },
      { label: "Total Sold",       value: `TZS ${fmtSmart(stats.totalSellVal)}`, sub: `${stats.sells} sell orders`, icon: "📤", color: C.red   },
      { label: "Net Position",     value: `TZS ${fmtSmart(Math.abs(stats.totalBuyVal - stats.totalSellVal))}`, sub: stats.totalBuyVal >= stats.totalSellVal ? "Net invested" : "Net realised", icon: "📊", color: C.gold },
    ];
    // SA/AD
    return [
      { label: "Total Transactions", value: stats.total, sub: `${stats.buys} buys · ${stats.sells} sells`, icon: "📋", color: C.navy  },
      { label: "Total Bought",       value: `TZS ${fmtSmart(stats.totalBuyVal)}`,  sub: `${stats.buys} buy orders`,  icon: "📥", color: C.green },
      { label: "Total Sold",         value: `TZS ${fmtSmart(stats.totalSellVal)}`, sub: `${stats.sells} sell orders`, icon: "📤", color: C.red   },
      { label: "Pending Verify",     value: stats.confirmed, sub: `${stats.pending} pending · ${stats.rejected} rejected`, icon: "⏳", color: C.gold  },
    ];
  }, [stats, selected.size, role]);

  // ── Table columns ─────────────────────────────────────────────────
  const showCheckbox = isVR || isSAAD;
  const showStatus   = !isRO;
  const showActions  = !isRO;

  // ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ height: "calc(100vh - 118px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ── Modals ── */}
      {deleteModal && (
        <Modal
          type="confirm"
          title="Delete Transaction"
          message={`Delete this ${deleteModal.type} transaction for "${deleteModal.company}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onClose={() => setDeleteModal(null)}
        />
      )}
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
      {actionModal && (
        <ConfirmActionModal
          action={actionModal.action}
          count={actionModal.ids.length}
          company={actionModal.company}
          onConfirm={actionModal.action === "confirm" ? doConfirm : doVerify}
          onClose={() => setActionModal(null)}
        />
      )}
        <RejectModal
          count={rejectModal.ids.length}
          onConfirm={handleReject}
          onClose={() => setRejectModal(null)}
        />
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8, flexShrink: 0 }}>
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>





      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap", flexShrink: 0 }}>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray400 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search company, type, date, remarks..."
            style={{ width: "100%", border: `1.5px solid ${C.gray200}`, borderRadius: 8, padding: "6px 10px 6px 32px", fontSize: 12, outline: "none", fontFamily: "inherit", color: C.text, boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.navy}
            onBlur={e  => e.target.style.borderColor = C.gray200}
          />
        </div>

        {/* Type filter */}
        {["All","Buy","Sell"].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${typeFilter === t ? C.navy : C.gray200}`,
            background: typeFilter === t ? C.navy : C.white,
            color: typeFilter === t ? C.white : C.gray600,
            fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>{t}</button>
        ))}

        {/* Status filter — only for SA/AD */}
        {isSAAD && (
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
            padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${C.gray200}`,
            fontSize: 12, fontFamily: "inherit", color: C.gray600, outline: "none", background: C.white, cursor: "pointer",
          }}
            onFocus={e => e.target.style.borderColor = C.navy}
            onBlur={e  => e.target.style.borderColor = C.gray200}
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        )}

        {isVR && selectedConfirmed.length > 0 && (
          <>
            <button onClick={() => handleVerify(selectedConfirmed)} disabled={verifying}
              style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: C.green, color: C.white, fontWeight: 700, fontSize: 12, cursor: verifying ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
              {verifying ? "Verifying..." : `✔ Verify ${selectedConfirmed.length}`}
            </button>
            <button onClick={() => setRejectModal({ ids: selectedConfirmed })}
              style={{ padding: "5px 14px", borderRadius: 8, border: `1.5px solid #FECACA`, background: C.redBg, color: C.red, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              ✖ Reject {selectedConfirmed.length}
            </button>
          </>
        )}
        {search && <Btn variant="secondary" onClick={() => setSearch("")}>Clear</Btn>}

        {/* Action buttons by role */}
        {(isDE || isSAAD) && (
          <Btn variant="navy" icon="+" onClick={() => setFormModal({ open: true, transaction: null })}>
            Record Transaction
          </Btn>
        )}
        {(isDE || isSAAD) && (
          <Btn variant="primary" icon="⬆️" onClick={() => setImportModal(true)}>Import</Btn>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <SectionCard
        title={`Transaction History (${filtered.length}${search ? ` of ${transactions.length}` : ""})`}
        subtitle={
          isVR   ? "Showing confirmed transactions awaiting your review" :
          isDE   ? "Your submitted transactions" :
          isRO   ? "Verified and approved transactions" :
                   "All transactions across all statuses"
        }
      >
        {transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: C.gray400 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {isVR ? "No confirmed transactions to review" : isRO ? "No verified transactions yet" : "No transactions yet"}
            </div>
            <div style={{ fontSize: 13 }}>
              {isDE ? "Click \"Record Transaction\" to add your first buy or sell" :
               isVR ? "Data Entrants need to confirm transactions before they appear here" :
               isRO ? "Verified transactions will appear here once approved by a Verifier" :
                      "Transactions will appear here once created"}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: C.gray400 }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>No results found</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${C.navy}08, ${C.navy}04)` }}>
                  {showCheckbox && (
                    <th style={{ padding: "10px 12px", borderBottom: `2px solid ${C.gray200}`, width: 36 }}>
                      {isVR && (
                        <input type="checkbox"
                          checked={allSelected}
                          ref={el => el && (el.indeterminate = someSelected && !allSelected)}
                          onChange={toggleAll}
                          style={{ cursor: "pointer", width: 15, height: 15, accentColor: C.navy }}
                        />
                      )}
                    </th>
                  )}
                  {[
                    { label: "#",           align: "left"  },
                    { label: "Date",        align: "left"  },
                    { label: "Company",     align: "left"  },
                    { label: "Type",        align: "left"  },
                    { label: "Qty",         align: "right" },
                    { label: "Price/Share", align: "right" },
                    { label: "Total",       align: "right" },
                    { label: "Fees",        align: "right" },
                    { label: "Grand Total", align: "right" },
                    { label: "Remarks",     align: "left"  },
                    ...(showStatus ? [{ label: "Status", align: "left" }] : []),
                    ...(showActions ? [{ label: "Actions", align: "right" }] : []),
                  ].map(h => (
                    <th key={h.label} style={{
                      padding: "7px 10px", textAlign: h.align,
                      color: C.gray400, fontWeight: 700, fontSize: 10,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      borderBottom: `2px solid ${C.gray200}`, whiteSpace: "nowrap",
                    }}>{h.label}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((t, i) => {
                  const gt       = Number(t.total || 0) + Number(t.fees || 0);
                  const isBuy    = t.type === "Buy";
                  const isPending   = t.status === "pending";
                  const isConfirmed = t.status === "confirmed";
                  const isVerified  = t.status === "verified";
                  const isRejected  = t.status === "rejected";
                  const canEdit   = isSAAD || (isDE && (isPending || isRejected));
                  const canDelete = isSAAD || (isDE && (isPending || isRejected));
                  const canConfirm = isDE && isPending;
                  const canVerify  = (isVR || isSAAD) && isConfirmed;
                  const canReject  = (isVR || isSAAD) && isConfirmed;
                  const isChecked  = selected.has(t.id);

                  const rowActions = [
                    ...(canEdit   ? [{ icon: "✏️", label: "Edit",   onClick: () => setFormModal({ open: true, transaction: t }) }] : []),
                    ...(canVerify ? [{ icon: "✔️", label: "Verify", onClick: () => handleVerify([t.id], t.company_name) }] : []),
                    ...(canReject ? [{ icon: "✖",  label: "Reject", danger: true, onClick: () => setRejectModal({ ids: [t.id] }) }] : []),
                    ...(canDelete ? [{ icon: "🗑️", label: deleting === t.id ? "Deleting..." : "Delete", danger: true, onClick: () => setDeleteModal({ id: t.id, type: t.type, company: t.company_name }) }] : []),
                  ];

                  return (
                    <tr key={t.id}
                      style={{ borderBottom: `1px solid ${C.gray100}`, transition: "background 0.15s", background: isRejected ? "#FFF5F5" : isVerified ? "#F9FFFB" : "transparent" }}
                      onMouseEnter={e => e.currentTarget.style.background = isRejected ? "#FFF0F0" : isVerified ? "#F0FDF4" : C.gray50}
                      onMouseLeave={e => e.currentTarget.style.background = isRejected ? "#FFF5F5" : isVerified ? "#F9FFFB" : "transparent"}
                    >
                      {showCheckbox && (
                        <td style={{ padding: "7px 10px" }}>
                          {isVR && isConfirmed && (
                            <input type="checkbox" checked={isChecked} onChange={() => toggleOne(t.id)}
                              style={{ cursor: "pointer", width: 15, height: 15, accentColor: C.navy }}
                            />
                          )}
                        </td>
                      )}

                      <td style={{ padding: "7px 10px", color: C.gray400, fontWeight: 600, fontSize: 12 }}>{i + 1}</td>

                      <td style={{ padding: "7px 10px", color: C.gray600, whiteSpace: "nowrap", fontSize: 12 }}>
                        {fmtDate(t.date)}
                      </td>

                      <td style={{ padding: "7px 10px", minWidth: 100 }}>
                        <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{t.company_name}</div>
                      </td>

                      <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                        <span style={{
                          background: isBuy ? C.greenBg : C.redBg,
                          color: isBuy ? C.green : C.red,
                          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                          border: `1px solid ${isBuy ? "#BBF7D0" : "#FECACA"}`,
                        }}>
                          {isBuy ? "▲ Buy" : "▼ Sell"}
                        </span>
                      </td>

                      <td style={{ padding: "7px 10px", fontWeight: 600, textAlign: "right" }}>{fmtInt(t.qty)}</td>

                      <td style={{ padding: "7px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ background: C.greenBg, color: C.green, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                          {fmt(t.price)}
                        </span>
                      </td>

                      <td style={{ padding: "7px 10px", fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>{fmt(t.total)}</td>

                      <td style={{ padding: "10px 12px", color: C.gray600, textAlign: "right", whiteSpace: "nowrap" }}>
                        {t.fees ? fmt(t.fees) : <span style={{ color: C.gray400 }}>—</span>}
                      </td>

                      <td style={{ padding: "7px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{
                          background: isBuy ? C.greenBg : C.redBg, color: isBuy ? C.green : C.red,
                          padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 800,
                          border: `1px solid ${isBuy ? "#BBF7D0" : "#FECACA"}`,
                        }}>
                          {fmt(gt)}
                        </span>
                      </td>

                      <td style={{ padding: "7px 10px", color: C.gray600, maxWidth: 130, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {t.remarks || <span style={{ color: C.gray400 }}>—</span>}
                      </td>

                      {showStatus && (
                        <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                          <div>
                            <StatusBadge status={t.status} />
                            {isRejected && t.rejection_comment && (
                              <div style={{ fontSize: 10, color: C.red, marginTop: 3, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.rejection_comment}>
                                💬 {t.rejection_comment}
                              </div>
                            )}
                          </div>
                        </td>
                      )}

                      {showActions && (
                        <td style={{ padding: "10px 12px", textAlign: "right" }}>
                          {canConfirm && (
                            <button onClick={() => handleConfirm(t.id, t.company_name)} disabled={confirming === t.id}
                              style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 700, fontSize: 11, cursor: confirming === t.id ? "not-allowed" : "pointer", fontFamily: "inherit", marginRight: rowActions.length ? 6 : 0 }}>
                              {confirming === t.id ? "..." : "✅ Confirm"}
                            </button>
                          )}
                          {rowActions.length > 0 && <ActionMenu actions={rowActions} />}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>

              {/* Totals Footer */}
              <tfoot>
                <tr style={{ background: `${C.navy}08`, borderTop: `2px solid ${C.gray200}` }}>
                  {/* Label spans: checkbox(opt) + # + Date + Company + Type + Qty + Price/Share = 6 or 7 */}
                  <td colSpan={showCheckbox ? 7 : 6}
                    style={{ padding: "8px 10px", fontWeight: 700, color: C.gray600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    TOTALS ({filtered.length} rows)
                  </td>
                  {/* Total column */}
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.green, display:"flex", alignItems:"center", gap: 4, justifyContent:"flex-end" }}><span style={{fontSize:10}}>▲</span>{fmt(totals.buyAmount)}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.red,   display:"flex", alignItems:"center", gap: 4, justifyContent:"flex-end", marginTop: 3 }}><span style={{fontSize:10}}>▼</span>{fmt(totals.sellAmount)}</div>
                  </td>
                  {/* Fees column */}
                  <td style={{ padding: "8px 10px", fontWeight: 700, color: C.text, textAlign: "right", fontSize: 13 }}>{fmt(totals.fees)}</td>
                  {/* Grand Total column */}
                  <td style={{ padding: "8px 10px", textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.green, display:"flex", alignItems:"center", gap: 4, justifyContent:"flex-end" }}><span style={{fontSize:10}}>▲</span>{fmt(totals.buyGrand)}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.red,   display:"flex", alignItems:"center", gap: 4, justifyContent:"flex-end", marginTop: 3 }}><span style={{fontSize:10}}>▼</span>{fmt(totals.sellGrand)}</div>
                  </td>
                  {/* Remarks + Status(opt) + Actions(opt) */}
                  <td colSpan={1 + (showStatus ? 1 : 0) + (showActions ? 1 : 0)} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </SectionCard>
      </div>
    </div>
  );
}
