<?php
namespace App\Repositories;

use App\Core\Database;

final class TokenRepository
{
    /** Emite um token novo. O texto puro só é devolvido UMA vez. */
    public function issue(int $userId): array
    {
        $plain     = bin2hex(random_bytes(32));           // 64 chars
        $hash      = hash('sha256', $plain);
        $ttlHours  = (int) (getenv('TOKEN_TTL_HOURS') ?: 720);
        $expiresAt = (new \DateTimeImmutable())->modify("+{$ttlHours} hours");

        $stmt = Database::connection()->prepare(
            'INSERT INTO personal_access_tokens (user_id, token_hash, expires_at, created_at)
             VALUES (:uid, :hash, :exp, NOW())'
        );
        $stmt->execute([
            'uid'  => $userId,
            'hash' => $hash,
            'exp'  => $expiresAt->format('Y-m-d H:i:s'),
        ]);

        return [
            'token'      => $plain,
            'expires_at' => $expiresAt->format('Y-m-d H:i:s'),
        ];
    }

    /** Devolve o usuário dono do token, ou null se inválido/expirado. */
    public function findUserByToken(string $plain): ?array
    {
        $hash = hash('sha256', $plain);

        $stmt = Database::connection()->prepare(
            'SELECT u.id, u.name, u.email, u.role, u.created_at
               FROM personal_access_tokens t
               JOIN users u ON u.id = t.user_id
              WHERE t.token_hash = :hash
                AND (t.expires_at IS NULL OR t.expires_at > NOW())
              LIMIT 1'
        );
        $stmt->execute(['hash' => $hash]);
        return $stmt->fetch() ?: null;
    }

    public function revoke(string $plain): void
    {
        $stmt = Database::connection()->prepare(
            'DELETE FROM personal_access_tokens WHERE token_hash = :hash'
        );
        $stmt->execute(['hash' => hash('sha256', $plain)]);
    }

}
