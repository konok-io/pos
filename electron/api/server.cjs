/**
 * POS System API Server
 * Pure Node.js + SQLite - No PHP Required!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

let DB_PATH;
let db = null;

function getDBPath() {
  if (!DB_PATH) {
    const { app } = require('electron');
    const userDataPath = app.getPath('userData');
    DB_PATH = path.join(userDataPath, 'database.sqlite');
  }
  return DB_PATH;
}

function initDB() {
  const Database = require('better-sqlite3');
  const dbPath = getDBPath();

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

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
      unit TEXT DEFAULT 'pcs',
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
      type TEXT DEFAULT 'expense',
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

    CREATE TABLE IF NOT EXISTS auth_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT,
      user_email TEXT,
      user_role TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const defaultSettings = [
    ['shop_name', 'POS System'],
    ['address', ''],
    ['phone', ''],
    ['vat_percent', '15'],
    ['name', 'My Shop'],
    ['vatEnabled', 'true'],
    ['vatPercent', '15']
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)');
  defaultSettings.forEach(([key, value]) => insertSetting.run(key, value));

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

function generateToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

function json(res, data, error = null, code = 200) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify({ success: error === null, data, error }, null, 2));
}

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

function getToken(cookieHeader) {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=');
    if (name === 'pos_auth_token') return value;
  }
  return null;
}

function handleRoute(req, res) {
  const url = new URL(req.url, 'http://localhost:8765');
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const token = getToken(req.headers.cookie);

  if (pathname === '/api/auth' && req.method === 'POST') {
    handleAuth(req, res, token);
  } else if (pathname === '/api/auth' && req.method === 'GET') {
    handleAuthCheck(req, res, token);
  } else if (pathname === '/api/auth' && req.method === 'DELETE') {
    handleLogout(req, res, token);
  } else if (pathname.match(/^\/api\//)) {
    handleAPI(req, res, token, pathname);
  } else {
    let filePath = pathname;
    
    if (filePath === '/') {
      filePath = '/src/index.html';
    }
    
    const distPath = path.join(__dirname, '..', '..', 'dist', filePath);

    if (fs.existsSync(distPath) && fs.statSync(distPath).isFile()) {
      const ext = path.extname(filePath);
      const contentTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.ttf': 'font/truetype',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
      };
      res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
      fs.createReadStream(distPath).pipe(res);
    } else {
      const indexPath = path.join(__dirname, '..', '..', 'dist', 'src', 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    }
  }
}

async function handleAuth(req, res, existingToken) {
  const body = await parseBody(req);
  const action = body.action;

  if (action === 'login') {
    const { email, password } = body;
    const db = getDB();

    if (email === 'admin@konok.io' && password === '@rsm@k@1A') {
      const userData = { id: 'super-admin', name: 'Super Admin', email: 'admin@konok.io', role: 'super_admin' };
      const newToken = generateToken();

      db.prepare('INSERT OR REPLACE INTO auth_tokens (token, user_id, user_name, user_email, user_role, expires_at) VALUES (?, ?, ?, ?, ?, datetime("now", "+30 days"))').run(
        newToken, userData.id, userData.name, userData.email, userData.role
      );

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `pos_auth_token=${newToken}; Path=/; HttpOnly; SameSite=Lax`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      });
      res.end(JSON.stringify({ success: true, data: { user: userData, authenticated: true } }));
      return;
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (user) {
      const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
      const newToken = generateToken();

      db.prepare('INSERT OR REPLACE INTO auth_tokens (token, user_id, user_name, user_email, user_role, expires_at) VALUES (?, ?, ?, ?, ?, datetime("now", "+30 days"))').run(
        newToken, user.id, user.name, user.email, user.role
      );

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `pos_auth_token=${newToken}; Path=/; HttpOnly; SameSite=Lax`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      });
      res.end(JSON.stringify({ success: true, data: { user: userData, authenticated: true } }));
    } else {
      json(res, null, 'Invalid credentials', 401);
    }
  } else {
    json(res, null, 'Invalid action');
  }
}

function handleAuthCheck(req, res, token) {
  if (!token) {
    json(res, { authenticated: false, user: null });
    return;
  }

  const db = getDB();
  const authRow = db.prepare('SELECT * FROM auth_tokens WHERE token = ? AND expires_at > datetime("now")').get(token);

  if (authRow) {
    json(res, {
      authenticated: true,
      user: {
        id: authRow.user_id,
        name: authRow.user_name,
        email: authRow.user_email,
        role: authRow.user_role
      }
    });
  } else {
    json(res, { authenticated: false, user: null });
  }
}

function handleLogout(req, res, token) {
  if (token) {
    const db = getDB();
    db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
  }
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Set-Cookie': 'pos_auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true'
  });
  res.end(JSON.stringify({ success: true }));
}

function getAuthUser(token) {
  if (!token) return null;
  const db = getDB();
  const authRow = db.prepare('SELECT * FROM auth_tokens WHERE token = ? AND expires_at > datetime("now")').get(token);
  if (!authRow) return null;
  return {
    id: authRow.user_id,
    name: authRow.user_name,
    email: authRow.user_email,
    role: authRow.user_role
  };
}

async function handleAPI(req, res, token, pathname) {
  const db = getDB();
  const endpoint = pathname.replace('/api/', '').replace('.php', '');
  const method = req.method;
  const user = getAuthUser(token);

  if (!user && !['products', 'categories', 'customers', 'suppliers', 'sales'].includes(endpoint)) {
    json(res, null, 'Authentication required', 401);
    return;
  }

  try {
    let result;

    switch (endpoint) {
      case 'users':
        if (method === 'GET') {
          if (user && user.role === 'super_admin') {
            result = db.prepare('SELECT id, name, email, role, status, created_at FROM users').all();
          } else if (user) {
            result = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE role != "super_admin"').all();
          }
        } else if (method === 'POST' && user && user.role === 'super_admin') {
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
        }
        break;

      case 'products':
        if (method === 'GET') {
          const search = new URL(req.url, 'http://localhost:8765').searchParams.get('search') || '';
          if (search) {
            result = db.prepare('SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? ORDER BY name').all('%' + search + '%', '%' + search + '%');
          } else {
            result = db.prepare('SELECT * FROM products ORDER BY name').all();
          }
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = body.id || 'prod_' + Date.now();
          db.prepare('INSERT OR REPLACE INTO products (id, name, barcode, unit, buyP, sellP, stock, minStock, cat, company, mrp, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
            id, body.name, body.barcode || '', body.unit || 'pcs', body.buyP || 0, body.sellP || 0,
            body.stock || 0, body.minStock || 0, body.cat || '', body.company || '', body.mrp || 0, body.image || ''
          );
          result = { id, ...body };
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
          db.prepare('INSERT INTO sales (id, items, subtotal, discount, total, vat, vatRate, paid, due, change, customer_id, payment_method, invoice_number, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
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
            db.prepare('INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, datetime("now"))').run(key, String(value));
          }
          result = body;
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

function start(port = 8765) {
  initDB();

  const server = http.createServer(handleRoute);

  const io = new Server(server, {
    cors: { origin: '*', credentials: true }
  });

  io.on('connection', (socket) => {
    console.log('Client connected');
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      console.log('POS API Server running on port ' + port);
      resolve(port);
    });
  });
}

module.exports = { start, getDB };
