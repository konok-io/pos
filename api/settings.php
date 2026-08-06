<?php
/**
 * Settings API
 * POS System
 * 
 * Simple key-value storage where keys are camelCase
 * and values are stored as JSON strings
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
            // Table doesn't exist - return empty settings
            response([]);
            return;
        }
        
        // Get all settings as key-value pairs
        // Keys are stored in camelCase (e.g., 'taxId', 'crNumber')
        $stmt = $db->query("SELECT setting_key, setting_value FROM settings");
        $rows = $stmt->fetchAll();
        
        $settings = [];
        foreach ($rows as $row) {
            $key = $row['setting_key'];
            $value = $row['setting_value'];
            
            // Try to decode JSON values
            if ($value !== null && $value !== '') {
                $decoded = @json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $settings[$key] = $decoded;
                } else {
                    // Handle boolean-like string values
                    if ($value === 'true' || $value === '1') {
                        $settings[$key] = true;
                    } else if ($value === 'false' || $value === '0' || $value === '') {
                        $settings[$key] = false;
                    } else if (is_numeric($value)) {
                        // Numeric values
                        $settings[$key] = strpos($value, '.') !== false ? floatval($value) : intval($value);
                    } else {
                        $settings[$key] = $value;
                    }
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
 * Accepts all camelCase keys from frontend
 */
function updateSettings() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    $input = @json_decode(file_get_contents('php://input'), true);

    if (empty($input) || json_last_error() !== JSON_ERROR_NONE) {
        response(null, 'Invalid JSON input', 400);
    }

    try {
        $db = getDB();
        
        // Delete all existing settings first (simpler approach)
        $db->exec("DELETE FROM settings");
        
        // Insert all settings from input
        // Keys are stored AS IS (camelCase: taxId, crNumber, etc.)
        $stmt = $db->prepare("INSERT INTO settings (setting_key, setting_value, updated_at) VALUES (?, ?, datetime('now'))");
        
        foreach ($input as $key => $value) {
            // Skip invalid keys
            if (!is_string($key) || strlen($key) === 0) {
                continue;
            }
            
            // Convert to string for storage
            if (is_bool($value)) {
                $valueToSave = $value ? 'true' : 'false';
            } else if (is_array($value) || is_object($value)) {
                $valueToSave = json_encode($value, JSON_UNESCAPED_UNICODE);
            } else {
                $valueToSave = (string)$value;
            }
            
            // Save the key as-is (camelCase)
            $stmt->execute([$key, $valueToSave]);
        }
        
        response(['message' => 'Settings updated successfully', 'count' => count($input)]);

    } catch (Exception $e) {
        response(null, 'Failed to update settings: ' . $e->getMessage(), 500);
    }
}
