/**
 * POS System API Server
 * Simple JSON File Storage - No Native Modules!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

let DATA_DIR;
let db = null;

function getDataDir() {
  if (!DATA_DIR) {
    const { app } = require('electron');
    DATA_DIR = app.getPath('userData');
  }
  return DATA_DIR;
}

function getDBPath() {
  return path.join(getDataDir(), 'data.json');
}

function initDB() {
  const dbPath = getDBPath();
  const dir = path.dirname(dbPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(dbPath)) {
    const defaultData = {
      users: [{
        id: 'super_admin',
        name: 'Super Admin',
        email: 'admin@konok.io',
        password: '@rsm@k@1A',
        role: 'super_admin',
        status: 'active'
      }],
      categories: [],
      suppliers: [],
      products: [],
      customers: [],
      sales: [],
      purchases: [],
      expenses: [],
      settings: {
        shop_name: 'POS System',
        name: 'My Shop',
        vatEnabled: 'true',
        vatPercent: '15'
      },
      auth_tokens: []
    };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
  }

  const content = fs.readFileSync(dbPath, 'utf8');
  db = JSON.parse(content);
  return db;
}

function saveDB() {
  const dbPath = getDBPath();
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
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
  res.end(JSON.stringify({ success: error === null, data, error }));
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
    const data = getDB();

    // Check super admin
    if (email === 'admin@konok.io' && password === '@rsm@k@1A') {
      const userData = { id: 'super-admin', name: 'Super Admin', email: 'admin@konok.io', role: 'super_admin' };
      const newToken = generateToken();
      
      // Clean old tokens
      data.auth_tokens = data.auth_tokens.filter(t => t.expires_at > Date.now());
      data.auth_tokens.push({
        token: newToken,
        user_id: userData.id,
        user_name: userData.name,
        user_email: userData.email,
        user_role: userData.role,
        expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });
      saveDB();

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `pos_auth_token=${newToken}; Path=/; HttpOnly; SameSite=Lax`,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true'
      });
      res.end(JSON.stringify({ success: true, data: { user: userData, authenticated: true } }));
      return;
    }

    // Check regular users
    const user = data.users.find(u => u.email === email && u.password === password);
    if (user) {
      const userData = { id: user.id, name: user.name, email: user.email, role: user.role };
      const newToken = generateToken();
      
      data.auth_tokens = data.auth_tokens.filter(t => t.expires_at > Date.now());
      data.auth_tokens.push({
        token: newToken,
        user_id: user.id,
        user_name: user.name,
        user_email: user.email,
        user_role: user.role,
        expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000)
      });
      saveDB();

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

  const data = getDB();
  const authRow = data.auth_tokens.find(t => t.token === token && t.expires_at > Date.now());

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
    const data = getDB();
    data.auth_tokens = data.auth_tokens.filter(t => t.token !== token);
    saveDB();
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
  const data = getDB();
  const authRow = data.auth_tokens.find(t => t.token === token && t.expires_at > Date.now());
  if (!authRow) return null;
  return {
    id: authRow.user_id,
    name: authRow.user_name,
    email: authRow.user_email,
    role: authRow.user_role
  };
}

async function handleAPI(req, res, token, pathname) {
  const data = getDB();
  const endpoint = pathname.replace('/api/', '').replace('.php', '');
  const method = req.method;
  const user = getAuthUser(token);

  // Public endpoints
  const publicEndpoints = ['products', 'categories', 'customers', 'suppliers', 'sales'];
  if (!user && !publicEndpoints.includes(endpoint)) {
    json(res, null, 'Authentication required', 401);
    return;
  }

  try {
    let result;

    switch (endpoint) {
      case 'users':
        if (method === 'GET') {
          result = data.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, created_at: u.created_at }));
        } else if (method === 'POST' && user?.role === 'super_admin') {
          const body = await parseBody(req);
          const id = 'user_' + Date.now();
          data.users.push({
            id, name: body.name, email: body.email, password: body.password || '1234',
            role: body.role || 'operator', status: 'active', created_at: new Date().toISOString()
          });
          saveDB();
          result = { id, ...body };
        }
        break;

      case 'categories':
        if (method === 'GET') {
          result = data.categories;
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'cat_' + Date.now();
          data.categories.push({ id, name: body.name, company: body.company || '', created_at: new Date().toISOString() });
          saveDB();
          result = { id, ...body };
        }
        break;

      case 'products':
        if (method === 'GET') {
          const search = new URL(req.url, 'http://localhost:8765').searchParams.get('search') || '';
          if (search) {
            const s = search.toLowerCase();
            result = data.products.filter(p => p.name.toLowerCase().includes(s) || (p.barcode && p.barcode.includes(search)));
          } else {
            result = data.products;
          }
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = body.id || 'prod_' + Date.now();
          const existing = data.products.findIndex(p => p.id === id);
          const product = {
            id, name: body.name, barcode: body.barcode || '', unit: body.unit || 'pcs',
            buyP: body.buyP || 0, sellP: body.sellP || 0, stock: body.stock || 0,
            minStock: body.minStock || 0, cat: body.cat || '', company: body.company || '',
            mrp: body.mrp || 0, image: body.image || ''
          };
          if (existing >= 0) {
            data.products[existing] = product;
          } else {
            data.products.push(product);
          }
          saveDB();
          result = { id, ...body };
        }
        break;

      case 'suppliers':
        if (method === 'GET') {
          result = data.suppliers;
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'sup_' + Date.now();
          data.suppliers.push({ id, name: body.name, phone: body.phone || '', email: body.email || '', address: body.address || '', company: body.company || '' });
          saveDB();
          result = { id, ...body };
        }
        break;

      case 'customers':
        if (method === 'GET') {
          result = data.customers;
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'cust_' + Date.now();
          data.customers.push({ id, name: body.name, phone: body.phone || '', email: body.email || '', address: body.address || '', balance: body.balance || 0 });
          saveDB();
          result = { id, ...body };
        }
        break;

      case 'sales':
        if (method === 'GET') {
          result = data.sales.slice(-100).reverse();
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'sale_' + Date.now();
          data.sales.push({
            id, items: JSON.stringify(body.items), subtotal: body.subtotal || 0, discount: body.discount || 0,
            total: body.total || 0, vat: body.vat || 0, vatRate: body.vatRate || 0,
            paid: body.paid || 0, due: body.due || 0, change: body.change || 0,
            customer_id: body.customer_id || '', payment_method: body.payment_method || 'cash',
            invoice_number: body.invoice_number || '', user_id: body.user_id || '', user_name: body.user_name || '',
            created_at: new Date().toISOString()
          });
          saveDB();
          result = { id, ...body };
        }
        break;

      case 'expenses':
        if (method === 'GET') {
          result = data.expenses;
        } else if (method === 'POST') {
          const body = await parseBody(req);
          const id = 'exp_' + Date.now();
          data.expenses.push({ id, title: body.title, amount: body.amount, type: body.type || 'expense', note: body.note || '', user_id: body.user_id || '', user_name: body.user_name || '' });
          saveDB();
          result = { id, ...body };
        }
        break;

      case 'settings':
        if (method === 'GET') {
          result = data.settings;
        } else if (method === 'POST') {
          const body = await parseBody(req);
          for (const [key, value] of Object.entries(body)) {
            data.settings[key] = String(value);
          }
          saveDB();
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

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      console.log('POS API Server running on port ' + port);
      resolve(port);
    });
  });
}

module.exports = { start, getDB };
