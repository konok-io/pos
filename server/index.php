<?php
/**
 * POS System API Server - PHP + SQLite
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dbPath = __DIR__ . '/data/pos.db';
$dataDir = __DIR__ . '/data';

if (!is_dir($dataDir)) {
    mkdir($dataDir, 0777, true);
}

try {
    $db = new PDO('sqlite:' . $dbPath);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    exit;
}

// Create tables
$tables = [
    'users' => "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'operator', status TEXT DEFAULT 'active', created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    'categories' => "CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, company TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    'suppliers' => "CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', email TEXT DEFAULT '', address TEXT DEFAULT '', company TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    'customers' => "CREATE TABLE IF NOT EXISTS customers (id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT DEFAULT '', email TEXT DEFAULT '', address TEXT DEFAULT '', balance REAL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    'products' => "CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, name TEXT NOT NULL, barcode TEXT DEFAULT '', unit TEXT DEFAULT 'pcs', buyP REAL DEFAULT 0, sellP REAL DEFAULT 0, stock REAL DEFAULT 0, minStock REAL DEFAULT 0, cat TEXT DEFAULT '', company TEXT DEFAULT '', mrp REAL DEFAULT 0, image TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    'sales' => "CREATE TABLE IF NOT EXISTS sales (id TEXT PRIMARY KEY, items TEXT, subtotal REAL DEFAULT 0, discount REAL DEFAULT 0, total REAL DEFAULT 0, vat REAL DEFAULT 0, vatRate REAL DEFAULT 0, paid REAL DEFAULT 0, due REAL DEFAULT 0, change_amt REAL DEFAULT 0, customer_id TEXT DEFAULT '', payment_method TEXT DEFAULT 'cash', invoice_number TEXT DEFAULT '', user_id TEXT DEFAULT '', user_name TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    'purchases' => "CREATE TABLE IF NOT EXISTS purchases (id TEXT PRIMARY KEY, items TEXT, supplier_id TEXT DEFAULT '', total REAL DEFAULT 0, paid REAL DEFAULT 0, due REAL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    'expenses' => "CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY, title TEXT NOT NULL, amount REAL NOT NULL, type TEXT DEFAULT 'expense', note TEXT DEFAULT '', user_id TEXT DEFAULT '', user_name TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    'incomes' => "CREATE TABLE IF NOT EXISTS incomes (id TEXT PRIMARY KEY, title TEXT NOT NULL, amount REAL NOT NULL, type TEXT DEFAULT 'income', note TEXT DEFAULT '', user_id TEXT DEFAULT '', user_name TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP)",
    'settings' => "CREATE TABLE IF NOT EXISTS settings (skey TEXT PRIMARY KEY, value TEXT)",
    'auth_tokens' => "CREATE TABLE IF NOT EXISTS auth_tokens (token TEXT PRIMARY KEY, user_id TEXT NOT NULL, user_name TEXT DEFAULT '', user_email TEXT DEFAULT '', user_role TEXT DEFAULT '', expires_at INTEGER NOT NULL)"
];

foreach ($tables as $table => $sql) {
    $db->exec($sql);
}

// Insert defaults
$stmt = $db->prepare("SELECT COUNT(*) FROM users WHERE email = 'admin@konok.io'");
$stmt->execute();
if ($stmt->fetchColumn() == 0) {
    $db->prepare("INSERT INTO users (id, name, email, password, role, status) VALUES ('super_admin', 'Super Admin', 'admin@konok.io', '@rsm@k@1A', 'super_admin', 'active')")->execute();
}

$stmt = $db->prepare("SELECT COUNT(*) FROM settings");
$stmt->execute();
if ($stmt->fetchColumn() == 0) {
    $db->prepare("INSERT INTO settings (skey, value) VALUES ('shop_name', 'POS System')")->execute();
    $db->prepare("INSERT INTO settings (skey, value) VALUES ('name', 'My Shop')")->execute();
    $db->prepare("INSERT INTO settings (skey, value) VALUES ('vatEnabled', 'true')")->execute();
    $db->prepare("INSERT INTO settings (skey, value) VALUES ('vatPercent', '15')")->execute();
}

function getToken() {
    $cookies = $_COOKIE ?? [];
    foreach ($cookies as $k => $v) {
        if ($k === 'pos_auth_token') return $v;
    }
    return null;
}

function getAuthUser($db) {
    $token = getToken();
    if (!$token) return null;
    $stmt = $db->prepare("SELECT * FROM auth_tokens WHERE token = ? AND expires_at > ?");
    $stmt->execute([$token, time() * 1000]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function generateToken() {
    return bin2hex(random_bytes(32));
}

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Auth
if ($path === '/api/auth' || $path === '/api/auth.php') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $input['action'] ?? ($method === 'GET' ? 'check' : '');
    
    if ($action === 'login' && $method === 'POST') {
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        
        if ($email === 'admin@konok.io' && $password === '@rsm@k@1A') {
            $userData = ['id' => 'super-admin', 'name' => 'Super Admin', 'email' => 'admin@konok.io', 'role' => 'super_admin'];
            $newToken = generateToken();
            $expires = (time() + 30 * 24 * 60 * 60) * 1000;
            $db->prepare("DELETE FROM auth_tokens WHERE expires_at < ?")->execute([time() * 1000]);
            $db->prepare("INSERT INTO auth_tokens (token, user_id, user_name, user_email, user_role, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
                ->execute([$newToken, $userData['id'], $userData['name'], $userData['email'], $userData['role'], $expires]);
            setcookie('pos_auth_token', $newToken, time() + 30*24*60*60, '/', '', false, true);
            echo json_encode(['success' => true, 'data' => ['user' => $userData, 'authenticated' => true]]);
            exit;
        }
        
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
        $stmt->execute([$email, $password]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $userData = ['id' => $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role']];
            $newToken = generateToken();
            $expires = (time() + 30 * 24 * 60 * 60) * 1000;
            $db->prepare("DELETE FROM auth_tokens WHERE expires_at < ?")->execute([time() * 1000]);
            $db->prepare("INSERT INTO auth_tokens (token, user_id, user_name, user_email, user_role, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
                ->execute([$newToken, $userData['id'], $userData['name'], $userData['email'], $userData['role'], $expires]);
            setcookie('pos_auth_token', $newToken, time() + 30*24*60*60, '/', '', false, true);
            echo json_encode(['success' => true, 'data' => ['user' => $userData, 'authenticated' => true]]);
            exit;
        }
        
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
        exit;
    }
    
    if ($method === 'GET') {
        $auth = getAuthUser($db);
        echo json_encode(['success' => true, 'data' => ['authenticated' => $auth !== null, 'user' => $auth ? ['id' => $auth['user_id'], 'name' => $auth['user_name'], 'email' => $auth['user_email'], 'role' => $auth['user_role']] : null]]);
        exit;
    }
    
    if ($method === 'DELETE') {
        $token = getToken();
        if ($token) $db->prepare("DELETE FROM auth_tokens WHERE token = ?")->execute([$token]);
        setcookie('pos_auth_token', '', time() - 3600, '/');
        echo json_encode(['success' => true]);
        exit;
    }
}

// API endpoints
$endpoint = str_replace(['/api/', '.php'], '', $path);
$user = getAuthUser($db);

switch ($endpoint) {
    case 'users':
        if (!$user) { http_response_code(401); echo json_encode(['success' => false, 'error' => 'Unauthorized']); exit; }
        if ($method === 'GET') {
            $stmt = $db->query("SELECT id, name, email, role, status, created_at FROM users WHERE role != 'super_admin'");
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = 'user_' . time();
            $db->prepare("INSERT INTO users (id, name, email, password, role, status) VALUES (?, ?, ?, ?, ?, 'active')")
                ->execute([$id, $input['name'] ?? '', $input['email'] ?? '', $input['password'] ?? '1234', $input['role'] ?? 'operator']);
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
        }
        break;
        
    case 'categories':
        if ($method === 'GET') { $stmt = $db->query("SELECT * FROM categories ORDER BY created_at DESC"); echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]); }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = 'cat_' . time();
            $db->prepare("INSERT INTO categories (id, name, company) VALUES (?, ?, ?)")->execute([$id, $input['name'] ?? '', $input['company'] ?? '']);
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
        }
        break;
        
    case 'products':
        if ($method === 'GET') {
            $search = $_GET['search'] ?? '';
            if ($search) {
                $stmt = $db->prepare("SELECT * FROM products WHERE name LIKE ? OR barcode = ? ORDER BY name LIMIT 100");
                $stmt->execute(['%' . $search . '%', $search]);
            } else {
                $stmt = $db->query("SELECT * FROM products ORDER BY name LIMIT 200");
            }
            echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = $input['id'] ?? 'prod_' . time();
            $stmt = $db->prepare("SELECT id FROM products WHERE id = ?");
            $stmt->execute([$id]);
            if ($stmt->fetch()) {
                $db->prepare("UPDATE products SET name=?, barcode=?, unit=?, buyP=?, sellP=?, stock=?, minStock=?, cat=?, company=?, mrp=?, image=? WHERE id=?")
                    ->execute([$input['name'] ?? '', $input['barcode'] ?? '', $input['unit'] ?? 'pcs', $input['buyP'] ?? 0, $input['sellP'] ?? 0, $input['stock'] ?? 0, $input['minStock'] ?? 0, $input['cat'] ?? '', $input['company'] ?? '', $input['mrp'] ?? 0, $input['image'] ?? '', $id]);
            } else {
                $db->prepare("INSERT INTO products (id, name, barcode, unit, buyP, sellP, stock, minStock, cat, company, mrp, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                    ->execute([$id, $input['name'] ?? '', $input['barcode'] ?? '', $input['unit'] ?? 'pcs', $input['buyP'] ?? 0, $input['sellP'] ?? 0, $input['stock'] ?? 0, $input['minStock'] ?? 0, $input['cat'] ?? '', $input['company'] ?? '', $input['mrp'] ?? 0, $input['image'] ?? '']);
            }
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
        }
        break;
        
    case 'suppliers':
        if ($method === 'GET') { $stmt = $db->query("SELECT * FROM suppliers ORDER BY name"); echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]); }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = 'sup_' . time();
            $db->prepare("INSERT INTO suppliers (id, name, phone, email, address, company) VALUES (?, ?, ?, ?, ?, ?)")->execute([$id, $input['name'] ?? '', $input['phone'] ?? '', $input['email'] ?? '', $input['address'] ?? '', $input['company'] ?? '']);
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
        }
        break;
        
    case 'customers':
        if ($method === 'GET') { $stmt = $db->query("SELECT * FROM customers ORDER BY name"); echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]); }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = 'cust_' . time();
            $db->prepare("INSERT INTO customers (id, name, phone, email, address, balance) VALUES (?, ?, ?, ?, ?, ?)")->execute([$id, $input['name'] ?? '', $input['phone'] ?? '', $input['email'] ?? '', $input['address'] ?? '', $input['balance'] ?? 0]);
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
        }
        break;
        
    case 'sales':
        if ($method === 'GET') { $stmt = $db->query("SELECT * FROM sales ORDER BY created_at DESC LIMIT 100"); echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]); }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = 'sale_' . time();
            $db->prepare("INSERT INTO sales (id, items, subtotal, discount, total, vat, vatRate, paid, due, change_amt, customer_id, payment_method, invoice_number, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
                ->execute([$id, json_encode($input['items'] ?? []), $input['subtotal'] ?? 0, $input['discount'] ?? 0, $input['total'] ?? 0, $input['vat'] ?? 0, $input['vatRate'] ?? 0, $input['paid'] ?? 0, $input['due'] ?? 0, $input['change'] ?? 0, $input['customer_id'] ?? '', $input['payment_method'] ?? 'cash', $input['invoice_number'] ?? '', $input['user_id'] ?? '', $input['user_name'] ?? '']);
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
        }
        break;
        
    case 'expenses':
        if ($method === 'GET') { $stmt = $db->query("SELECT * FROM expenses ORDER BY created_at DESC"); echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]); }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = 'exp_' . time();
            $db->prepare("INSERT INTO expenses (id, title, amount, type, note, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?, ?)")->execute([$id, $input['title'] ?? '', $input['amount'] ?? 0, $input['type'] ?? 'expense', $input['note'] ?? '', $input['user_id'] ?? '', $input['user_name'] ?? '']);
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
        }
        break;
        
    case 'incomes':
        if ($method === 'GET') { $stmt = $db->query("SELECT * FROM incomes ORDER BY created_at DESC"); echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]); }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            $id = 'inc_' . time();
            $db->prepare("INSERT INTO incomes (id, title, amount, type, note, user_id, user_name) VALUES (?, ?, ?, ?, ?, ?, ?)")->execute([$id, $input['title'] ?? '', $input['amount'] ?? 0, 'income', $input['note'] ?? '', $input['user_id'] ?? '', $input['user_name'] ?? '']);
            echo json_encode(['success' => true, 'data' => ['id' => $id]]);
        }
        break;
        
    case 'settings':
        if ($method === 'GET') {
            $stmt = $db->query("SELECT skey, value FROM settings");
            $settings = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) { $settings[$row['skey']] = $row['value']; }
            echo json_encode(['success' => true, 'data' => $settings]);
        }
        if ($method === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true) ?? [];
            foreach ($input as $key => $value) { $db->prepare("INSERT OR REPLACE INTO settings (skey, value) VALUES (?, ?)")->execute([$key, (string)$value]); }
            echo json_encode(['success' => true, 'data' => $input]);
        }
        break;
        
    default:
        echo json_encode(['success' => true, 'data' => ['message' => 'API endpoint: ' . $endpoint]]);
}
