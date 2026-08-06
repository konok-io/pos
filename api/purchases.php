<?php
/**
 * Purchases API
 * POS System
 */

require_once 'config.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getPurchases();
        break;
    case 'POST':
        createPurchase();
        break;
    case 'DELETE':
        deletePurchase();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get all purchases
 */
function getPurchases() {
    try {
        $db = getDB();
        
        $from = $_GET['from'] ?? '';
        $to = $_GET['to'] ?? '';
        
        $sql = "SELECT p.*, s.name as supplier_name 
                FROM purchases p 
                LEFT JOIN suppliers s ON p.supplier_id = s.id 
                WHERE 1=1";
        $params = [];
        
        if ($from && $to) {
            $sql .= " AND DATE(p.created_at) BETWEEN ? AND ?";
            $params[] = $from;
            $params[] = $to;
        }
        
        $sql .= " ORDER BY p.created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $purchases = $stmt->fetchAll();
        
        // Decode items JSON
        foreach ($purchases as &$purchase) {
            $purchase['items'] = json_decode($purchase['items'], true) ?? [];
        }
        
        response($purchases);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch purchases: ' . $e->getMessage(), 500);
    }
}

/**
 * Create new purchase
 */
function createPurchase() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    $input = @json_decode(file_get_contents('php://input'), true);
    
    $id = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        $items = $input['items'] ?? [];
        $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);
        
        // Generate invoice number
        $invoiceNumber = 'PUR-' . date('Ymd') . '-' . substr($id, 0, 6);
        
        $stmt = $db->prepare("
            INSERT INTO purchases (id, items, subtotal, total, paid, due, supplier_id, invoice_number, user_id, user_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $itemsJson,
            (float)($input['subtotal'] ?? 0),
            (float)($input['total'] ?? 0),
            (float)($input['paid'] ?? 0),
            (float)($input['due'] ?? 0),
            $input['supplier_id'] ?? null,
            $invoiceNumber,
            $auth['user_id'],
            $auth['user_name']
        ]);
        
        // Update product stock and record history
        foreach ($items as $item) {
            // Update or create product
            $stmt = $db->prepare("SELECT id, name, stock FROM products WHERE name = ? LIMIT 1");
            $stmt->execute([$item['name'] ?? '']);
            $product = $stmt->fetch();
            
            if ($product) {
                // Update existing product
                $oldStock = $product['stock'];
                $newStock = $oldStock + (int)($item['qty'] ?? 0);
                
                $stmt = $db->prepare("UPDATE products SET stock = ?, buyP = ?, sellP = ? WHERE id = ?");
                $stmt->execute([
                    $newStock,
                    (float)($item['buyP'] ?? 0),
                    (float)($item['sellP'] ?? $item['buyP'] * 1.3),
                    $product['id']
                ]);
                
                // Record history
                $historyId = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
                $stmt = $db->prepare("
                    INSERT INTO product_history (id, product_id, product_name, type, quantity, stock_before, stock_after, user_id)
                    VALUES (?, ?, ?, 'purchase', ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $historyId,
                    $product['id'],
                    $item['name'] ?? '',
                    (int)($item['qty'] ?? 0),
                    $oldStock,
                    $newStock,
                    $auth['user_id']
                ]);
            }
        }
        
        response([
            'id' => $id,
            'invoice_number' => $invoiceNumber,
            'message' => 'Purchase completed successfully'
        ], null, 201);
        
    } catch (Exception $e) {
        response(null, 'Failed to create purchase: ' . $e->getMessage(), 500);
    }
}

/**
 * Delete purchase
 */
function deletePurchase() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
    if (!in_array($auth['user_role'], ['super_admin', 'admin'])) {
        response(null, 'Permission denied', 403);
    }
    
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        response(null, 'Purchase ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        // Get purchase details
        $stmt = $db->prepare("SELECT * FROM purchases WHERE id = ?");
        $stmt->execute([$id]);
        $purchase = $stmt->fetch();
        
        if (!$purchase) {
            response(null, 'Purchase not found', 404);
        }
        
        // Restore product stock
        $items = json_decode($purchase['items'], true) ?? [];
        foreach ($items as $item) {
            $stmt = $db->prepare("UPDATE products SET stock = stock - ? WHERE name = ?");
            $stmt->execute([(int)($item['qty'] ?? 0), $item['name'] ?? '']);
        }
        
        // Delete purchase
        $stmt = $db->prepare("DELETE FROM purchases WHERE id = ?");
        $stmt->execute([$id]);
        
        response(['message' => 'Purchase deleted successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to delete purchase: ' . $e->getMessage(), 500);
    }
}
