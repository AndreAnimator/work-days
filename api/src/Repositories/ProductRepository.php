<?php
declare(strict_types=1);

namespace App\Repositories;

use App\Core\Database;
use PDO;

final class ProductRepository
{
    /** Ordenações permitidas (valor aceito em ?sort= => cláusula ORDER BY). */
    public const SORTS = [
        'newest'     => 'created_at DESC, id DESC',
        'price_asc'  => 'price ASC, id DESC',
        'price_desc' => 'price DESC, id DESC',
    ];

    public const DEFAULT_SORT = 'newest';

    /**
     * Lista os produtos ATIVOS do catálogo.
     *
     * @param string|null $search   trecho do NOME do produto
     * @param string|null $category categoria exata
     * @param string      $sort     uma das chaves de self::SORTS
     */
    public function all(
        ?string $search = null,
        ?string $category = null,
        string $sort = self::DEFAULT_SORT,
    ): array {
        $pdo = Database::connection();

        // Produtos inativos nunca aparecem no catálogo
        $conditions = ['active = 1'];
        $params = [];

        $search = $search !== null ? trim($search) : '';
        if ($search !== '') {
            // Busca somente pelo nome. Os curingas do LIKE (% e _) digitados
            // pelo usuário são escapados para valerem como texto comum.
            $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $search);
            $conditions[] = "name LIKE :search ESCAPE '!'";
            $params['search'] = '%' . $escaped . '%';
        }

        if ($category !== null && $category !== '') {
            $conditions[] = 'category = :category';
            $params['category'] = $category;
        }

        // O valor de ORDER BY vem de uma lista fixa, nunca direto da requisição
        $orderBy = self::SORTS[$sort] ?? self::SORTS[self::DEFAULT_SORT];

        $sql = 'SELECT id, name, description, category, price, image, stock
                  FROM products
                 WHERE ' . implode(' AND ', $conditions) . '
                 ORDER BY ' . $orderBy;

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
