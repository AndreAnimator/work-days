<?php
namespace App\Core;

final class Response
{
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /** Formato de erro único da API. */
    public static function error(string $message, int $status = 400, array $errors = []): void
    {
        $payload = ['message' => $message];
        if ($errors) $payload['errors'] = $errors;
        self::json($payload, $status);
    }
}