<?php
namespace App\Repositories;

use App\Core\Database;
use PDO;

final class CartRepository
{
    public function findByToken(string $token, ?PDO $pdo = null): ?array
    {
        $pdo ??= Database::connection();
        $stmt = $pdo->prepare(
            'SELECT * FROM carts WHERE token = :token AND user_id IS NULL LIMIT 1'
        );
        $stmt->execute(['token' => $token]);
        return $stmt->fetch() ?: null;
    }

    public function findOrCreateForUser(int $userId, ?PDO $pdo = null): array
    {
        $pdo ??= Database::connection();

        $stmt = $pdo->prepare('SELECT * FROM carts WHERE user_id = :uid LIMIT 1');
        $stmt->execute(['uid' => $userId]);
        $cart = $stmt->fetch();
        if ($cart) return $cart;

        $stmt = $pdo->prepare(
            'INSERT INTO carts (user_id, token, created_at, updated_at)
             VALUES (:uid, NULL, NOW(), NOW())
             RETURNING *'
        );
        $stmt->execute(['uid' => $userId]);
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
             ON CONFLICT (cart_id, product_id)
             DO UPDATE SET quantity = EXCLUDED.quantity'
        );
        $stmt->execute(['cid' => $cartId, 'pid' => $productId, 'qty' => $quantity]);
    }

    public function deleteItem(int $cartId, int $productId, ?PDO $pdo = null): void
    {
        $pdo ??= Database::connection();
        $stmt = $pdo->prepare(
            'DELETE FROM cart_items WHERE cart_id = :cid AND product_id = :pid'
        );
        $stmt->execute(['cid' => $cartId, 'pid' => $productId]);
    }

    public function destroy(int $cartId, ?PDO $pdo = null): void
    {
        $pdo ??= Database::connection();
        $pdo->prepare('DELETE FROM carts WHERE id = :id')->execute(['id' => $cartId]);
    }

    public function productStock(int $productId, ?PDO $pdo = null): ?array
    {
        $pdo ??= Database::connection();
        $stmt = $pdo->prepare('SELECT id, name, stock, active FROM products WHERE id = :id');
        $stmt->execute(['id' => $productId]);
        return $stmt->fetch() ?: null;
    }
}