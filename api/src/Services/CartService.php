<?php
declare(strict_types=1);

namespace App\Services;

use App\Core\Database;
use App\Core\HttpException;
use App\Repositories\CartRepository;

final class CartService
{
    public function __construct(
        private CartRepository $carts = new CartRepository(),
    ) {}

    /** Devolve o carrinho persistido da conta com preços/estoque atuais do servidor. */
    public function getForUser(int $userId): array
    {
        $cart = $this->carts->findOrCreateForUser($userId);
        $items = $this->carts->items((int) $cart['id']);

        return $this->formatCart($cart, $items);
    }

    /**
     * Adiciona N unidades ao carrinho. A quantidade existente é lida do banco
     * e o estoque do produto é bloqueado durante toda a operação.
     */
    public function addItem(int $userId, int $productId, int $quantity): array
    {
        if ($quantity < 1) {
            throw new HttpException(422, 'Dados inválidos.', [
                'quantity' => ['A quantidade mínima é 1.'],
            ]);
        }

        return Database::transaction(function ($pdo) use ($userId, $productId, $quantity) {
            $product = $this->carts->productStock($productId, $pdo, true);

            if (!$product || !(bool) $product['active']) {
                throw new HttpException(404, 'Produto não encontrado ou indisponível.');
            }

            $stock = (int) $product['stock'];
            if ($stock <= 0) {
                throw new HttpException(422, 'Produto sem estoque.', [
                    'quantity' => ['Este produto está sem estoque.'],
                ]);
            }

            $cart = $this->carts->findOrCreateForUser($userId, $pdo);
            $items = $this->carts->items((int) $cart['id'], $pdo);
            $current = 0;

            foreach ($items as $item) {
                if ((int) $item['product_id'] === $productId) {
                    $current = (int) $item['quantity'];
                    break;
                }
            }

            $desired = $current + $quantity;
            if ($desired > $stock) {
                throw new HttpException(422, 'Quantidade acima do estoque.', [
                    'quantity' => [
                        "Só há {$stock} unidade(s) em estoque e o carrinho já possui {$current}.",
                    ],
                ]);
            }

            $this->carts->upsertItem((int) $cart['id'], $productId, $desired, $pdo);

            return $this->formatCart(
                $cart,
                $this->carts->items((int) $cart['id'], $pdo)
            );
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
                $product = $this->carts->productStock($productId, $pdo, true);

                if (!$product || !(bool) $product['active']) {
                    throw new HttpException(404, 'Produto não encontrado ou indisponível.');
                }

                if ($quantity > (int) $product['stock']) {
                    throw new HttpException(422, 'Quantidade acima do estoque.', [
                        'quantity' => [
                            'Só há ' . (int) $product['stock'] . ' unidade(s) em estoque.',
                        ],
                    ]);
                }

                $this->carts->upsertItem((int) $cart['id'], $productId, $quantity, $pdo);
            }

            return $this->formatCart(
                $cart,
                $this->carts->items((int) $cart['id'], $pdo)
            );
        });
    }

    public function removeItem(int $userId, int $productId): array
    {
        return Database::transaction(function ($pdo) use ($userId, $productId) {
            $cart = $this->carts->findOrCreateForUser($userId, $pdo);
            $this->carts->deleteItem((int) $cart['id'], $productId, $pdo);

            return $this->formatCart(
                $cart,
                $this->carts->items((int) $cart['id'], $pdo)
            );
        });
    }

    /**
     * Todos os preços, subtotais e o total são calculados aqui, usando apenas
     * os dados atuais do banco. Nenhum preço/total enviado pelo cliente é aceito.
     */
    private function formatCart(array $cart, array $items): array
    {
        $subtotalCents = 0;
        $formatted = [];

        foreach ($items as $item) {
            $priceCents = (int) round(((float) $item['price']) * 100);
            $quantity = (int) $item['quantity'];
            $lineCents = $priceCents * $quantity;
            $stock = (int) $item['stock'];
            $active = (bool) $item['active'];

            $availability = 'available';
            if (!$active) {
                $availability = 'inactive';
            } elseif ($stock <= 0) {
                $availability = 'out_of_stock';
            } elseif ($quantity > $stock) {
                $availability = 'quantity_exceeds_stock';
            }

            $subtotalCents += $lineCents;

            $formatted[] = [
                'product_id' => (int) $item['product_id'],
                'name' => $item['name'],
                'image' => $item['image'] ?? null,
                'price' => $this->money($priceCents),
                'quantity' => $quantity,
                'subtotal' => $this->money($lineCents),
                'available' => $availability === 'available',
                'availability' => $availability,
                'stock' => $stock,
            ];
        }

        return [
            'cart_id' => (int) $cart['id'],
            'items' => $formatted,
            'items_count' => array_sum(array_column($formatted, 'quantity')),
            'subtotal' => $this->money($subtotalCents),
            'total' => $this->money($subtotalCents),
        ];
    }

    private function money(int $cents): string
    {
        return number_format($cents / 100, 2, '.', '');
    }
}
