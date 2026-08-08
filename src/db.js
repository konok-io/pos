/**
 * POS System - Database Layer
 * Uses SQLite at C:\laragon\www\.pos_data
 */

/**
 * SQLite implementation for web server
 */
class SQLiteStore {
  constructor() {
    this.db = null;
    this.dbPath = null;
  }

  async open() {
    const path = require('path');
    const fs = require('fs');
    
    // Data directory: C:\laragon\www\.pos_data
    const dataDir = 'C:\\laragon\\www\\.pos_data';
    this.dbPath = path.join(dataDir, 'database.sqlite');
    
    // Create directory if not exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const Database = require('better-sqlite3');
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

// Auto-select based on environment
let dbInstance = null;

export async function openDB() {
  if (!dbInstance) {
    dbInstance = new SQLiteStore();
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
