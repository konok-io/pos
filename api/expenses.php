<?php
/**
 * Expenses & Incomes API
 * POS System
 */

require_once 'config.php';
require_once 'auth.php';

$type = $_GET['type'] ?? 'expenses';
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        if ($type === 'incomes') {
            getIncomes();
        } else {
            getExpenses();
        }
        break;
    case 'POST':
        if ($type === 'incomes') {
            createIncome();
        } else {
            createExpense();
        }
        break;
    case 'DELETE':
        if ($type === 'incomes') {
            deleteIncome();
        } else {
            deleteExpense();
        }
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get all expenses (stored in expenses table with type='expenses')
 */
function getExpenses() {
    try {
        $db = getDB();
        
        $from = $_GET['from'] ?? '';
        $to = $_GET['to'] ?? '';
        
        // Filter by type='expenses' or type is not set
        $sql = "SELECT * FROM expenses WHERE (type = 'expenses' OR type IS NULL OR type = '')";
        $params = [];
        
        if ($from && $to) {
            $sql .= " AND DATE(created_at) BETWEEN ? AND ?";
            $params[] = $from;
            $params[] = $to;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $expenses = $stmt->fetchAll();
        
        response($expenses);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch expenses: ' . $e->getMessage(), 500);
    }
}

/**
 * Create expense (stored in expenses table with type='expenses')
 */
function createExpense() {
    $auth = authenticate();
    $input = @json_decode(file_get_contents('php://input'), true);
    
    $id = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            INSERT INTO expenses (id, title, amount, note, type, user_id, user_name)
            VALUES (?, ?, ?, ?, 'expenses', ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $input['title'] ?? '',
            (float)($input['amount'] ?? 0),
            $input['note'] ?? '',
            $auth['user_id'],
            $auth['user_name']
        ]);
        
        response(['id' => $id, 'message' => 'Expense added successfully'], null, 201);
        
    } catch (Exception $e) {
        response(null, 'Failed to create expense: ' . $e->getMessage(), 500);
    }
}

/**
 * Delete expense (stored in expenses table with type='expenses')
 */
function deleteExpense() {
    $auth = authenticate();
    
    if (!in_array($auth['user_role'], ['super_admin', 'admin'])) {
        response(null, 'Permission denied', 403);
    }
    
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        response(null, 'Expense ID is required', 400);
    }
    
    try {
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM expenses WHERE id = ? AND (type = 'expenses' OR type IS NULL OR type = '')");
        $stmt->execute([$id]);
        
        response(['message' => 'Expense deleted successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to delete expense: ' . $e->getMessage(), 500);
    }
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
    $input = @json_decode(file_get_contents('php://input'), true);
    
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
