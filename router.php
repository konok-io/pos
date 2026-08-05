<?php
/**
 * POS System Router
 * Serves frontend app and proxies API requests
 * 
 * Usage: php -S localhost:8080 router.php
 */

// Get the request URI
$uri = $_SERVER['REQUEST_URI'];

// API routes - forward to appropriate PHP file
if (strpos($uri, '/api/') === 0) {
    // Extract the API endpoint
    $apiPath = parse_url($uri, PHP_URL_PATH);
    $apiFile = __DIR__ . $apiPath;
    
    // If the file doesn't exist with .php extension, try adding it
    if (!file_exists($apiFile)) {
        $apiFile = $apiFile . '.php';
    }
    
    if (file_exists($apiFile) && is_file($apiFile)) {
        include $apiFile;
        return;
    }
    
    // API endpoint not found
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'API endpoint not found: ' . $uri]);
    return;
}

// Serve frontend app (SPA)
$indexFile = __DIR__ . '/dist/index.html';
if (file_exists($indexFile)) {
    // Check if it's a file request (for JS/CSS assets)
    $distPath = __DIR__ . '/dist' . parse_url($uri, PHP_URL_PATH);
    
    if (file_exists($distPath) && is_file($distPath)) {
        // Serve the static file
        $mimeTypes = [
            '.js' => 'application/javascript',
            '.css' => 'text/css',
            '.html' => 'text/html',
            '.json' => 'application/json',
            '.png' => 'image/png',
            '.jpg' => 'image/jpeg',
            '.svg' => 'image/svg+xml',
            '.ico' => 'image/x-icon',
            '.woff' => 'font/woff',
            '.woff2' => 'font/woff2',
            '.ttf' => 'font/ttf',
        ];
        
        $ext = strtolower(pathinfo($distPath, PATHINFO_EXTENSION));
        $mime = $mimeTypes['.' . $ext] ?? 'application/octet-stream';
        
        header('Content-Type: ' . $mime);
        readfile($distPath);
        return;
    }
    
    // For all other routes, serve the SPA index.html
    header('Content-Type: text/html; charset=utf-8');
    readfile($indexFile);
    return;
}

// Not found
http_response_code(404);
echo "Not Found";
