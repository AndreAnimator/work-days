<?php
namespace App\Services;

use App\Core\Database;
use App\Core\HttpException;
use App\Repositories\CartRepository;

final class CartService
{
    public function __construct(
        private CartRepository $carts = new CartRepository(),
    ) {}

    /** Devolve o carrinho do usuário (criando se necessário) com itens e total. */
    public function getForUser(int $userId): array
    {
        $cart  = $this->carts->findOrCreateForUser($userId);
        $items = $this->carts->items((int) $cart['id']);

        return $this->formatCart($cart, $items);
    }

    /**
     * Adiciona N unidades ao carrinho. Se o produto já existir, SOMA
     * a quantidade (regra "carrinho + produto é única").
     */
    public function addItem(int $userId, int $productId, int $quantity): array
    {
        if ($quantity < 1) {
            throw new HttpException(422, 'Dados inválidos.', [
                'quantity' => ['A quantidade mínima é 1.'],
            ]);
        }

        return Database::transaction(function ($pdo) use ($userId, $productId, $quantity) {
            $product = $this->carts->productStock($productId, $pdo);

            if (!$product || !(bool) $product['active']) {
                throw new HttpException(404, 'Produto não encontrado ou indisponível.');
            }
            if ((int) $product['stock'] <= 0) {
                throw new HttpException(422, 'Produto sem estoque.', [
                    'quantity' => ['Este produto está sem estoque.'],
                ]);
            }

            $cart      = $this->carts->findOrCreateForUser($userId, $pdo);
            $items     = $this->carts->items((int) $cart['id'], $pdo);
            $current   = 0;
            foreach ($items as $it) {
                if ((int) $it['product_id'] === $productId) {
                    $current = (int) $it['quantity'];
                    break;
                }
            }

            $desired = $current + $quantity;
            $final   = min($desired, (int) $product['stock']);

            $this->carts->upsertItem((int) $cart['id'], $productId, $final, $pdo);

            $items = $this->carts->items((int) $cart['id'], $pdo);
            return $this->formatCart($cart, $items);
        });
    }

    /** Define a quantidade exata. 0 remove o item. */
    public function updateItem(int $userId, int $productId, int $quantity): array
    {
        if ($quantity < 0) {
            throw new HttpException(422, 'Dados inválidos.', [
                'quantity' => ['A quantidade não pode ser negativa.'],
            ]);
        }

        return Database::transaction(function ($pdo) use ($userId, $productId, $quantity) {
            $cart = $this->carts->findOrCreateForUser($userId, $pdo);

            if ($quantity === 0) {
                $this->carts->deleteItem((int) $cart['id'], $productId, $pdo);
            } else {
                $product = $this->carts->productStock($productId, $pdo);
                if (!$product || !(bool) $product['active']) {
                    throw new HttpException(404, 'Produto não encontrado ou indisponível.');
                }
                if ($quantity > (int) $product['stock']) {
                    throw new HttpException(422, 'Quantidade acima do estoque.', [
                        'quantity' => [
                            'Só há ' . $product['stock'] . ' unidade(s) em estoque.',
                        ],
                    ]);
                }
                $this->carts->upsertItem((int) $cart['id'], $productId, $quantity, $pdo);
            }

            $items = $this->carts->items((int) $cart['id'], $pdo);
            return $this->formatCart($cart, $items);
        });
    }

    public function removeItem(int $userId, int $productId): array
    {
        return Database::transaction(function ($pdo) use ($userId, $productId) {
            $cart = $this->carts->findOrCreateForUser($userId, $pdo);
            $this->carts->deleteItem((int) $cart['id'], $productId, $pdo);

            $items = $this->carts->items((int) $cart['id'], $pdo);
            return $this->formatCart($cart, $items);
        });
    }

    /**
     * Formata o carrinho. Preço e total SEMPRE recalculados no servidor
     * a partir do banco — valores enviados pelo cliente são ignorados.
     */
    private function formatCart(array $cart, array $items): array
    {
        $subtotal = 0.0;
        $formatted = [];

        foreach ($items as $it) {
            $price = (float) $it['price'];
            $qty   = (int)   $it['quantity'];
            $line  = $price * $qty;
            $subtotal += $line;

            $formatted[] = [
                'product_id' => (int) $it['product_id'],
                'name'       => $it['name'],
                'price'      => number_format($price, 2, '.', ''),
                'quantity'   => $qty,
                'subtotal'   => number_format($line, 2, '.', ''),
                'available'  => (bool) $it['active'] && (int) $it['stock'] > 0,
                'stock'      => (int) $it['stock'],
            ];
        }

        return [
            'cart_id'     => (int) $cart['id'],
            'items'       => $formatted,
            'items_count' => array_sum(array_column($formatted, 'quantity')),
            'subtotal'    => number_format($subtotal, 2, '.', ''),
            'total'       => number_format($subtotal, 2, '.', ''),
        ];
    }
}