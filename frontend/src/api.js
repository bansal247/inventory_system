const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    const detail = data && data.detail ? data.detail : `Request failed (${res.status})`;
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg).join(", ")
      : detail;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Products
  getProducts: () => request("/products"),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (payload) => request("/products", { method: "POST", body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  // Customers
  getCustomers: () => request("/customers"),
  createCustomer: (payload) => request("/customers", { method: "POST", body: JSON.stringify(payload) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),

  // Orders
  getOrders: () => request("/orders"),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (payload) => request("/orders", { method: "POST", body: JSON.stringify(payload) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: "DELETE" }),

  // Dashboard
  getSummary: () => request("/dashboard/summary"),
};
