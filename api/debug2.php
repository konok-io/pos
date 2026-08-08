<?php
/**
 * Detailed debug for auth check
 */

header('Content-Type: application/json');

// Check all cookies
$all_cookies = $_COOKIE;
$pos_token = $_COOKIE['pos_auth_token'] ?? null;

// Get database info
require_once 'config.php';
require_once 'auth.php';

$token_in_db = null;
$db_error = null;

try {
    $db = getDB();
    
    if ($pos_token) {
        $stmt = $db->prepare("SELECT * FROM auth_tokens WHERE token = ?");
        $stmt->execute([$pos_token]);
        $token_in_db = $stmt->fetch();
    }
    
    // Get all tokens
    $all_tokens = $db->query("SELECT token, expires_at, user_email FROM auth_tokens")->fetchAll();
} catch (Exception $e) {
    $db_error = $e->getMessage();
}

echo json_encode([
    'cookie_pos_token' => $pos_token,
    'token_in_db' => $token_in_db,
    'all_tokens_in_db' => $all_tokens,
    'db_error' => $db_error,
    'all_cookies' => array_keys($all_cookies),
], JSON_PRETTY_PRINT);
