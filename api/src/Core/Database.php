<?php
namespace App\Core;

use PDO;
use Throwable;

final class Database
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) return self::$pdo;

        $driver = getenv('DB_CONNECTION') ?: 'pgsql';
        $dsn = sprintf(
            '%s:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $driver,
            getenv('DB_HOST') ?: '127.0.0.1',
            getenv('DB_PORT') ?: ($driver === 'pgsql' ? '5432' : '3306'),
            getenv('DB_DATABASE') ?: 'ecommerce'
        );

        self::$pdo = new PDO(
            $dsn,
            getenv('DB_USERNAME') ?: 'root',
            getenv('DB_PASSWORD') ?: '',
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );

        return self::$pdo;
    }

    /** Executa um callback dentro de uma transação. */
    public static function transaction(callable $fn)
    {
        $pdo = self::connection();
        $pdo->beginTransaction();
        try {
            $result = $fn($pdo);
            $pdo->commit();
            return $result;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            throw $e;
        }
    }
}