<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Core\Validator;
use App\Repositories\ProductRepository;
use PDOException;

final class AdminController
{
    public function __construct(
        private ProductRepository $products = new ProductRepository(),
    ) {}

    public function check(Request $request, array $params): void
    {
        Response::json([
            'authorized' => true,
            'user' => $request->user(),
        ]);
    }

    /** GET /api/admin/products */
    public function products(Request $request, array $params): void
    {
        Response::json(['products' => $this->products->allForAdmin()]);
    }

    /** POST /api/admin/products */
    public function store(Request $request, array $params): void
    {
        $data = $this->validateProduct($request->body(), false);
        $product = $this->products->create($data);

        Response::json(['product' => $product], 201);
    }

    /** PATCH /api/admin/products/{id} */
    public function update(Request $request, array $params): void
    {
        $id = $this->parseId($params['id'] ?? null);
        $data = $this->validateProduct($request->body(), true);

        if ($data === []) {
            throw new HttpException(422, 'Nenhum campo para atualizar.');
        }

        $product = $this->products->update($id, $data);
        if (!$product) {
            throw new HttpException(404, 'Produto não encontrado.');
        }

        Response::json(['product' => $product]);
    }

    /** DELETE /api/admin/products/{id} */
    public function delete(Request $request, array $params): void
    {
        $id = $this->parseId($params['id'] ?? null);

        try {
            if (!$this->products->delete($id)) {
                throw new HttpException(404, 'Produto não encontrado.');
            }
        } catch (PDOException $e) {
            // cart_items usa ON DELETE RESTRICT para preservar o histórico do carrinho.
            if ($e->getCode() === '23000' && ($e->errorInfo[1] ?? null) === 1451) {
                throw new HttpException(
                    409,
                    'Este produto não pode ser excluído porque está presente em um carrinho. Desative-o em vez de excluir.'
                );
            }
            throw $e;
        }

        Response::json(['message' => 'Produto excluído com sucesso.']);
    }

    private function validateProduct(array $data, bool $partial): array
    {
        $data = $this->trimStrings($data, ['name', 'description', 'category', 'image']);
        $v = new Validator($data);

        if (!$partial || array_key_exists('name', $data)) {
            $v->required('name', 'nome')->string('name', 'nome')->min('name', 2, 'nome')->max('name', 150, 'nome');
        }
        if (!$partial || array_key_exists('description', $data)) {
            $v->string('description', 'descrição')->max('description', 5000, 'descrição');
        }
        if (!$partial || array_key_exists('category', $data)) {
            $v->required('category', 'categoria')->string('category', 'categoria')->max('category', 100, 'categoria');
        }
        if (!$partial || array_key_exists('price', $data)) {
            $v->required('price', 'preço')->decimal('price', 'preço', 0, 99999999.99, 2);
        }
        if (!$partial || array_key_exists('stock', $data)) {
            $v->required('stock', 'estoque')->integer('stock', 'estoque', 0);
        }
        if (!$partial || array_key_exists('image', $data)) {
            $v->string('image', 'imagem')->max('image', 500, 'imagem')->url('image', 'imagem');
        }
        if (!$partial || array_key_exists('active', $data)) {
            $v->boolean('active', 'status');
        }

        $v->validate();

        $normalized = [];
        foreach (['name', 'description', 'category', 'image'] as $field) {
            if (array_key_exists($field, $data)) {
                $normalized[$field] = $data[$field] === '' ? null : $data[$field];
            }
        }
        if (array_key_exists('price', $data)) {
            $normalized['price'] = number_format((float) $data['price'], 2, '.', '');
        }
        if (array_key_exists('stock', $data)) {
            $normalized['stock'] = (int) $data['stock'];
        }
        if (array_key_exists('active', $data)) {
            $normalized['active'] = (bool) $data['active'];
        }

        return $normalized;
    }

    private function parseId(mixed $value): int
    {
        if (is_int($value) || (is_string($value) && preg_match('/^[1-9]\d*$/', $value))) {
            $id = (int) $value;
            if ($id > 0) return $id;
        }

        throw new HttpException(422, 'ID de produto inválido.', [
            'id' => ['O ID deve ser um número inteiro positivo.'],
        ]);
    }

    private function trimStrings(array $data, array $fields): array
    {
        foreach ($fields as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                $data[$field] = trim($data[$field]);
            }
        }
        return $data;
    }
}
