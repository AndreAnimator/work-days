<?php

require_once __DIR__ . '/../models/productModel.php';

class ProductController
{
    private Product $productModel;

    public function __construct(PDO $pdo)
    {
        $this->productModel = new Product($pdo);
    }

    public function index(): void
    {
        $products = $this->productModel->getAll();

        header('Content-Type: application/json');

        echo json_encode($products);
    }
}