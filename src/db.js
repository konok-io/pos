/**
 * POS System - Database Layer
 * Uses IndexedDB for browser, SQLite for Electron
 */

// Check if we're in Electron
const isElectron = typeof window !== 'undefined' && window.require;

/**
 * IndexedDB implementation for browser
 */
class IndexedDBStore {
  constructor() {
    this.db = null;
    this.dbName = 'POS_System_DB';
    this.dbVersion = 1;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        const stores = [
          'users', 'categories', 'products', 'suppliers', 
          'customers', 'sales', 'purchases', 'expenses', 
          'settings', 'productHistory', 'license'
        ];
        
        stores.forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            if (name === 'users') {
              const store = db.createObjectStore(name, { keyPath: 'id' });
              store.createIndex('email', 'email', { unique: true });
            } else if (name === 'products') {
              const store = db.createObjectStore(name, { keyPath: 'id' });
              store.createIndex('barcode', 'barcode', { unique: false });
            } else if (name === 'settings' || name === 'license') {
              db.createObjectStore(name, { keyPath: 'key' });
            } else {
              db.createObjectStore(name, { keyPath: 'id' });
            }
          }
        });
      };
    });
  }

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve(data);
      request.onerror = () => reject(request.error);
    });
  }

  async remove(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async searchProducts(query) {
    const products = await this.getAll('products');
    if (!query) return products;
    const q = query.toLowerCase();
    return products.filter(p => 
      p.name?.toLowerCase().includes(q) || 
      p.barcode?.toLowerCase().includes(q)
    );
  }

  async initializeDefaults() {
    const admin = await this.get('users', 'super_admin');
    if (!admin) {
      await this.add('users', {
        id: 'super_admin',
        name: 'Super Admin',
        email: 'admin@konok.io',
        password: '@rsm@k@1A',
        role: 'super_admin',
        status: 'active',
        created_at: new Date().toISOString()
      });
    }
    
    const defaultSettings = [
      ['shop_name', 'POS সিস্টেম'],
      ['name', 'আমার দোকান'],
      ['address', ''],
      ['phone', ''],
      ['vat_percent', '15'],
      ['vatEnabled', 'true'],
      ['vatPercent', '15']
    ];
    
    for (const [key, value] of defaultSettings) {
      const existing = await this.get('settings', key);
      if (!existing) {
        await this.add('settings', { key, value });
      }
    }
  }
}

/**
 * SQLite implementation for Electron (native)
 */
class SQLiteStore {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  async open() {
    const path = require('path');
    const fs = require('fs');
    const { app } = window.require('electron');
    
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'database.sqlite');
    
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    
    const Database = window.require('better-sqlite3');
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL, role TEXT DEFAULT 'operator', status TEXT DEFAULT 'active', created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY, name TEXT, company TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY, name TEXT, barcode TEXT, unit TEXT DEFAULT 'পিস',
        buyP REAL DEFAULT 0, sellP REAL DEFAULT 0, stock REAL DEFAULT 0, minStock REAL DEFAULT 0,
        cat TEXT, company TEXT, mrp REAL DEFAULT 0, image TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS suppliers (
        id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT, address TEXT, company TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT, address TEXT, balance REAL DEFAULT 0, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY, items TEXT, subtotal REAL DEFAULT 0, discount REAL DEFAULT 0, total REAL DEFAULT 0,
        vat REAL DEFAULT 0, vatRate REAL DEFAULT 0, paid REAL DEFAULT 0, due REAL DEFAULT 0, change REAL DEFAULT 0,
        customer_id TEXT, payment_method TEXT DEFAULT 'cash', invoice_number TEXT, user_id TEXT, user_name TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS purchases (
        id TEXT PRIMARY KEY, items TEXT, subtotal REAL DEFAULT 0, total REAL DEFAULT 0,
        paid REAL DEFAULT 0, due REAL DEFAULT 0, supplier_id TEXT, invoice_number TEXT, user_id TEXT, user_name TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY, title TEXT, amount REAL DEFAULT 0, type TEXT DEFAULT 'expense',
        note TEXT, user_id TEXT, user_name TEXT, created_at TEXT
      );
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
      CREATE TABLE IF NOT EXISTS license (
        key TEXT PRIMARY KEY, accepted INTEGER, firstRunDate TEXT, licenseKey TEXT, isLicensed INTEGER, trialDays INTEGER, activatedDate TEXT
      );
    `);
    
    return this.db;
  }

  getAll(storeName) {
    return this.db.prepare(`SELECT * FROM ${storeName}`).all();
  }

  get(storeName, key) {
    return this.db.prepare(`SELECT * FROM ${storeName} WHERE id = ? OR key = ?`).get(key, key);
  }

  add(storeName, data) {
    const keys = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    this.db.prepare(`INSERT OR REPLACE INTO ${storeName} (${keys}) VALUES (${placeholders})`).run(...Object.values(data));
    return data;
  }

  remove(storeName, key) {
    this.db.prepare(`DELETE FROM ${storeName} WHERE id = ? OR key = ?`).run(key, key);
    return true;
  }

  clear(storeName) {
    this.db.prepare(`DELETE FROM ${storeName}`).run();
    return true;
  }

  searchProducts(query) {
    if (!query) return this.db.prepare('SELECT * FROM products ORDER BY name').all();
    return this.db.prepare('SELECT * FROM products WHERE LOWER(name) LIKE ? OR LOWER(barcode) LIKE ?')
      .all(`%${query}%`, `%${query}%`);
  }

  async initializeDefaults() {
    const existing = this.db.prepare('SELECT id FROM users WHERE id = ?').get('super_admin');
    if (!existing) {
      this.db.prepare('INSERT INTO users (id, name, email, password, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run('super_admin', 'Super Admin', 'admin@konok.io', '@rsm@k@1A', 'super_admin', 'active', new Date().toISOString());
    }
    
    const defaultSettings = [
      ['shop_name', 'POS সিস্টেম'], ['name', 'আমার দোকান'], ['address', ''],
      ['phone', ''], ['vat_percent', '15'], ['vatEnabled', 'true'], ['vatPercent', '15']
    ];
    
    for (const [key, value] of defaultSettings) {
      this.db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, value);
    }
  }
}

// Export store types
export { IndexedDBStore, SQLiteStore };

// Auto-select based on environment
let dbInstance = null;

export async function openDB() {
  if (!dbInstance) {
    dbInstance = isElectron ? new SQLiteStore() : new IndexedDBStore();
    await dbInstance.open();
  }
  return dbInstance;
}

export async function getAll(storeName) {
  if (!dbInstance) await openDB();
  return dbInstance.getAll(storeName);
}

export async function get(storeName, key) {
  if (!dbInstance) await openDB();
  return dbInstance.get(storeName, key);
}

export async function add(storeName, data) {
  if (!dbInstance) await openDB();
  return dbInstance.add(storeName, data);
}

export async function remove(storeName, key) {
  if (!dbInstance) await openDB();
  return dbInstance.remove(storeName, key);
}

export async function searchProducts(query) {
  if (!dbInstance) await openDB();
  return dbInstance.searchProducts(query);
}

export async function initializeDefaults() {
  if (!dbInstance) await openDB();
  return dbInstance.initializeDefaults();
}

// STORES constant
export const STORES = {
  users: 'users', categories: 'categories', products: 'products', suppliers: 'suppliers',
  customers: 'customers', sales: 'sales', purchases: 'purchases', expenses: 'expenses',
  settings: 'settings', productHistory: 'productHistory', license: 'license'
};

export default { STORES, openDB, getAll, get, add, remove, searchProducts, initializeDefaults };
