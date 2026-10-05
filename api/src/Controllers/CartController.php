<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Services\CartService;

final class CartController
{
    public function __construct(
        private CartService $carts = new CartService(),
    ) {}

    public function show(Request $request, array $params): void
    {
        Response::json($this->carts->getForUser($this->requireUserId($request)));
    }

    public function addItem(Request $request, array $params): void
    {
        $productId = $this->positiveInt($request->input('product_id'), 'product_id');
        $quantity = $this->positiveInt($request->input('quantity', 1), 'quantity');

        Response::json(
            $this->carts->addItem($this->requireUserId($request), $productId, $quantity),
            201
        );
    }

    public function updateItem(Request $request, array $params): void
    {
        $productId = $this->positiveInt($params['productId'] ?? null, 'productId');
        $quantity = $this->nonNegativeInt($request->input('quantity'), 'quantity');

        Response::json(
            $this->carts->updateItem($this->requireUserId($request), $productId, $quantity)
        );
    }

    public function removeItem(Request $request, array $params): void
    {
        $productId = $this->positiveInt($params['productId'] ?? null, 'productId');

        Response::json(
            $this->carts->removeItem($this->requireUserId($request), $productId)
        );
    }

    private function requireUserId(Request $request): int
    {
        $id = $request->userId();
        if ($id === null || $id < 1) {
            throw new HttpException(401, 'Usuário não autenticado.');
        }
        return $id;
    }

    private function positiveInt(mixed $value, string $field): int
    {
        $number = filter_var($value, FILTER_VALIDATE_INT);
        if ($number === false || $number < 1 || (is_string($value) && !preg_match('/^[1-9]\d*$/', $value))) {
            throw new HttpException(422, 'Dados inválidos.', [
                $field => ['O valor deve ser um número inteiro positivo.'],
            ]);
        }
        return (int) $number;
    }

    private function nonNegativeInt(mixed $value, string $field): int
    {
        if ($value === null || $value === '' || is_bool($value)) {
            throw new HttpException(422, 'Dados inválidos.', [
                $field => ['O campo é obrigatório e deve ser um número inteiro maior ou igual a zero.'],
            ]);
        }

        $number = filter_var($value, FILTER_VALIDATE_INT);
        if ($number === false || $number < 0 || (is_string($value) && !preg_match('/^\d+$/', $value))) {
            throw new HttpException(422, 'Dados inválidos.', [
                $field => ['O valor deve ser um número inteiro maior ou igual a zero.'],
            ]);
        }
        return (int) $number;
    }
}
