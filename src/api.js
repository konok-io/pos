/**
 * API Service
 * POS System - Connects to PHP Backend
 */

// API Base URL - Change this to your server URL
const API_BASE = '/api';

/**
 * Get stored token
 */
const getToken = () => localStorage.getItem('pos_token');

/**
 * Set auth token
 */
const setToken = (token) => {
  if (token) {
    localStorage.setItem('pos_token', token);
  } else {
    localStorage.removeItem('pos_token');
  }
};

/**
 * API request wrapper
 */
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
        // Token expired or invalid
        setToken(null);
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

/**
 * Auth API
 */
export const auth = {
  async login(email, password) {
    const data = await api('auth.php', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.success && data.data.token) {
      setToken(data.data.token);
      localStorage.setItem('pos_user', JSON.stringify(data.data.user));
    }
    
    return data;
  },
  
  async logout() {
    try {
      await api('auth.php', { method: 'DELETE' });
    } catch (e) {
      // Ignore errors
    }
    setToken(null);
    localStorage.removeItem('pos_user');
  },
  
  async check() {
    try {
      const data = await api('auth.php');
      return data;
    } catch {
      return { success: false };
    }
  },
  
  getUser() {
    const user = localStorage.getItem('pos_user');
    return user ? JSON.parse(user) : null;
  },
  
  isAuthenticated() {
    return !!getToken();
  },
};

/**
 * Products API
 */
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
    return api('products.php', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },
  
  async update(product) {
    return api('products.php', {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  },
  
  async delete(id) {
    return api(`products.php?id=${id}`, { method: 'DELETE' });
  },
};

/**
 * Customers API
 */
export const customers = {
  async getAll(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await api(`customers.php${query}`);
    return data.success ? data.data : [];
  },
  
  async create(customer) {
    return api('customers.php', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  },
  
  async update(customer) {
    return api('customers.php', {
      method: 'PUT',
      body: JSON.stringify(customer),
    });
  },
  
  async delete(id) {
    return api(`customers.php?id=${id}`, { method: 'DELETE' });
  },
};

/**
 * Sales API
 */
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
    return api('sales.php', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  },
  
  async delete(id) {
    return api(`sales.php?id=${id}`, { method: 'DELETE' });
  },
};

/**
 * Purchases API
 */
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
    return api('purchases.php', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
  },
  
  async delete(id) {
    return api(`purchases.php?id=${id}`, { method: 'DELETE' });
  },
};

/**
 * Suppliers API
 */
export const suppliers = {
  async getAll(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const data = await api(`suppliers.php${query}`);
    return data.success ? data.data : [];
  },
  
  async create(supplier) {
    return api('suppliers.php', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  },
  
  async update(supplier) {
    return api('suppliers.php', {
      method: 'PUT',
      body: JSON.stringify(supplier),
    });
  },
  
  async delete(id) {
    return api(`suppliers.php?id=${id}`, { method: 'DELETE' });
  },
};

/**
 * Categories API
 */
export const categories = {
  async getAll() {
    const data = await api('categories.php');
    return data.success ? data.data : [];
  },
  
  async create(category) {
    return api('categories.php', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  },
  
  async update(category) {
    return api('categories.php', {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  },
  
  async delete(id) {
    return api(`categories.php?id=${id}`, { method: 'DELETE' });
  },
};

/**
 * Expenses API
 */
export const expenses = {
  async getExpenses(from = '', to = '') {
    const params = new URLSearchParams({ type: 'expenses' });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const data = await api(`expenses.php?${params}`);
    return data.success ? data.data : [];
  },
  
  async create(expense) {
    return api('expenses.php?type=expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  },
  
  async delete(id) {
    return api(`expenses.php?type=expenses&id=${id}`, { method: 'DELETE' });
  },
};

/**
 * Incomes API
 */
export const incomes = {
  async getIncomes(from = '', to = '') {
    const params = new URLSearchParams({ type: 'incomes' });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const data = await api(`expenses.php?${params}`);
    return data.success ? data.data : [];
  },
  
  async create(income) {
    return api('expenses.php?type=incomes', {
      method: 'POST',
      body: JSON.stringify(income),
    });
  },
  
  async delete(id) {
    return api(`expenses.php?type=incomes&id=${id}`, { method: 'DELETE' });
  },
};

/**
 * Settings API
 */
export const settings = {
  async get() {
    const data = await api('settings.php');
    return data.success ? data.data : {};
  },
  
  async update(settingsData) {
    return api('settings.php', {
      method: 'POST',
      body: JSON.stringify(settingsData),
    });
  },
};

/**
 * Users API
 */
export const users = {
  async getAll() {
    const data = await api('users.php');
    return data.success ? data.data : [];
  },
  
  async create(user) {
    return api('users.php', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },
  
  async update(user) {
    return api('users.php', {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },
  
  async delete(id) {
    return api(`users.php?id=${id}`, { method: 'DELETE' });
  },
};

// Export API base for direct access
export { API_BASE, api, getToken, setToken };
