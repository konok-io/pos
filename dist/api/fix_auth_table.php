<?php
/**
 * Fix auth_tokens table - add missing columns
 */
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

try {
    require_once 'config.php';
    
    $db = getDB();
    
    // Get current columns
    $result = $db->query("PRAGMA table_info(auth_tokens)");
    $columns = [];
    while ($row = $result->fetch()) {
        $columns[] = $row['name'];
    }
    
    $added = [];
    
    // Add missing columns
    if (!in_array('user_name', $columns)) {
        $db->exec("ALTER TABLE auth_tokens ADD COLUMN user_name TEXT");
        $added[] = 'user_name';
    }
    
    if (!in_array('user_email', $columns)) {
        $db->exec("ALTER TABLE auth_tokens ADD COLUMN user_email TEXT");
        $added[] = 'user_email';
    }
    
    if (!in_array('user_role', $columns)) {
        $db->exec("ALTER TABLE auth_tokens ADD COLUMN user_role TEXT");
        $added[] = 'user_role';
    }
    
    echo json_encode([
        'success' => true,
        'existing_columns' => $columns,
        'added_columns' => $added
    ]);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
