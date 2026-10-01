<?php
declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use App\Controllers\AuthController;
use App\Controllers\CartController;
use App\Controllers\ProductController;
use App\Core\Request;
use App\Core\Router;
use App\Middleware\Authenticate;
use App\Middleware\Cors;

Cors::apply();

$router = new Router();

// Público
$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login',    [AuthController::class, 'login']);
$router->get('/api/products',       [ProductController::class, 'index']);

// Autenticado
$router->post('/api/auth/logout', [AuthController::class, 'logout'], [Authenticate::class]);
$router->get('/api/auth/me', [AuthController::class, 'me'], [Authenticate::class]);

// Carrinho
$router->get('/api/cart', [CartController::class, 'show'], [Authenticate::class]);
$router->post('/api/cart/items', [CartController::class, 'addItem'], [Authenticate::class]);
$router->patch('/api/cart/items/{productId}', [CartController::class, 'updateItem'], [Authenticate::class]);
$router->delete('/api/cart/items/{productId}', [CartController::class, 'removeItem'], [Authenticate::class]);

$router->dispatch(Request::capture());