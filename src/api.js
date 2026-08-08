/**
 * API Service - POS System
 * All data is stored in SQLite database via Node.js API
 * Session management is handled server-side
 */

// API Base URL - point to local API server
const API_BASE = '/api';

// ============================================================================
// AUTH STATE (managed in memory only, not persisted)
// ============================================================================

let currentUser = null;

export const getToken = () => null;
export const setToken = () => {};
export const getUser = () => currentUser;
export const setUser = (user) => { currentUser = user; };
export const clearAuth = () => { currentUser = null; };

// App State - stored in SQLite
export const appState = {
  get: async (key) => {
    const data = await api('state.php');
    return data.data?.[key] || null;
  },
  set: async (key, value) => {
    return await api('state.php', {
      method: 'POST',
      body: JSON.stringify({ [key]: value }),
    });
  },
  getAll: async () => {
    return await api('state.php');
  },
};

// ============================================================================
// API REQUEST WRAPPER
// ============================================================================

async function api(endpoint, options = {}) {
  const url = `${API_BASE}/${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
    
    const text = await response.text();
    
    console.log('API Request:', options.method || 'GET', url);
    
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON response from:', url);
      console.error('Response text:', text.substring(0, 500));
      throw new Error('Invalid JSON response from server');
    }
    
    if (!response.ok) {
      console.error('API Error Response:', data);
      if (response.status === 401) {
        clearAuth();
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      throw new Error(data.error || data.message || 'Request failed');
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
    try {
      const data = await api('auth.php', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (data.success && data.data?.user) {
        setUser(data.data.user);
      }
      
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
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
      const data = await api('auth.php');
      
      // Handle response with authenticated flag
      if (data.success) {
        if (data.data?.authenticated === true && data.data?.user) {
          setUser(data.data.user);
          return { success: true, authenticated: true, user: data.data.user };
        } else if (data.data?.authenticated === false) {
          return { success: true, authenticated: false };
        } else if (data.data?.user) {
          setUser(data.data.user);
          return { success: true, authenticated: true, user: data.data.user };
        }
      }
      return { success: true, authenticated: false };
    } catch (error) {
      console.error('Auth check failed:', error);
      return { success: false, authenticated: false };
    }
  },
  
  getUser,
  isAuthenticated: () => currentUser !== null,
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
    // API returns array directly in data field
    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
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
    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
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
    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
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
    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
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
    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
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
    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
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
    if (data.success && data.data?.items) {
      return data.data.items;
    }
    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
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
    if (data.success && data.data?.items) {
      return data.data.items;
    }
    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
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
    if (data.success) {
      return data.data || {};
    }
    return {};
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
    if (data.success) {
      return Array.isArray(data.data) ? data.data : [];
    }
    return [];
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
// DATA LOADER - Load all initial data from SQLite
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

