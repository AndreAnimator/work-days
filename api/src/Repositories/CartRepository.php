<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use PDO;

final class CartRepository
{
    /**
     * Retorna o único carrinho da conta, criando-o de forma atômica.
     * A chave UNIQUE carts.user_id é a garantia de integridade no banco.
     */
    public function findOrCreateForUser(int $userId, ?PDO $pdo = null): array
    {
        $pdo ??= Database::connection();

        // ON DUPLICATE KEY evita corrida entre duas requisições/dispositivos
        // do mesmo usuário tentando criar o primeiro carrinho simultaneamente.
        $stmt = $pdo->prepare(
            'INSERT INTO carts (user_id, created_at, updated_at)
             VALUES (:uid, NOW(), NOW())
             ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)'
        );
        $stmt->execute(['uid' => $userId]);

        $stmt = $pdo->prepare('SELECT * FROM carts WHERE user_id = :uid LIMIT 1');
        $stmt->execute(['uid' => $userId]);
        return $stmt->fetch() ?: throw new \RuntimeException('Não foi possível obter o carrinho do usuário.');
    }

    public function items(int $cartId, ?PDO $pdo = null): array
    {
        $pdo ??= Database::connection();
        $stmt = $pdo->prepare(
            'SELECT ci.id, ci.product_id, ci.quantity,
                    p.name, p.price, p.image, p.stock, p.active
               FROM cart_items ci
               JOIN products p ON p.id = ci.product_id
              WHERE ci.cart_id = :cid
              ORDER BY ci.id ASC'
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

    /**
     * Busca o produto e, quando chamada dentro de uma transação, bloqueia a
     * linha até o fim dela. Isso evita duas sessões ultrapassarem o estoque.
     */
    public function productStock(int $productId, ?PDO $pdo = null, bool $forUpdate = false): ?array
    {
        $pdo ??= Database::connection();
        $sql =
            'SELECT id, name, price, stock, active
               FROM products
              WHERE id = :id
              LIMIT 1';

        if ($forUpdate) {
            $sql .= ' FOR UPDATE';
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $productId]);
        return $stmt->fetch() ?: null;
    }
}
