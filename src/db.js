/**
 * POS System - API Client (Browser)
 * Makes HTTP requests to local API server
 */

const API_BASE = '/api';

// Auth state (in-memory only)
let currentUser = null;

export const getToken = () => null;
export const setToken = () => {};
export const getUser = () => currentUser;
export const setUser = (user) => { currentUser = user; };
export const clearAuth = () => { currentUser = null; };

// App state
export const appState = {
  get: async (key) => {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    return data.data?.[key] || null;
  },
  set: async (key, value) => {
    await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    });
    return { success: true };
  },
  getAll: async () => {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    return data.data || {};
  },
};

// API wrapper
async function api(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body;
  const url = options.url || '';
  const isArrayEndpoint = ['products', 'customers', 'sales', 'categories', 'suppliers', 'expenses', 'purchases', 'users'].some(e => endpoint.includes(e)) && method === 'GET';

  try {
    let fullUrl = `${API_BASE}/${endpoint}`;
    if (url) fullUrl += url;

    const res = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(body ? { 'Body': JSON.stringify(body) } : {})
      },
      body: ['POST', 'PUT', 'PATCH'].includes(method) ? JSON.stringify(body) : undefined
    });

    const data = await res.json();
    
    // Handle HTTP errors
    if (!res.ok) {
      if (res.status === 401) {
        return isArrayEndpoint ? { success: false, data: [], error: 'Unauthorized' } : { success: false, error: 'Unauthorized' };
      }
      return { success: false, error: data.error || 'Request failed' };
    }
    
    return data;
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, error: err.message };
  }
}

// Auth API
export const auth = {
  login: (email, password) => api('auth', { method: 'POST', body: { action: 'login', email, password } }),
  check: () => api('auth', { method: 'GET' }),
  logout: () => api('auth', { method: 'DELETE' })
};

// Products API
export const products = {
  getAll: (search) => api('products', { method: 'GET', url: search ? `?search=${encodeURIComponent(search)}` : '' }),
  create: (data) => api('products', { method: 'POST', body: data }),
  update: (data) => api('products', { method: 'POST', body: data }),
  delete: (id) => api('products', { method: 'DELETE', url: `?id=${id}` })
};

// Customers API
export const customers = {
  getAll: () => api('customers', { method: 'GET' }),
  create: (data) => api('customers', { method: 'POST', body: data }),
  update: (data) => api('customers', { method: 'POST', body: data })
};

// Sales API
export const sales = {
  getAll: () => api('sales', { method: 'GET' }),
  create: (data) => api('sales', { method: 'POST', body: data })
};

// Purchases API
export const purchases = {
  getAll: () => api('purchases', { method: 'GET' }),
  create: (data) => api('purchases', { method: 'POST', body: data })
};

// Suppliers API
export const suppliers = {
  getAll: () => api('suppliers', { method: 'GET' }),
  create: (data) => api('suppliers', { method: 'POST', body: data }),
  update: (data) => api('suppliers', { method: 'POST', body: data })
};

// Categories API
export const categories = {
  getAll: () => api('categories', { method: 'GET' }),
  create: (data) => api('categories', { method: 'POST', body: data }),
  delete: (id) => api('categories', { method: 'DELETE', url: `?id=${id}` })
};

// Expenses API
export const expenses = {
  getAll: () => api('expenses', { method: 'GET' }),
  create: (data) => api('expenses', { method: 'POST', body: data }),
  delete: (id) => api('expenses', { method: 'DELETE', url: `?id=${id}` })
};

// Incomes API (alias)
export const incomes = {
  getAll: () => api('incomes', { method: 'GET' }),
  create: (data) => api('incomes', { method: 'POST', body: data }),
  delete: (id) => api('incomes', { method: 'DELETE', url: `?id=${id}` })
};

// Settings API
export const settings = {
  getAll: () => api('settings', { method: 'GET' }),
  save: (data) => api('settings', { method: 'POST', body: data })
};

// Users API
export const users = {
  getAll: () => api('users', { method: 'GET' }),
  create: (data) => api('users', { method: 'POST', body: data })
};

// Load all data
export async function loadAllData() {
  const [productsList, customersList, salesList, categoriesList, suppliersList, expensesList, settingsData, usersList] = await Promise.all([
    products.getAll(),
    customers.getAll(),
    sales.getAll(),
    categories.getAll(),
    suppliers.getAll(),
    expenses.getAll(),
    settings.getAll(),
    users.getAll()
  ]);
  
  return {
    products: productsList?.data || [],
    customers: customersList?.data || [],
    sales: salesList?.data || [],
    categories: categoriesList?.data || [],
    suppliers: suppliersList?.data || [],
    expenses: expensesList?.data || [],
    settings: settingsData?.data || {},
    users: usersList?.data || []
  };
}

// STORES constant
export const STORES = {
  users: 'users', categories: 'categories', products: 'products', suppliers: 'suppliers',
  customers: 'customers', sales: 'sales', purchases: 'purchases', expenses: 'expenses',
  settings: 'settings', productHistory: 'productHistory'
};

// Database initialization
export async function openDB() {
  return Promise.resolve();
}

export async function initializeDefaults() {
  // No-op for client
}

export default {
  STORES,
  openDB,
  initializeDefaults,
  appState
};
