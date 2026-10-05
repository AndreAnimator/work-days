<?php
declare(strict_types=1);

// 1. CARREGAR AUTOLOAD / BOOTSTRAP PRIMEIRO
require __DIR__ . '/../bootstrap.php';

use App\Controllers\AdminController;
use App\Controllers\AuthController;
use App\Controllers\CartController;
use App\Controllers\ProductController;
use App\Core\Request;
use App\Core\Router;
use App\Middleware\Authenticate;
use App\Middleware\Cors;

// 2. APLICAR CORS IMEDIATAMENTE (Antes do cli-server e das rotas)
Cors::apply();

// 3. TRATAMENTO DE ARQUIVOS ESTÁTICOS DO SERVIDO EMBUTIDO DO PHP
if (PHP_SAPI === 'cli-server') {
    $requested = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $candidate = realpath(__DIR__ . $requested);
    $publicRoot = realpath(__DIR__);

    if ($requested !== '/' && $candidate !== false && $publicRoot !== false
        && str_starts_with($candidate, $publicRoot . DIRECTORY_SEPARATOR)
        && is_file($candidate)) {
        return false;
    }
}

// 4. ROTAS DA APLICAÇÃO
$router = new Router();

$router->get('/api/products', [ProductController::class, 'index']);
$router->get('/api/products/{id}', [ProductController::class, 'show']);

$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login', [AuthController::class, 'login']);
$router->patch('/api/auth/me', [AuthController::class, 'updateProfile'], [Authenticate::class]);
$router->post('/api/auth/logout', [AuthController::class, 'logout'], [Authenticate::class]);
$router->get('/api/auth/me', [AuthController::class, 'me'], [Authenticate::class]);

// Área administrativa: ':admin' faz o Authenticate responder 403 para clientes.
$router->get('/api/admin/check', [AdminController::class, 'check'], [Authenticate::class . ':admin']);
$router->get('/api/admin/products', [AdminController::class, 'products'], [Authenticate::class . ':admin']);
$router->post('/api/admin/products', [AdminController::class, 'store'], [Authenticate::class . ':admin']);
$router->patch('/api/admin/products/{id}', [AdminController::class, 'update'], [Authenticate::class . ':admin']);
$router->delete('/api/admin/products/{id}', [AdminController::class, 'delete'], [Authenticate::class . ':admin']);

$router->get('/api/cart', [CartController::class, 'show'], [Authenticate::class]);
$router->post('/api/cart/items', [CartController::class, 'addItem'], [Authenticate::class]);
$router->patch('/api/cart/items/{productId}', [CartController::class, 'updateItem'], [Authenticate::class]);
$router->delete('/api/cart/items/{productId}', [CartController::class, 'removeItem'], [Authenticate::class]);

// 5. PROCESSAMENTO DA REQUISIÇÃO
$router->dispatch(Request::capture());