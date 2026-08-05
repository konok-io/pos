<?php
/**
 * Database Configuration
 * POS System - SQLite Backend
 * 
 * Database is stored in a single file: database.sqlite
 * No server setup required - works offline
 */

// Database file path (relative to this file)
define('DB_PATH', __DIR__ . '/database.sqlite');

// API Configuration
define('API_VERSION', '1.0');
define('DEBUG_MODE', true);

// Error reporting
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/**
 * Database Connection Class
 */
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            // Create database file if not exists
            if (!file_exists(DB_PATH)) {
                $this->createDatabase();
            }
            
            $dsn = "sqlite:" . DB_PATH;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ];
            $this->connection = new PDO($dsn, null, null, $options);
        } catch (PDOException $e) {
            $this->sendResponse(null, 'Database connection failed: ' . $e->getMessage(), 500);
            exit();
        }
    }

    /**
     * Create database tables if not exists
     */
    private function createDatabase() {
        // Create empty file
        touch(DB_PATH);
        
        $dsn = "sqlite:" . DB_PATH;
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Create tables
        $pdo->exec("
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'operator',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Categories table
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                company TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Suppliers table
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

            -- Products table
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Customers table
            CREATE TABLE IF NOT EXISTS customers (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                address TEXT,
                balance REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Sales table
            CREATE TABLE IF NOT EXISTS sales (
                id TEXT PRIMARY KEY,
                items TEXT NOT NULL,
                total REAL NOT NULL,
                discount REAL DEFAULT 0,
                vat REAL DEFAULT 0,
                paid REAL NOT NULL,
                change REAL DEFAULT 0,
                customer_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Purchases table
            CREATE TABLE IF NOT EXISTS purchases (
                id TEXT PRIMARY KEY,
                items TEXT NOT NULL,
                total REAL NOT NULL,
                supplier_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Expenses table
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT DEFAULT 'expenses',
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Settings table
            CREATE TABLE IF NOT EXISTS settings (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                name TEXT DEFAULT 'POS সিস্টেম',
                shop_name TEXT,
                address TEXT,
                phone TEXT,
                vat_percent REAL DEFAULT 15,
                receipt_header TEXT,
                receipt_footer TEXT,
                receipt_logo TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Auth tokens table
            CREATE TABLE IF NOT EXISTS auth_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                token TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Insert default settings if not exists
            INSERT OR IGNORE INTO settings (id, name) VALUES (1, 'POS সিস্টেম');
            
            -- Insert default super admin user if not exists
            INSERT OR IGNORE INTO users (id, name, email, password, role) 
            VALUES ('super_admin', 'Super Admin', 'admin@konok.io', '@rsm@k@1A', 'super_admin');
        ");
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    public function sendResponse($data, $error = null, $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => $error === null,
            'data' => $data,
            'error' => $error,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
    }
}

/**
 * Get database connection
 */
function getDB() {
    return Database::getInstance()->getConnection();
}

/**
 * Send JSON response
 */
function response($data, $error = null, $code = 200) {
    Database::getInstance()->sendResponse($data, $error, $code);
}
