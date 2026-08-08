/**
 * POS System API Server
 * Pure Node.js + SQLite - No PHP Required!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

// Database path
let DB_PATH;
let db = null;

function getDBPath() {
  if (!DB_PATH) {
    const app = require('electron').app || require('electron').remote?.app;
    const userDataPath = app?.getPath?.('userData') || process.cwd();
    DB_PATH = path.join(userDataPath, 'database.sqlite');
  }
  return DB_PATH;
}

// Session storage
const sessions = new Map();

// Initialize SQLite
function initDB() {
  const Database = require('better-sqlite3');
  const dbPath = getDBPath();
  
  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'operator',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      company TEXT,
      cr_number TEXT,
      vat_number TEXT,
      code TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT,
      unit TEXT DEFAULT 'পিস',
      buyP REAL DEFAULT 0,
      sellP REAL DEFAULT 0,
      stock REAL DEFAULT 0,
      minStock REAL DEFAULT 0,
      cat TEXT,
      company TEXT,
      mrp REAL DEFAULT 0,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_history (
      id TEXT PRIMARY KEY,
      product_id TEXT,
      product_name TEXT,
      type TEXT,
      quantity INTEGER DEFAULT 0,
      stock_before INTEGER DEFAULT 0,
      stock_after INTEGER DEFAULT 0,
      note TEXT,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      items TEXT NOT NULL,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      vat REAL DEFAULT 0,
      vatRate REAL DEFAULT 0,
      paid REAL NOT NULL,
      due REAL DEFAULT 0,
      change REAL DEFAULT 0,
      customer_id TEXT,
      payment_method TEXT DEFAULT 'cash',
      invoice_number TEXT,
      user_id TEXT,
      user_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      items TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      paid REAL NOT NULL DEFAULT 0,
      due REAL NOT NULL DEFAULT 0,
      supplier_id TEXT,
      invoice_number TEXT,
      user_id TEXT,
      user_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT DEFAULT 'expenses',
      note TEXT,
      user_id TEXT,
      user_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      setting_key TEXT PRIMARY KEY,
      setting_value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );
  `);

  // Insert default data
  const defaultSettings = [
    ['shop_name', 'POS সিস্টেম'],
    ['address', ''],
    ['phone', ''],
    ['vat_percent', '15'],
    ['name', 'আমার দোকান'],
    ['vatEnabled', 'true'],
    ['vatPercent', '15']
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)');
  defaultSettings.forEach(([key, value]) => insertSetting.run(key, value));

  // Insert default admin
  db.prepare('INSERT OR IGNORE INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
    'super_admin', 'Super Admin', 'admin@konok.io', '@rsm@k@1A', 'super_admin'
  );

  return db;
}

function getDB() {
  if (!db) {
    initDB();
  }
  return db;
}

// Session management
function createSession(userId, userData) {
  const sessionId = 'sess_' + Math.random().toString(36).substr(2, 32);
  sessions.set(sessionId, {
    userId,
    user: userData,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000 // 24 hours
  });
  return sessionId;
}

function getSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session && session.expiresAt > Date.now()) {
    return session;
  }
  sessions.delete(sessionId);
  return null;
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

// Response helpers
function json(res, data, error = null, code = 200) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  
  const response = {
    success: error === null,
    data,
    error,
    timestamp: new Date().toISOString()
  };
  
  res.end(JSON.stringify(response, null, 2));
}

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Route handler
function handleRoute(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }
  
  // Parse session from cookie
  const cookies = req.headers.cookie || '';
  const sessionId = cookies.split(';').find(c => c.trim().startsWith('session_id='))?.split('=')[1];
  const session = sessionId ? getSession(sessionId) : null;
  
  // Route handling
  if (pathname === '/api/auth' && req.method === 'POST') {
    handleAuth(req, res, session);
  } else if (pathname === '/api/auth' && req.method === 'GET') {
    handleAuthCheck(req, res, session);
  } else if (pathname === '/api/auth' && req.method === 'DELETE') {
    handleLogout(req, res, session);
  } else if (pathname.match(/^\/api\//)) {
    handleAPI(req, res, session, pathname);
  } else {
    // Serve static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    const distPath = path.join(__dirname, '..', '..', 'dist', filePath);
    
    if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon'
      };
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
      fs.createReadStream(distPath).pipe(res);
    } else {
      // SPA fallback - serve index.html
      const indexPath = path.join(__dirname, '..', '..', 'dist', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        json(res, null, 'Not found', 404);
      }
    }
  }
}

// Auth endpoints
async function handleAuth(req, res, session) {
  const body = await parseBody(req);
  const action = body.action;
  
  if (action === 'login') {
    const { email, password } = body;
    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    
    if (user) {
      const sid = createSession(user.id, { id: user.id, name: user.name, email: user.email, role: user.role });
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_id=${sid}; Path=/; HttpOnly`
      });
      json(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, authenticated: true });
    } else {
      json(res, null, 'Invalid credentials', 401);
    }
  } else {
    json(res, null, 'Invalid action');
  }
}

function handleAuthCheck(req, res, session) {
  if (session) {
    json(res, { authenticated: true, user: session.user });
  } else {
    json(res, { authenticated: false, user: null });
  }
}

function handleLogout(req, res, session) {
  const cookies = req.headers.cookie || '';
  const sessionId = cookies.split(';').find(c => c.trim().startsWith('session_id='))?.split('=')[1];
  if (sessionId) deleteSession(sessionId);
  json(res, { success: true });
}

// Generic API handler
async function handleAPI(req, res, session, pathname) {
  const db = getDB();
  const endpoint = pathname.replace('/api/', '').replace('.php', '');
  const method = req.method;
  
  try {
    let result;
    
    switch (endpoint) {
      case 'users':
        if (method === 'GET') {
          result = db.prepare('SELECT id, name, email, role, status, created_at FROM users').all();
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'user_' + Date.now();
          db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
            id, body.name, body.email, body.password || '1234', body.role || 'operator'
          );
          result = { id, ...body };
        }
        break;
        
      case 'categories':
        if (method === 'GET') {
          result = db.prepare('SELECT * FROM categories ORDER BY name').all();
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'cat_' + Date.now();
          db.prepare('INSERT INTO categories (id, name, company) VALUES (?, ?, ?)').run(id, body.name, body.company || '');
          result = { id, ...body };
        } else if (method === 'DELETE') {
          const id = new URL(req.url, 'http://localhost').searchParams.get('id');
          db.prepare('DELETE FROM categories WHERE id = ?').run(id);
          result = { success: true };
        }
        break;
        
      case 'products':
        if (method === 'GET') {
          const search = new URL(req.url, 'http://localhost').searchParams.get('search') || '';
          if (search) {
            result = db.prepare('SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? ORDER BY name').all(`%${search}%`, `%${search}%`);
          } else {
            result = db.prepare('SELECT * FROM products ORDER BY name').all();
          }
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = body.id || 'prod_' + Date.now();
          db.prepare(`INSERT OR REPLACE INTO products 
            (id, name, barcode, unit, buyP, sellP, stock, minStock, cat, company, mrp, image) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
            id, body.name, body.barcode || '', body.unit || 'পিস', body.buyP || 0, body.sellP || 0,
            body.stock || 0, body.minStock || 0, body.cat || '', body.company || '', body.mrp || 0, body.image || ''
          );
          result = { id, ...body };
        } else if (method === 'DELETE') {
          const id = new URL(req.url, 'http://localhost').searchParams.get('id');
          db.prepare('DELETE FROM products WHERE id = ?').run(id);
          result = { success: true };
        }
        break;
        
      case 'suppliers':
        if (method === 'GET') {
          result = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'sup_' + Date.now();
          db.prepare('INSERT INTO suppliers (id, name, phone, email, address, company) VALUES (?, ?, ?, ?, ?, ?)').run(
            id, body.name, body.phone || '', body.email || '', body.address || '', body.company || ''
          );
          result = { id, ...body };
        }
        break;
        
      case 'customers':
        if (method === 'GET') {
          result = db.prepare('SELECT * FROM customers ORDER BY name').all();
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'cust_' + Date.now();
          db.prepare('INSERT INTO customers (id, name, phone, email, address, balance) VALUES (?, ?, ?, ?, ?, ?)').run(
            id, body.name, body.phone || '', body.email || '', body.address || '', body.balance || 0
          );
          result = { id, ...body };
        }
        break;
        
      case 'sales':
        if (method === 'GET') {
          result = db.prepare('SELECT * FROM sales ORDER BY created_at DESC LIMIT 100').all();
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'sale_' + Date.now();
          db.prepare(`INSERT INTO sales 
            (id, items, subtotal, discount, total, vat, vatRate, paid, due, change, customer_id, payment_method, invoice_number, user_id, user_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
            id, JSON.stringify(body.items), body.subtotal || 0, body.discount || 0, body.total || 0,
            body.vat || 0, body.vatRate || 0, body.paid || 0, body.due || 0, body.change || 0,
            body.customer_id || '', body.payment_method || 'cash', body.invoice_number || '',
            body.user_id || '', body.user_name || ''
          );
          result = { id, ...body };
        }
        break;
        
      case 'expenses':
        if (method === 'GET') {
          result = db.prepare('SELECT * FROM expenses ORDER BY created_at DESC').all();
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'exp_' + Date.now();
          db.prepare('INSERT INTO expenses (id, title, amount, type, note, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
            id, body.title, body.amount, body.type || 'expense', body.note || '', body.user_id || '', body.user_name || ''
          );
          result = { id, ...body };
        }
        break;
        
      case 'settings':
        if (method === 'GET') {
          const rows = db.prepare('SELECT setting_key, setting_value FROM settings').all();
          result = {};
          rows.forEach(row => result[row.setting_key] = row.setting_value);
        } else if (method === 'POST') {
          const body = await parseBody(req);
          for (const [key, value] of Object.entries(body)) {
            db.prepare('INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)').run(key, value);
          }
          result = body;
        }
        break;
        
      case 'state':
        if (method === 'GET') {
          result = {};
        } else if (method === 'POST') {
          result = { success: true };
        }
        break;
        
      default:
        result = { message: 'API endpoint: ' + endpoint };
    }
    
    json(res, result);
  } catch (err) {
    console.error('API Error:', err);
    json(res, null, err.message, 500);
  }
}

// Start server
function start(port = 8765) {
  initDB();
  
  const server = http.createServer(handleRoute);
  
  // Setup Socket.IO
  const io = new Server(server, {
    cors: { origin: '*' }
  });
  
  io.on('connection', (socket) => {
    console.log('Client connected');
  });
  
  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`POS API Server running on port ${port}`);
      resolve(port);
    });
  });
}

module.exports = { start, getDB };
