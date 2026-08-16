/**
 * POS System - API Server
 * Uses SQLite at platform-specific data directory
 */

const http = require('http');
const path = require('path');
const fs = require('fs');

// Data directory - use platform-specific path
const isWindows = process.platform === 'win32';
const DATA_DIR = isWindows 
  ? (process.env.LARAGON_ROOT || 'C:\\laragon\\www') + '\\.pos_data'
  : path.join(process.env.HOME || '/tmp', '.pos_data');
const DB_PATH = path.join(DATA_DIR, 'database.sqlite');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  } catch (err) {
    console.error('Failed to create data directory:', err.message);
  }
}

// Initialize SQLite
let db;
try {
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(`
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
  `);
  
  // Initialize defaults
  initDefaults();
  
  console.log('✅ Database initialized at:', DB_PATH);
} catch (err) {
  console.error('❌ Database error:', err.message);
  process.exit(1);
}

function initDefaults() {
  // Default admin user
  const admin = db.prepare('SELECT id FROM users WHERE id = ?').get('super_admin');
  if (!admin) {
    db.prepare('INSERT INTO users (id, name, email, password, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run('super_admin', 'Super Admin', 'admin@konok.io', '@rsm@k@1A', 'super_admin', 'active', new Date().toISOString());
    console.log('✅ Default admin user created');
  }
  
  // Default settings
  const defaultSettings = [
    ['shop_name', 'POS সিস্টেম'], ['name', 'আমার দোকান'], ['address', ''],
    ['phone', ''], ['vat_percent', '15'], ['vatEnabled', 'true'], ['vatPercent', '15']
  ];
  
  for (const [key, value] of defaultSettings) {
    db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)').run(key, value);
  }
}

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 
    'Content-Type': 'application/json', 
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Parse URL params
function getParams(url) {
  const urlObj = new URL(url, 'http://localhost');
  return urlObj.searchParams;
}

// API Routes
async function handleRequest(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }
  
  const url = req.url.split('?')[0];
  const method = req.method;
  const body = method !== 'GET' && method !== 'DELETE' ? await parseBody(req) : {};
  const params = getParams(req.url);
  
  try {
    // Route matching
    if (url === '/api/auth' && method === 'POST') {
      if (body.action === 'login') {
        const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?')
          .get(body.email, body.password);
        if (user) {
          sendJSON(res, { success: true, data: { user: { id: user.id, name: user.name, email: user.email, role: user.role }, authenticated: true } });
        } else {
          sendJSON(res, { success: false, error: 'Invalid credentials' });
        }
      }
    } else if (url === '/api/auth' && method === 'GET') {
      sendJSON(res, { success: true, data: { authenticated: false, user: null } });
    } else if (url === '/api/users' && method === 'GET') {
      const users = db.prepare('SELECT id, name, email, role, status, created_at FROM users').all();
      sendJSON(res, { success: true, data: users });
    } else if (url === '/api/users' && method === 'POST') {
      const id = body.id || `user_${Date.now()}`;
      db.prepare('INSERT OR REPLACE INTO users (id, name, email, password, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, body.name, body.email, body.password || '1234', body.role || 'operator', 'active', new Date().toISOString());
      sendJSON(res, { success: true, data: { id, name: body.name, email: body.email } });
    } else if (url === '/api/categories' && method === 'GET') {
      const categories = db.prepare('SELECT * FROM categories').all();
      sendJSON(res, { success: true, data: categories });
    } else if (url === '/api/categories' && method === 'POST') {
      const id = body.id || `cat_${Date.now()}`;
      db.prepare('INSERT OR REPLACE INTO categories (id, name, company, created_at) VALUES (?, ?, ?, ?)')
        .run(id, body.name, body.company || '', new Date().toISOString());
      sendJSON(res, { success: true, data: { id, name: body.name } });
    } else if (url === '/api/categories' && method === 'DELETE') {
      const id = params.get('id');
      if (id) db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      sendJSON(res, { success: true });
    } else if (url === '/api/products' && method === 'GET') {
      const search = params.get('search') || '';
      let products;
      if (search) {
        products = db.prepare('SELECT * FROM products WHERE LOWER(name) LIKE ? OR LOWER(barcode) LIKE ? ORDER BY name')
          .all(`%${search}%`, `%${search}%`);
      } else {
        products = db.prepare('SELECT * FROM products ORDER BY name').all();
      }
      sendJSON(res, { success: true, data: products });
    } else if (url === '/api/products' && method === 'POST') {
      const id = body.id || `prod_${Date.now()}`;
      db.prepare(`INSERT OR REPLACE INTO products 
        (id, name, barcode, unit, buyP, sellP, stock, minStock, cat, company, mrp, image, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, body.name, body.barcode || '', body.unit || 'পিস', 
             parseFloat(body.buyP) || 0, parseFloat(body.sellP) || 0, parseFloat(body.stock) || 0,
             parseFloat(body.minStock) || 0, body.cat || '', body.company || '',
             parseFloat(body.mrp) || 0, body.image || '', new Date().toISOString());
      sendJSON(res, { success: true, data: { id } });
    } else if (url === '/api/products' && method === 'DELETE') {
      const id = params.get('id');
      if (id) db.prepare('DELETE FROM products WHERE id = ?').run(id);
      sendJSON(res, { success: true });
    } else if (url === '/api/suppliers' && method === 'GET') {
      const suppliers = db.prepare('SELECT * FROM suppliers').all();
      sendJSON(res, { success: true, data: suppliers });
    } else if (url === '/api/suppliers' && method === 'POST') {
      const id = body.id || `sup_${Date.now()}`;
      db.prepare('INSERT OR REPLACE INTO suppliers (id, name, phone, email, address, company, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, body.name, body.phone || '', body.email || '', body.address || '', body.company || '', new Date().toISOString());
      sendJSON(res, { success: true, data: { id } });
    } else if (url === '/api/customers' && method === 'GET') {
      const customers = db.prepare('SELECT * FROM customers').all();
      sendJSON(res, { success: true, data: customers });
    } else if (url === '/api/customers' && method === 'POST') {
      const id = body.id || `cust_${Date.now()}`;
      db.prepare('INSERT OR REPLACE INTO customers (id, name, phone, email, address, balance, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, body.name, body.phone || '', body.email || '', body.address || '', parseFloat(body.balance) || 0, new Date().toISOString());
      sendJSON(res, { success: true, data: { id } });
    } else if (url === '/api/sales' && method === 'GET') {
      const sales = db.prepare('SELECT * FROM sales ORDER BY created_at DESC LIMIT 100').all();
      sendJSON(res, { success: true, data: sales });
    } else if (url === '/api/sales' && method === 'POST') {
      const id = body.id || `sale_${Date.now()}`;
      db.prepare(`INSERT OR REPLACE INTO sales 
        (id, items, subtotal, discount, total, vat, vatRate, paid, due, change, customer_id, payment_method, invoice_number, user_id, user_name, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
             parseFloat(body.subtotal) || 0, parseFloat(body.discount) || 0, parseFloat(body.total) || 0,
             parseFloat(body.vat) || 0, parseFloat(body.vatRate) || 0, parseFloat(body.paid) || 0,
             parseFloat(body.due) || 0, parseFloat(body.change) || 0, body.customer_id || '',
             body.payment_method || 'cash', body.invoice_number || '', body.user_id || '', body.user_name || '', new Date().toISOString());
      sendJSON(res, { success: true, data: { id } });
    } else if (url === '/api/purchases' && method === 'GET') {
      const purchases = db.prepare('SELECT * FROM purchases ORDER BY created_at DESC').all();
      sendJSON(res, { success: true, data: purchases });
    } else if (url === '/api/purchases' && method === 'POST') {
      const id = body.id || `pur_${Date.now()}`;
      db.prepare(`INSERT OR REPLACE INTO purchases 
        (id, items, subtotal, total, paid, due, supplier_id, invoice_number, user_id, user_name, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
             parseFloat(body.subtotal) || 0, parseFloat(body.total) || 0, parseFloat(body.paid) || 0,
             parseFloat(body.due) || 0, body.supplier_id || '', body.invoice_number || '',
             body.user_id || '', body.user_name || '', new Date().toISOString());
      sendJSON(res, { success: true, data: { id } });
    } else if (url === '/api/expenses' && method === 'GET') {
      const expenses = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all();
      sendJSON(res, { success: true, data: expenses });
    } else if (url === '/api/expenses' && method === 'POST') {
      const id = body.id || `exp_${Date.now()}`;
      db.prepare('INSERT OR REPLACE INTO expenses (id, title, amount, type, note, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, body.title, parseFloat(body.amount) || 0, body.type || 'expense', body.note || '',
             body.user_id || '', body.user_name || '', new Date().toISOString());
      sendJSON(res, { success: true, data: { id } });
    } else if (url === '/api/expenses' && method === 'DELETE') {
      const id = params.get('id');
      if (id) db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
      sendJSON(res, { success: true });
    } else if (url === '/api/incomes' && method === 'GET') {
      // Alias for expenses
      const expenses = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all();
      sendJSON(res, { success: true, data: expenses });
    } else if (url === '/api/incomes' && method === 'POST') {
      const id = body.id || `inc_${Date.now()}`;
      db.prepare('INSERT OR REPLACE INTO expenses (id, title, amount, type, note, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(id, body.title, parseFloat(body.amount) || 0, 'income', body.note || '',
             body.user_id || '', body.user_name || '', new Date().toISOString());
      sendJSON(res, { success: true, data: { id } });
    } else if (url === '/api/incomes' && method === 'DELETE') {
      const id = params.get('id');
      if (id) db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
      sendJSON(res, { success: true });
    } else if (url === '/api/settings' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM settings').all();
      const settings = {};
      rows.forEach(row => settings[row.key] = row.value);
      sendJSON(res, { success: true, data: settings });
    } else if (url === '/api/settings' && method === 'POST') {
      for (const [key, value] of Object.entries(body)) {
        db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
      }
      sendJSON(res, { success: true });
    } else if (url === '/api/state' && method === 'GET') {
      sendJSON(res, { success: true, data: {} });
    } else if (url === '/api/state' && method === 'POST') {
      sendJSON(res, { success: true });
    } else {
      sendJSON(res, { success: false, error: 'Not found' }, 404);
    }
  } catch (err) {
    console.error('API Error:', err);
    try {
      sendJSON(res, { success: false, error: err.message || 'Internal server error' }, 500);
    } catch (sendErr) {
      console.error('Failed to send error response:', sendErr);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Internal server error' }));
    }
  }
}

// Create HTTP server
const PORT = 8765;
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n🚀 POS API Server running at http://localhost:${PORT}`);
  console.log(`📁 Database: ${DB_PATH}\n`);
});

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing database...');
  if (db) db.close();
  process.exit(0);
});
