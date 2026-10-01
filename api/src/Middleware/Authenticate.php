<?php
namespace App\Middleware;

use App\Core\HttpException;
use App\Core\Request;
use App\Repositories\TokenRepository;

final class Authenticate
{
    public function handle(Request $request): void
    {
        $token = $request->bearerToken();

        if (!$token) {
            throw new HttpException(401, 'Não autenticado. Faça login para continuar.');
        }

        $user = (new TokenRepository())->findUserByToken($token);

        if (!$user) {
            throw new HttpException(401, 'Token inválido ou expirado.');
        }

        $request->setUser($user);
    }
}