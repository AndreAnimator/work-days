<?php
namespace App\Repositories;

use App\Core\Database;
use PDO;

final class CartRepository
{
    /** Devolve o carrinho do usuário, criando se ainda não existir. */
    public function findOrCreateForUser(int $userId, ?PDO $pdo = null): array
    {
        $pdo ??= Database::connection();

        $stmt = $pdo->prepare('SELECT * FROM carts WHERE user_id = :uid LIMIT 1');
        $stmt->execute(['uid' => $userId]);
        $cart = $stmt->fetch();
        if ($cart) return $cart;

        $stmt = $pdo->prepare(
            'INSERT INTO carts (user_id, created_at, updated_at)
             VALUES (:uid, NOW(), NOW())'
        );
        $stmt->execute(['uid' => $userId]);

        $id = (int) $pdo->lastInsertId();

        $stmt = $pdo->prepare('SELECT * FROM carts WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    public function items(int $cartId, ?PDO $pdo = null): array
    {
        $pdo ??= Database::connection();
        $stmt = $pdo->prepare(
            'SELECT ci.id, ci.product_id, ci.quantity,
                    p.name, p.price, p.stock, p.active
               FROM cart_items ci
               JOIN products p ON p.id = ci.product_id
              WHERE ci.cart_id = :cid'
        );
        $stmt->execute(['cid' => $cartId]);
        return $stmt->fetchAll();
    }

    public function upsertItem(int $cartId, int $productId, int $quantity, ?PDO $pdo = null): void
    {
        $pdo ??= Database::connection();

        if ($quantity <= 0) {
            $this->deleteItem($cartId, $productId, $pdo);
            return;
        }

        $stmt = $pdo->prepare(
            'INSERT INTO cart_items (cart_id, product_id, quantity)
             VALUES (:cid, :pid, :qty)
             ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)'
        );
        $stmt->execute([
            'cid' => $cartId,
            'pid' => $productId,
            'qty' => $quantity,
        ]);
    }

    public function deleteItem(int $cartId, int $productId, ?PDO $pdo = null): void
    {
        $pdo ??= Database::connection();
        $stmt = $pdo->prepare(
            'DELETE FROM cart_items WHERE cart_id = :cid AND product_id = :pid'
        );
        $stmt->execute(['cid' => $cartId, 'pid' => $productId]);
    }


    public function productStock(int $productId, ?PDO $pdo = null): ?array
    {
        $pdo ??= Database::connection();
        $stmt = $pdo->prepare(
            'SELECT id, name, price, stock, active FROM products WHERE id = :id'
        );
        $stmt->execute(['id' => $productId]);
        return $stmt->fetch() ?: null;
    }
}