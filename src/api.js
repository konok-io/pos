/**
 * API Service - POS System
 * Works completely offline using IndexedDB
 * No server needed - all data stored locally in browser
 */

import database, { STORES } from './db';

// ============================================================================
// AUTH STATE (managed in memory only, not persisted)
// ============================================================================

let currentUser = null;

export const getToken = () => null;
export const setToken = () => {};
export const getUser = () => currentUser;
export const setUser = (user) => { currentUser = user; };
export const clearAuth = () => { currentUser = null; };

// App State - stored in IndexedDB
export const appState = {
  get: async (key) => {
    const data = await database.get(STORES.settings, key);
    return data?.value || null;
  },
  set: async (key, value) => {
    await database.add(STORES.settings, { key, value });
    return { success: true };
  },
  getAll: async () => {
    const all = await database.getAll(STORES.settings);
    const result = {};
    all.forEach(item => result[item.key] = item.value);
    return result;
  },
};

// ============================================================================
// API WRAPPER (using IndexedDB instead of HTTP)
// ============================================================================

async function api(endpoint, options = {}) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  const url = options.url || '';
  
  try {
    // Route to appropriate handler
    switch (endpoint) {
      case 'auth':
        return await handleAuth(method, body);
      case 'users':
        return await handleUsers(method, body);
      case 'categories':
        return await handleCategories(method, body, url);
      case 'products':
        return await handleProducts(method, body, url);
      case 'suppliers':
        return await handleSuppliers(method, body);
      case 'customers':
        return await handleCustomers(method, body);
      case 'sales':
        return await handleSales(method, body);
      case 'purchases':
        return await handlePurchases(method, body);
      case 'expenses':
        return await handleExpenses(method, body, url);
      case 'settings':
        return await handleSettings(method, body);
      case 'state':
        return await handleState(method, body);
      case 'incomes':
        // Alias for expenses (same storage)
        return await handleExpenses(method, body, url);
      default:
        return { success: false, error: 'Unknown endpoint' };
    }
  } catch (err) {
    console.error('API Error:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================================
// AUTH HANDLERS
// ============================================================================

async function handleAuth(method, body) {
  if (method === 'POST' && body.action === 'login') {
    const users = await database.getAll(STORES.users);
    const user = users.find(u => 
      u.email === body.email && u.password === body.password
    );
    
    if (user) {
      setUser({ id: user.id, name: user.name, email: user.email, role: user.role });
      return {
        success: true,
        data: {
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          authenticated: true
        }
      };
    } else {
      return { success: false, error: 'Invalid credentials' };
    }
  } else if (method === 'GET') {
    const user = getUser();
    return {
      success: true,
      data: { authenticated: !!user, user }
    };
  } else if (method === 'DELETE') {
    clearAuth();
    return { success: true };
  }
  
  return { success: false, error: 'Invalid action' };
}

// ============================================================================
// USERS HANDLERS
// ============================================================================

async function handleUsers(method, body) {
  if (method === 'GET') {
    const users = await database.getAll(STORES.users);
    return {
      success: true,
      data: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        created_at: u.created_at
      }))
    };
  } else if (method === 'POST') {
    const id = body.id || `user_${Date.now()}`;
    const user = {
      id,
      name: body.name,
      email: body.email,
      password: body.password || '1234',
      role: body.role || 'operator',
      status: 'active',
      created_at: new Date().toISOString()
    };
    await database.add(STORES.users, user);
    return { success: true, data: user };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// CATEGORIES HANDLERS
// ============================================================================

async function handleCategories(method, body, url) {
  if (method === 'GET') {
    const categories = await database.getAll(STORES.categories);
    return { success: true, data: categories };
  } else if (method === 'POST') {
    const id = body.id || `cat_${Date.now()}`;
    const category = { id, name: body.name, company: body.company || '', created_at: new Date().toISOString() };
    await database.add(STORES.categories, category);
    return { success: true, data: category };
  } else if (method === 'DELETE') {
    const params = new URL(url, 'http://localhost').searchParams;
    const id = params.get('id');
    if (id) await database.remove(STORES.categories, id);
    return { success: true };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// PRODUCTS HANDLERS
// ============================================================================

async function handleProducts(method, body, url) {
  if (method === 'GET') {
    const params = new URL(url, 'http://localhost').searchParams;
    const search = params.get('search') || '';
    const products = await database.searchProducts(search);
    return { success: true, data: products };
  } else if (method === 'POST') {
    const id = body.id || `prod_${Date.now()}`;
    const product = {
      id,
      name: body.name,
      barcode: body.barcode || '',
      unit: body.unit || 'পিস',
      buyP: parseFloat(body.buyP) || 0,
      sellP: parseFloat(body.sellP) || 0,
      stock: parseFloat(body.stock) || 0,
      minStock: parseFloat(body.minStock) || 0,
      cat: body.cat || '',
      company: body.company || '',
      mrp: parseFloat(body.mrp) || 0,
      image: body.image || '',
      created_at: new Date().toISOString()
    };
    await database.add(STORES.products, product);
    return { success: true, data: product };
  } else if (method === 'DELETE') {
    const params = new URL(url, 'http://localhost').searchParams;
    const id = params.get('id');
    if (id) await database.remove(STORES.products, id);
    return { success: true };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// SUPPLIERS HANDLERS
// ============================================================================

async function handleSuppliers(method, body) {
  if (method === 'GET') {
    const suppliers = await database.getAll(STORES.suppliers);
    return { success: true, data: suppliers };
  } else if (method === 'POST') {
    const id = body.id || `sup_${Date.now()}`;
    const supplier = {
      id,
      name: body.name,
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      company: body.company || '',
      created_at: new Date().toISOString()
    };
    await database.add(STORES.suppliers, supplier);
    return { success: true, data: supplier };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// CUSTOMERS HANDLERS
// ============================================================================

async function handleCustomers(method, body) {
  if (method === 'GET') {
    const customers = await database.getAll(STORES.customers);
    return { success: true, data: customers };
  } else if (method === 'POST') {
    const id = body.id || `cust_${Date.now()}`;
    const customer = {
      id,
      name: body.name,
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      balance: parseFloat(body.balance) || 0,
      created_at: new Date().toISOString()
    };
    await database.add(STORES.customers, customer);
    return { success: true, data: customer };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// SALES HANDLERS
// ============================================================================

async function handleSales(method, body) {
  if (method === 'GET') {
    const sales = await database.getAll(STORES.sales);
    sales.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { success: true, data: sales.slice(0, 100) };
  } else if (method === 'POST') {
    const id = body.id || `sale_${Date.now()}`;
    const sale = {
      id,
      items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
      subtotal: parseFloat(body.subtotal) || 0,
      discount: parseFloat(body.discount) || 0,
      total: parseFloat(body.total) || 0,
      vat: parseFloat(body.vat) || 0,
      vatRate: parseFloat(body.vatRate) || 0,
      paid: parseFloat(body.paid) || 0,
      due: parseFloat(body.due) || 0,
      change: parseFloat(body.change) || 0,
      customer_id: body.customer_id || '',
      payment_method: body.payment_method || 'cash',
      invoice_number: body.invoice_number || '',
      user_id: body.user_id || '',
      user_name: body.user_name || '',
      created_at: new Date().toISOString()
    };
    await database.add(STORES.sales, sale);
    
    // Update product stock
    try {
      const items = typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items;
      for (const item of items) {
        const product = await database.get(STORES.products, item.id);
        if (product) {
          product.stock = Math.max(0, product.stock - item.qty);
          await database.add(STORES.products, product);
        }
      }
    } catch (e) {
      console.error('Error updating stock:', e);
    }
    
    return { success: true, data: sale };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// PURCHASES HANDLERS
// ============================================================================

async function handlePurchases(method, body) {
  if (method === 'GET') {
    const purchases = await database.getAll(STORES.purchases);
    return { success: true, data: purchases };
  } else if (method === 'POST') {
    const id = body.id || `pur_${Date.now()}`;
    const purchase = {
      id,
      items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
      subtotal: parseFloat(body.subtotal) || 0,
      total: parseFloat(body.total) || 0,
      paid: parseFloat(body.paid) || 0,
      due: parseFloat(body.due) || 0,
      supplier_id: body.supplier_id || '',
      invoice_number: body.invoice_number || '',
      user_id: body.user_id || '',
      user_name: body.user_name || '',
      created_at: new Date().toISOString()
    };
    await database.add(STORES.purchases, purchase);
    
    // Update product stock
    try {
      const items = typeof purchase.items === 'string' ? JSON.parse(purchase.items) : purchase.items;
      for (const item of items) {
        const product = await database.get(STORES.products, item.id);
        if (product) {
          product.stock = (product.stock || 0) + (item.qty || 0);
          await database.add(STORES.products, product);
        }
      }
    } catch (e) {
      console.error('Error updating stock:', e);
    }
    
    return { success: true, data: purchase };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// EXPENSES HANDLERS
// ============================================================================

async function handleExpenses(method, body, url) {
  if (method === 'GET') {
    const expenses = await database.getAll(STORES.expenses);
    expenses.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { success: true, data: expenses };
  } else if (method === 'POST') {
    const id = body.id || `exp_${Date.now()}`;
    const expense = {
      id,
      title: body.title,
      amount: parseFloat(body.amount) || 0,
      type: body.type || 'expense',
      note: body.note || '',
      user_id: body.user_id || '',
      user_name: body.user_name || '',
      created_at: new Date().toISOString()
    };
    await database.add(STORES.expenses, expense);
    return { success: true, data: expense };
  } else if (method === 'DELETE') {
    const params = new URL(url, 'http://localhost').searchParams;
    const id = params.get('id');
    if (id) await database.remove(STORES.expenses, id);
    return { success: true };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// SETTINGS HANDLERS
// ============================================================================

async function handleSettings(method, body) {
  if (method === 'GET') {
    const all = await database.getAll(STORES.settings);
    const result = {};
    all.forEach(item => result[item.key] = item.value);
    return { success: true, data: result };
  } else if (method === 'POST') {
    for (const [key, value] of Object.entries(body)) {
      await database.add(STORES.settings, { key, value });
    }
    return { success: true, data: body };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// STATE HANDLERS
// ============================================================================

async function handleState(method, body) {
  if (method === 'GET') {
    return { success: true, data: {} };
  } else if (method === 'POST') {
    return { success: true };
  }
  return { success: false, error: 'Invalid method' };
}

// ============================================================================
// EXPORT API
// ============================================================================

// Wrapper functions for each API endpoint
export const auth = {
  login: (email, password) => api('auth', { method: 'POST', body: JSON.stringify({ action: 'login', email, password }) }),
  check: () => api('auth', { method: 'GET' }),
  logout: () => api('auth', { method: 'DELETE' })
};

export const products = {
  getAll: (search) => api('products', { method: 'GET', url: search ? `?search=${encodeURIComponent(search)}` : '' }),
  create: (data) => api('products', { method: 'POST', body: JSON.stringify(data) }),
  update: (data) => api('products', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => api('products', { method: 'DELETE', url: `?id=${id}` })
};

export const customers = {
  getAll: () => api('customers', { method: 'GET' }),
  create: (data) => api('customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (data) => api('customers', { method: 'POST', body: JSON.stringify(data) })
};

export const sales = {
  getAll: () => api('sales', { method: 'GET' }),
  create: (data) => api('sales', { method: 'POST', body: JSON.stringify(data) })
};

export const purchases = {
  getAll: () => api('purchases', { method: 'GET' }),
  create: (data) => api('purchases', { method: 'POST', body: JSON.stringify(data) })
};

export const suppliers = {
  getAll: () => api('suppliers', { method: 'GET' }),
  create: (data) => api('suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (data) => api('suppliers', { method: 'POST', body: JSON.stringify(data) })
};

export const categories = {
  getAll: () => api('categories', { method: 'GET' }),
  create: (data) => api('categories', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => api('categories', { method: 'DELETE', url: `?id=${id}` })
};

export const expenses = {
  getAll: () => api('expenses', { method: 'GET' }),
  create: (data) => api('expenses', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => api('expenses', { method: 'DELETE', url: `?id=${id}` })
};

export const incomes = {
  getAll: () => api('incomes', { method: 'GET' }),
  create: (data) => api('incomes', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => api('incomes', { method: 'DELETE', url: `?id=${id}` })
};

export const settings = {
  getAll: () => api('settings', { method: 'GET' }),
  save: (data) => api('settings', { method: 'POST', body: JSON.stringify(data) })
};

export const users = {
  getAll: () => api('users', { method: 'GET' }),
  create: (data) => api('users', { method: 'POST', body: JSON.stringify(data) })
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

export default api;
