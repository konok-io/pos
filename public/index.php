<?php
// POS System - Redirect to pos.html
$posFile = __DIR__ . '/pos.html';
if (file_exists($posFile)) {
    readfile($posFile);
} else {
    echo "pos.html not found!";
}
