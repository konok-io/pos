<?php
/**
 * Customers API
 * POS System
 */

require_once 'config.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getCustomers();
        break;
    case 'POST':
        createCustomer();
        break;
    case 'PUT':
        updateCustomer();
        break;
    case 'DELETE':
        deleteCustomer();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get all customers
 */
function getCustomers() {
    try {
        $db = getDB();
        
        $search = $_GET['search'] ?? '';
        
        $sql = "SELECT * FROM customers WHERE 1=1";
        $params = [];
        
        if ($search) {
            $sql .= " AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $customers = $stmt->fetchAll();
        
        response($customers);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch customers: ' . $e->getMessage(), 500);
    }
}

/**
 * Create new customer
 */
function createCustomer() {
    authenticate();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $id = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            INSERT INTO customers (id, name, phone, address, email, balance)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $input['name'] ?? '',
            $input['phone'] ?? '',
            $input['address'] ?? '',
            $input['email'] ?? '',
            (float)($input['balance'] ?? 0)
        ]);
        
        $customer = [
            'id' => $id,
            'name' => $input['name'] ?? '',
            'phone' => $input['phone'] ?? '',
            'address' => $input['address'] ?? '',
            'email' => $input['email'] ?? '',
            'balance' => (float)($input['balance'] ?? 0)
        ];
        
        response($customer, null, 201);
        
    } catch (Exception $e) {
        response(null, 'Failed to create customer: ' . $e->getMessage(), 500);
    }
}

/**
 * Update customer
 */
function updateCustomer() {
    authenticate();
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        response(null, 'Customer ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            UPDATE customers SET 
                name = ?, phone = ?, address = ?, email = ?, balance = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['name'] ?? '',
            $input['phone'] ?? '',
            $input['address'] ?? '',
            $input['email'] ?? '',
            (float)($input['balance'] ?? 0),
            $input['id']
        ]);
        
        response(['message' => 'Customer updated successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to update customer: ' . $e->getMessage(), 500);
    }
}

/**
 * Delete customer
 */
function deleteCustomer() {
    authenticate();
    
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        response(null, 'Customer ID is required', 400);
    }
    
    try {
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM customers WHERE id = ?");
        $stmt->execute([$id]);
        
        response(['message' => 'Customer deleted successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to delete customer: ' . $e->getMessage(), 500);
    }
}
