<?php
namespace App\Controllers;

use App\Core\HttpException;
use App\Core\Request;
use App\Core\Response;
use App\Services\AuthService;

final class AuthController
{
    public function __construct(
        private AuthService $auth = new AuthService(),
    ) {}

    /** POST /api/auth/register */
    public function register(Request $request, array $params): void
    {
        $result = $this->auth->register(
            $request->body(),
            $this->visitorCartToken($request)
        );

        Response::json([
            'message'    => 'Conta criada com sucesso.',
            'user'       => $result['user'],
            'token'      => $result['token'],
            'expires_at' => $result['expires_at'],
            'warnings'   => $result['warnings'],
        ], 201);
    }

    /** POST /api/auth/login */
    public function login(Request $request, array $params): void
    {
        $result = $this->auth->login(
            $request->body(),
            $this->visitorCartToken($request)
        );

        Response::json([
            'message'    => 'Login realizado com sucesso.',
            'user'       => $result['user'],
            'token'      => $result['token'],
            'expires_at' => $result['expires_at'],
            'warnings'   => $result['warnings'],
        ]);
    }

    /** POST /api/auth/logout */
    public function logout(Request $request, array $params): void
    {
        $token = $request->bearerToken();
        if (!$token) {
            throw new HttpException(401, 'Token ausente.');
        }

        $this->auth->logout($token);

        Response::json(['message' => 'Sessão encerrada.']);
    }

    /** GET /api/auth/me */
    public function me(Request $request, array $params): void
    {
        Response::json(['user' => $request->user()]);
    }

    /**
     * O frontend manda o token do carrinho de visitante no body ou no header
     * "X-Cart-Token". Aceitamos os dois para ficar flexível.
     */
    private function visitorCartToken(Request $request): ?string
    {
        $token = $request->input('cart_token')
              ?? $request->header('X-Cart-Token');

        if (!is_string($token) || $token === '') return null;
        return $token;
    }
}