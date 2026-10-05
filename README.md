# Work Days

Aplicação de e-commerce de artigos para sinuca, com frontend estático, API PHP e MySQL.

## Estrutura

```text
work-days/
├── api/
│   ├── Dockerfile
│   ├── bootstrap.php
│   ├── public/index.php
│   └── src/
│       ├── Controllers/
│       ├── Core/
│       ├── Middleware/
│       ├── Repositories/
│       └── Services/
├── db/schema.sql
├── frontend/
├── compose.yaml
└── .env.example
```

A implementação antiga de `backend/` foi removida e os produtos passaram a usar a mesma arquitetura da API principal.

## Executar com Docker

```bash
docker compose up --build
```

A API ficará em `http://localhost:8000`.

O frontend pode ser aberto com Live Server (por exemplo, porta 5500) ou outro servidor estático.

## Endpoints principais

- `GET /api/products` — lista produtos; aceita `search` e `category`.
- `GET /api/products/{id}` — retorna um produto.
- `POST /api/auth/register` — cria uma conta.
- `POST /api/auth/login` — autentica.
- `GET /api/auth/me` — retorna o usuário autenticado.
- `PATCH /api/auth/me` — atualiza nome e e-mail do usuário autenticado.
- `POST /api/auth/logout` — encerra o token atual.
- `GET /api/cart` — retorna o carrinho autenticado.
- `POST /api/cart/items` — adiciona produto ao carrinho.
- `PATCH /api/cart/items/{productId}` — altera quantidade.
- `DELETE /api/cart/items/{productId}` — remove produto.

- `GET /api/admin/check` — **somente admin** (401 sem token, 403 para cliente). Usado pelo frontend para confirmar o papel no servidor.

## Papéis e autorização

Existem dois papéis: `cliente` (padrão em todo cadastro) e `admin`. O papel é lido do banco a cada requisição e nunca vem do corpo do cadastro.

O middleware `Authenticate` aceita uma lista de papéis após `:`:

```php
[Authenticate::class]                 // qualquer usuário autenticado
[Authenticate::class . ':admin']      // somente admin: cliente recebe 403
```

Usuário admin criado pelo `db/schema.sql` (apenas desenvolvimento — troque a senha fora do ambiente local):

| E-mail                | Senha         |
|-----------------------|---------------|
| `admin@sinucapro.com` | `Admin@12345` |

## Painel administrativo

`frontend/admin.html` só exibe o painel depois que `GET /api/admin/check` responde 200. Sem token o usuário vai para o login; cliente vê "Acesso negado". O CRUD de produtos do painel consome estes endpoints, protegidos por `Authenticate::class . ':admin'` :

- `GET /api/admin/products` — lista todos os produtos, inclusive inativos (campos: `id, name, description, category, price, image, stock, active`); aceita resposta `{ "products": [...] }`.
- `POST /api/admin/products` — cria produto.
- `PATCH /api/admin/products/{id}` — atualiza produto.
- `DELETE /api/admin/products/{id}` — exclui produto.

Corpo de `POST`/`PATCH`: `{ name, description, category, price, stock, image, active }`. Erros de validação devem seguir o formato `{ "message": "...", "errors": { "campo": ["..."] } }`.

## Banco de dados

O banco é inicializado automaticamente pelo MySQL na primeira criação do volume. Para recriá-lo do zero durante o desenvolvimento:

```bash
docker compose down -v
docker compose up --build
```

Não coloque credenciais reais no repositório. O arquivo `.env` local deve ser criado a partir de `.env.example` quando a API for executada fora do Docker.
