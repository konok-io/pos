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
        
        $sql = "SELECT id, code, name, phone, email, address, company, cr_number, vat_number FROM suppliers WHERE 1=1";
        $params = [];
        
        if ($search) {
            $sql .= " AND (name LIKE ? OR phone LIKE ? OR company LIKE ? OR code LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $suppliers = $stmt->fetchAll();
        
        // Transform column names to camelCase for frontend compatibility
        $suppliers = array_map(function($s) {
            return [
                'id' => $s['id'],
                'code' => $s['code'] ?? '',
                'name' => $s['name'],
                'phone' => $s['phone'] ?? '',
                'email' => $s['email'] ?? '',
                'address' => $s['address'] ?? '',
                'company' => $s['company'] ?? '',
                'crNumber' => $s['cr_number'] ?? '',
                'vatNumber' => $s['vat_number'] ?? ''
            ];
        }, $suppliers);
        
        response($suppliers);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch suppliers: ' . $e->getMessage(), 500);
    }
}

/**
 * Create new supplier
 */
function createSupplier() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    $input = @json_decode(file_get_contents('php://input'), true);
    
    $id = $input['id'] ?? uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        // Generate code if not provided
        $code = $input['code'] ?? '';
        if (empty($code)) {
            $stmt = $db->prepare("SELECT code FROM suppliers WHERE code LIKE 'C-%' ORDER BY code DESC LIMIT 1");
            $stmt->execute();
            $last = $stmt->fetch();
            if ($last && preg_match('/C-(\d+)/', $last['code'], $m)) {
                $num = intval($m[1]) + 1;
            } else {
                $num = 1;
            }
            $code = 'C-' . str_pad($num, 5, '0', STR_PAD_LEFT);
        }
        
        $stmt = $db->prepare("
            INSERT INTO suppliers (id, code, name, phone, email, address, company, cr_number, vat_number)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $code,
            $input['name'] ?? '',
            $input['phone'] ?? '',
            $input['email'] ?? '',
            $input['address'] ?? '',
            $input['company'] ?? $input['name'] ?? '',
            $input['crNumber'] ?? $input['cr_number'] ?? '',
            $input['vatNumber'] ?? $input['vat_number'] ?? ''
        ]);
        
        $supplier = [
            'id' => $id,
            'code' => $code,
            'name' => $input['name'] ?? '',
            'phone' => $input['phone'] ?? '',
            'email' => $input['email'] ?? '',
            'address' => $input['address'] ?? '',
            'company' => $input['company'] ?? $input['name'] ?? '',
            'crNumber' => $input['crNumber'] ?? $input['cr_number'] ?? '',
            'vatNumber' => $input['vatNumber'] ?? $input['vat_number'] ?? ''
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
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    $input = @json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        response(null, 'Supplier ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            UPDATE suppliers SET 
                code = ?, name = ?, phone = ?, email = ?, address = ?, company = ?, cr_number = ?, vat_number = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['code'] ?? '',
            $input['name'] ?? '',
            $input['phone'] ?? '',
            $input['email'] ?? '',
            $input['address'] ?? '',
            $input['company'] ?? '',
            $input['crNumber'] ?? $input['cr_number'] ?? '',
            $input['vatNumber'] ?? $input['vat_number'] ?? '',
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
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
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
