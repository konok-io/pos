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
        $stmt = $db->query("SELECT setting_key, setting_value FROM settings");
        $rows = $stmt->fetchAll();

        $settings = [];
        foreach ($rows as $row) {
            $value = $row['setting_value'];
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $settings[$row['setting_key']] = $decoded;
            } else {
                $settings[$row['setting_key']] = $value;
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
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input)) {
        response(null, 'No settings provided', 400);
    }

    try {
        $db = getDB();

        foreach ($input as $key => $value) {
            $valueToSave = is_array($value) ? json_encode($value, JSON_UNESCAPED_UNICODE) : $value;
            
            // SQLite compatible upsert
            $stmt = $db->prepare("INSERT OR REPLACE INTO settings (setting_key, setting_value) VALUES (?, ?)");
            $stmt->execute([$key, $valueToSave]);
        }

        response(['message' => 'Settings updated successfully']);

    } catch (Exception $e) {
        response(null, 'Failed to update settings: ' . $e->getMessage(), 500);
    }
}
