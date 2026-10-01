<?php
header('Access-Control-Allow-Origin: *');
require_once __DIR__ . '/routes/productRoutes.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (!handleProductRoutes($path)) {
    http_response_code(404);
    echo json_encode(['error' => 'Route not found']);
}