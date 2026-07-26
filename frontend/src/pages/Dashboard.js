import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getSummary();
      setSummary(data);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="page-loading">Loading dashboard…</div>;
  if (!summary) return null;

  const stats = [
    { label: "Total Products", value: summary.total_products, note: "SKUs tracked", accent: "amber" },
    { label: "Total Customers", value: summary.total_customers, note: "accounts on file", accent: "teal" },
    { label: "Total Orders", value: summary.total_orders, note: "orders processed", accent: "rose" },
    { label: "Low Stock Alerts", value: summary.low_stock_products.length, note: "≤ 10 units left", accent: "amber" },
  ];

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Dashboard</h1>
        </div>
      </header>

      <section className="stat-grid">
        {stats.map((s) => (
          <div className={`stat-card stat-card--${s.accent}`} key={s.label}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
            <span className="stat-note">{s.note}</span>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Low Stock Products</h2>
          <span className="panel-subtitle">Items at or below the 10-unit threshold</span>
        </div>
        {summary.low_stock_products.length === 0 ? (
          <p className="empty-note">All products are sufficiently stocked.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {summary.low_stock_products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="mono">{p.sku}</td>
                    <td className="mono">${p.price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.quantity === 0 ? "badge--danger" : "badge--warning"}`}>
                        {p.quantity} left
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}