<?php
/**
 * Incomes API
 * POS System
 * 
 * This file provides a dedicated API endpoint for incomes.
 * Incomes are stored in the expenses table with type='incomes'.
 */

require_once 'config.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getIncomes();
        break;
    case 'POST':
        createIncome();
        break;
    case 'DELETE':
        deleteIncome();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get all incomes (stored in expenses table with type='incomes')
 */
function getIncomes() {
    try {
        $db = getDB();
        
        $from = $_GET['from'] ?? '';
        $to = $_GET['to'] ?? '';
        
        // Use expenses table with type='incomes'
        $sql = "SELECT * FROM expenses WHERE type = 'incomes'";
        $params = [];
        
        if ($from && $to) {
            $sql .= " AND DATE(created_at) BETWEEN ? AND ?";
            $params[] = $from;
            $params[] = $to;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $incomes = $stmt->fetchAll();
        
        response($incomes);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch incomes: ' . $e->getMessage(), 500);
    }
}

/**
 * Create income (stored in expenses table with type='incomes')
 */
function createIncome() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
    $input = @json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        response(null, 'Invalid JSON input', 400);
    }
    
    $id = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            INSERT INTO expenses (id, title, amount, note, type, user_id, user_name)
            VALUES (?, ?, ?, ?, 'incomes', ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $input['title'] ?? '',
            (float)($input['amount'] ?? 0),
            $input['note'] ?? '',
            $auth['user_id'],
            $auth['user_name']
        ]);
        
        response(['id' => $id, 'message' => 'Income added successfully'], null, 201);
        
    } catch (Exception $e) {
        response(null, 'Failed to create income: ' . $e->getMessage(), 500);
    }
}

/**
 * Delete income (stored in expenses table with type='incomes')
 */
function deleteIncome() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
    if (!in_array($auth['user_role'], ['super_admin', 'admin'])) {
        response(null, 'Permission denied', 403);
    }
    
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        response(null, 'Income ID is required', 400);
    }
    
    try {
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM expenses WHERE id = ? AND type = 'incomes'");
        $stmt->execute([$id]);
        
        response(['message' => 'Income deleted successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to delete income: ' . $e->getMessage(), 500);
    }
}
