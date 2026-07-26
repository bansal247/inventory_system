import React, { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";

const emptyForm = { full_name: "", email: "", phone: "" };
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCustomers(await api.getCustomers());
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  }

  function validate() {
    const e = {};

    if (!form.full_name.trim()) {
      e.full_name = "Full name is required";
    }

    if (!emailRe.test(form.email)) {
      e.email = "Enter a valid email address";
    }

    if (!/^\d{10}$/.test(form.phone)) {
      e.phone = "Phone number must be exactly 10 digits";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    if (!validate()) return;
    try {
      await api.createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      toast("Customer added");
      setModalOpen(false);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteCustomer(id);
      toast("Customer deleted");
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Accounts</span>
          <h1>Customers</h1>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>+ Add Customer</button>
      </header>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <section className="panel">
        {loading ? (
          <div className="page-loading">Loading customers…</div>
        ) : filtered.length === 0 ? (
          <p className="empty-note">No customers found. Add your first customer to get started.</p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Full name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>{c.full_name}</td>
                    <td className="mono">{c.email}</td>
                    <td className="mono">{c.phone}</td>
                    <td className="row-actions">
                      <button className="link-btn link-btn--danger" onClick={() => setConfirmDelete(c)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <Modal title="Add Customer" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label>Full name</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              {errors.full_name && <span className="field-error">{errors.full_name}</span>}
            </div>
            <div className="field">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>
            <div className="field">
              <label>Phone number</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onKeyDown={(e) => {
                  if (
                    !/[0-9]/.test(e.key) &&
                    !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary">Add Customer</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <Modal title="Delete customer?" onClose={() => setConfirmDelete(null)} width="420px">
          <p className="confirm-text">
            This will permanently remove <strong>{confirmDelete.full_name}</strong>. This cannot be undone.
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