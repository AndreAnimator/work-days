<?php

namespace App\Middleware;

final class Cors
{
    /**
     * Origens permitidas no ambiente de desenvolvimento e produção.
     */
    private const ALLOWED_ORIGINS = [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5501',
        'http://127.0.0.1:5501',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ];

    /** Métodos HTTP permitidos para o frontend. */
    private const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

    /** Headers que o frontend pode enviar nas requisições. */
    private const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';

    /** Headers que o frontend pode ler nas respostas. */
    private const EXPOSED_HEADERS = 'Content-Length, Content-Type';

    /**
     * Aplica os cabeçalhos CORS na resposta atual.
     * Devolve `true` se for uma requisição preflight (OPTIONS) já respondida.
     */
    public static function apply(): bool
    {
        $origin =$_SERVER['HTTP_ORIGIN'] ?? '';

        // Limpa possíveis cabeçalhos antigos para evitar duplicações
        if (function_exists('header_remove')) {
            header_remove('Access-Control-Allow-Origin');
            header_remove('Access-Control-Allow-Credentials');
        }

        // Caso a origem do frontend esteja na lista permitida
        if ($origin !== '' && in_array($origin, self::ALLOWED_ORIGINS, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Vary: Origin');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: ' . self::ALLOWED_METHODS);
            header('Access-Control-Allow-Headers: ' . self::ALLOWED_HEADERS);
            header('Access-Control-Expose-Headers: ' . self::EXPOSED_HEADERS);
            header('Access-Control-Max-Age: 86400'); // Cache do preflight por 24h
        }

        // Tratamento da requisição Preflight (OPTIONS)
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        return false;
    }
}   