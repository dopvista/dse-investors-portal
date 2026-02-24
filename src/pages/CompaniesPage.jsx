import { useState, useMemo } from "react";
import { sbInsert, sbUpdate, sbDelete, sbGet } from "../lib/supabase";
import { C, fmt, Btn, StatCard, SectionCard, Modal, PriceHistoryModal, UpdatePriceModal, CompanyFormModal, ActionMenu } from "../components/ui";

export default function CompaniesPage({ companies, setCompanies, transactions, showToast }) {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(null);

  // Modals
  const [modal, setModal]               = useState({ open: false, type: "confirm", title: "", message: "", targetId: null });
  const [historyModal, setHistoryModal] = useState({ open: false, company: null, history: [] });
  const [updateModal, setUpdateModal]   = useState({ open: false, company: null });
  const [formModal, setFormModal]       = useState({ open: false, company: null }); // null = register, company = edit

  // ── Stats ──────────────────────────────────────────────────────
  const totalAvg = companies.length
    ? companies.reduce((s, c) => s + Number(c.price || 0), 0) / companies.length : 0;
  const highestPrice = companies.length
    ? Math.max(...companies.map(c => Number(c.price || 0))) : 0;

  // ── Search filter ──────────────────────────────────────────────
  const filtered = useMemo(() =>
    companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [companies, search]);

  // ── Register / Edit Company ────────────────────────────────────
  const handleFormConfirm = async ({ name, price, remarks }) => {
    const isEdit = !!formModal.company;
    try {
      if (isEdit) {
        const rows = await sbUpdate("companies", formModal.company.id, { name, remarks });
        setCompanies(p => p.map(c => c.id === formModal.company.id ? rows[0] : c));
        showToast("Company updated!", "success");
      } else {
        const rows = await sbInsert("companies", { name, price, remarks });
        setCompanies(p => [rows[0], ...p]);
        showToast("Company registered!", "success");
      }
      setFormModal({ open: false, company: null });
    } catch (e) { showToast("Error: " + e.message, "error"); }
  };

  // ── Delete Company ─────────────────────────────────────────────
  const del = (id) => {
    const hasTx = transactions.some(t => t.company_id === id);
    const company = companies.find(c => c.id === id);
    if (hasTx) {
      setModal({ open: true, type: "warning", title: "Cannot Delete Company", message: `"${company.name}" has existing transactions. Delete all its transactions first before removing this company.`, targetId: null });
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
  const confirmUpdatePrice = async ({ newPrice, datetime, reason }) => {
    const company = updateModal.company;
    const oldPrice = Number(company.price);
    const changeAmount = newPrice - oldPrice;
    const changePct = oldPrice !== 0 ? (changeAmount / oldPrice) * 100 : 0;
    setUpdateModal({ open: false, company: null });
    setUpdating(company.id);
    try {
      await sbInsert("price_history", {
        company_id: company.id, company_name: company.name,
        old_price: oldPrice, new_price: newPrice,
        change_amount: changeAmount, change_percent: changePct,
        notes: reason || null, updated_by: "Admin",
        created_at: new Date(datetime).toISOString(),
      });
      const rows = await sbUpdate("companies", company.id, { price: newPrice, previous_price: oldPrice });
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
      {/* ── Modals ─────────────────────────────────────────────── */}
      <Modal type={modal.type} title={modal.open ? modal.title : ""} message={modal.message} onConfirm={confirmDelete} onClose={() => setModal({ ...modal, open: false })} />
      <PriceHistoryModal company={historyModal.open ? historyModal.company : null} history={historyModal.history} onClose={() => setHistoryModal({ open: false, company: null, history: [] })} />
      <UpdatePriceModal key={updateModal.company?.id} company={updateModal.open ? updateModal.company : null} onConfirm={confirmUpdatePrice} onClose={() => setUpdateModal({ open: false, company: null })} />
      {formModal.open && <CompanyFormModal key={formModal.company?.id || "new"} company={formModal.company} onConfirm={handleFormConfirm} onClose={() => setFormModal({ open: false, company: null })} />}

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Holdings" value={companies.length} sub="Registered companies" icon="🏢" color={C.navy} />
        <StatCard label="Avg. Price" value={`TZS ${fmt(totalAvg)}`} sub="Across all holdings" icon="📊" color={C.green} />
        <StatCard label="Highest Price" value={`TZS ${fmt(highestPrice)}`} sub="Top priced holding" icon="🏆" color={C.gold} />
        <StatCard label="Search Results" value={filtered.length} sub={search ? `Matching "${search}"` : "Showing all"} icon="🔍" color={C.navy} />
      </div>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: C.gray400 }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search companies..."
            style={{ width: "100%", border: `1.5px solid ${C.gray200}`, borderRadius: 8, padding: "9px 12px 9px 36px", fontSize: 14, outline: "none", fontFamily: "inherit", color: C.text, boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = C.green}
            onBlur={e => e.target.style.borderColor = C.gray200}
          />
        </div>
        {search && (
          <Btn variant="secondary" onClick={() => setSearch("")}>Clear</Btn>
        )}
        <Btn variant="navy" icon="+" onClick={() => setFormModal({ open: true, company: null })}>Register Company</Btn>
      </div>

      {/* ── Holdings Table ──────────────────────────────────────── */}
      <SectionCard title={`Holdings (${filtered.length}${search ? ` of ${companies.length}` : ""})`} subtitle="Manage your DSE registered companies">
        {companies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: C.gray400 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>No companies yet</div>
            <div style={{ fontSize: 13 }}>Click "Register Company" to add your first holding</div>
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
                  {["#", "Company Name", "Previous Price (TZS)", "Current Price (TZS)", "Last Price Update", ""].map(h => (
                    <th key={h} style={{ padding: "12px 18px", textAlign: ["Previous Price (TZS)", "Current Price (TZS)"].includes(h) ? "right" : "left", color: C.gray400, fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: `1px solid ${C.gray200}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const priceUp = c.previous_price != null ? Number(c.price) >= Number(c.previous_price) : null;
                  const changePct = c.previous_price != null && Number(c.previous_price) !== 0
                    ? ((Number(c.price) - Number(c.previous_price)) / Number(c.previous_price)) * 100 : null;

                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${C.gray100}`, transition: "background 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

                      {/* # */}
                      <td style={{ padding: "14px 18px", color: C.gray400, fontWeight: 600, width: 40 }}>{i + 1}</td>

                      {/* Company Name + Remarks as subtitle */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 700, color: C.text }}>{c.name}</div>
                        {c.remarks && <div style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>{c.remarks}</div>}
                      </td>

                      {/* Previous Price */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        {c.previous_price != null
                          ? <span style={{ color: C.gray500, fontSize: 13 }}>{fmt(c.previous_price)}</span>
                          : <span style={{ color: C.gray400 }}>—</span>}
                      </td>

                      {/* Current Price + movement badge */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                          <span style={{ background: C.greenBg, color: C.green, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                            {fmt(c.price)}
                          </span>
                          {priceUp !== null && changePct !== null && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: priceUp ? C.green : C.red }}>
                              {priceUp ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Last Updated date */}
                      <td style={{ padding: "14px 18px" }}>
                        {c.updated_at
                          ? <div>
                              <div style={{ fontSize: 13, color: C.gray600 }}>{new Date(c.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                              <div style={{ fontSize: 11, color: C.gray400, marginTop: 1 }}>{new Date(c.updated_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
                            </div>
                          : <span style={{ color: C.gray400 }}>—</span>}
                      </td>

                      {/* Actions — ⋯ dropdown */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <ActionMenu actions={[
                          { icon: "💰", label: "Update Price", onClick: () => setUpdateModal({ open: true, company: c }) },
                          { icon: "📈", label: updating === c.id || loadingHistory === c.id ? "Loading..." : "Price History", onClick: () => viewHistory(c) },
                          { icon: "✏️", label: "Edit Details", onClick: () => setFormModal({ open: true, company: c }) },
                          { icon: "🗑️", label: "Delete", danger: true, onClick: () => del(c.id) },
                        ]} />
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
