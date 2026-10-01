<?php
require_once __DIR__ . '/../models/productModel.php';

function listProducts(): void {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(getAllProducts());
}