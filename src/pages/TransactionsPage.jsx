// ── src/pages/TransactionsPage.jsx ───────────────────────────────
import { useState, useMemo } from "react";
import {
  sbInsertTransaction, sbUpdateTransaction, sbDeleteTransaction,
  sbConfirmTransaction, sbVerifyTransactions, sbRejectTransactions,
} from "../lib/supabase";
import {
  C, fmt, fmtInt, fmtSmart,
  Btn, StatCard, SectionCard, Modal, ActionMenu,
  TransactionFormModal, ImportTransactionsModal,
} from "../components/ui";

const fmtDate = (d) => {
  if (!d) return "—";
  const date = new Date(d.includes("T") ? d : d + "T00:00:00");
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS = {
  pending:   { label: "Pending",   bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA", icon: "🕐" },
  confirmed: { label: "Confirmed", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", icon: "✅" },
  verified:  { label: "Verified",  bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0", icon: "✔️" },
  rejected:  { label: "Rejected",  bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", icon: "✖" },
};

// ── Spinner ────────────────────────────────────────────────────────
function Spinner({ size = 13, color = "#fff", style = {} }) {
  return (
    <>
      <style>{`@keyframes _txSpin { to { transform: rotate(360deg); } }`}</style>
      <span style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `2px solid ${color}33`,
        borderTop: `2px solid ${color}`,
        borderRadius: "50%",
        animation: "_txSpin 0.65s linear infinite",
        flexShrink: 0,
        ...style,
      }} />
    </>
  );
}

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

// ── Reject Modal ───────────────────────────────────────────────────
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
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, #1e3a5f)`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>✖ Reject Transaction{count > 1 ? "s" : ""}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 2 }}>{count > 1 ? `${count} transactions selected` : "1 transaction selected"}</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
        <div style={{ padding: "20px" }}>
          {err && <div style={{ background: C.redBg, border: `1px solid #FECACA`, color: C.red, borderRadius: 8, padding: "9px 12px", fontSize: 13, marginBottom: 14 }}>{err}</div>}
          <label style={{ fontSize: 13, fontWeight: 600, color: C.text, display: "block", marginBottom: 6 }}>Rejection Reason <span style={{ color: C.red }}>*</span></label>
          <textarea value={comment} onChange={e => { setComment(e.target.value); setErr(""); }}
            placeholder="Explain why this transaction is being rejected..."
            rows={4}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 14, border: `1.5px solid ${C.gray200}`, outline: "none", fontFamily: "inherit", resize: "vertical", color: C.text, boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.red}
            onBlur={e  => e.target.style.borderColor = C.gray200}
          />
          <div style={{ fontSize: 11, color: C.gray400, marginTop: 4 }}>This comment will be visible to the Data Entrant.</div>
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={saving} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray600, fontWeight: 600, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={saving || !comment.trim()} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: saving || !comment.trim() ? C.gray200 : C.red, color: C.white, fontWeight: 700, fontSize: 13, cursor: saving || !comment.trim() ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {saving ? <><Spinner size={13} color="#fff" /> Rejecting...</> : `Reject ${count > 1 ? `${count} Transactions` : "Transaction"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Confirm Action Modal ───────────────────────────────────────────
function ConfirmActionModal({ action, count = 1, company, onConfirm, onClose, loading }) {
  const isVerify    = action === "verify";
  const accentColor = isVerify ? C.green : "#1D4ED8";
  const accentBg    = isVerify ? C.greenBg : "#EFF6FF";
  const accentBdr   = isVerify ? "#BBF7D0" : "#BFDBFE";
  const icon        = isVerify ? "✔" : "✅";
  const title       = isVerify ? `Verify Transaction${count > 1 ? "s" : ""}` : "Confirm Transaction";
  const subtitle    = count > 1 ? `${count} transactions selected` : company || "1 transaction";
  const description = isVerify
    ? `Verifying will mark ${count > 1 ? "these transactions" : "this transaction"} as verified and finalize them.`
    : action === "confirm-rejected"
    ? "This transaction was previously rejected. Confirming will resubmit it to the Verifier for review."
    : "Confirming will send this transaction to the Verifier for review.";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,31,58,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, backdropFilter: "blur(2px)" }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, #1e3a5f)`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>{icon} {title}</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} disabled={loading} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 28, height: 28, borderRadius: "50%", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ background: accentBg, border: `1px solid ${accentBdr}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 18, marginTop: 1 }}>{isVerify ? "🔍" : "📋"}</span>
            <div style={{ fontSize: 13, color: accentColor, lineHeight: 1.5 }}>{description}</div>
          </div>
          <div style={{ fontSize: 13, color: C.gray600 }}>Are you sure you want to proceed?</div>
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray600, fontWeight: 600, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: loading ? C.gray200 : accentColor, color: C.white, fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {loading
              ? <><Spinner size={13} color="#fff" />{isVerify ? "Verifying..." : "Confirming..."}</>
              : <>{icon} {isVerify ? (count > 1 ? `Verify ${count}` : "Verify") : "Confirm"}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Simple confirmation modal for bulk delete / unverify ──────────
function SimpleConfirmModal({ title, message, count, onConfirm, onClose, loading }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,31,58,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, backdropFilter: "blur(2px)" }}>
      <div style={{ background: C.white, borderRadius: 16, width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, #1e3a5f)`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>{title}</div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>{count} transaction{count > 1 ? "s" : ""} selected</div>
          </div>
          <button onClick={onClose} disabled={loading} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: C.white, width: 28, height: 28, borderRadius: "50%", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <div style={{ padding: "20px" }}>
          <div style={{ fontSize: 14, color: C.text, marginBottom: 16 }}>{message}</div>
        </div>
        <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray600, fontWeight: 600, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: loading ? C.gray200 : C.red, color: C.white, fontWeight: 700, fontSize: 13, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
            {loading ? <><Spinner size={13} color="#fff" /> Processing...</> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Pagination component ───────────────────────────────────────────
function Pagination({ page, totalPages, pageSize, setPage, setPageSize, total, filtered }) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, filtered);
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "...") pages.push("...");
  }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderTop: `1px solid ${C.gray200}`, flexShrink: 0, background: `${C.navy}04` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, color: C.gray400 }}>
          Showing <strong style={{ color: C.text }}>{from}–{to}</strong> of <strong style={{ color: C.text }}>{filtered}</strong>
          {filtered !== total ? ` (${total} total)` : ""}
        </span>
        <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          style={{ padding: "3px 8px", borderRadius: 6, border: `1.5px solid ${C.gray200}`, fontSize: 11, fontFamily: "inherit", color: C.gray600, outline: "none", background: C.white, cursor: "pointer" }}>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
          <option value={200}>200 / page</option>
        </select>
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <PgBtn onClick={() => setPage(1)}        disabled={page === 1}           label="«" />
          <PgBtn onClick={() => setPage(p => p-1)} disabled={page === 1}           label="‹" />
          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} style={{ padding: "0 4px", color: C.gray400, fontSize: 12 }}>…</span>
            ) : (
              <PgBtn key={p} onClick={() => setPage(p)} active={p === page} label={p} />
            )
          )}
          <PgBtn onClick={() => setPage(p => p+1)} disabled={page === totalPages}  label="›" />
          <PgBtn onClick={() => setPage(totalPages)} disabled={page === totalPages} label="»" />
        </div>
      )}
    </div>
  );
}

function PgBtn({ onClick, disabled, label, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: 28, height: 28, borderRadius: 6, border: `1.5px solid ${active ? C.navy : C.gray200}`,
      background: active ? C.navy : disabled ? C.gray50 : C.white,
      color: active ? C.white : disabled ? C.gray400 : C.gray600,
      fontWeight: active ? 700 : 500, fontSize: 12, cursor: disabled ? "default" : "pointer",
      fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center",
    }}>{label}</button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function TransactionsPage({ companies, transactions, setTransactions, showToast, role, cdsNumber }) {

  const isDE   = role === "DE";
  const isVR   = role === "VR";
  const isRO   = role === "RO";
  const isSAAD = role === "SA" || role === "AD";

  const defaultStatus = "All";
  const statusOptions = [["All","All Statuses"],["pending","🕐 Pending"],["confirmed","✅ Confirmed"],["verified","✔️ Verified"],["rejected","✖ Rejected"]];

  const [search,       setSearch]      = useState("");
  const [typeFilter,   setTypeFilter]  = useState("All");
  const [statusFilter, setStatusFilter]= useState(defaultStatus);
  const [page,         setPage]        = useState(1);
  const [pageSize,     setPageSize]    = useState(50);
  const [selected,     setSelected]    = useState(new Set());

  // ── Loading states per action ──────────────────────────────────
  const [confirmingIds,  setConfirmingIds]  = useState(new Set()); // IDs currently being confirmed
  const [verifyingIds,   setVerifyingIds]   = useState(new Set()); // IDs currently being verified
  const [rejectingIds,   setRejectingIds]   = useState(new Set()); // IDs currently being rejected
  const [unverifyingIds, setUnverifyingIds] = useState(new Set()); // IDs currently being unverified
  const [deletingId,     setDeletingId]     = useState(null);      // single ID being deleted
  const [bulkDeletingIds,setBulkDeletingIds]= useState(new Set()); // IDs being bulk-deleted

  // ── Modal states ───────────────────────────────────────────────
  const [deleteModal,      setDeleteModal]      = useState(null);
  const [bulkDeleteModal,  setBulkDeleteModal]  = useState(null);
  const [bulkUnverifyModal,setBulkUnverifyModal]= useState(null);
  const [formModal,        setFormModal]        = useState({ open: false, transaction: null });
  const [importModal,      setImportModal]      = useState(false);
  const [actionModal,      setActionModal]      = useState(null);
  const [rejectModal,      setRejectModal]      = useState(null);

  // Derived: is any action globally in flight (for disabling bulk bars)
  const isAnyConfirming  = confirmingIds.size  > 0;
  const isAnyVerifying   = verifyingIds.size   > 0;
  const isAnyRejecting   = rejectingIds.size   > 0;
  const isAnyUnverifying = unverifyingIds.size > 0;
  const isAnyDeleting    = !!deletingId || bulkDeletingIds.size > 0;

  const myTransactions = useMemo(() =>
    cdsNumber ? transactions.filter(t => t.cds_number === cdsNumber) : transactions
  , [transactions, cdsNumber]);

  const stats = useMemo(() => {
    const buys  = myTransactions.filter(t => t.type === "Buy");
    const sells = myTransactions.filter(t => t.type === "Sell");
    return {
      total:        myTransactions.length,
      buys:         buys.length,
      sells:        sells.length,
      totalBuyVal:  buys.reduce((s,t)  => s + Number(t.total||0), 0),
      totalSellVal: sells.reduce((s,t) => s + Number(t.total||0), 0),
      pending:      myTransactions.filter(t => t.status === "pending").length,
      confirmed:    myTransactions.filter(t => t.status === "confirmed").length,
      verified:     myTransactions.filter(t => t.status === "verified").length,
      rejected:     myTransactions.filter(t => t.status === "rejected").length,
    };
  }, [myTransactions]);

  const filtered = useMemo(() => {
    let list = myTransactions;
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
    const isActive = s => s === "pending" || s === "confirmed" || s === "rejected";
    list = [...list].sort((a, b) => {
      const aActive = isActive(a.status);
      const bActive = isActive(b.status);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return (b.date || "").localeCompare(a.date || "");
    });
    return list;
  }, [myTransactions, typeFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const resetPage  = () => setPage(1);

  const totals = useMemo(() => ({
    buyAmount:  filtered.filter(t => t.type==="Buy").reduce((s,t)  => s+Number(t.total||0),0),
    sellAmount: filtered.filter(t => t.type==="Sell").reduce((s,t) => s+Number(t.total||0),0),
    fees:       filtered.reduce((s,t) => s+Number(t.fees||0),0),
    buyGrand:   filtered.filter(t => t.type==="Buy").reduce((s,t)  => s+Number(t.total||0)+Number(t.fees||0),0),
    sellGrand:  filtered.filter(t => t.type==="Sell").reduce((s,t) => s+Number(t.total||0)+Number(t.fees||0),0),
  }), [filtered]);

  const paginatedIds = paginated.map(t => t.id);
  const allSelected  = paginatedIds.length > 0 && paginatedIds.every(id => selected.has(id));
  const someSelected = paginatedIds.some(id => selected.has(id));

  const toggleAll = () => {
    if (allSelected) {
      const newSelected = new Set(selected);
      paginatedIds.forEach(id => newSelected.delete(id));
      setSelected(newSelected);
    } else {
      const newSelected = new Set(selected);
      paginatedIds.forEach(id => newSelected.add(id));
      setSelected(newSelected);
    }
  };

  const toggleOne = (id) => {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  };

  const selectedPendingRejected = useMemo(() =>
    [...selected].filter(id => {
      const t = myTransactions.find(t => t.id === id);
      return t && (t.status === "pending" || t.status === "rejected");
    }), [selected, myTransactions]);

  // SA/AD can delete any status; DE restricted to pending/rejected
  const selectedDeletable = useMemo(() =>
    isSAAD
      ? [...selected].filter(id => myTransactions.some(t => t.id === id))
      : selectedPendingRejected
  , [selected, myTransactions, isSAAD, selectedPendingRejected]);

  const selectedConfirmed = useMemo(() =>
    [...selected].filter(id => {
      const t = myTransactions.find(t => t.id === id);
      return t && t.status === "confirmed";
    }), [selected, myTransactions]);

  const selectedVerified = useMemo(() =>
    [...selected].filter(id => {
      const t = myTransactions.find(t => t.id === id);
      return t && t.status === "verified";
    }), [selected, myTransactions]);

  // ── Handlers ──────────────────────────────────────────────────────
  const handleFormConfirm = async ({ date, companyId, type, qty, price, fees, remarks, total }) => {
    const isEdit  = !!formModal.transaction;
    const company = companies.find(c => c.id === companyId);
    const payload = { date, company_id: companyId, company_name: company?.name, type, qty: Number(qty), price: Number(price), total, fees: fees ? Number(fees) : null, remarks: remarks || null, cds_number: cdsNumber || null };
    try {
      if (isEdit) {
        const rows = await sbUpdateTransaction(formModal.transaction.id, payload);
        if (!rows || rows.length === 0) throw new Error("Update failed – transaction may have been modified or you lack permission.");
        setTransactions(p => p.map(t => t.id === formModal.transaction.id ? rows[0] : t));
        showToast("Transaction updated!", "success");
      } else {
        const rows = await sbInsertTransaction(payload);
        setTransactions(p => [rows[0], ...p]);
        showToast("Transaction recorded!", "success");
      }
      setFormModal({ open: false, transaction: null });
    } catch (e) { showToast("Error: " + e.message, "error"); }
  };

  const handleConfirm = (id, company, status) =>
    setActionModal({ action: status === "rejected" ? "confirm-rejected" : "confirm", ids: [id], company });

  // Bulk confirm (also used for single confirm via actionModal)
  const doBulkConfirm = async () => {
    const ids = actionModal?.ids;
    if (!ids?.length) return;

    setActionModal(null);
    setConfirmingIds(new Set(ids));

    try {
      const updatedTransactions = [...myTransactions];
      for (const id of ids) {
        const rows = await sbConfirmTransaction(id);
        if (!rows || rows.length === 0) {
          throw new Error(`Transaction ${id} could not be confirmed. It may have been already confirmed or you no longer have permission.`);
        }
        const idx = updatedTransactions.findIndex(t => t.id === id);
        if (idx !== -1) updatedTransactions[idx] = rows[0];
      }
      setTransactions(updatedTransactions);
      setSelected(new Set());
      showToast(`${ids.length} transaction${ids.length > 1 ? "s" : ""} confirmed!`, "success");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setConfirmingIds(new Set());
    }
  };

  const handleVerify = (ids, company) => setActionModal({ action: "verify", ids, company: company || null });

  const doVerify = async () => {
    const ids = actionModal?.ids;
    if (!ids?.length) return;
    setActionModal(null);
    setVerifyingIds(new Set(ids));
    try {
      await sbVerifyTransactions(ids);
      setTransactions(p => p.map(t => ids.includes(t.id) ? { ...t, status: "verified" } : t));
      setSelected(new Set());
      showToast(`${ids.length} transaction${ids.length > 1 ? "s" : ""} verified!`, "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    finally { setVerifyingIds(new Set()); }
  };

  const handleReject = async (comment) => {
    const ids = rejectModal?.ids;
    if (!ids?.length) return;
    setRejectingIds(new Set(ids));
    try {
      await sbRejectTransactions(ids, comment);
      setTransactions(p => p.map(t => ids.includes(t.id) ? { ...t, status: "rejected", rejection_comment: comment } : t));
      setSelected(new Set());
      setRejectModal(null);
      showToast(`${ids.length} transaction${ids.length > 1 ? "s" : ""} rejected.`, "error");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setRejectingIds(new Set());
    }
  };

  const handleUnVerify = async (id) => {
    setUnverifyingIds(prev => new Set([...prev, id]));
    try {
      const rows = await sbUpdateTransaction(id, { status: "pending", verified_by: null, verified_at: null, rejection_comment: null });
      if (!rows || rows.length === 0) throw new Error("Unverify failed – transaction may have been modified or you lack permission.");
      setTransactions(p => p.map(t => t.id === id ? rows[0] : t));
      showToast("Transaction unverified and returned to Pending.", "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    finally {
      setUnverifyingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  // Bulk unverify for SA/AD
  const doBulkUnverify = async () => {
    const ids = bulkUnverifyModal?.ids;
    if (!ids?.length) return;
    setBulkUnverifyModal(null);
    setUnverifyingIds(new Set(ids));

    try {
      const updatedTransactions = [...myTransactions];
      for (const id of ids) {
        const rows = await sbUpdateTransaction(id, { status: "pending", verified_by: null, verified_at: null, rejection_comment: null });
        if (!rows || rows.length === 0) throw new Error(`Transaction ${id} could not be unverified.`);
        const idx = updatedTransactions.findIndex(t => t.id === id);
        if (idx !== -1) updatedTransactions[idx] = rows[0];
      }
      setTransactions(updatedTransactions);
      setSelected(new Set());
      showToast(`${ids.length} transaction${ids.length > 1 ? "s" : ""} unverified.`, "success");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setUnverifyingIds(new Set());
    }
  };

  const handleDelete = async () => {
    const id = deleteModal.id;
    setDeleteModal(null);
    setDeletingId(id);
    try {
      await sbDeleteTransaction(id);
      setTransactions(p => p.filter(t => t.id !== id));
      showToast("Transaction deleted.", "success");
    } catch (e) { showToast("Error: " + e.message, "error"); }
    finally { setDeletingId(null); }
  };

  // Bulk delete for DE
  const doBulkDelete = async () => {
    const ids = bulkDeleteModal?.ids;
    if (!ids?.length) return;
    setBulkDeleteModal(null);
    setBulkDeletingIds(new Set(ids));

    try {
      for (const id of ids) {
        await sbDeleteTransaction(id);
      }
      setTransactions(p => p.filter(t => !ids.includes(t.id)));
      setSelected(new Set());
      showToast(`${ids.length} transaction${ids.length > 1 ? "s" : ""} deleted.`, "success");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    } finally {
      setBulkDeletingIds(new Set());
    }
  };

  const handleImport = async (rows) => {
    const BATCH = 20;
    const inserted = [];
    for (let i = 0; i < rows.length; i += BATCH) {
      const results = await Promise.all(rows.slice(i, i + BATCH).map(row => sbInsertTransaction({ ...row, cds_number: cdsNumber || null })));
      results.forEach(r => inserted.push(r[0]));
    }
    inserted.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(p => [...inserted, ...p]);
    showToast(`Imported ${inserted.length} transaction${inserted.length !== 1 ? "s" : ""} successfully!`, "success");
  };

  // ── Stat cards ────────────────────────────────────────────────────
  const statCards = useMemo(() => {
    if (isVR) return [
      { label: "Awaiting Review", value: stats.confirmed, sub: "Confirmed by Data Entrant", icon: "📋", color: "#1D4ED8" },
      { label: "Verified",        value: stats.verified,  sub: "Approved transactions",     icon: "✔️", color: C.green  },
      { label: "Rejected",        value: stats.rejected,  sub: "Sent back for correction",  icon: "✖",  color: C.red    },
      { label: "Selected",        value: selected.size,   sub: selected.size > 0 ? "Ready to action" : "Use checkboxes below", icon: "☑️", color: C.gold },
    ];
    if (isDE) return [
      { label: "My Transactions", value: stats.total,   sub: `${stats.pending} pending · ${stats.confirmed} confirmed`, icon: "📋", color: C.navy  },
      { label: "Total Bought",    value: `TZS ${fmtSmart(stats.totalBuyVal)}`,  sub: `${stats.buys} buy orders`,   icon: "📥", color: C.green },
      { label: "Total Sold",      value: `TZS ${fmtSmart(stats.totalSellVal)}`, sub: `${stats.sells} sell orders`, icon: "📤", color: C.red   },
      { label: "Pending Confirm", value: stats.pending, sub: "Awaiting your confirmation", icon: "🕐", color: C.gold  },
    ];
    if (isRO) return [
      { label: "Total Records",  value: stats.total,    sub: `${stats.verified} verified`, icon: "📋", color: C.navy  },
      { label: "Total Bought",   value: `TZS ${fmtSmart(stats.totalBuyVal)}`,  sub: `${stats.buys} buy orders`,   icon: "📥", color: C.green },
      { label: "Total Sold",     value: `TZS ${fmtSmart(stats.totalSellVal)}`, sub: `${stats.sells} sell orders`, icon: "📤", color: C.red   },
      { label: "Net Position",   value: `TZS ${fmtSmart(Math.abs(stats.totalBuyVal - stats.totalSellVal))}`, sub: stats.totalBuyVal >= stats.totalSellVal ? "Net invested" : "Net realised", icon: "📊", color: C.gold },
    ];
    return [
      { label: "Total Transactions", value: stats.total,    sub: `${stats.buys} buys · ${stats.sells} sells`,             icon: "📋", color: C.navy  },
      { label: "Total Bought",       value: `TZS ${fmtSmart(stats.totalBuyVal)}`,  sub: `${stats.buys} buy orders`,       icon: "📥", color: C.green },
      { label: "Total Sold",         value: `TZS ${fmtSmart(stats.totalSellVal)}`, sub: `${stats.sells} sell orders`,     icon: "📤", color: C.red   },
      { label: "Pending Verify",     value: stats.confirmed, sub: `${stats.pending} pending · ${stats.rejected} rejected`, icon: "⏳", color: C.gold  },
    ];
  }, [stats, selected.size, role]);

  const showCheckbox = true;
  const showStatus   = true;
  const showActions  = !isRO;

  return (
    <div style={{ height: "calc(100vh - 118px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Modals */}
      {deleteModal && (
        <Modal type="confirm" title="Delete Transaction"
          message={`Delete this ${deleteModal.type} transaction for "${deleteModal.company}"? This cannot be undone.`}
          onConfirm={handleDelete} onClose={() => setDeleteModal(null)} />
      )}
      {bulkDeleteModal && (
        <SimpleConfirmModal
          title="Delete Transactions"
          message={`Are you sure you want to delete ${bulkDeleteModal.ids.length} transaction(s)? This cannot be undone.`}
          count={bulkDeleteModal.ids.length}
          loading={bulkDeletingIds.size > 0}
          onConfirm={doBulkDelete}
          onClose={() => setBulkDeleteModal(null)}
        />
      )}
      {bulkUnverifyModal && (
        <SimpleConfirmModal
          title="Unverify Transactions"
          message={`Are you sure you want to unverify ${bulkUnverifyModal.ids.length} transaction(s)? They will be moved back to Pending.`}
          count={bulkUnverifyModal.ids.length}
          loading={isAnyUnverifying}
          onConfirm={doBulkUnverify}
          onClose={() => setBulkUnverifyModal(null)}
        />
      )}
      {formModal.open && (
        <TransactionFormModal key={formModal.transaction?.id || "new"} transaction={formModal.transaction}
          companies={companies} onConfirm={handleFormConfirm} onClose={() => setFormModal({ open: false, transaction: null })} />
      )}
      {importModal && (
        <ImportTransactionsModal companies={companies} onImport={handleImport} onClose={() => setImportModal(false)} />
      )}
      {actionModal && (
        <ConfirmActionModal
          action={actionModal.action}
          count={actionModal.ids.length}
          company={actionModal.company}
          loading={isAnyConfirming || isAnyVerifying}
          onConfirm={actionModal.action === "verify" ? doVerify : doBulkConfirm}
          onClose={() => setActionModal(null)}
        />
      )}
      {rejectModal && (
        <RejectModal
          count={rejectModal.ids.length}
          onConfirm={handleReject}
          onClose={() => setRejectModal(null)}
        />
      )}

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8, flexShrink: 0 }}>
        {statCards.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap", flexShrink: 0 }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: C.gray400 }}>🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="Search company, type, date, remarks..."
            style={{ width: "100%", border: `1.5px solid ${C.gray200}`, borderRadius: 8, padding: "6px 10px 6px 32px", fontSize: 12, outline: "none", fontFamily: "inherit", color: C.text, boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.navy}
            onBlur={e  => e.target.style.borderColor = C.gray200}
          />
        </div>

        {/* Type filter */}
        {["All","Buy","Sell"].map(t => (
          <button key={t} onClick={() => { setTypeFilter(t); resetPage(); }} style={{
            padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${typeFilter === t ? C.navy : C.gray200}`,
            background: typeFilter === t ? C.navy : C.white,
            color: typeFilter === t ? C.white : C.gray600,
            fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          }}>{t}</button>
        ))}

        {/* Status filter */}
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); resetPage(); }} style={{
          padding: "5px 10px", borderRadius: 8,
          border: `1.5px solid ${statusFilter !== "All" ? C.navy : C.gray200}`,
          fontSize: 12, fontFamily: "inherit",
          color: statusFilter !== "All" ? C.navy : C.gray600,
          fontWeight: statusFilter !== "All" ? 700 : 400,
          outline: "none", background: C.white, cursor: "pointer",
        }}
          onFocus={e => e.target.style.borderColor = C.navy}
          onBlur={e  => e.target.style.borderColor = statusFilter !== "All" ? C.navy : C.gray200}
        >
          {statusOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>

        {/* Bulk action buttons */}
        {selected.size > 0 && (
          <>
            {/* Data Entry + SA/AD bulk confirm & delete for pending/rejected */}
            {(isDE || isSAAD) && selectedPendingRejected.length > 0 && (
              <>
                <button
                  onClick={() => setActionModal({ action: "confirm", ids: selectedPendingRejected, company: null })}
                  disabled={isAnyConfirming}
                  style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: isAnyConfirming ? C.gray200 : "#1D4ED8", color: C.white, fontWeight: 700, fontSize: 12, cursor: isAnyConfirming ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {isAnyConfirming ? <><Spinner size={12} color="#888" /> Confirming...</> : `✅ Confirm ${selectedPendingRejected.length}`}
                </button>
              </>
            )}
            {(isDE || isSAAD) && selectedDeletable.length > 0 && (
                <button
                  onClick={() => setBulkDeleteModal({ ids: selectedDeletable })}
                  disabled={isAnyDeleting}
                  style={{ padding: "5px 14px", borderRadius: 8, border: `1.5px solid #FECACA`, background: isAnyDeleting ? C.gray100 : C.redBg, color: C.red, fontWeight: 700, fontSize: 12, cursor: isAnyDeleting ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {isAnyDeleting ? <><Spinner size={12} color={C.red} /> Deleting...</> : `🗑️ Delete ${selectedDeletable.length}`}
                </button>
            )}

            {/* Verifier bulk actions */}
            {(isVR || isSAAD) && selectedConfirmed.length > 0 && (
              <>
                <button
                  onClick={() => handleVerify(selectedConfirmed)}
                  disabled={isAnyVerifying}
                  style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: isAnyVerifying ? C.gray200 : C.green, color: C.white, fontWeight: 700, fontSize: 12, cursor: isAnyVerifying ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {isAnyVerifying ? <><Spinner size={12} color="#888" /> Verifying...</> : `✔ Verify ${selectedConfirmed.length}`}
                </button>
                <button
                  onClick={() => setRejectModal({ ids: selectedConfirmed })}
                  disabled={isAnyRejecting}
                  style={{ padding: "5px 14px", borderRadius: 8, border: `1.5px solid #FECACA`, background: isAnyRejecting ? C.gray100 : C.redBg, color: C.red, fontWeight: 700, fontSize: 12, cursor: isAnyRejecting ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {isAnyRejecting ? <><Spinner size={12} color={C.red} /> Rejecting...</> : `✖ Reject ${selectedConfirmed.length}`}
                </button>
              </>
            )}

            {/* SA/AD bulk unverify */}
            {isSAAD && selectedVerified.length > 0 && (
              <button
                onClick={() => setBulkUnverifyModal({ ids: selectedVerified })}
                disabled={isAnyUnverifying}
                style={{ padding: "5px 14px", borderRadius: 8, border: `1.5px solid ${C.gray200}`, background: isAnyUnverifying ? C.gray100 : C.white, color: C.gray600, fontWeight: 700, fontSize: 12, cursor: isAnyUnverifying ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
              >
                {isAnyUnverifying ? <><Spinner size={12} color={C.gray400} /> Unverifying...</> : `↩️ UnVerify ${selectedVerified.length}`}
              </button>
            )}
          </>
        )}

        {/* Reset button */}
        {(search || typeFilter !== "All" || statusFilter !== defaultStatus) && (
          <Btn variant="secondary" onClick={() => { setSearch(""); setTypeFilter("All"); setStatusFilter(defaultStatus); resetPage(); }}>Reset</Btn>
        )}

        {/* Record / Import buttons */}
        {(isDE || isSAAD) && (
          <Btn variant="navy" icon="+" onClick={() => setFormModal({ open: true, transaction: null })}>Record Transaction</Btn>
        )}
        {(isDE || isSAAD) && (
          <Btn variant="primary" icon="⬆️" onClick={() => setImportModal(true)}>Import</Btn>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <SectionCard
          title={`Transaction History (${filtered.length}${filtered.length !== stats.total ? ` of ${stats.total}` : ""})`}
        >
          {stats.total === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.gray400 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No transactions yet</div>
              <div style={{ fontSize: 13 }}>{isDE ? "Click \"Record Transaction\" to add your first buy or sell" : "Transactions will appear here once created"}</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: C.gray400 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <div style={{ fontWeight: 600 }}>No results found</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Try adjusting your search or filters</div>
              <button onClick={() => { setSearch(""); setTypeFilter("All"); setStatusFilter(defaultStatus); resetPage(); }}
                style={{ marginTop: 12, padding: "6px 16px", borderRadius: 8, border: `1.5px solid ${C.gray200}`, background: C.white, color: C.gray600, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto", overflowY: "auto", flex: 1, minHeight: 0 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 2 }}>
                    <tr style={{ background: `linear-gradient(135deg, ${C.navy}08, ${C.navy}04)` }}>
                      {showCheckbox && (
                        <th style={{ padding: "7px 10px", borderBottom: `2px solid ${C.gray200}`, width: 36 }}>
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={el => el && (el.indeterminate = someSelected && !allSelected)}
                            onChange={toggleAll}
                            style={{ cursor: "pointer", width: 15, height: 15, accentColor: C.navy }}
                          />
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
                        { label: "Status",      align: "left"  },
                        ...(showActions ? [{ label: "Actions", align: "right" }] : []),
                      ].map(h => (
                        <th key={h.label} style={{ padding: "7px 10px", textAlign: h.align, color: C.gray400, fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `2px solid ${C.gray200}`, whiteSpace: "nowrap", background: "#f5f6fa" }}>{h.label}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {paginated.map((t, i) => {
                      const gt          = Number(t.total || 0) + Number(t.fees || 0);
                      const isBuy       = t.type === "Buy";
                      const isPending   = t.status === "pending";
                      const isConfirmed = t.status === "confirmed";
                      const isVerified  = t.status === "verified";
                      const isRejected  = t.status === "rejected";
                      const globalIdx   = (safePage - 1) * pageSize + i + 1;

                      const canConfirm  = (isDE || isSAAD) && (isPending || isRejected);
                      const canEdit     = isSAAD || (isDE && (isPending || isRejected));
                      const canDelete   = isDE ? (isPending || isRejected) : isSAAD;
                      const canUnVerify = isSAAD && isVerified;
                      const canVerify   = (isVR || isSAAD) && isConfirmed;
                      const canReject   = (isVR || isSAAD) && isConfirmed;
                      const isChecked   = selected.has(t.id);

                      // Per-row loading flags
                      const isRowConfirming  = confirmingIds.has(t.id);
                      const isRowVerifying   = verifyingIds.has(t.id);
                      const isRowRejecting   = rejectingIds.has(t.id);
                      const isRowUnverifying = unverifyingIds.has(t.id);
                      const isRowDeleting    = deletingId === t.id || bulkDeletingIds.has(t.id);
                      const isRowBusy        = isRowConfirming || isRowVerifying || isRowRejecting || isRowUnverifying || isRowDeleting;

                      const rowActions = [
                        ...(canEdit      ? [{ icon: "✏️", label: "Edit",     disabled: isRowBusy, onClick: () => setFormModal({ open: true, transaction: t }) }] : []),
                        ...(canVerify    ? [{ icon: isRowVerifying ? null : "✔️", label: isRowVerifying ? "Verifying..." : "Verify", disabled: isRowBusy, onClick: () => handleVerify([t.id], t.company_name) }] : []),
                        ...(canReject    ? [{ icon: isRowRejecting ? null : "✖",  label: isRowRejecting ? "Rejecting..." : "Reject", danger: true, disabled: isRowBusy, onClick: () => setRejectModal({ ids: [t.id] }) }] : []),
                        ...(canUnVerify  ? [{ icon: isRowUnverifying ? null : "↩️", label: isRowUnverifying ? "Unverifying..." : "UnVerify", danger: true, disabled: isRowBusy, onClick: () => handleUnVerify(t.id) }] : []),
                        ...(canDelete    ? [{ icon: isRowDeleting ? null : "🗑️", label: isRowDeleting ? "Deleting..." : "Delete", danger: true, disabled: isRowBusy, onClick: () => setDeleteModal({ id: t.id, type: t.type, company: t.company_name }) }] : []),
                      ];

                      return (
                        <tr key={t.id}
                          style={{
                            borderBottom: `1px solid ${C.gray100}`,
                            transition: "background 0.15s, opacity 0.2s",
                            background: isRejected ? "#FFF5F5" : isVerified ? "#F9FFFB" : "transparent",
                            opacity: isRowBusy ? 0.6 : 1,
                            pointerEvents: isRowBusy ? "none" : "auto",
                          }}
                          onMouseEnter={e => { if (!isRowBusy) e.currentTarget.style.background = isRejected ? "#FFF0F0" : isVerified ? "#F0FDF4" : C.gray50; }}
                          onMouseLeave={e => { e.currentTarget.style.background = isRejected ? "#FFF5F5" : isVerified ? "#F9FFFB" : "transparent"; }}
                        >
                          {showCheckbox && (
                            <td style={{ padding: "7px 10px" }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleOne(t.id)}
                                disabled={isRowBusy}
                                style={{ cursor: isRowBusy ? "not-allowed" : "pointer", width: 15, height: 15, accentColor: C.navy }}
                              />
                            </td>
                          )}
                          <td style={{ padding: "7px 10px", color: C.gray400, fontWeight: 600, fontSize: 12 }}>{globalIdx}</td>
                          <td style={{ padding: "7px 10px", color: C.gray600, whiteSpace: "nowrap", fontSize: 12 }}>{fmtDate(t.date)}</td>
                          <td style={{ padding: "7px 10px", minWidth: 100 }}>
                            <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{t.company_name}</div>
                          </td>
                          <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                            <span style={{ background: isBuy ? C.greenBg : C.redBg, color: isBuy ? C.green : C.red, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${isBuy ? "#BBF7D0" : "#FECACA"}` }}>
                              {isBuy ? "▲ Buy" : "▼ Sell"}
                            </span>
                          </td>
                          <td style={{ padding: "7px 10px", fontWeight: 600, textAlign: "right" }}>{fmtInt(t.qty)}</td>
                          <td style={{ padding: "7px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <span style={{ background: C.greenBg, color: C.green, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{fmt(t.price)}</span>
                          </td>
                          <td style={{ padding: "7px 10px", fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" }}>{fmt(t.total)}</td>
                          <td style={{ padding: "7px 10px", color: C.gray600, textAlign: "right", whiteSpace: "nowrap" }}>
                            {t.fees ? fmt(t.fees) : <span style={{ color: C.gray400 }}>—</span>}
                          </td>
                          <td style={{ padding: "7px 10px", textAlign: "right", whiteSpace: "nowrap" }}>
                            <span style={{ background: isBuy ? C.greenBg : C.redBg, color: isBuy ? C.green : C.red, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 800, border: `1px solid ${isBuy ? "#BBF7D0" : "#FECACA"}` }}>
                              {fmt(gt)}
                            </span>
                          </td>
                          <td style={{ padding: "7px 10px", color: C.gray600, maxWidth: 130, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.remarks || <span style={{ color: C.gray400 }}>—</span>}
                          </td>
                          <td style={{ padding: "7px 10px", whiteSpace: "nowrap" }}>
                            <StatusBadge status={t.status} />
                            {isRejected && t.rejection_comment && (
                              <div style={{ fontSize: 10, color: C.red, marginTop: 3, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={t.rejection_comment}>
                                💬 {t.rejection_comment}
                              </div>
                            )}
                          </td>
                          {showActions && (
                            <td style={{ padding: "7px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                              {canConfirm && (
                                <button
                                  onClick={() => handleConfirm(t.id, t.company_name, t.status)}
                                  disabled={isRowBusy}
                                  style={{
                                    padding: "4px 10px", borderRadius: 7, border: "none",
                                    background: isRowConfirming ? C.gray100 : "#EFF6FF",
                                    color: isRowConfirming ? C.gray400 : "#1D4ED8",
                                    fontWeight: 700, fontSize: 11,
                                    cursor: isRowBusy ? "not-allowed" : "pointer",
                                    fontFamily: "inherit",
                                    marginRight: rowActions.length ? 6 : 0,
                                    display: "inline-flex", alignItems: "center", gap: 5,
                                    minWidth: 80, justifyContent: "center",
                                  }}
                                >
                                  {isRowConfirming
                                    ? <><Spinner size={11} color={C.gray400} /> Confirming</>
                                    : "✅ Confirm"
                                  }
                                </button>
                              )}
                              {rowActions.length > 0 && <ActionMenu actions={rowActions} />}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot>
                    <tr style={{ background: `${C.navy}08`, borderTop: `2px solid ${C.gray200}` }}>
                      <td colSpan={showCheckbox ? 7 : 6}
                        style={{ padding: "8px 10px", fontWeight: 700, color: C.gray600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        TOTALS ({filtered.length} rows{filtered.length > pageSize ? `, page shows ${paginated.length}` : ""})
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.green, display:"flex", alignItems:"center", gap: 4, justifyContent:"flex-end" }}><span style={{fontSize:10}}>▲</span>{fmt(totals.buyAmount)}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.red,   display:"flex", alignItems:"center", gap: 4, justifyContent:"flex-end", marginTop: 3 }}><span style={{fontSize:10}}>▼</span>{fmt(totals.sellAmount)}</div>
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: 700, color: C.text, textAlign: "right", fontSize: 13 }}>{fmt(totals.fees)}</td>
                      <td style={{ padding: "8px 10px", textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.green, display:"flex", alignItems:"center", gap: 4, justifyContent:"flex-end" }}><span style={{fontSize:10}}>▲</span>{fmt(totals.buyGrand)}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: C.red,   display:"flex", alignItems:"center", gap: 4, justifyContent:"flex-end", marginTop: 3 }}><span style={{fontSize:10}}>▼</span>{fmt(totals.sellGrand)}</div>
                      </td>
                      <td colSpan={1 + 1 + (showActions ? 1 : 0)} />
                    </tr>
                  </tfoot>
                </table>
              </div>

              <Pagination
                page={safePage}
                totalPages={totalPages}
                pageSize={pageSize}
                setPage={setPage}
                setPageSize={setPageSize}
                total={stats.total}
                filtered={filtered.length}
              />
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
