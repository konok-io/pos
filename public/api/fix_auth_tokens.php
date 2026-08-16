<?php
/**
 * Fix auth_tokens table - add missing columns
 */

require_once 'config.php';

header('Content-Type: text/plain; charset=utf-8');

$db = getDB();

echo "Checking auth_tokens table...\n\n";

// Get current columns
echo "Current columns:\n";
try {
    $stmt = $db->query("PRAGMA table_info(auth_tokens)");
    $columns = $stmt->fetchAll();
    foreach ($columns as $col) {
        echo "  - " . $col['name'] . " (" . $col['type'] . ")\n";
    }
} catch (Exception $e) {
    echo "  Error: " . $e->getMessage() . "\n";
}

// Add missing columns
echo "\nAdding missing columns...\n";

$alterations = [
    "ALTER TABLE auth_tokens ADD COLUMN user_name TEXT",
    "ALTER TABLE auth_tokens ADD COLUMN user_email TEXT",
    "ALTER TABLE auth_tokens ADD COLUMN user_role TEXT"
];

foreach ($alterations as $sql) {
    try {
        $db->exec($sql);
        echo "  ✅ Success: " . substr($sql, 0, 50) . "...\n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'duplicate column') !== false) {
            echo "  ⏭️  Already exists: " . substr($sql, 0, 50) . "...\n";
        } else {
            echo "  ❌ Error: " . $e->getMessage() . "\n";
        }
    }
}

echo "\nDone! Try logging in again.\n";
