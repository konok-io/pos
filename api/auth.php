<?php
/**
 * Authentication API
 * POS System - SQLite Backend
 * Uses PHP Sessions for session management - NO localStorage
 */

require_once 'config.php';

// Only process requests if this file is accessed directly (not included)
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
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
}

/**
 * Login - Creates PHP session
 */
function login() {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input) || !isset($input['email']) || !isset($input['password'])) {
        response(null, 'Email and password are required', 400);
    }
    
    $email = trim($input['email']);
    $password = $input['password'];
    
    // Super Admin hardcoded check
    if ($email === 'admin@konok.io' && $password === '@rsm@k@1A') {
        // Set session for super admin
        $_SESSION['user_id'] = 'super-admin';
        $_SESSION['user_name'] = 'Super Admin';
        $_SESSION['user_email'] = 'admin@konok.io';
        $_SESSION['user_role'] = 'super_admin';
        $_SESSION['login_time'] = time();
        
        response([
            'user' => [
                'id' => 'super-admin',
                'name' => 'Super Admin',
                'email' => 'admin@konok.io',
                'role' => 'super_admin'
            ],
            'message' => 'Login successful'
        ]);
        return;
    }
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user || $user['password'] !== $password) {
            response(null, 'Invalid email or password', 401);
        }
        
        // Set session for database user
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];
        $_SESSION['login_time'] = time();
        
        response([
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ],
            'message' => 'Login successful'
        ]);
        
    } catch (Exception $e) {
        response(null, 'Login failed: ' . $e->getMessage(), 500);
    }
}

/**
 * Logout - Destroys PHP session
 */
function logout() {
    // Clear all session data
    $_SESSION = [];
    
    // Delete session cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    
    // Destroy the session
    session_destroy();
    
    response(['message' => 'Logged out successfully']);
}

/**
 * Check authentication - Returns current session user
 */
function checkAuth() {
    // Check if user is logged in via session
    if (!isset($_SESSION['user_id'])) {
        response(null, 'Not authenticated', 401);
    }
    
    response([
        'user' => [
            'id' => $_SESSION['user_id'],
            'name' => $_SESSION['user_name'],
            'email' => $_SESSION['user_email'],
            'role' => $_SESSION['user_role']
        ],
        'login_time' => $_SESSION['login_time'] ?? null
    ]);
}

/**
 * Authenticate request - Returns user info from session
 */
function authenticate() {
    if (!isset($_SESSION['user_id'])) {
        response(null, 'Authentication required', 401);
    }
    
    return [
        'user_id' => $_SESSION['user_id'],
        'user_name' => $_SESSION['user_name'],
        'user_role' => $_SESSION['user_role']
    ];
}
