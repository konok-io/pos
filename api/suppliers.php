<?php
/**
 * Suppliers API
 * POS System
 */

require_once 'config.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getSuppliers();
        break;
    case 'POST':
        createSupplier();
        break;
    case 'PUT':
        updateSupplier();
        break;
    case 'DELETE':
        deleteSupplier();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get all suppliers
 */
function getSuppliers() {
    try {
        $db = getDB();
        
        $search = $_GET['search'] ?? '';
        
        $sql = "SELECT * FROM suppliers WHERE 1=1";
        $params = [];
        
        if ($search) {
            $sql .= " AND (name LIKE ? OR phone LIKE ? OR company LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $suppliers = $stmt->fetchAll();
        
        response($suppliers);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch suppliers: ' . $e->getMessage(), 500);
    }
}

/**
 * Create new supplier
 */
function createSupplier() {
    authenticate();
    $input = @json_decode(file_get_contents('php://input'), true);
    
    $id = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            INSERT INTO suppliers (id, name, phone, email, address, company)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $input['name'] ?? '',
            $input['phone'] ?? '',
            $input['email'] ?? '',
            $input['address'] ?? '',
            $input['company'] ?? ''
        ]);
        
        $supplier = [
            'id' => $id,
            'name' => $input['name'] ?? '',
            'phone' => $input['phone'] ?? '',
            'email' => $input['email'] ?? '',
            'address' => $input['address'] ?? '',
            'company' => $input['company'] ?? ''
        ];
        
        response($supplier, null, 201);
        
    } catch (Exception $e) {
        response(null, 'Failed to create supplier: ' . $e->getMessage(), 500);
    }
}

/**
 * Update supplier
 */
function updateSupplier() {
    authenticate();
    $input = @json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        response(null, 'Supplier ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            UPDATE suppliers SET 
                name = ?, phone = ?, email = ?, address = ?, company = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['name'] ?? '',
            $input['phone'] ?? '',
            $input['email'] ?? '',
            $input['address'] ?? '',
            $input['company'] ?? '',
            $input['id']
        ]);
        
        response(['message' => 'Supplier updated successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to update supplier: ' . $e->getMessage(), 500);
    }
}

/**
 * Delete supplier
 */
function deleteSupplier() {
    authenticate();
    
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        response(null, 'Supplier ID is required', 400);
    }
    
    try {
        $db = getDB();
        $stmt = $db->prepare("DELETE FROM suppliers WHERE id = ?");
        $stmt->execute([$id]);
        
        response(['message' => 'Supplier deleted successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to delete supplier: ' . $e->getMessage(), 500);
    }
}
