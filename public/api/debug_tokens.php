<?php
/**
 * Debug auth tokens
 */

require_once 'config.php';

header('Content-Type: text/plain; charset=utf-8');

$db = getDB();

// Check tables
echo "Tables:\n";
$tables = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
foreach ($tables as $t) {
    echo "  - " . $t['name'] . "\n";
}

// Check auth_tokens
echo "\nAuth tokens:\n";
try {
    $stmt = $db->query("SELECT * FROM auth_tokens");
    $tokens = $stmt->fetchAll();
    if (count($tokens) === 0) {
        echo "  No tokens found\n";
    }
    foreach ($tokens as $t) {
        echo "  Token: " . substr($t['token'], 0, 20) . "...\n";
        echo "  User: " . $t['user_name'] . "\n";
        echo "  Expires: " . $t['expires_at'] . "\n";
        echo "  Now: " . date('Y-m-d H:i:s') . "\n";
    }
} catch (Exception $e) {
    echo "  Error: " . $e->getMessage() . "\n";
}

// Test query
echo "\nTest datetime('now'):\n";
try {
    $stmt = $db->query("SELECT datetime('now') as now");
    $result = $stmt->fetch();
    echo "  Result: " . $result['now'] . "\n";
} catch (Exception $e) {
    echo "  Error: " . $e->getMessage() . "\n";
}
