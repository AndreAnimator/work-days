<?php
namespace App\Controllers;

use App\Core\Database;
use App\Core\Request;
use App\Core\Response;

final class ProductController
{
    /** GET /api/products  (opcional: ?category=Giz) */
    public function index(Request $request, array $params): void
    {
        $sql  = 'SELECT id, name, description, price, image, category, stock
                   FROM products
                  WHERE active = 1';
        $bind = [];

        $category = $request->query('category');
        if ($category) {
            $sql .= ' AND category = :category';
            $bind['category'] = $category;
        }

        $sql .= ' ORDER BY id ASC';

        $stmt = Database::connection()->prepare($sql);
        $stmt->execute($bind);

        Response::json($stmt->fetchAll());
    }
}