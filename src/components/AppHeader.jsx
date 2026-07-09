import React from "react";

import { activeMenuBtn, headerStyle, logoutBtn, menuBtn } from "../styles/uiStyles";

const IconCart = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l2 10h9l2-7H7" /><path d="M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /></svg>
);
const IconList = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12" /><path d="M8 12h12" /><path d="M8 18h12" /><path d="M4 6h.01" /><path d="M4 12h.01" /><path d="M4 18h.01" /></svg>
);
const IconChart = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-8" /></svg>
);
const IconBox = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M4 7.5 12 12l8-4.5" /><path d="M12 12v9" /></svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 19c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4" /><path d="M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /><path d="M20 19c0-1.8-1.2-3.4-3-3.9" /><path d="M15 5.2a3 3 0 0 1 0 5.6" /></svg>
);
const IconAudit = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z" /><path d="M9 12l2 2 4-5" /></svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M13 4h6v16h-6" /></svg>
);

export default function AppHeader({ employeeName, branch, role, isOffline, page, setPage, logout }) {
  const canManageUsers = role === "Admin" || role === "Audit";

  const menuItems = [
    { key: "pos", label: "POS ขายสินค้า", Icon: IconCart },
    { key: "history", label: "รายการขาย", Icon: IconList },
    { key: "summary", label: "สรุปยอดขาย", Icon: IconChart },
    { key: "price", label: "สินค้า", Icon: IconBox },
    ...(canManageUsers ? [{ key: "users", label: "ผู้ใช้งาน", Icon: IconUsers }] : []),
    ...(canManageUsers ? [{ key: "audit", label: "Audit Log", Icon: IconAudit }] : []),
  ];

  return (
    <aside style={headerStyle}>
      <div className="sidebar-brand-block">
        <h1 className="sidebar-title">D Farm Food<br />Retail Co., Ltd.</h1>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(({ Icon, ...item }) => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            style={page === item.key ? activeMenuBtn : menuBtn}
            type="button"
          >
            <Icon />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={isOffline ? "status-dot offline" : "status-dot"}>
          {isOffline ? "ออฟไลน์" : "ออนไลน์"}
        </div>
        <div className="sidebar-user">
          <strong>{employeeName || "User"}</strong>
          <span>{branch || "Branch"} / {role || "Role"}</span>
        </div>
        <button onClick={logout} style={logoutBtn} type="button"><IconLogout /> Logout</button>
      </div>
    </aside>
  );
}
