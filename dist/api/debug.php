<?php
/**
 * Debug endpoint for testing cookie authentication
 */

header('Content-Type: application/json');

// Get all cookies
$cookies = $_COOKIE;

// Check for auth token
$auth_token = $_COOKIE['pos_auth_token'] ?? null;

echo json_encode([
    'all_cookies' => $cookies,
    'pos_auth_token' => $auth_token,
    'session_id' => session_id() ?? 'no session',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? '',
    'http_origin' => $_SERVER['HTTP_ORIGIN'] ?? 'none',
    'http_referer' => $_SERVER['HTTP_REFERER'] ?? 'none',
], JSON_PRETTY_PRINT);
