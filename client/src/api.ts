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

function mapProduct(p: any) {
  return { ...p, costPrice: p.cost_price ?? p.costPrice ?? 0, sellPrice: p.sell_price ?? p.sellPrice ?? 0, minStock: p.min_stock ?? p.minStock ?? 5, categoryId: p.category_id ?? p.categoryId ?? '', expiryDate: p.expiry_date ?? p.expiryDate ?? '', purchaseId: p.purchase_id ?? p.purchaseId ?? '' };
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
    window.location.reload();
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
};
