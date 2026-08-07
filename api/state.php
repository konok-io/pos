<?php
/**
 * App State API
 * POS System
 * 
 * Stores app state (like current tab) in SQLite settings table
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

// No authentication required for state endpoints
// State is stored per-session or globally

switch ($method) {
    case 'GET':
        getState();
        break;
    case 'POST':
        setState();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get app state (e.g., current tab)
 */
function getState() {
    try {
        $db = getDB();
        
        // Ensure app_state table exists
        $db->exec("
            CREATE TABLE IF NOT EXISTS app_state (
                state_key TEXT PRIMARY KEY,
                state_value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        $stmt = $db->query("SELECT state_key, state_value FROM app_state");
        $rows = $stmt->fetchAll();
        
        $state = [];
        foreach ($rows as $row) {
            $state[$row['state_key']] = $row['state_value'];
        }
        
        response($state);
        
    } catch (Exception $e) {
        response(null, 'Failed to get state: ' . $e->getMessage(), 500);
    }
}

/**
 * Set app state (e.g., current tab)
 */
function setState() {
    $input = @json_decode(file_get_contents('php://input'), true);
    
    if (empty($input) || json_last_error() !== JSON_ERROR_NONE) {
        response(null, 'Invalid JSON input', 400);
    }
    
    try {
        $db = getDB();
        
        // Ensure app_state table exists
        $db->exec("
            CREATE TABLE IF NOT EXISTS app_state (
                state_key TEXT PRIMARY KEY,
                state_value TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ");
        
        $stmt = $db->prepare("
            INSERT OR REPLACE INTO app_state (state_key, state_value, updated_at) 
            VALUES (?, ?, datetime('now'))
        ");
        
        foreach ($input as $key => $value) {
            $stmt->execute([$key, $value]);
        }
        
        response(['message' => 'State updated successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to set state: ' . $e->getMessage(), 500);
    }
}
