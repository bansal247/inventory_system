import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ product_id: "", quantity: 1 }]);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [o, c, p] = await Promise.all([api.getOrders(), api.getCustomers(), api.getProducts()]);
      setOrders(o);
      setCustomers(c);
      setProducts(p);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setCustomerId("");
    setLines([{ product_id: "", quantity: 1 }]);
    setFormError("");
    setModalOpen(true);
  }

  function updateLine(idx, field, value) {
    setLines((ls) => ls.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  }

  function addLine() {
    setLines((ls) => [...ls, { product_id: "", quantity: 1 }]);
  }

  function removeLine(idx) {
    setLines((ls) => ls.filter((_, i) => i !== idx));
  }

  const estimatedTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const product = products.find((p) => p.id === Number(l.product_id));
      if (!product) return sum;
      return sum + product.price * Number(l.quantity || 0);
    }, 0);
  }, [lines, products]);

  async function handleSubmit(evt) {
    evt.preventDefault();
    setFormError("");

    if (!customerId) {
      setFormError("Please select a customer.");
      return;
    }
    const validLines = lines.filter((l) => l.product_id);
    if (validLines.length === 0) {
      setFormError("Add at least one product line.");
      return;
    }
    for (const l of validLines) {
      if (!l.quantity || Number(l.quantity) <= 0) {
        setFormError("Every line must have a quantity greater than 0.");
        return;
      }
    }

    try {
      await api.createOrder({
        customer_id: Number(customerId),
        items: validLines.map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) })),
      });
      toast("Order created");
      setModalOpen(false);
      load();
    } catch (e) {
      setFormError(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteOrder(id);
      toast("Order cancelled and stock restored");
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Fulfillment</span>
          <h1>Orders</h1>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>+ New Order</button>
      </header>

      <section className="panel">
        {loading ? (
          <div className="page-loading">Loading orders…</div>
        ) : orders.length === 0 ? (
          <p className="empty-note">No orders yet. Create your first order to get started.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">#{String(o.id).padStart(4, "0")}</td>
                    <td>{o.customer ? o.customer.full_name : `Customer ${o.customer_id}`}</td>
                    <td>{o.items.length} item{o.items.length !== 1 ? "s" : ""}</td>
                    <td className="mono">${o.total_amount.toFixed(2)}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="row-actions">
                      <button className="link-btn" onClick={() => setViewOrder(o)}>View</button>
                      <button className="link-btn link-btn--danger" onClick={() => setConfirmDelete(o)}>Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <Modal title="New Order" onClose={() => setModalOpen(false)} width="620px">
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label>Customer</label>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Select a customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Order items</label>
              {lines.map((line, idx) => {
                const product = products.find((p) => p.id === Number(line.product_id));
                return (
                  <div className="order-line" key={idx}>
                    <select value={line.product_id} onChange={(e) => updateLine(idx, "product_id", e.target.value)}>
                      <option value="">Select product…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                          {p.name} ({p.sku}) — {p.quantity} in stock
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      max={product ? product.quantity : undefined}
                      value={line.quantity}
                      onChange={(e) => updateLine(idx, "quantity", e.target.value)}
                    />
                    <span className="line-subtotal mono">
                      {product ? `$${(product.price * Number(line.quantity || 0)).toFixed(2)}` : "—"}
                    </span>
                    <button type="button" className="icon-btn" onClick={() => removeLine(idx)} disabled={lines.length === 1}>✕</button>
                  </div>
                );
              })}
              <button type="button" className="btn btn--ghost btn--small" onClick={addLine}>+ Add another item</button>
            </div>

            {formError && <span className="field-error">{formError}</span>}

            <div className="order-total">
              <span>Estimated total</span>
              <span className="mono">${estimatedTotal.toFixed(2)}</span>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary">Create Order</button>
            </div>
          </form>
        </Modal>
      )}

      {viewOrder && (
        <Modal title={`Order #${String(viewOrder.id).padStart(4, "0")}`} onClose={() => setViewOrder(null)} width="560px">
          <div className="order-detail">
            <div className="order-detail-row">
              <span>Customer</span>
              <strong>{viewOrder.customer ? viewOrder.customer.full_name : viewOrder.customer_id}</strong>
            </div>
            <div className="order-detail-row">
              <span>Email</span>
              <strong>{viewOrder.customer ? viewOrder.customer.email : "—"}</strong>
            </div>
            <div className="order-detail-row">
              <span>Placed on</span>
              <strong>{new Date(viewOrder.created_at).toLocaleString()}</strong>
            </div>
            <div className="table-scroll">
              <table className="table table--compact">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewOrder.items.map((it) => (
                    <tr key={it.id}>
                      <td>{it.product ? it.product.name : `#${it.product_id}`}</td>
                      <td>{it.quantity}</td>
                      <td className="mono">${it.unit_price.toFixed(2)}</td>
                      <td className="mono">${it.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="order-total">
              <span>Total</span>
              <span className="mono">${viewOrder.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Cancel order?" onClose={() => setConfirmDelete(null)} width="420px">
          <p className="confirm-text">
            Cancelling order <strong>#{String(confirmDelete.id).padStart(4, "0")}</strong> will restore the reserved stock. This cannot be undone.
          </p>
          <div className="form-actions">
            <button className="btn btn--ghost" onClick={() => setConfirmDelete(null)}>Keep Order</button>
            <button className="btn btn--danger" onClick={() => handleDelete(confirmDelete.id)}>Cancel Order</button>
          </div>
        </Modal>
      )}
    </div>
  );
}