<?php
$posFile = __DIR__ . '/pos.html';
if (file_exists($posFile)) {
    readfile($posFile);
}
