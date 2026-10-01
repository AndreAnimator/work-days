<?php
namespace App\Core;

final class Router
{
    /* @var array<int, array{method:string,path:string,handler:array,middleware:array}> */
    private array $routes = [];

    public function get(string $path, array $handler, array $middleware = []): void
    { $this->add('GET', $path, $handler, $middleware); }

    public function post(string $path, array $handler, array $middleware = []): void
    { $this->add('POST', $path, $handler, $middleware); }

    public function patch(string $path, array $handler, array $middleware = []): void
    { $this->add('PATCH', $path, $handler, $middleware); }

    public function delete(string $path, array $handler, array $middleware = []): void
    { $this->add('DELETE', $path, $handler, $middleware); }

    private function add(string $method, string $path, array $handler, array $middleware): void
    {
        $this->routes[] = compact('method', 'path', 'handler', 'middleware');
    }

    public function dispatch(Request $request): void
    {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method()) continue;

            $params = $this->match($route['path'], $request->path());
            if ($params === null) continue;

            foreach ($route['middleware'] as $mwClass) {
                (new $mwClass())->handle($request);
            }

            [$class, $action] = $route['handler'];
            (new $class())->{$action}($request, $params);
            return;
        }

        throw new HttpException(404, 'Rota não encontrada.');
    }

    /** Converte "/api/orders/{id}" em regex e devolve os parâmetros. */
    private function match(string $pattern, string $path): ?array
    {
        $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';

        if (!preg_match($regex, $path, $m)) return null;

        return array_filter($m, 'is_string', ARRAY_FILTER_USE_KEY);
    }
}