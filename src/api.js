/**
 * API Service - POS System
 * All business data is stored in SQLite database via PHP API
 * NO localStorage is used - all data comes from the database
 */

// API Base URL
const API_BASE = '/api';

// ============================================================================
// AUTH STORAGE (Session only - not persisted in localStorage)
// ============================================================================

let currentToken = null;
let currentUser = null;

export const getToken = () => currentToken;
export const setToken = (token) => { currentToken = token; };

export const getUser = () => currentUser;
export const setUser = (user) => { currentUser = user; };

export const clearAuth = () => {
  currentToken = null;
  currentUser = null;
};

// ============================================================================
// API REQUEST WRAPPER
// ============================================================================

async function api(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        clearAuth();
        window.location.reload();
      }
      throw new Error(data.error || 'Request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================================================
// AUTH API
// ============================================================================

export const auth = {
  async login(email, password) {
    // Super Admin hardcoded check
    if (email === 'admin@konok.io' && password === '@rsm@k@1A') {
      const superAdmin = { id: 'super-admin', name: 'Super Admin', email: 'admin@konok.io', role: 'super_admin' };
      setUser(superAdmin);
      return { success: true, data: { user: superAdmin } };
    }
    
    const data = await api('auth.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.success && data.data.token) {
      setToken(data.data.token);
      setUser(data.data.user);
    }
    
    return data;
  },
  
  async logout() {
    try {
      await api('auth.php', { method: 'DELETE' });
    } catch (e) {
      // Ignore errors
    }
    clearAuth();
  },
  
  async check() {
    try {
      return await api('auth.php');
    } catch {
      return { success: false };
    }
  },
  
  getUser,
  isAuthenticated: () => !!getToken(),
};

// ============================================================================
// PRODUCTS API
// ============================================================================

export const products = {
  async getAll(search = '', category = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const query = params.toString();
    const data = await api(`products.php${query ? '?' + query : ''}`);
    return data.success ? data.data : [];
  },
  
  async create(product) {
    return await api('products.php', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },
  
  async update(product) {
    return await api('products.php', {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },
  
  async delete(id) {
    return await api(`products.php?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// CUSTOMERS API
// ============================================================================

export const customers = {
  async getAll(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await api(`customers.php${query}`);
    return data.success ? data.data : [];
  },
  
  async create(customer) {
    return await api('customers.php', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },
  
  async update(customer) {
    return await api('customers.php', {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  },
  
  async delete(id) {
    return await api(`customers.php?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// SALES API
// ============================================================================

export const sales = {
  async getAll(date = '', from = '', to = '') {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    const data = await api(`sales.php${query ? '?' + query : ''}`);
    return data.success ? data.data : [];
  },
  
  async create(sale) {
    return await api('sales.php', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  },
  
  async delete(id) {
    return await api(`sales.php?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// PURCHASES API
// ============================================================================

export const purchases = {
  async getAll(from = '', to = '') {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const query = params.toString();
    const data = await api(`purchases.php${query ? '?' + query : ''}`);
    return data.success ? data.data : [];
  },
  
  async create(purchase) {
    return await api('purchases.php', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
  },
  
  async delete(id) {
    return await api(`purchases.php?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// SUPPLIERS API
// ============================================================================

export const suppliers = {
  async getAll(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await api(`suppliers.php${query}`);
    return data.success ? data.data : [];
  },
  
  async create(supplier) {
    return await api('suppliers.php', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  },
  
  async update(supplier) {
    return await api('suppliers.php', {
      method: 'PUT',
      body: JSON.stringify(supplier),
    });
  },
  
  async delete(id) {
    return await api(`suppliers.php?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// CATEGORIES API
// ============================================================================

export const categories = {
  async getAll() {
    const data = await api('categories.php');
    return data.success ? data.data : [];
  },
  
  async create(category) {
    return await api('categories.php', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },
  
  async update(category) {
    return await api('categories.php', {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  },
  
  async delete(id) {
    return await api(`categories.php?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// EXPENSES API
// ============================================================================

export const expenses = {
  async getAll(from = '', to = '') {
    const params = new URLSearchParams({ type: 'expenses' });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const data = await api(`expenses.php?${params}`);
    return data.success ? data.data : [];
  },
  
  async create(expense) {
    return await api('expenses.php?type=expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },
  
  async delete(id) {
    return await api(`expenses.php?type=expenses&id=${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// INCOMES API
// ============================================================================

export const incomes = {
  async getAll(from = '', to = '') {
    const params = new URLSearchParams({ type: 'incomes' });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const data = await api(`expenses.php?${params}`);
    return data.success ? data.data : [];
  },
  
  async create(income) {
    return await api('expenses.php?type=incomes', {
      method: 'POST',
      body: JSON.stringify(income),
    });
  },
  
  async delete(id) {
    return await api(`expenses.php?type=incomes&id=${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// SETTINGS API
// ============================================================================

export const settings = {
  async get() {
    const data = await api('settings.php');
    return data.success ? data.data : {};
  },
  
  async update(settingsData) {
    return await api('settings.php', {
      method: 'POST',
      body: JSON.stringify(settingsData),
    });
  },
};

// ============================================================================
// USERS API
// ============================================================================

export const users = {
  async getAll() {
    const data = await api('users.php');
    return data.success ? data.data : [];
  },
  
  async create(user) {
    return await api('users.php', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },
  
  async update(user) {
    return await api('users.php', {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },
  
  async delete(id) {
    return await api(`users.php?id=${id}`, { method: 'DELETE' });
  },
};

// ============================================================================
// DATA LOADER - Load all initial data from MySQL
// ============================================================================

export async function loadAllData() {
  try {
    const [productsData, customersData, salesData, settingsData, suppliersData, categoriesData] = await Promise.all([
      products.getAll(),
      customers.getAll(),
      sales.getAll(),
      settings.get(),
      suppliers.getAll(),
      categories.getAll(),
    ]);
    
    return {
      products: productsData,
      customers: customersData,
      sales: salesData,
      settings: settingsData,
      suppliers: suppliersData,
      categories: categoriesData,
    };
  } catch (error) {
    console.error('Failed to load data from API:', error);
    throw error;
  }
}

// Export for direct access
export { API_BASE };

