<?php
namespace App\Services;

use App\Core\Database;
use App\Core\HttpException;
use App\Core\Validator;
use App\Repositories\TokenRepository;
use App\Repositories\UserRepository;

final class AuthService
{
    public function __construct(
        private UserRepository  $users  = new UserRepository(),
        private TokenRepository $tokens = new TokenRepository(),
        private CartService     $carts  = new CartService(),
    ) {}

    // ---------------------------------------------------------------
    // REGISTRO
    // ---------------------------------------------------------------
    public function register(array $data, ?string $visitorCartToken): array
    {
        $v = new Validator($data);
        $v->required('name', 'nome')
          ->min('name', 3, 'nome')
          ->required('email', 'e-mail')
          ->email('email')
          ->required('password', 'senha')
          ->min('password', 8, 'senha')
          ->confirmed('password', 'password_confirmation', 'senha');
        $v->validate();

        if ($this->users->emailExists($data['email'])) {
            throw new HttpException(422, 'Dados inválidos.', [
                'email' => ['Este e-mail já está cadastrado.'],
            ]);
        }

        return Database::transaction(function () use ($data, $visitorCartToken) {
            $user = $this->users->create([
                'name'     => trim($data['name']),
                'email'    => $data['email'],
                'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                'role'     => 'cliente',
            ]);

            $warnings = [];
            if ($visitorCartToken) {
                $merge = $this->carts->mergeVisitorCartIntoUser($visitorCartToken, (int) $user['id']);
                $warnings = $merge['warnings'];
            }

            $token = $this->tokens->issue((int) $user['id']);

            return [
                'user'       => $user,
                'token'      => $token['token'],
                'expires_at' => $token['expires_at'],
                'warnings'   => $warnings,
            ];
        });
    }

    // ---------------------------------------------------------------
    // LOGIN
    // ---------------------------------------------------------------
    public function login(array $data, ?string $visitorCartToken): array
    {
        $v = new Validator($data);
        $v->required('email', 'e-mail')->email('email')
          ->required('password', 'senha');
        $v->validate();

        $user = $this->users->findByEmail($data['email']);

        // Mensagem genérica: não revela se o e-mail existe
        if (!$user || !password_verify($data['password'], $user['password'])) {
            throw new HttpException(401, 'Credenciais inválidas.');
        }

        $warnings = [];
        if ($visitorCartToken) {
            $merge = $this->carts->mergeVisitorCartIntoUser($visitorCartToken, (int) $user['id']);
            $warnings = $merge['warnings'];
        }

        $token = $this->tokens->issue((int) $user['id']);

        return [
            'user'       => [
                'id'    => (int) $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role'],
            ],
            'token'      => $token['token'],
            'expires_at' => $token['expires_at'],
            'warnings'   => $warnings,
        ];
    }

    // ---------------------------------------------------------------
    // LOGOUT
    // ---------------------------------------------------------------
    public function logout(string $plainToken): void
    {
        $this->tokens->revoke($plainToken);
    }
}