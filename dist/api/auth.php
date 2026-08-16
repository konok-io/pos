<?php
/**
 * POS System Auth API
 */

// CORS headers for cookie-based auth
header('Access-Control-Allow-Origin: http://pos.test');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * Authentication API
 * POS System - SQLite Backend
 * Uses persistent auth tokens stored in cookies and database
 */

require_once 'config.php';

// Auth token cookie name
define('AUTH_TOKEN_COOKIE', 'pos_auth_token');

// Only process requests if this file is accessed directly (not included)
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'POST':
            login();
            break;
        case 'DELETE':
            logout();
            break;
        case 'GET':
            checkAuth();
            break;
        default:
            response(null, 'Method not allowed', 405);
    }
}

/**
 * Generate a secure random token
 */
function generateToken() {
    return bin2hex(random_bytes(32));
}

/**
 * Set auth cookie
 */
function setAuthCookie($token, $days = 30) {
    setcookie(AUTH_TOKEN_COOKIE, $token, [
        'expires' => time() + ($days * 86400),
        'path' => '/',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

/**
 * Get auth token from cookie
 */
function getAuthToken() {
    return $_COOKIE[AUTH_TOKEN_COOKIE] ?? null;
}

/**
 * Clear auth cookie
 */
function clearAuthCookie() {
    setcookie(AUTH_TOKEN_COOKIE, '', time() - 3600, '/');
}

/**
 * Save auth token to database
 */
function saveAuthToken($token, $userData) {
    try {
        $db = getDB();
        $expiresAt = date('Y-m-d H:i:s', time() + (30 * 86400));
        
        $stmt = $db->prepare("
            INSERT OR REPLACE INTO auth_tokens (token, user_id, user_name, user_email, user_role, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $result = $stmt->execute([
            $token,
            $userData['id'],
            $userData['name'],
            $userData['email'],
            $userData['role'],
            $expiresAt
        ]);
        
        if (!$result) {
            error_log("Auth: Failed to save token for user " . ($userData['email'] ?? 'unknown'));
        }
    } catch (Exception $e) {
        error_log("Auth: Exception saving token: " . $e->getMessage());
        throw $e; // Re-throw to see the error
    }
}

/**
 * Get user from auth token
 */
function getUserFromToken($token) {
    try {
        $db = getDB();
        $stmt = $db->prepare("
            SELECT * FROM auth_tokens 
            WHERE token = ? AND expires_at > datetime('now')
        ");
        $stmt->execute([$token]);
        return $stmt->fetch();
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Delete auth token
 */
function deleteAuthToken($token) {
    try {
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM auth_tokens WHERE token = ?");
        $stmt->execute([$token]);
    } catch (Exception $e) {
        // Ignore
    }
}

/**
 * Login - Creates persistent auth token
 */
function login() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input) || !isset($input['email']) || !isset($input['password'])) {
        response(null, 'Email and password are required', 400);
    }
    
    $email = trim($input['email']);
    $password = $input['password'];
    
    $userData = null;
    
    // Super Admin hardcoded check
    if ($email === 'admin@konok.io' && $password === '@rsm@k@1A') {
        $userData = [
            'id' => 'super-admin',
            'name' => 'Super Admin',
            'email' => 'admin@konok.io',
            'role' => 'super_admin'
        ];
    } else {
        try {
            $db = getDB();
            $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();
            
            if ($user && $user['password'] === $password) {
                $userData = [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ];
            }
        } catch (Exception $e) {
            // Continue
        }
    }
    
    if (!$userData) {
        response(null, 'Invalid email or password', 401);
    }
    
    // Generate and save auth token
    $token = generateToken();
    try {
        saveAuthToken($token, $userData);
    } catch (Exception $e) {
        error_log("Login failed to save token: " . $e->getMessage());
        response(null, 'Login failed: ' . $e->getMessage(), 500);
    }
    setAuthCookie($token, 30);
    
    response([
        'user' => $userData,
        'message' => 'Login successful'
    ]);
}

/**
 * Logout - Clears auth token
 */
function logout() {
    $token = getAuthToken();
    if ($token) {
        deleteAuthToken($token);
    }
    clearAuthCookie();
    
    response(['message' => 'Logged out successfully']);
}

/**
 * Check authentication - Returns current user from token
 */
function checkAuth() {
    $token = getAuthToken();
    
    if (!$token) {
        response(['authenticated' => false], null, 200);
        return;
    }
    
    $user = getUserFromToken($token);
    
    if (!$user) {
        response(['authenticated' => false], null, 200);
        return;
    }
    
    // Refresh token expiry
    saveAuthToken($token, [
        'id' => $user['user_id'],
        'name' => $user['user_name'],
        'email' => $user['user_email'],
        'role' => $user['user_role']
    ]);
    
    response([
        'authenticated' => true,
        'user' => [
            'id' => $user['user_id'],
            'name' => $user['user_name'],
            'email' => $user['user_email'],
            'role' => $user['user_role']
        ]
    ]);
}

/**
 * Authenticate request - Returns user info from token
 */
function authenticate() {
    $token = getAuthToken();
    if (!$token) {
        return null;
    }
    
    $user = getUserFromToken($token);
    if (!$user) {
        return null;
    }
    
    return [
        'user_id' => $user['user_id'],
        'user_name' => $user['user_name'],
        'user_email' => $user['user_email'],
        'user_role' => $user['user_role']
    ];
}
