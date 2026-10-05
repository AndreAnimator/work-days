<?php
namespace App\Middleware;

use App\Core\HttpException;
use App\Core\Request;
use App\Repositories\TokenRepository;

/**
 * Autentica pelo Bearer token e, opcionalmente, restringe por papel (role).
 *
 * Uso nas rotas:
 *   [Authenticate::class]                  -> qualquer usuário autenticado
 *   [Authenticate::class . ':admin']       -> somente admin (cliente recebe 403)
 *   [Authenticate::class . ':admin,cliente'] -> lista de papéis aceitos
 *
 * Os papéis vêm do banco a cada requisição (JOIN com users), então uma
 * mudança de papel vale imediatamente, sem depender do que o front guardou.
 */
final class Authenticate
{
    public function handle(Request $request, string ...$roles): void
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

        if ($roles !== [] && !in_array($user['role'], $roles, true)) {
            throw new HttpException(403, 'Você não tem permissão para acessar este recurso.');
        }
    }
}
