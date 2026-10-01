<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Services\CartService;

final class CartController
{
    public function __construct(
        private CartService $carts = new CartService(),
    ) {}

    /** GET /api/cart */
    public function show(Request $request, array $params): void
    {
        Response::json($this->carts->getForUser((int) $request->userId()));
    }

    /** POST /api/cart/items  body: { product_id, quantity } */
    public function addItem(Request $request, array $params): void
    {
        $productId = (int) $request->input('product_id');
        $quantity  = (int) $request->input('quantity', 1);

        Response::json(
            $this->carts->addItem((int) $request->userId(), $productId, $quantity),
            201
        );
    }

    /** PATCH /api/cart/items/{productId}  body: { quantity } */
    public function updateItem(Request $request, array $params): void
    {
        $productId = (int) $params['productId'];
        $quantity  = (int) $request->input('quantity');

        Response::json(
            $this->carts->updateItem((int) $request->userId(), $productId, $quantity)
        );
    }

    /** DELETE /api/cart/items/{productId} */
    public function removeItem(Request $request, array $params): void
    {
        Response::json(
            $this->carts->removeItem((int) $request->userId(), (int) $params['productId'])
        );
    }
}