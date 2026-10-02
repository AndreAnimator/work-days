<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Repositories\ProductRepository;

final class ProductController
{
    public function __construct(
        private ProductRepository $products = new ProductRepository(),
    ) {}

    public function index(Request $request, array $params): void
    {
        $products = $this->products->all(
            $request->query('search'),
            $request->query('category'),
        );

        Response::json(['products' => $products]);
    }

    public function show(Request $request, array $params): void
    {
        $product = $this->products->find((int) $params['id']);

        if (!$product) {
            throw new HttpException(404, 'Produto não encontrado.');
        }

        Response::json(['product' => $product]);
    }
}
