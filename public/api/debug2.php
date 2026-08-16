<?php
/**
 * Detailed debug for auth check
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

$pos_token = $_COOKIE['pos_auth_token'] ?? null;

echo json_encode([
    'cookie_pos_token' => $pos_token,
    'message' => 'Test successful - cookie received'
], JSON_PRETTY_PRINT);
