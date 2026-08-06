<?php
/**
 * Users API
 * POS System
 */

require_once 'config.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getUsers();
        break;
    case 'POST':
        createUser();
        break;
    case 'PUT':
        updateUser();
        break;
    case 'DELETE':
        deleteUser();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get all users
 * - Super Admin can see all users including other Super Admins
 * - Admin can see all users EXCEPT Super Admin
 * - Staff can see all users EXCEPT Super Admin
 */
function getUsers() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
    try {
        $db = getDB();
        
        // Super Admin can see all users
        // Admin and Staff can see everyone except Super Admin
        if ($auth['user_role'] === 'super_admin') {
            $stmt = $db->query("SELECT id, name, email, role, phone, status, created_at FROM users ORDER BY created_at DESC");
        } else {
            $stmt = $db->query("SELECT id, name, email, role, phone, status, created_at FROM users WHERE role != 'super_admin' ORDER BY created_at DESC");
        }
        
        $users = $stmt->fetchAll();
        
        response($users);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch users: ' . $e->getMessage(), 500);
    }
}

/**
 * Create new user (super_admin only)
 */
function createUser() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
    if ($auth['user_role'] !== 'super_admin') {
        response(null, 'Permission denied. Super Admin only.', 403);
    }
    
    $input = @json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['email']) || empty($input['password']) || empty($input['name'])) {
        response(null, 'Name, email and password are required', 400);
    }
    
    $id = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        // Check if email already exists
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$input['email']]);
        if ($stmt->fetch()) {
            response(null, 'Email already exists', 400);
        }
        
        $stmt = $db->prepare("
            INSERT INTO users (id, name, email, password, role)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $input['name'],
            $input['email'],
            $input['password'],
            $input['role'] ?? 'operator'
        ]);
        
        $user = [
            'id' => $id,
            'name' => $input['name'],
            'email' => $input['email'],
            'role' => $input['role'] ?? 'operator'
        ];
        
        response($user, null, 201);
        
    } catch (Exception $e) {
        response(null, 'Failed to create user: ' . $e->getMessage(), 500);
    }
}

/**
 * Update user (super_admin only)
 */
function updateUser() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
    if ($auth['user_role'] !== 'super_admin') {
        response(null, 'Permission denied. Super Admin only.', 403);
    }
    
    $input = @json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        response(null, 'User ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        // Check if trying to update super_admin
        $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$input['id']]);
        $user = $stmt->fetch();
        
        if ($user && $user['role'] === 'super_admin') {
            response(null, 'Cannot modify super admin', 400);
        }
        
        $stmt = $db->prepare("
            UPDATE users SET name = ?, email = ?, password = ?, role = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['name'] ?? '',
            $input['email'] ?? '',
            $input['password'] ?? '',
            $input['role'] ?? 'operator',
            $input['id']
        ]);
        
        response(['message' => 'User updated successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to update user: ' . $e->getMessage(), 500);
    }
}

/**
 * Delete user (super_admin only)
 */
function deleteUser() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
    if ($auth['user_role'] !== 'super_admin') {
        response(null, 'Permission denied. Super Admin only.', 403);
    }
    
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        response(null, 'User ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        // Check if trying to delete super_admin
        $stmt = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if ($user && $user['role'] === 'super_admin') {
            response(null, 'Cannot delete super admin', 400);
        }
        
        // Delete user's sessions
        $stmt = $db->prepare("DELETE FROM sessions WHERE user_id = ?");
        $stmt->execute([$id]);
        
        // Delete user
        $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        
        response(['message' => 'User deleted successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to delete user: ' . $e->getMessage(), 500);
    }
}
