<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use PDO;

final class ProductRepository
{
    public function all(?string $search = null, ?string $category = null): array
    {
        $pdo = Database::connection();
        $conditions = ['active = 1'];
        $params = [];

        if ($search !== null && $search !== '') {
            $conditions[] = '(name LIKE :search OR description LIKE :search)';
            $params['search'] = '%' . $search . '%';
        }

        if ($category !== null && $category !== '') {
            $conditions[] = 'category = :category';
            $params['category'] = $category;
        }

        $sql = 'SELECT id, name, description, category, price, image, stock
                  FROM products
                 WHERE ' . implode(' AND ', $conditions) . '
                 ORDER BY id DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, name, description, category, price, image, stock
               FROM products
              WHERE id = :id AND active = 1
              LIMIT 1'
        );
        $stmt->execute(['id' => $id]);

        return $stmt->fetch() ?: null;
    }
}
