<?php
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

    public function emailExists(string $email): bool
    {
        $stmt = Database::connection()->prepare(
            'SELECT 1 FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->execute(['email' => mb_strtolower($email)]);
        return (bool) $stmt->fetchColumn();
    }

    public function create(array $data, ?PDO $pdo = null): array
    {
        $pdo ??= Database::connection();

        $stmt = $pdo->prepare(
            'INSERT INTO users (name, email, password, role, created_at, updated_at)
             VALUES (:name, :email, :password, :role, NOW(), NOW())
             RETURNING id, name, email, role, created_at'
        );

        $stmt->execute([
            'name'     => $data['name'],
            'email'    => mb_strtolower($data['email']),
            'password' => $data['password'],
            'role'     => $data['role'] ?? 'cliente',
        ]);

        return $stmt->fetch();
    }

    public function updateProfile(int $id, array $data): array
    {
        $fields = [];
        $params = ['id' => $id];

        if (isset($data['name'])) {
            $fields[] = 'name = :name';
            $params['name'] = trim($data['name']);
        }
        if (!empty($data['password'])) {
            $fields[] = 'password = :password';
            $params['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        if (!$fields) {
            return $this->findById($id);
        }

        $fields[] = 'updated_at = NOW()';

        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
        Database::connection()->prepare($sql)->execute($params);

        return $this->findById($id);
    }
}