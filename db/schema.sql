-- 1. Seleciona o banco de dados
USE Ecommerce;

-- 2. Cria a tabela de produtos caso ela ainda não exista
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    stock INT NOT NULL DEFAULT 0
);

CREATE TABLE users (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(180) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('cliente','admin') NOT NULL DEFAULT 'cliente',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE personal_access_tokens (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    token_hash  CHAR(64) NOT NULL,
    expires_at  DATETIME NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tokens_hash (token_hash),
    KEY idx_tokens_user (user_id),
    CONSTRAINT fk_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Carrinho: SEMPRE pertence a um usuário autenticado.
-- UNIQUE(user_id) garante "no máximo um carrinho por usuário".
CREATE TABLE carts (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_carts_user (user_id),
    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE cart_items (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cart_id     BIGINT UNSIGNED NOT NULL,
    product_id  BIGINT UNSIGNED NOT NULL,
    quantity    INT UNSIGNED NOT NULL,
    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    -- Quando criar a tabela `products`, descomente:
    -- CONSTRAINT fk_cart_items_product
    --     FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT chk_cart_items_qty CHECK (quantity > 0),
    UNIQUE KEY uq_cart_product (cart_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Insere itens de exemplo na tabela
INSERT INTO products (name, description, category, price, image) VALUES 
('Taco de madeira', 'Taco de cinuca padrao exelente para uso.', 'Taco', 99.99, 'https://images.tcdn.com.br/img/img_prod/1157245/taco_de_sinuca_garfado_2_20260202191158_e4d1f0d7c907.jpg'),
('Mesa de cinuca', 'Mesa de cinuca, pano verde, grande.', 'Mesa', 2999.99, 'https://acdn-us.mitiendanube.com/stores/005/809/978/products/35f18790382b6a285d60f6dc2d73d1c2-7211787dc032aa737a17416337942908-1024-1024.webp'),
('Bolas de cinuca', 'Bolas padrao de cinuca (16 bolas)', 'Bolas', 189.90, 'https://salaodejogos.com.br/media/catalog/product/cache/d27d2a17979f79ea285678bb24e3a247/5/4/5407_bolas_de_sinuca_54mm_esportes_express_4.jpg'),
('giz azul', 'Giz de cinuca azul de uso profissional', 'Giz', 34.80, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_6RVlIyEnszyTGkhHPLMR8Pzju_RNuwvbKYr4MifbiA&s');
-- MySQL 8.0+