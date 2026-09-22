const API_URL = '/api';

let authToken = localStorage.getItem('pos_api_token') || '';

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem('pos_api_token', token);
}

export function getToken() {
  return authToken;
}

export function clearToken() {
  authToken = '';
  localStorage.removeItem('pos_api_token');
}

const mapSale = (s: any) => {
  return { ...s, customerId: s.customer_id || '', customerName: s.customer_name || '', invoiceNo: s.invoice_no || '', items: typeof s.items === 'string' ? JSON.parse(s.items) : s.items || [], vatPercent: parseFloat(s.vat_percent) || 0, vatAmount: parseFloat(s.vat_amount) || 0, changeAmount: parseFloat(s.change_amount) || 0, paymentMethod: s.payment_method || 'cash', subtotal: parseFloat(s.subtotal) || 0, discount: parseFloat(s.discount) || 0, total: parseFloat(s.total) || 0, paid: parseFloat(s.paid) || 0, due: parseFloat(s.due) || 0 };
};

const mapCustomer = (c: any) => {
  return { ...c, balance: parseFloat(c.balance) || 0, deposit: parseFloat(c.deposit) || 0, isSystem: c.is_system === 1 || c.is_system === true };
};

const mapProduct = (p: any) => {
  return { ...p, costPrice: parseFloat(p.cost_price) || 0, sellPrice: parseFloat(p.sell_price) || 0, minStock: parseInt(p.min_stock) || 5, categoryId: p.category_id || '', expiryDate: p.expiry_date || '', purchaseId: p.purchase_id || '' };
}

async function request(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Products
  getProducts: () => request('/products').then((d: any) => Array.isArray(d) ? d.map(mapProduct) : d),
  addProduct: (p: any) => request('/products', { method: 'POST', body: JSON.stringify(p) }),
  updateProduct: (id: string, p: any) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  addCategory: (c: any) => request('/categories', { method: 'POST', body: JSON.stringify(c) }),
  updateCategory: (id: string, c: any) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(c) }),
  deleteCategory: (id: string) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  addSupplier: (s: any) => request('/suppliers', { method: 'POST', body: JSON.stringify(s) }),
  addCustomer: (c: any) => request('/customers', { method: 'POST', body: JSON.stringify(c) }),
  updateSupplier: (id: string, s: any) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(s) }),
  deleteSupplier: (id: string) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Stock History
  getStockHistory: () => request('/stock-history'),
  addStockHistory: (h: any) => request('/stock-history', { method: 'POST', body: JSON.stringify(h) }),

  // Price History
  getPriceHistory: () => request('/price-history'),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (s: any) => request('/settings', { method: 'PUT', body: JSON.stringify(s) }),

  // Delete All (for data reset)
  deleteAllProducts: () => request('/products/all', { method: 'DELETE' }),
  deleteAllCategories: () => request('/categories/all', { method: 'DELETE' }),
  deleteAllSuppliers: () => request('/suppliers/all', { method: 'DELETE' }),
  deleteAllSales: () => request('/sales/all', { method: 'DELETE' }),
  deleteAllCustomers: () => request('/customers/all', { method: 'DELETE' }),
  deleteAllPurchases: () => request('/purchases/all', { method: 'DELETE' }),

  // Customers CRUD
  getCustomers: async () => { const data = await request('/customers'); return Array.isArray(data) ? data.map(mapCustomer) : data; },
  getCustomer: async (id: string) => { const data = await request(`/customers/${id}`); return data ? mapCustomer(data) : data; },
  updateCustomer: (id: string, c: any) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(c) }),
  deleteCustomer: (id: string) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Sales
  getSales: async () => { const data = await request('/sales'); return Array.isArray(data) ? data.map(mapSale) : data; },
  getSale: async (id: string) => { const data = await request(`/sales/${id}`); return data ? mapSale(data) : data; },
  addSale: (s: any) => request('/sales', { method: 'POST', body: JSON.stringify(s) }),

  // Purchases
  getPurchases: () => request('/purchases'),
  addPurchase: (p: any) => request('/purchases', { method: 'POST', body: JSON.stringify(p) }),

  // Stock adjust
  adjustStock: (data: any) => request('/stock-adjust', { method: 'POST', body: JSON.stringify(data) }),
};


// === ZATCA Phase 2 API (2026 Official) ===
export const zatcaApi = {
  getConfig: async () => {
    const res = await fetch(`${API_URL}/zatca/config`);
    return res.json();
  },
  saveIdentity: async (data: any) => {
    const res = await fetch(`${API_URL}/zatca/identity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  generateCsr: async () => {
    const res = await fetch(`${API_URL}/zatca/csr`, { method: 'POST' });
    return res.json();
  },
  requestComplianceCsid: async (otp: string) => {
    const res = await fetch(`${API_URL}/zatca/compliance-csid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    });
    return res.json();
  },
  requestProductionCsid: async () => {
    const res = await fetch(`${API_URL}/zatca/production-csid`, { method: 'POST' });
    return res.json();
  },
  renewProductionCsid: async () => {
    const res = await fetch(`${API_URL}/zatca/renew-csid`, { method: 'POST' });
    return res.json();
  },
  submitComplianceInvoice: async (data: any) => {
    const res = await fetch(`${API_URL}/zatca/compliance-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  processInvoice: async (invoice: any) => {
    const res = await fetch(`${API_URL}/zatca/process-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    return res.json();
  },
};
