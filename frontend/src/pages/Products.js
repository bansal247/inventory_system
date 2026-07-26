import React, { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";

const emptyForm = { name: "", sku: "", price: "", quantity: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setProducts(await api.getProducts());
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({ name: p.name, sku: p.sku, price: String(p.price), quantity: String(p.quantity) });
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (form.price === "" || Number(form.price) < 0) e.price = "Price must be 0 or more";
    if (form.quantity === "" || Number(form.quantity) < 0 || !Number.isInteger(Number(form.quantity)))
      e.quantity = "Quantity must be a whole number ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    if (!validate()) return;
    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };
    try {
      if (editing) {
        await api.updateProduct(editing.id, payload);
        toast("Product updated");
      } else {
        await api.createProduct(payload);
        toast("Product created");
      }
      setModalOpen(false);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteProduct(id);
      toast("Product deleted");
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Catalog</span>
          <h1>Products</h1>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>+ Add Product</button>
      </header>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <section className="panel">
        {loading ? (
          <div className="page-loading">Loading products…</div>
        ) : filtered.length === 0 ? (
          <p className="empty-note">No products found. Add your first product to get started.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="mono">{p.sku}</td>
                    <td className="mono">${p.price.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.quantity === 0 ? "badge--danger" : p.quantity <= 10 ? "badge--warning" : "badge--ok"}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button className="link-btn" onClick={() => openEdit(p)}>Edit</button>
                      <button className="link-btn link-btn--danger" onClick={() => setConfirmDelete(p)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label>Product name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
            <div className="field">
              <label>SKU / code</label>
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              {errors.sku && <span className="field-error">{errors.sku}</span>}
            </div>
            <div className="field-row">
              <div className="field">
                <label>Price ($)</label>
                <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                {errors.price && <span className="field-error">{errors.price}</span>}
              </div>
              <div className="field">
                <label>Quantity in stock</label>
                <input type="number" step="1" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
                {errors.quantity && <span className="field-error">{errors.quantity}</span>}
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary">{editing ? "Save Changes" : "Create Product"}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete product?" onClose={() => setConfirmDelete(null)} width="420px">
          <p className="confirm-text">
            This will permanently remove <strong>{confirmDelete.name}</strong> ({confirmDelete.sku}). This cannot be undone.
          </p>
          <div className="form-actions">
            <button className="btn btn--ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
            <button className="btn btn--danger" onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}