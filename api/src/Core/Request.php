<?php
namespace App\Core;

final class Request
{
    private ?array $user = null;
    private ?array $body = null;

    public function __construct(
        private string $method,
        private string $path,
        private array  $headers,
        private array  $query,
    ) {}

    public static function capture(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri    = $_SERVER['REQUEST_URI'] ?? '/';
        $path   = parse_url($uri, PHP_URL_PATH) ?: '/';
        $path   = rtrim($path, '/');
        if ($path === '') $path = '/';

        return new self($method, $path, self::readHeaders(), $_GET);
    }

    private static function readHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($key, 5)))));
                $headers[$name] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE']))  $headers['Content-Type']  = $_SERVER['CONTENT_TYPE'];
        if (isset($_SERVER['CONTENT_LENGTH'])) $headers['Content-Length'] = $_SERVER['CONTENT_LENGTH'];
        return $headers;
    }

    public function method(): string { return $this->method; }
    public function path(): string   { return $this->path; }

    public function header(string $name): ?string
    {
        foreach ($this->headers as $k => $v) {
            if (strcasecmp($k, $name) === 0) return $v;
        }
        return null;
    }

    public function bearerToken(): ?string
    {
        $auth = $this->header('Authorization');
        if (!$auth) return null;
        if (preg_match('/^Bearer\s+(.+)$/i', trim($auth), $m)) return trim($m[1]);
        return null;
    }

    /** Body JSON (ou vazio se não for JSON). */
    public function body(): array
    {
        if ($this->body !== null) return $this->body;

        $raw = file_get_contents('php://input') ?: '';
        $json = json_decode($raw, true);

        if (is_array($json)) return $this->body = $json;

        // fallback para form-urlencoded
        return $this->body = $_POST ?: [];
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body()[$key] ?? $default;
    }

    public function query(string $key, mixed $default = null): mixed
    {
        return $this->query[$key] ?? $default;
    }

    public function setUser(array $user): void { $this->user = $user; }
    public function user(): ?array             { return $this->user; }
    public function userId(): ?int             { return $this->user['id'] ?? null; }
    public function isAdmin(): bool            { return ($this->user['role'] ?? null) === 'admin'; }
}