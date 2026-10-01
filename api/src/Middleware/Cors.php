<?php
namespace App\Middleware;

final class Cors
{
    /**
     * Origens permitidas. Em dev liberamos as portas comuns de
     * Live Server (5500/5501), Vite (5173), etc. Em produção,
     * troque por uma lista fechada com o domínio real.
     */
    private const ALLOWED_ORIGINS = [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5501',
        'http://127.0.0.1:5501',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
    ];

    /** Métodos HTTP que o frontend pode usar. */
    private const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';

    /** Headers que o frontend pode enviar. */
    private const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Requested-With, Accept, Origin';

    /** Headers que o frontend pode ler na resposta. */
    private const EXPOSED_HEADERS = 'Content-Length, Content-Type';

    /**
     * Aplica os headers CORS na resposta atual.
     * Devolve `true` se a requisição for um preflight (OPTIONS) e já
     * respondeu 204 — nesse caso o chamador NÃO deve continuar.
     */
    public static function apply(): bool
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        // Só manda os headers se a origem estiver na allowlist.
        // Mandar `*` junto com credenciais é proibido pelo navegador,
        // e liberar qualquer origem sem checar é um furo de segurança.
        if ($origin !== '' && in_array($origin, self::ALLOWED_ORIGINS, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Vary: Origin');                       // cache correto por origem
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: ' . self::ALLOWED_METHODS);
            header('Access-Control-Allow-Headers: ' . self::ALLOWED_HEADERS);
            header('Access-Control-Expose-Headers: ' . self::EXPOSED_HEADERS);
            header('Access-Control-Max-Age: 86400');      // cacheia o preflight por 24h
        }

        // Preflight: responde e encerra. Não deixa o Router processar.
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }

        return false;
    }
}