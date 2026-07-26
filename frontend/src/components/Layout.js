import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "◈", end: true },
  { to: "/products", label: "Products", icon: "▤" },
  { to: "/customers", label: "Customers", icon: "◐" },
  { to: "/orders", label: "Orders", icon: "▥" },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="shell">
      <button className="menu-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
        <span />
        <span />
        <span />
      </button>

      <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
        <div className="brand">
          <span className="brand-mark">SL</span>
          <div className="brand-text">
            <span className="brand-name">StockLedger</span>
            <span className="brand-sub">Inventory Control</span>
          </div>
        </div>

        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="ledger-line">Ledger v1.0</span>
        </div>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
