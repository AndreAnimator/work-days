<?php
declare(strict_types=1);

namespace App\Core;

final class Request
{
    private ?array $body = null;
    private ?array $user = null;

    public function __construct(
        private string $method,
        private string $path,
        private array $headers,
        private array $query,
    ) {}

    public static function capture(): self
    {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $path = rtrim($path, '/') ?: '/';

        return new self(
            strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            $path,
            self::readHeaders(),
            $_GET,
        );
    }

    private static function readHeaders(): array
    {
        $headers = [];

        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = str_replace(
                    ' ',
                    '-',
                    ucwords(strtolower(str_replace('_', ' ', substr($key, 5))))
                );
                $headers[$name] = $value;
            }
        }

        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['Content-Type'] = $_SERVER['CONTENT_TYPE'];
        }

        return $headers;
    }

    public function method(): string { return $this->method; }
    public function path(): string { return $this->path; }

    public function header(string $name): ?string
    {
        foreach ($this->headers as $key => $value) {
            if (strcasecmp($key, $name) === 0) {
                return $value;
            }
        }

        return null;
    }

    public function bearerToken(): ?string
    {
        $authorization = $this->header('Authorization');

        if ($authorization && preg_match('/^Bearer\s+(.+)$/i', trim($authorization), $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    public function body(): array
    {
        if ($this->body !== null) {
            return $this->body;
        }

        $raw = file_get_contents('php://input') ?: '';
        $decoded = json_decode($raw, true);

        return $this->body = is_array($decoded) ? $decoded : ($_POST ?: []);
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
    public function user(): ?array { return $this->user; }
    public function userId(): ?int { return isset($this->user['id']) ? (int) $this->user['id'] : null; }
    public function isAdmin(): bool { return ($this->user['role'] ?? null) === 'admin'; }
}
