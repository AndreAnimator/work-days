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

    public function register(Request $request, array $params): void
    {
        $result = $this->auth->register($request->body());

        Response::json([
            'message'    => 'Conta criada com sucesso.',
            'user'       => $result['user'],
            'token'      => $result['token'],
            'expires_at' => $result['expires_at'],
        ], 201);
    }

    public function login(Request $request, array $params): void
    {
        $result = $this->auth->login($request->body());

        Response::json([
            'message'    => 'Login realizado com sucesso.',
            'user'       => $result['user'],
            'token'      => $result['token'],
            'expires_at' => $result['expires_at'],
        ]);
    }

    public function logout(Request $request, array $params): void
    {
        $token = $request->bearerToken();
        if (!$token) {
            throw new HttpException(401, 'Token ausente.');
        }

        $this->auth->logout($token);

        Response::json(['message' => 'Sessão encerrada.']);
    }

    public function me(Request $request, array $params): void
    {
        Response::json(['user' => $request->user()]);
    }
}