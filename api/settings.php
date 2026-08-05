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
        
        // Detect actual column names - auto-detect ANY two-column schema
        $columns = [];
        $columnNames = [];
        $result = $db->query("PRAGMA table_info(settings)");
        while ($row = $result->fetch()) {
            $colName = $row['name'];
            $columns[$colName] = true;
            $columnNames[] = $colName;
        }
        
        // Determine which columns to use - priority order
        $keyCol = null;
        $valueCol = null;
        
        // Key column priority: setting_key > key > name
        if (isset($columns['setting_key'])) {
            $keyCol = 'setting_key';
        } elseif (isset($columns['key'])) {
            $keyCol = 'key';
        } elseif (isset($columns['name'])) {
            $keyCol = 'name';
        }
        
        // Value column priority: setting_value > value > data
        if (isset($columns['setting_value'])) {
            $valueCol = 'setting_value';
        } elseif (isset($columns['value'])) {
            $valueCol = 'value';
        } elseif (isset($columns['data'])) {
            $valueCol = 'data';
        }
        
        // Fallback: If no recognized columns, use first two columns
        if ((!$keyCol || !$valueCol) && count($columnNames) >= 2) {
            $keyCol = $columnNames[0];
            $valueCol = $columnNames[1];
        }
        
        if (!$keyCol || !$valueCol) {
            response(null, 'Settings table schema error: cannot determine columns. Found: ' . implode(',', $columnNames), 500);
            return;
        }
        
        $stmt = $db->query("SELECT \"$keyCol\", \"$valueCol\" FROM settings");
        $rows = $stmt->fetchAll();

        $settings = [];
        foreach ($rows as $row) {
            $key = $row[$keyCol];
            $value = $row[$valueCol];
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
        
        // Get detailed column info
        $columns = [];
        $columnNames = [];
        $result = $db->query("PRAGMA table_info(settings)");
        while ($row = $result->fetch()) {
            $colName = $row['name'];
            $columns[$colName] = [
                'name' => $colName,
                'type' => $row['type'],
                'pk' => $row['pk'],
                'notnull' => $row['notnull'],
                'dflt_value' => $row['dflt_value']
            ];
            $columnNames[] = $colName;
        }
        
        // Determine which columns to use - priority order
        $keyCol = null;
        $valueCol = null;
        $hasUpdatedAt = false;
        
        // Check if updated_at column exists
        $hasUpdatedAt = isset($columns['updated_at']);
        
        // Key column priority: setting_key > key > name
        if (isset($columns['setting_key'])) {
            $keyCol = 'setting_key';
        } elseif (isset($columns['key'])) {
            $keyCol = 'key';
        } elseif (isset($columns['name'])) {
            $keyCol = 'name';
        }
        
        // Value column priority: setting_value > value > data
        if (isset($columns['setting_value'])) {
            $valueCol = 'setting_value';
        } elseif (isset($columns['value'])) {
            $valueCol = 'value';
        } elseif (isset($columns['data'])) {
            $valueCol = 'data';
        }
        
        // Fallback: If no recognized columns, use first two non-pk columns
        if ((!$keyCol || !$valueCol) && count($columnNames) >= 2) {
            $nonPkCols = [];
            foreach ($columnNames as $col) {
                if ($columns[$col]['pk'] == 0) {
                    $nonPkCols[] = $col;
                }
            }
            if (count($nonPkCols) >= 2) {
                $keyCol = $nonPkCols[0];
                $valueCol = $nonPkCols[1];
            } elseif (count($nonPkCols) >= 1 && count($columnNames) >= 2) {
                $keyCol = $nonPkCols[0];
                $valueCol = $columnNames[1];
            }
        }
        
        if (!$keyCol || !$valueCol) {
            response(null, 'Settings table schema error: cannot determine columns. Found: ' . implode(',', $columnNames), 500);
            return;
        }

        foreach ($input as $key => $value) {
            // Validate key to prevent SQL injection
            if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $key)) {
                continue;
            }
            
            $valueToSave = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value;
            
            // Build query dynamically based on available columns
            if ($hasUpdatedAt) {
                $stmt = $db->prepare("INSERT OR REPLACE INTO settings (\"$keyCol\", \"$valueCol\", updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
                $stmt->execute([$key, $valueToSave]);
            } else {
                $stmt = $db->prepare("INSERT OR REPLACE INTO settings (\"$keyCol\", \"$valueCol\") VALUES (?, ?)");
                $stmt->execute([$key, $valueToSave]);
            }
        }

        response(['message' => 'Settings updated successfully']);

    } catch (Exception $e) {
        response(null, 'Failed to update settings: ' . $e->getMessage(), 500);
    }
}
