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

    /** GET /api/products?search=&category=&sort=newest|price_asc|price_desc */
    public function index(Request $request, array $params): void
    {
        // Só aceita texto simples (ignora formatos como ?search[]=x)
        $search   = $this->textQuery($request, 'search');
        $category = $this->textQuery($request, 'category');
        $sort     = $this->textQuery($request, 'sort') ?? ProductRepository::DEFAULT_SORT;

        if (!array_key_exists($sort, ProductRepository::SORTS)) {
            throw new HttpException(422, 'Dados inválidos.', [
                'sort' => ['Ordenação inválida. Use: ' . implode(', ', array_keys(ProductRepository::SORTS)) . '.'],
            ]);
        }

        Response::json([
            'products' => $this->products->all($search, $category, $sort),
        ]);
    }

    private function textQuery(Request $request, string $key): ?string
    {
        $value = $request->query($key);

        return is_string($value) && trim($value) !== '' ? trim($value) : null;
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
