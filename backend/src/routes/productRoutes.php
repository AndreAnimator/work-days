<?php
require_once __DIR__ . '/../controllers/productController.php';

function handleProductRoutes(string $path): bool {
    if ($path === '/api/products') {
        listProducts();
        return true;
    }
    return false;
}