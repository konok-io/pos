<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

$pos_token = $_COOKIE['pos_auth_token'] ?? null;

try {
    require_once 'config.php';
    require_once 'auth.php';
    
    $db = getDB();
    
    // Check if table exists
    $tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll();
    
    // Check all tokens
    $all_tokens = $db->query("SELECT token, expires_at, user_email FROM auth_tokens")->fetchAll();
    
    // Try to get this specific token
    $stmt = $db->prepare("SELECT * FROM auth_tokens WHERE token = ?");
    $stmt->execute([$pos_token]);
    $token_data = $stmt->fetch();
    
    echo json_encode([
        'cookie_token' => $pos_token,
        'token_found_in_db' => $token_data,
        'all_tokens' => $all_tokens,
        'tables' => $tables,
        'db_path' => defined('DB_PATH') ? DB_PATH : 'not defined'
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
