/**
 * POS System - IndexedDB Database
 * Works completely offline - no server needed!
 */

// Database name and version
const DB_NAME = 'POS_System_DB';
const DB_VERSION = 1;

// Store names
const STORES = {
  users: 'users',
  categories: 'categories',
  products: 'products',
  suppliers: 'suppliers',
  customers: 'customers',
  sales: 'sales',
  purchases: 'purchases',
  expenses: 'expenses',
  settings: 'settings',
  productHistory: 'productHistory',
  license: 'license'
};

let db = null;

// Open database
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // Users store
      if (!database.objectStoreNames.contains(STORES.users)) {
        const store = database.createObjectStore(STORES.users, { keyPath: 'id' });
        store.createIndex('email', 'email', { unique: true });
      }
      
      // Categories store
      if (!database.objectStoreNames.contains(STORES.categories)) {
        database.createObjectStore(STORES.categories, { keyPath: 'id' });
      }
      
      // Products store
      if (!database.objectStoreNames.contains(STORES.products)) {
        const store = database.createObjectStore(STORES.products, { keyPath: 'id' });
        store.createIndex('barcode', 'barcode', { unique: false });
        store.createIndex('cat', 'cat', { unique: false });
      }
      
      // Suppliers store
      if (!database.objectStoreNames.contains(STORES.suppliers)) {
        database.createObjectStore(STORES.suppliers, { keyPath: 'id' });
      }
      
      // Customers store
      if (!database.objectStoreNames.contains(STORES.customers)) {
        database.createObjectStore(STORES.customers, { keyPath: 'id' });
      }
      
      // Sales store
      if (!database.objectStoreNames.contains(STORES.sales)) {
        const store = database.createObjectStore(STORES.sales, { keyPath: 'id' });
        store.createIndex('created_at', 'created_at', { unique: false });
      }
      
      // Purchases store
      if (!database.objectStoreNames.contains(STORES.purchases)) {
        database.createObjectStore(STORES.purchases, { keyPath: 'id' });
      }
      
      // Expenses store
      if (!database.objectStoreNames.contains(STORES.expenses)) {
        database.createObjectStore(STORES.expenses, { keyPath: 'id' });
      }
      
      // Settings store
      if (!database.objectStoreNames.contains(STORES.settings)) {
        database.createObjectStore(STORES.settings, { keyPath: 'key' });
      }
      
      // Product history store
      if (!database.objectStoreNames.contains(STORES.productHistory)) {
        database.createObjectStore(STORES.productHistory, { keyPath: 'id' });
      }
      
      // License store
      if (!database.objectStoreNames.contains(STORES.license)) {
        database.createObjectStore(STORES.license, { keyPath: 'key' });
      }
    };
  });
}

// Generic CRUD operations
async function getAll(storeName) {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function get(storeName, id) {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function add(storeName, data) {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data); // put instead of add for upsert
    request.onsuccess = () => resolve(data);
    request.onerror = () => reject(request.error);
  });
}

async function remove(storeName, id) {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

async function clear(storeName) {
  if (!db) await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

// Search products by name or barcode
async function searchProducts(query) {
  const products = await getAll(STORES.products);
  if (!query) return products;
  const q = query.toLowerCase();
  return products.filter(p => 
    p.name?.toLowerCase().includes(q) || 
    p.barcode?.toLowerCase().includes(q)
  );
}

// Initialize with default data
async function initializeDefaults() {
  await openDB();
  
  // Add default admin user
  const admin = await get(STORES.users, 'super_admin');
  if (!admin) {
    await add(STORES.users, {
      id: 'super_admin',
      name: 'Super Admin',
      email: 'admin@konok.io',
      password: '@rsm@k@1A',
      role: 'super_admin',
      status: 'active',
      created_at: new Date().toISOString()
    });
  }
  
  // Add default settings
  const settings = [
    ['shop_name', 'POS সিস্টেম'],
    ['name', 'আমার দোকান'],
    ['address', ''],
    ['phone', ''],
    ['vat_percent', '15'],
    ['vatEnabled', 'true'],
    ['vatPercent', '15']
  ];
  
  for (const [key, value] of settings) {
    const existing = await get(STORES.settings, key);
    if (!existing) {
      await add(STORES.settings, { key, value });
    }
  }
}

// Export all stores for direct access
export const database = {
  STORES,
  openDB,
  getAll,
  get,
  add,
  remove,
  clear,
  searchProducts,
  initializeDefaults
};

export { STORES };
export default database;
