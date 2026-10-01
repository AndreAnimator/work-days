<?php
namespace App\Middleware;

use App\Core\HttpException;
use App\Core\Request;

final class RequireAdmin
{
    public function handle(Request $request): void
    {
        if (!$request->user()) {
            throw new HttpException(401, 'Não autenticado.');
        }
        if (!$request->isAdmin()) {
            throw new HttpException(403, 'Acesso restrito a administradores.');
        }
    }
}