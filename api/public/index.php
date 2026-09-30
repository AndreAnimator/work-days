<?php
declare(strict_types=1);

require __DIR__ . '/../bootstrap.php';

use App\Controllers\AuthController;
use App\Core\Request;
use App\Core\Router;
use App\Middleware\Authenticate;
use App\Middleware\RequireAdmin;

$router = new Router();

// ---------------- Público ----------------
$router->post('/api/auth/register', [AuthController::class, 'register']);
$router->post('/api/auth/login',    [AuthController::class, 'login']);

// ---------------- Autenticado ----------------
$router->post('/api/auth/logout', [AuthController::class, 'logout'], [Authenticate::class]);
$router->get ('/api/auth/me',     [AuthController::class, 'me'],     [Authenticate::class]);

// ---------------- Exemplo de rota admin ----------------
// (descomente quando criar o controller)
// $router->get('/api/admin/orders',
//     [\App\Controllers\AdminOrderController::class, 'index'],
//     [Authenticate::class, RequireAdmin::class]
// );

$router->dispatch(Request::capture());