<?php
/**
 * Authentication API
 * POS System - SQLite Backend
 */

require_once 'config.php';

// Generate unique ID
function generateId() {
    return uniqid() . '-' . substr(md5(uniqid()), 0, 5);
}

// Generate token
function generateToken() {
    return bin2hex(random_bytes(32));
}

// Handle request
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

/**
 * Login
 */
function login() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input) || !isset($input['email']) || !isset($input['password'])) {
        response(null, 'Email and password are required', 400);
    }
    
    $email = trim($input['email']);
    $password = $input['password'];
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || $user['password'] !== $password) {
            response(null, 'Invalid email or password', 401);
        }
        
        // Create token
        $tokenId = generateId();
        $token = generateToken();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
        
        // Delete old tokens for this user
        $stmt = $db->prepare("DELETE FROM auth_tokens WHERE user_id = ?");
        $stmt->execute([$user['id']]);
        
        // Create new token
        $stmt = $db->prepare("INSERT INTO auth_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)");
        $stmt->execute([$tokenId, $user['id'], $token, $expiresAt]);
        
        response([
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ],
            'token' => $token,
            'expires_at' => $expiresAt
        ]);
        
    } catch (Exception $e) {
        response(null, 'Login failed: ' . $e->getMessage(), 500);
    }
}

/**
 * Logout
 */
function logout() {
    $token = getBearerToken();
    
    if (!$token) {
        response(null, 'No token provided', 401);
    }
    
    try {
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM auth_tokens WHERE token = ?");
        $stmt->execute([$token]);
        
        response(['message' => 'Logged out successfully']);
        
    } catch (Exception $e) {
        response(null, 'Logout failed: ' . $e->getMessage(), 500);
    }
}

/**
 * Check authentication
 */
function checkAuth() {
    $token = getBearerToken();
    
    if (!$token) {
        response(null, 'No token provided', 401);
    }
    
    // Check for super admin token (generated in frontend)
    if (strpos($token, 'super-admin-token-') === 0) {
        response([
            'user' => [
                'id' => 'super-admin',
                'name' => 'Super Admin',
                'email' => 'admin@konok.io',
                'role' => 'super_admin'
            ],
            'expires_at' => date('Y-m-d H:i:s', strtotime('+24 hours'))
        ]);
        return;
    }
    
    try {
        $db = getDB();
        $stmt = $db->prepare("
            SELECT t.*, u.name, u.email, u.role 
            FROM auth_tokens t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.token = ? AND t.expires_at > datetime('now')
        ");
        $stmt->execute([$token]);
        $session = $stmt->fetch();
        
        if (!$session) {
            response(null, 'Session expired or invalid', 401);
        }
        
        response([
            'user' => [
                'id' => $session['user_id'],
                'name' => $session['name'],
                'email' => $session['email'],
                'role' => $session['role']
            ],
            'expires_at' => $session['expires_at']
        ]);
        
    } catch (Exception $e) {
        response(null, 'Auth check failed: ' . $e->getMessage(), 500);
    }
}

/**
 * Get Bearer Token
 */
function getBearerToken() {
    $headers = getallheaders();
    $authorization = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (preg_match('/Bearer\s+(.*)$/i', $authorization, $matches)) {
        return $matches[1];
    }
    
    return null;
}

/**
 * Authenticate request
 */
function authenticate() {
    $token = getBearerToken();
    
    if (!$token) {
        response(null, 'Authentication required', 401);
    }
    
    // Check for super admin token (generated in frontend)
    if (strpos($token, 'super-admin-token-') === 0) {
        return [
            'user_id' => 'super-admin',
            'user_name' => 'Super Admin',
            'user_role' => 'super_admin'
        ];
    }
    
    try {
        $db = getDB();
        $stmt = $db->prepare("
            SELECT t.*, u.name, u.email, u.role 
            FROM auth_tokens t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.token = ? AND t.expires_at > datetime('now')
        ");
        $stmt->execute([$token]);
        $session = $stmt->fetch();
        
        if (!$session) {
            response(null, 'Session expired or invalid', 401);
        }
        
        return [
            'user_id' => $session['user_id'],
            'user_name' => $session['name'],
            'user_role' => $session['role']
        ];
        
    } catch (Exception $e) {
        response(null, 'Authentication failed: ' . $e->getMessage(), 500);
    }
}
