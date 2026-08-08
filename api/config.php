<?php
/**
 * Database Configuration
 * POS System - SQLite Backend
 * 
 * Database is stored in a single file: database.sqlite
 * No server setup required - works offline
 */

// Start output buffering to prevent any output before JSON
ob_start();

// Database file path - stored OUTSIDE web root to survive deployments
// Store in parent directory's .pos_data folder
$posDataDir = dirname(__DIR__) . '/.pos_data';
if (!is_dir($posDataDir)) {
    mkdir($posDataDir, 0755, true);
}
define('DB_PATH', $posDataDir . '/database.sqlite');

// API Configuration
define('API_VERSION', '1.0');
define('DEBUG_MODE', true);

// Error reporting - suppress all errors in production
if (DEBUG_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// CORS Headers - Use specific origin instead of * for credentials support
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    ob_end_clean();
    http_response_code(200);
    exit();
}

// Start PHP session for auth management
// Use database-based session for persistence across builds/restarts
// Session data is stored in SQLite database in .pos_data directory

// Session lifetime: 30 days for better persistence
ini_set('session.gc_maxlifetime', 2592000); // 30 days
ini_set('session.cookie_lifetime', 2592000); // 30 days cookie
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Lax');
ini_set('session.use_strict_mode', 0); // Disable to allow session restoration
ini_set('session.use_only_cookies', 1);

// Set cookie path to root to work across all paths
ini_set('session.cookie_path', '/');

// Start PHP session
session_start();

// Update session expiry on activity
if (isset($_SESSION['LAST_ACTIVITY']) && (time() - $_SESSION['LAST_ACTIVITY'] > 2592000)) {
    // Session expired (30 days), clear it
    $_SESSION = array();
}

// Always update last activity
$_SESSION['LAST_ACTIVITY'] = time();

// Load session data from database if session is empty but exists in DB
$sessionId = session_id();
$db = null;
if (!isset($_SESSION['user_id'])) {
    try {
        $db = getDB();
        $stmt = $db->prepare("SELECT data FROM sessions WHERE id = ? AND expires_at > datetime('now')");
        $stmt->execute([$sessionId]);
        $row = $stmt->fetch();
        if ($row && $row['data']) {
            $sessionData = json_decode($row['data'], true);
            if (is_array($sessionData) && isset($sessionData['user_id'])) {
                foreach ($sessionData as $key => $value) {
                    $_SESSION[$key] = $value;
                }
            }
        }
    } catch (Exception $e) {
        // Continue with empty session if database fails
    }
}

// Save session data to database if user is logged in
if (isset($_SESSION['user_id'])) {
    try {
        if (!$db) $db = getDB();
        $sessionData = array(
            'user_id' => $_SESSION['user_id'],
            'user_name' => $_SESSION['user_name'] ?? '',
            'user_email' => $_SESSION['user_email'] ?? '',
            'user_role' => $_SESSION['user_role'] ?? '',
            'login_time' => $_SESSION['login_time'] ?? time(),
        );
        $data = json_encode($sessionData);
        $expiresAt = date('Y-m-d H:i:s', time() + 2592000); // 30 days
        
        $stmt = $db->prepare("INSERT OR REPLACE INTO sessions (id, data, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))");
        $stmt->execute([$sessionId, $data, $expiresAt]);
    } catch (Exception $e) {
        // Ignore errors
    }
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
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Run migrations on existing database
            $this->runMigrations();
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'data' => null,
                'error' => 'Database connection failed: ' . $e->getMessage(),
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
    }

    /**
     * Migration: Add status column to users table if missing
     */
    private function addUsersStatusColumn() {
        try {
            // Get users table columns
            $result = $this->connection->query("PRAGMA table_info(users)");
            $columns = [];
            while ($row = $result->fetch()) {
                $columns[$row['name']] = true;
            }
            
            // Add status column if missing
            if (!isset($columns['status'])) {
                $this->connection->exec("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'");
            }
        } catch (Exception $e) {
            // Column might already exist or table doesn't exist - ignore
        }
    }

    /**
     * Migration: Ensure sessions table has data column
     */
    private function addSessionsDataColumn() {
        try {
            $result = $this->connection->query("PRAGMA table_info(sessions)");
            $columns = [];
            while ($row = $result->fetch()) {
                $columns[$row['name']] = true;
            }
            
            if (!isset($columns['data'])) {
                $this->connection->exec("ALTER TABLE sessions ADD COLUMN data TEXT");
            }
            if (!isset($columns['expires_at'])) {
                $this->connection->exec("ALTER TABLE sessions ADD COLUMN expires_at DATETIME");
            }
        } catch (Exception $e) {
            // Column might already exist or table doesn't exist - ignore
        }
    }

    /**
     * Run database migrations for schema updates
     */
    private function runMigrations() {
        try {
            // Check if settings table exists
            $result = $this->connection->query("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'");
            if ($result->fetchColumn() === false) {
                return; // Table doesn't exist yet
            }
            
            // Migration: Add status column to users table if missing
            $this->addUsersStatusColumn();
            
            // Migration: Add data column to sessions table
            $this->addSessionsDataColumn();
            
            // Get all columns
            $result = $this->connection->query("PRAGMA table_info(settings)");
            $columns = [];
            while ($row = $result->fetch()) {
                $columns[$row['name']] = true;
            }
            
            // Check if migration already done
            if (isset($columns['setting_key']) && isset($columns['setting_value'])) {
                // Migration already applied, just ensure updated_at exists
                if (!isset($columns['updated_at'])) {
                    try {
                        $this->connection->exec("ALTER TABLE settings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
                    } catch (Exception $e) {
                        // Column might already exist
                    }
                }
                return;
            }
            
            // Migration needed - identify source columns
            $keyCol = null;
            $valueCol = null;
            
            // Detect key column
            if (isset($columns['key'])) {
                $keyCol = 'key';
            } elseif (isset($columns['setting_key'])) {
                $keyCol = 'setting_key';
            }
            
            // Detect value column
            if (isset($columns['value'])) {
                $valueCol = 'value';
            } elseif (isset($columns['setting_value'])) {
                $valueCol = 'setting_value';
            }
            
            // If we have key and value columns, rename them
            if ($keyCol && $valueCol && $keyCol !== 'setting_key') {
                try {
                    $this->connection->exec("ALTER TABLE settings RENAME COLUMN $keyCol TO setting_key");
                } catch (Exception $e) {
                    // RENAME failed, will use recreate method
                    $keyCol = null;
                }
            }
            
            if ($valueCol && $valueCol !== 'setting_value') {
                try {
                    $this->connection->exec("ALTER TABLE settings RENAME COLUMN $valueCol TO setting_value");
                } catch (Exception $e) {
                    // RENAME failed, will use recreate method
                    $valueCol = null;
                }
            }
            
            // If columns couldn't be renamed, recreate table
            if (!$keyCol || !$valueCol) {
                // Get data from existing table with any column names
                $this->connection->exec("CREATE TABLE settings_new (
                    setting_key TEXT PRIMARY KEY,
                    setting_value TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )");
                
                // Try to copy data - use COALESCE for flexible column names (quoted for reserved words)
                $this->connection->exec("INSERT INTO settings_new (setting_key, setting_value) 
                    SELECT COALESCE(\"key\", setting_key, name, 'unknown'), 
                           COALESCE(value, setting_value, data, description, '')
                    FROM settings");
                
                $this->connection->exec("DROP TABLE settings");
                $this->connection->exec("ALTER TABLE settings_new RENAME TO settings");
            }
            
            // Ensure updated_at column exists
            $result = $this->connection->query("PRAGMA table_info(settings)");
            $columns = [];
            while ($row = $result->fetch()) {
                $columns[$row['name']] = true;
            }
            if (!isset($columns['updated_at'])) {
                try {
                    $this->connection->exec("ALTER TABLE settings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
                } catch (Exception $e) {
                    // Column might already exist
                }
            }
            
            // Migration: Add columns to purchases table if missing
            $stmt = $this->connection->query("PRAGMA table_info(purchases)");
            $columns = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $columns[$row['name']] = true;
            }
            
            $migrations = [
                'subtotal' => 'ALTER TABLE purchases ADD COLUMN subtotal REAL DEFAULT 0',
                'paid' => 'ALTER TABLE purchases ADD COLUMN paid REAL DEFAULT 0',
                'due' => 'ALTER TABLE purchases ADD COLUMN due REAL DEFAULT 0',
                'invoice_number' => 'ALTER TABLE purchases ADD COLUMN invoice_number TEXT'
            ];
            
            foreach ($migrations as $col => $sql) {
                if (!isset($columns[$col])) {
                    try {
                        $this->connection->exec($sql);
                    } catch (Exception $e) {
                        // Column might already exist, ignore
                    }
                }
            }
        } catch (Exception $e) {
            // Ignore migration errors - table might not exist yet
        }
    }

    /**
     * Create database tables if not exists
     */
    private function createDatabase() {
        // Create empty file
        if (!touch(DB_PATH)) {
            throw new Exception('Failed to create database file');
        }
        
        $dsn = "sqlite:" . DB_PATH;
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Enable foreign keys
        $pdo->exec("PRAGMA foreign_keys = ON;");
        
        // Create tables
        $pdo->exec("
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'operator',
                status TEXT DEFAULT 'active',
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
                mrp REAL DEFAULT 0,
                image TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Product history table
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

            -- Purchases table
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

            -- Expenses table
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

            -- Settings table (key-value format)
            CREATE TABLE IF NOT EXISTS settings (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT,
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

            -- Sessions table (for PHP session storage reference)
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME
            );

            -- Insert default settings if not exists
            INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('shop_name', 'POS সিস্টেম');
            INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('address', '');
            INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('phone', '');
            INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('vat_percent', '15');
            INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('name', 'আমার দোকান');
            INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('vatEnabled', 'true');
            INSERT OR IGNORE INTO settings (setting_key, setting_value) VALUES ('vatPercent', '15');
            
            -- Insert default super admin user if not exists
            INSERT OR IGNORE INTO users (id, name, email, password, role) 
            VALUES ('super_admin', 'Super Admin', 'admin@konok.io', '@rsm@k@1A', 'super_admin');
        ");
        
        // Migration: Add updated_at column if it doesn't exist (for existing databases)
        try {
            $pdo->exec("ALTER TABLE settings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        } catch (PDOException $e) {
            // Column might already exist, ignore error
        }
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
 * Send JSON response with proper error handling
 */
function response($data, $error = null, $code = 200) {
    // Clean and end output buffering to prevent any output before JSON
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    http_response_code($code);
    
    $response = [
        'success' => $error === null,
        'data' => $data,
        'error' => $error,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit();
}
