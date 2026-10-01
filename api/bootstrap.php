<?php
declare(strict_types=1);

// ---------- .env ----------
$envFile = __DIR__ . '/.env';
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if ($line === '' || str_starts_with(trim($line), '#')) continue;
        [$k, $v] = array_pad(explode('=', $line, 2), 2, '');
        $k = trim($k);
        $v = trim($v, " \t\"'");
        if ($k !== '' && getenv($k) === false) {
            putenv("$k=$v");
            $_ENV[$k] = $v;
        }
    }
}

// ---------- Autoload (PSR-4 simplificado) ----------
spl_autoload_register(function (string $class): void {
    $prefix  = 'App\\';
    $baseDir = __DIR__ . '/src/';
    if (!str_starts_with($class, $prefix)) return;
    $relative = substr($class, strlen($prefix));
    $file = $baseDir . str_replace('\\', '/', $relative) . '.php';
    if (is_file($file)) require $file;
});

// ---------- Erros ----------
$debug = filter_var(getenv('APP_DEBUG') ?: 'false', FILTER_VALIDATE_BOOL);
error_reporting(E_ALL);
ini_set('display_errors', $debug ? '1' : '0');

set_exception_handler(function (Throwable $e) use ($debug): void {
    if ($e instanceof \App\Core\HttpException) {
        \App\Core\Response::error($e->getMessage(), $e->status, $e->errors);
        return;
    }
    error_log((string) $e);
    \App\Core\Response::error(
        $debug ? $e->getMessage() : 'Erro interno do servidor.',
        500
    );
});

date_default_timezone_set('America/Sao_Paulo');