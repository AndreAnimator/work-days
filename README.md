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

- `GET /api/products` — lista os produtos **ativos**. Parâmetros opcionais:
  - `search`: texto buscado no **nome** do produto;
  - `category`: categoria exata (ex.: `Tacos`);
  - `sort`: `newest` (padrão, mais recentes), `price_asc` (menor preço) ou `price_desc` (maior preço). Outro valor retorna 422.
- `GET /api/products/{id}` — retorna um produto.
- `POST /api/auth/register` — cria uma conta.
- `POST /api/auth/login` — autentica.
- `GET /api/auth/me` — retorna o usuário autenticado.
- `POST /api/auth/logout` — encerra o token atual.
- `GET /api/cart` — retorna o carrinho autenticado.
- `POST /api/cart/items` — adiciona produto ao carrinho.
- `PATCH /api/cart/items/{productId}` — altera quantidade.
- `DELETE /api/cart/items/{productId}` — remove produto.

## Banco de dados

O banco é inicializado automaticamente pelo MySQL na primeira criação do volume. Para recriá-lo do zero durante o desenvolvimento:

```bash
docker compose down -v
docker compose up --build
```

Não coloque credenciais reais no repositório. O arquivo `.env` local deve ser criado a partir de `.env.example` quando a API for executada fora do Docker.
