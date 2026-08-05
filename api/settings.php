<?php
/**
 * Settings API
 * POS System
 */

require_once 'config.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getSettings();
        break;
    case 'POST':
        updateSettings();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Migrate settings table to correct schema
 */
function migrateSettingsTable($db) {
    // Get current columns
    $columns = [];
    $result = $db->query("PRAGMA table_info(settings)");
    while ($row = $result->fetch()) {
        $columns[$row['name']] = true;
    }
    
    // If table already has correct schema, nothing to do
    if (isset($columns['setting_key']) && isset($columns['setting_value'])) {
        // Ensure updated_at column exists
        if (!isset($columns['updated_at'])) {
            try {
                $db->exec("ALTER TABLE settings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
            } catch (Exception $e) {
                // Column might already exist
            }
        }
        return;
    }
    
    // Migration needed - old schema with 'key' and 'value' columns
    if (isset($columns['key']) && isset($columns['value'])) {
        try {
            // Try SQLite 3.25+ RENAME COLUMN (preferred method)
            $db->exec("ALTER TABLE settings RENAME COLUMN key TO setting_key");
            $db->exec("ALTER TABLE settings RENAME COLUMN value TO setting_value");
        } catch (Exception $e) {
            // Fallback: Recreate table with new schema
            $db->exec("CREATE TABLE settings_new (
                setting_key TEXT PRIMARY KEY,
                setting_value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )");
            $db->exec("INSERT INTO settings_new (setting_key, setting_value) SELECT key, value FROM settings");
            $db->exec("DROP TABLE settings");
            $db->exec("ALTER TABLE settings_new RENAME TO settings");
        }
        
        // Ensure updated_at column exists
        try {
            $db->exec("ALTER TABLE settings ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP");
        } catch (Exception $e) {
            // Column might already exist
        }
    }
}

/**
 * Get all settings
 */
function getSettings() {
    try {
        $db = getDB();
        
        // Check if settings table exists
        $tableCheck = $db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'");
        if ($tableCheck->fetchColumn() === false) {
            response(null, 'Settings table not found', 500);
            return;
        }
        
        // Migrate table if needed
        migrateSettingsTable($db);
        
        $stmt = $db->query("SELECT setting_key, setting_value FROM settings");
        $rows = $stmt->fetchAll();

        $settings = [];
        foreach ($rows as $row) {
            $value = $row['setting_value'];
            if ($value !== null && $value !== '') {
                $decoded = @json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $settings[$row['setting_key']] = $decoded;
                } else {
                    $settings[$row['setting_key']] = $value;
                }
            }
        }

        response($settings);

    } catch (Exception $e) {
        response(null, 'Failed to fetch settings: ' . $e->getMessage(), 500);
    }
}

/**
 * Update settings
 */
function updateSettings() {
    authenticate();
    $input = @json_decode(file_get_contents('php://input'), true);

    if (empty($input) || json_last_error() !== JSON_ERROR_NONE) {
        response(null, 'Invalid JSON input', 400);
    }

    try {
        $db = getDB();
        
        // Migrate table if needed
        migrateSettingsTable($db);

        foreach ($input as $key => $value) {
            // Validate key to prevent SQL injection
            if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $key)) {
                continue;
            }
            
            $valueToSave = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value;
            
            // SQLite compatible upsert
            $stmt = $db->prepare("INSERT OR REPLACE INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
            $stmt->execute([$key, $valueToSave]);
        }

        response(['message' => 'Settings updated successfully']);

    } catch (Exception $e) {
        response(null, 'Failed to update settings: ' . $e->getMessage(), 500);
    }
}
