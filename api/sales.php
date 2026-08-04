<?php
/**
 * Sales API
 * POS System
 */

require_once 'config.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getSales();
        break;
    case 'POST':
        createSale();
        break;
    case 'DELETE':
        deleteSale();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get all sales
 */
function getSales() {
    try {
        $db = getDB();
        
        $date = $_GET['date'] ?? '';
        $from = $_GET['from'] ?? '';
        $to = $_GET['to'] ?? '';
        
        $sql = "SELECT s.*, c.name as customer_name 
                FROM sales s 
                LEFT JOIN customers c ON s.customer_id = c.id 
                WHERE 1=1";
        $params = [];
        
        if ($date) {
            $sql .= " AND DATE(s.created_at) = ?";
            $params[] = $date;
        }
        
        if ($from && $to) {
            $sql .= " AND DATE(s.created_at) BETWEEN ? AND ?";
            $params[] = $from;
            $params[] = $to;
        }
        
        $sql .= " ORDER BY s.created_at DESC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $sales = $stmt->fetchAll();
        
        // Decode items JSON
        foreach ($sales as &$sale) {
            $sale['items'] = json_decode($sale['items'], true) ?? [];
        }
        
        response($sales);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch sales: ' . $e->getMessage(), 500);
    }
}

/**
 * Create new sale
 */
function createSale() {
    $auth = authenticate();
    $input = json_decode(file_get_contents('php://input'), true);
    
    $id = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        $items = $input['items'] ?? [];
        $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);
        
        // Generate invoice number
        $invoiceNumber = 'INV-' . date('Ymd') . '-' . substr($id, 0, 6);
        
        $stmt = $db->prepare("
            INSERT INTO sales (id, items, subtotal, discount, total, vat, vatRate, paid, due, customer_id, payment_method, invoice_number, user_id, user_name)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $itemsJson,
            (float)($input['subtotal'] ?? 0),
            (float)($input['discount'] ?? 0),
            (float)($input['total'] ?? 0),
            (float)($input['vat'] ?? 0),
            (float)($input['vatRate'] ?? 0),
            (float)($input['paid'] ?? 0),
            (float)($input['due'] ?? 0),
            $input['customer_id'] ?? null,
            $input['payment_method'] ?? 'cash',
            $invoiceNumber,
            $auth['user_id'],
            $auth['user_name']
        ]);
        
        // Update product stock and record history
        foreach ($items as $item) {
            // Update stock
            $stmt = $db->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");
            $stmt->execute([(int)($item['qty'] ?? 0), $item['id']]);
            
            // Get current stock for history
            $stmt = $db->prepare("SELECT name, stock FROM products WHERE id = ?");
            $stmt->execute([$item['id']]);
            $product = $stmt->fetch();
            
            if ($product) {
                $historyId = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
                $stmt = $db->prepare("
                    INSERT INTO product_history (id, product_id, product_name, type, quantity, stock_before, stock_after, user_id)
                    VALUES (?, ?, ?, 'sale', ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $historyId,
                    $item['id'],
                    $product['name'],
                    (int)($item['qty'] ?? 0),
                    $product['stock'],
                    $product['stock'] - (int)($item['qty'] ?? 0),
                    $auth['user_id']
                ]);
            }
        }
        
        // Update customer balance if there's due
        if (!empty($input['customer_id']) && ($input['due'] ?? 0) > 0) {
            $stmt = $db->prepare("UPDATE customers SET balance = balance + ? WHERE id = ?");
            $stmt->execute([(float)($input['due'] ?? 0), $input['customer_id']]);
        }
        
        response([
            'id' => $id,
            'invoice_number' => $invoiceNumber,
            'message' => 'Sale completed successfully'
        ], null, 201);
        
    } catch (Exception $e) {
        response(null, 'Failed to create sale: ' . $e->getMessage(), 500);
    }
}

/**
 * Delete sale
 */
function deleteSale() {
    $auth = authenticate();
    
    // Only super_admin and admin can delete sales
    if (!in_array($auth['user_role'], ['super_admin', 'admin'])) {
        response(null, 'Permission denied', 403);
    }
    
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        response(null, 'Sale ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        // Get sale details
        $stmt = $db->prepare("SELECT * FROM sales WHERE id = ?");
        $stmt->execute([$id]);
        $sale = $stmt->fetch();
        
        if (!$sale) {
            response(null, 'Sale not found', 404);
        }
        
        // Restore product stock
        $items = json_decode($sale['items'], true) ?? [];
        foreach ($items as $item) {
            $stmt = $db->prepare("UPDATE products SET stock = stock + ? WHERE id = ?");
            $stmt->execute([(int)($item['qty'] ?? 0), $item['id']]);
        }
        
        // Update customer balance
        if ($sale['customer_id'] && $sale['due'] > 0) {
            $stmt = $db->prepare("UPDATE customers SET balance = balance - ? WHERE id = ?");
            $stmt->execute([$sale['due'], $sale['customer_id']]);
        }
        
        // Delete sale
        $stmt = $db->prepare("DELETE FROM sales WHERE id = ?");
        $stmt->execute([$id]);
        
        response(['message' => 'Sale deleted successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to delete sale: ' . $e->getMessage(), 500);
    }
}
