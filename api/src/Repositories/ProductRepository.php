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

    public function allForAdmin(): array
    {
        $stmt = Database::connection()->query(
            'SELECT id, name, description, category, price, image, stock, active
               FROM products
              ORDER BY id DESC'
        );
        return $stmt->fetchAll();
    }

    public function create(array $data): array
    {
        $pdo = Database::connection();
        $stmt = $pdo->prepare(
            'INSERT INTO products (name, description, category, price, image, stock, active)
             VALUES (:name, :description, :category, :price, :image, :stock, :active)'
        );
        $stmt->execute([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'],
            'price' => $data['price'],
            'image' => $data['image'] ?? null,
            'stock' => $data['stock'],
            'active' => $data['active'] ?? true,
        ]);

        return $this->findAdmin((int) $pdo->lastInsertId());
    }

    public function update(int $id, array $data): ?array
    {
        if ($this->findAdmin($id) === null) return null;

        $allowed = ['name', 'description', 'category', 'price', 'image', 'stock', 'active'];
        $fields = [];
        $params = ['id' => $id];

        foreach ($allowed as $field) {
            if (!array_key_exists($field, $data)) continue;
            $fields[] = "{$field} = :{$field}";
            $params[$field] = $data[$field];
        }

        if ($fields !== []) {
            $sql = 'UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = :id';
            $stmt = Database::connection()->prepare($sql);
            $stmt->execute($params);
        }

        return $this->findAdmin($id);
    }

    public function delete(int $id): bool
    {
        $stmt = Database::connection()->prepare('DELETE FROM products WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    private function findAdmin(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, name, description, category, price, image, stock, active
               FROM products WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
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
