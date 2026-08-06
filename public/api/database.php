<?php
/**
 * Database Connection - POS System
 * SQLite using PDO
 * 
 * Database path: /database/pos_database.sqlite
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database path (two levels up from public/api)
$dbPath = __DIR__ . '/../../database/pos_database.sqlite';

// Ensure database directory exists
$dbDir = dirname($dbPath);
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0755, true);
}

// Create database file if it doesn't exist
if (!file_exists($dbPath)) {
    touch($dbPath);
}

try {
    // Create PDO connection
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec("PRAGMA foreign_keys = ON");
    $pdo->exec("PRAGMA journal_mode = WAL");
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database connection failed: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Run database migrations - add missing columns to existing tables
 */
function migrateDatabase($pdo) {
    // Users table migrations
    $columns = $pdo->query("PRAGMA table_info(users)")->fetchAll(PDO::FETCH_ASSOC);
    $existingColumns = array_column($columns, 'name');
    
    // Add username column if missing
    if (!in_array('username', $existingColumns)) {
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN username TEXT UNIQUE");
        } catch (Exception $e) {
            // Column might already exist in some SQLite versions
        }
    }
    
    // Add phone column if missing
    if (!in_array('phone', $existingColumns)) {
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN phone TEXT");
        } catch (Exception $e) {
            // Column might already exist
        }
    }
    
    // Products table migrations
    $columns = $pdo->query("PRAGMA table_info(products)")->fetchAll(PDO::FETCH_ASSOC);
    $existingColumns = array_column($columns, 'name');
    
    // Add missing columns to products
    $productColumns = ['cost_price', 'min_stock', 'unit', 'description', 'image', 'supplier_id', 'sku'];
    foreach ($productColumns as $col) {
        if (!in_array($col, $existingColumns)) {
            try {
                $pdo->exec("ALTER TABLE products ADD COLUMN $col TEXT");
            } catch (Exception $e) {
                // Ignore errors
            }
        }
    }
    
    // Customers table migrations
    $columns = $pdo->query("PRAGMA table_info(customers)")->fetchAll(PDO::FETCH_ASSOC);
    $existingColumns = array_column($columns, 'name');
    
    // Add balance column if missing
    if (!in_array('balance', $existingColumns)) {
        try {
            $pdo->exec("ALTER TABLE customers ADD COLUMN balance REAL DEFAULT 0");
        } catch (Exception $e) {
            // Ignore
        }
    }
    
    // Settings table - check if using old schema
    $columns = $pdo->query("PRAGMA table_info(settings)")->fetchAll(PDO::FETCH_ASSOC);
    $existingColumns = array_column($columns, 'name');
    
    if (in_array('key', $existingColumns) && !in_array('setting_key', $existingColumns)) {
        // Old schema: rename 'key' to 'setting_key'
        try {
            $pdo->exec("ALTER TABLE settings ADD COLUMN setting_key TEXT UNIQUE");
            $pdo->exec("ALTER TABLE settings ADD COLUMN setting_value TEXT");
            // Copy data
            $pdo->exec("UPDATE settings SET setting_key = key, setting_value = value WHERE setting_key IS NULL");
        } catch (Exception $e) {
            // Ignore
        }
    }
}

/**
 * Run database migrations - create tables if they don't exist
 */
function initDatabase($pdo) {
    // Users table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'staff',
            phone TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Categories table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Suppliers table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            company TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Customers table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            balance REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Products table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sku TEXT UNIQUE,
            barcode TEXT,
            category_id INTEGER,
            supplier_id INTEGER,
            price REAL NOT NULL DEFAULT 0,
            cost_price REAL DEFAULT 0,
            stock INTEGER DEFAULT 0,
            min_stock INTEGER DEFAULT 0,
            unit TEXT DEFAULT 'pcs',
            description TEXT,
            image TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
        )
    ");
    
    // Sales table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT UNIQUE,
            customer_id INTEGER,
            user_id INTEGER,
            subtotal REAL DEFAULT 0,
            discount REAL DEFAULT 0,
            tax REAL DEFAULT 0,
            total REAL DEFAULT 0,
            paid REAL DEFAULT 0,
            due REAL DEFAULT 0,
            payment_method TEXT DEFAULT 'cash',
            status TEXT DEFAULT 'completed',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ");
    
    // Sale items table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER,
            product_id INTEGER,
            product_name TEXT,
            quantity INTEGER,
            price REAL,
            discount REAL DEFAULT 0,
            total REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sale_id) REFERENCES sales(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        )
    ");
    
    // Expenses table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL DEFAULT 'expense',
            category TEXT,
            amount REAL NOT NULL,
            description TEXT,
            date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Settings table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            setting_key TEXT UNIQUE NOT NULL,
            setting_value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Sessions table for PHP session storage
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            user_id INTEGER,
            data TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME
        )
    ");
    
    // Insert default admin user if not exists
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE email = ? OR role = 'admin'");
    $stmt->execute(['admin@pos.local']);
    if ($stmt->fetchColumn() == 0) {
        $hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare("
            INSERT INTO users (name, username, email, password, role, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute(['Administrator', 'admin', 'admin@pos.local', $hashedPassword, 'admin', 'active']);
        
        // Also insert legacy admin for compatibility
        $stmt = $pdo->prepare("
            INSERT INTO users (name, username, email, password, role, status) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute(['Super Admin', 'superadmin', 'admin@konok.io', '@rsm@k@1A', 'super_admin', 'active']);
    }
    
    // Insert default settings if not exist
    $defaultSettings = [
        ['shop_name', 'My POS Shop'],
        ['shop_address', ''],
        ['shop_phone', ''],
        ['shop_email', ''],
        ['currency', 'BDT'],
        ['currency_symbol', '৳'],
        ['tax_rate', '0'],
        ['invoice_prefix', 'INV-'],
        ['name', 'আমার দোকান'],
        ['vatEnabled', 'false'],
        ['vatPercent', '15'],
    ];
    
    foreach ($defaultSettings as $setting) {
        $stmt = $pdo->prepare("INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)");
        $stmt->execute($setting);
    }
}

// Run database initialization
initDatabase($pdo);

// Run migrations AFTER tables are created
migrateDatabase($pdo);

/**
 * Send JSON response
 */
function jsonResponse($data, $error = null, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $error === null,
        'data' => $data,
        'error' => $error,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Get authenticated user from session
 */
function getAuthUser() {
    // Start session if not started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'name' => $_SESSION['user_name'] ?? '',
        'email' => $_SESSION['user_email'] ?? '',
        'role' => $_SESSION['user_role'] ?? 'staff'
    ];
}

/**
 * Require authentication - returns user or exits with 401
 */
function requireAuth() {
    $user = getAuthUser();
    if (!$user) {
        jsonResponse(null, 'Authentication required', 401);
    }
    return $user;
}
