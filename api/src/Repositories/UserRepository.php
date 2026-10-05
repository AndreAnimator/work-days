<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use PDO;

final class UserRepository
{
    public function findByEmail(string $email): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT * FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->execute(['email' => mb_strtolower($email)]);
        return $stmt->fetch() ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, name, email, role, created_at FROM users WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public function emailExists(string $email, ?int $exceptId = null): bool
    {
        $sql = 'SELECT 1 FROM users WHERE email = :email';
        $params = ['email' => mb_strtolower($email)];

        if ($exceptId !== null) {
            $sql .= ' AND id <> :id';
            $params['id'] = $exceptId;
        }

        $sql .= ' LIMIT 1';
        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($params);
        return (bool) $stmt->fetchColumn();
    }

    public function create(array $data, ?PDO $pdo = null): array
    {
        $pdo ??= Database::connection();

        $stmt = $pdo->prepare(
            'INSERT INTO users (name, email, password, role, created_at, updated_at)
             VALUES (:name, :email, :password, :role, NOW(), NOW())'
        );
        $stmt->execute([
            'name' => $data['name'],
            'email' => mb_strtolower($data['email']),
            'password' => $data['password'],
            'role' => $data['role'] ?? 'cliente',
        ]);

        return $this->findById((int) $pdo->lastInsertId());
    }

    public function updateProfile(int $id, string $name, string $email): ?array
    {
        $stmt = Database::connection()->prepare(
            'UPDATE users
                SET name = :name, email = :email, updated_at = NOW()
              WHERE id = :id'
        );
        $stmt->execute([
            'id' => $id,
            'name' => $name,
            'email' => mb_strtolower($email),
        ]);

        return $this->findById($id);
    }
}
