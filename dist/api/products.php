<?php
/**
 * Products API
 * POS System
 */

require_once 'config.php';
require_once 'auth.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getProducts();
        break;
    case 'POST':
        createProduct();
        break;
    case 'PUT':
        updateProduct();
        break;
    case 'DELETE':
        deleteProduct();
        break;
    default:
        response(null, 'Method not allowed', 405);
}

/**
 * Get all products
 */
function getProducts() {
    try {
        $db = getDB();
        
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? '';
        
        $sql = "SELECT * FROM products WHERE 1=1";
        $params = [];
        
        if ($search) {
            $sql .= " AND (name LIKE ? OR barcode LIKE ? OR company LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        if ($category) {
            $sql .= " AND cat = ?";
            $params[] = $category;
        }
        
        $sql .= " ORDER BY name ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();
        
        response($products);
        
    } catch (Exception $e) {
        response(null, 'Failed to fetch products: ' . $e->getMessage(), 500);
    }
}

/**
 * Create new product
 */
function createProduct() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    $input = @json_decode(file_get_contents('php://input'), true);
    
    $id = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
    
    try {
        $db = getDB();
        
        $stmt = $db->prepare("
            INSERT INTO products (id, name, cat, company, stock, buyP, sellP, mrp, unit, barcode, image, minStock)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $id,
            $input['name'] ?? '',
            $input['cat'] ?? '',
            $input['company'] ?? '',
            (int)($input['stock'] ?? 0),
            (float)($input['buyP'] ?? 0),
            (float)($input['sellP'] ?? 0),
            (float)($input['mrp'] ?? 0),
            $input['unit'] ?? 'পিস',
            $input['barcode'] ?? '',
            $input['image'] ?? '',
            (int)($input['minStock'] ?? 0)
        ]);
        
        // Record history
        $historyId = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
        $stmt = $db->prepare("
            INSERT INTO product_history (id, product_id, product_name, type, quantity, stock_before, stock_after, note, user_id)
            VALUES (?, ?, ?, 'purchase', ?, 0, ?, 'Initial stock', ?)
        ");
        $stmt->execute([
            $historyId,
            $id,
            $input['name'] ?? '',
            (int)($input['stock'] ?? 0),
            (int)($input['stock'] ?? 0),
            $auth['user_id']
        ]);
        
        $product = [
            'id' => $id,
            'name' => $input['name'] ?? '',
            'cat' => $input['cat'] ?? '',
            'company' => $input['company'] ?? '',
            'stock' => (int)($input['stock'] ?? 0),
            'buyP' => (float)($input['buyP'] ?? 0),
            'sellP' => (float)($input['sellP'] ?? 0),
            'mrp' => (float)($input['mrp'] ?? 0),
            'unit' => $input['unit'] ?? 'পিস',
            'barcode' => $input['barcode'] ?? '',
            'image' => $input['image'] ?? '',
            'minStock' => (int)($input['minStock'] ?? 0)
        ];
        
        response($product, null, 201);
        
    } catch (Exception $e) {
        response(null, 'Failed to create product: ' . $e->getMessage(), 500);
    }
}

/**
 * Update product
 */
function updateProduct() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    $input = @json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id'])) {
        response(null, 'Product ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        // Get current stock
        $stmt = $db->prepare("SELECT stock FROM products WHERE id = ?");
        $stmt->execute([$input['id']]);
        $current = $stmt->fetch();
        $oldStock = $current ? $current['stock'] : 0;
        $newStock = (int)($input['stock'] ?? $oldStock);
        
        $stmt = $db->prepare("
            UPDATE products SET 
                name = ?, cat = ?, company = ?, stock = ?, buyP = ?, sellP = ?, 
                mrp = ?, unit = ?, barcode = ?, image = ?, minStock = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['name'] ?? '',
            $input['cat'] ?? '',
            $input['company'] ?? '',
            $newStock,
            (float)($input['buyP'] ?? 0),
            (float)($input['sellP'] ?? 0),
            (float)($input['mrp'] ?? 0),
            $input['unit'] ?? 'পিস',
            $input['barcode'] ?? '',
            $input['image'] ?? '',
            (int)($input['minStock'] ?? 0),
            $input['id']
        ]);
        
        // Record history if stock changed
        if ($oldStock !== $newStock) {
            $historyId = uniqid() . '-' . substr(md5(uniqid()), 0, 5);
            $stmt = $db->prepare("
                INSERT INTO product_history (id, product_id, product_name, type, quantity, stock_before, stock_after, note, user_id)
                VALUES (?, ?, ?, 'adjustment', ?, ?, ?, 'Stock adjustment', ?)
            ");
            $stmt->execute([
                $historyId,
                $input['id'],
                $input['name'] ?? '',
                abs($newStock - $oldStock),
                $oldStock,
                $newStock,
                $auth['user_id']
            ]);
        }
        
        response(['message' => 'Product updated successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to update product: ' . $e->getMessage(), 500);
    }
}

/**
 * Delete product
 */
function deleteProduct() {
    $auth = authenticate();
    if (!$auth) {
        response(null, 'Authentication required', 401);
    }
    
    $id = $_GET['id'] ?? '';
    
    if (!$id) {
        response(null, 'Product ID is required', 400);
    }
    
    try {
        $db = getDB();
        
        // Delete history first
        $stmt = $db->prepare("DELETE FROM product_history WHERE product_id = ?");
        $stmt->execute([$id]);
        
        // Delete product
        $stmt = $db->prepare("DELETE FROM products WHERE id = ?");
        $stmt->execute([$id]);
        
        response(['message' => 'Product deleted successfully']);
        
    } catch (Exception $e) {
        response(null, 'Failed to delete product: ' . $e->getMessage(), 500);
    }
}
