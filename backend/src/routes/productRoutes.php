<?php
//Verefica métodos PHP e chma o controller de acordo com o método

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/productController.php';

$controller = new ProductController($pdo);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $controller->index();
    exit;
}

http_response_code(405);

header('Content-Type: application/json');

echo json_encode([
    'error' => 'Método não permitido'
]);