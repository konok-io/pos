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
 * Detect settings table schema type
 * Returns: 'keyvalue' or 'single-row'
 */
function detectSettingsSchema($db) {
    $result = $db->query("PRAGMA table_info(settings)");
    $columns = [];
    while ($row = $result->fetch()) {
        $columns[$row['name']] = [
            'type' => $row['type'],
            'pk' => $row['pk'],
            'notnull' => $row['notnull']
        ];
    }
    
    // Check for key-value schema
    if (isset($columns['setting_key']) || isset($columns['key']) || isset($columns['name'])) {
        // Key-value schema
        $keyCol = isset($columns['setting_key']) ? 'setting_key' : (isset($columns['key']) ? 'key' : 'name');
        $valueCol = isset($columns['setting_value']) ? 'setting_value' : (isset($columns['value']) ? 'value' : (isset($columns['data']) ? 'data' : null));
        
        if ($valueCol) {
            return [
                'type' => 'keyvalue',
                'keyCol' => $keyCol,
                'valueCol' => $valueCol,
                'hasUpdatedAt' => isset($columns['updated_at'])
            ];
        }
    }
    
    // Check for single-row schema (has id with CHECK constraint)
    if (isset($columns['id'])) {
        // Single-row schema - all settings are columns in one row
        return [
            'type' => 'single-row',
            'columns' => array_keys($columns)
        ];
    }
    
    return null;
}

/**
 * Convert snake_case to camelCase
 */
function snakeToCamel($str) {
    $result = '';
    $parts = explode('_', $str);
    foreach ($parts as $i => $part) {
        if ($i === 0) {
            $result .= $part;
        } else {
            $result .= ucfirst($part);
        }
    }
    return $result;
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
        
        // Detect schema
        $schema = detectSettingsSchema($db);
        if (!$schema) {
            response(null, 'Unknown settings table schema', 500);
            return;
        }
        
        if ($schema['type'] === 'keyvalue') {
            // Key-value schema
            $stmt = $db->query("SELECT \"" . $schema['keyCol'] . "\", \"" . $schema['valueCol'] . "\" FROM settings");
            $rows = $stmt->fetchAll();
            
            $settings = [];
            foreach ($rows as $row) {
                $key = snakeToCamel($row[$schema['keyCol']]);
                $value = $row[$schema['valueCol']];
                if ($value !== null && $value !== '') {
                    $decoded = @json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $settings[$key] = $decoded;
                    } else {
                        $settings[$key] = $value;
                    }
                }
            }
            response($settings);
        } else {
            // Single-row schema - get all columns as settings
            $cols = $schema['columns'];
            $placeholders = implode(',', array_fill(0, count($cols), '?'));
            $stmt = $db->prepare("SELECT * FROM settings LIMIT 1");
            $stmt->execute();
            $row = $stmt->fetch();
            
            $settings = [];
            if ($row) {
                foreach ($cols as $col) {
                    if ($col !== 'id' && isset($row[$col])) {
                        // Convert column name to camelCase for frontend compatibility
                        $key = snakeToCamel($col);
                        $settings[$key] = $row[$col];
                    }
                }
            }
            response($settings);
        }

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
        
        // Detect schema
        $schema = detectSettingsSchema($db);
        if (!$schema) {
            response(null, 'Unknown settings table schema', 500);
            return;
        }
        
        if ($schema['type'] === 'keyvalue') {
            // Key-value schema - update/insert each key
            foreach ($input as $key => $value) {
                if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $key)) {
                    continue;
                }
                $valueToSave = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value;
                
                if ($schema['hasUpdatedAt']) {
                    $stmt = $db->prepare("INSERT OR REPLACE INTO settings (\"" . $schema['keyCol'] . "\", \"" . $schema['valueCol'] . "\", updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
                } else {
                    $stmt = $db->prepare("INSERT OR REPLACE INTO settings (\"" . $schema['keyCol'] . "\", \"" . $schema['valueCol'] . "\") VALUES (?, ?)");
                }
                $stmt->execute([$key, $valueToSave]);
            }
        } else {
            // Single-row schema - UPDATE existing row
            // Map input keys to column names
            $updateCols = [];
            $params = [];
            
            foreach ($input as $key => $value) {
                // Map camelCase to snake_case for column names
                $colName = preg_replace('/([A-Z])/', '_$1', $key);
                $colName = strtolower($colName);
                $colName = ltrim($colName, '_');
                
                // Check if column exists
                if (in_array($colName, $schema['columns'])) {
                    $updateCols[] = "\"$colName\" = ?";
                    $params[] = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value;
                }
            }
            
            if (!empty($updateCols)) {
                $sql = "UPDATE settings SET " . implode(', ', $updateCols);
                $stmt = $db->prepare($sql);
                $stmt->execute($params);
            }
        }

        response(['message' => 'Settings updated successfully']);

    } catch (Exception $e) {
        response(null, 'Failed to update settings: ' . $e->getMessage(), 500);
    }
}
