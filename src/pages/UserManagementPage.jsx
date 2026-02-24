// ── src/pages/UserManagementPage.jsx ──────────────────────────────
import { C } from "../components/ui";

export default function UserManagementPage({ role, showToast }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
        <div style={{ fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 8 }}>
          User Management
        </div>
        <div style={{ fontSize: 14, color: C.gray400, lineHeight: 1.6 }}>
          Manage system users and assign roles. Full implementation coming soon.
        </div>
        <div style={{
          marginTop: 20, display: "inline-block",
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 8, padding: "8px 16px",
          fontSize: 12, color: "#16a34a", fontWeight: 600,
        }}>
          🔒 Restricted to Super Admin
        </div>
      </div>
    </div>
  );
}
