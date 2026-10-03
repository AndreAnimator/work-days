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
    ) {}

    private const EMAIL_TAKEN = ['email' => ['Este e-mail já está cadastrado.']];

    public function register(array $data): array
    {
        $data = $this->trimFields($data, ['name', 'email']);

        $v = new Validator($data);
        $v->required('name', 'nome')
          ->string('name', 'nome')
          ->min('name', 3, 'nome')
          ->max('name', 120, 'nome')
          ->required('email', 'e-mail')
          ->string('email', 'e-mail')
          ->email('email')
          ->max('email', 180, 'e-mail')
          ->required('password', 'senha')
          ->string('password', 'senha')
          ->min('password', 8, 'senha')
          // bcrypt (PASSWORD_DEFAULT) só considera os 72 primeiros bytes
          ->max('password', 72, 'senha')
          ->required('password_confirmation', 'confirmação de senha')
          ->string('password_confirmation', 'confirmação de senha')
          ->confirmed('password', 'password_confirmation', 'senha');
        $v->validate();

        if ($this->users->emailExists($data['email'])) {
            throw new HttpException(422, 'Dados inválidos.', self::EMAIL_TAKEN);
        }

        try {
            return Database::transaction(function () use ($data) {
                // O papel NUNCA vem do corpo da requisição: todo auto-cadastro é 'cliente'.
                $user = $this->users->create([
                    'name'     => $data['name'],
                    'email'    => $data['email'],
                    'password' => password_hash($data['password'], PASSWORD_DEFAULT),
                    'role'     => 'cliente',
                ]);

                $token = $this->tokens->issue((int) $user['id']);

                return [
                    'user'       => $user,
                    'token'      => $token['token'],
                    'expires_at' => $token['expires_at'],
                ];
            });
        } catch (\PDOException $e) {
            // Corrida entre dois cadastros com o mesmo e-mail: a UNIQUE KEY do banco
            // é a garantia final (MySQL 1062 / SQLSTATE 23000).
            if ($e->getCode() === '23000' && ($e->errorInfo[1] ?? null) === 1062) {
                throw new HttpException(422, 'Dados inválidos.', self::EMAIL_TAKEN);
            }
            throw $e;
        }
    }

    public function login(array $data): array
    {
        $data = $this->trimFields($data, ['email']);

        $v = new Validator($data);
        $v->required('email', 'e-mail')->string('email', 'e-mail')->email('email')
          ->required('password', 'senha')->string('password', 'senha');
        $v->validate();

        $user = $this->users->findByEmail($data['email']);

        if (!$user || !password_verify($data['password'], $user['password'])) {
            throw new HttpException(401, 'Credenciais inválidas.');
        }

        $token = $this->tokens->issue((int) $user['id']);

        return [
            'user' => [
                'id'    => (int) $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role'],
            ],
            'token'      => $token['token'],
            'expires_at' => $token['expires_at'],
        ];
    }

    /** Invalida o token: a linha é apagada do banco e ele deixa de valer na hora. */
    public function logout(string $plainToken): void
    {
        $this->tokens->revoke($plainToken);
    }

    /** Remove espaços das pontas dos campos de texto informados (senha nunca é alterada). */
    private function trimFields(array $data, array $fields): array
    {
        foreach ($fields as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                $data[$field] = trim($data[$field]);
            }
        }

        return $data;
    }
}