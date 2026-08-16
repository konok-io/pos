<?php
/**
 * Categories API
 * POS System
 */

require_once 'config.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getCategories();
        break;
    case 'POST':
        createCategory();
        break;
    case 'PUT':
        updateCategory();
        break;
    case 'DELETE':
        deleteCategory();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get all categories
 */
function getCategories() {
    try {
        $db = getDB();
        $stmt = $db->query("SELECT * FROM categories ORDER BY name ASC");
        $categories = $stmt->fetchAll();
        
        response($categories);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch categories: ' . $e->getMessage(), 500);
    }
}

/**
 * Create new category
 */
function createCategory() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    $input = @json_decode(file_get_contents('php://input'), true);
    
    $id = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            INSERT INTO categories (id, name, company)
            VALUES (?, ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $input['name'] ?? '',
            $input['company'] ?? ''
        ]);
        
        $category = [
            'id' => $id,
            'name' => $input['name'] ?? '',
            'company' => $input['company'] ?? ''
        ];
        
        response($category, null, 201);
        
    } catch (Exception $e) {
        response(null, 'Failed to create category: ' . $e->getMessage(), 500);
    }
}

/**
 * Update category
 */
function updateCategory() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    $input = @json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        response(null, 'Category ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            UPDATE categories SET name = ?, company = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['name'] ?? '',
            $input['company'] ?? '',
            $input['id']
        ]);
        
        response(['message' => 'Category updated successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to update category: ' . $e->getMessage(), 500);
    }
}

/**
 * Delete category
 */
function deleteCategory() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        response(null, 'Category ID is required', 400);
    }
    
    try {
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        
        response(['message' => 'Category deleted successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to delete category: ' . $e->getMessage(), 500);
    }
}
