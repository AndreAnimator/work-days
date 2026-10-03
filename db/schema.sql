CREATE DATABASE IF NOT EXISTS Ecommerce
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE Ecommerce;

CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    category VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500) NULL,
    stock INT UNSIGNED NOT NULL DEFAULT 0,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_category (category),
    INDEX idx_products_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS personal_access_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_tokens_hash (token_hash),
    INDEX idx_tokens_user (user_id),
    CONSTRAINT fk_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_carts_user (user_id),
    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cart_id BIGINT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    UNIQUE KEY uq_cart_product (cart_id, product_id),
    CONSTRAINT chk_cart_items_qty CHECK (quantity > 0),
    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Taco de madeira', 'Taco de sinuca padrão para uso recreativo e profissional.', 'Tacos', 99.99,
       'https://images.tcdn.com.br/img/img_prod/1157245/taco_de_sinuca_garfado_2_20260202191158_e4d1f0d7c907.jpg', 20
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Taco de madeira');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Mesa de sinuca', 'Mesa de sinuca com pano verde.', 'Mesas', 2999.99,
       'https://acdn-us.mitiendanube.com/stores/005/809/978/products/35f18790382b6a285d60f6dc2d73d1c2-7211787dc032aa737a17416337942908-1024-1024.webp', 5
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Mesa de sinuca');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Bolas de sinuca', 'Jogo padrão com 16 bolas.', 'Bolas', 189.90,
       'https://salaodejogos.com.br/media/catalog/product/cache/d27d2a17979f79ea285678bb24e3a247/5/4/5407_bolas_de_sinuca_54mm_esportes_express_4.jpg', 15
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Bolas de sinuca');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Giz azul', 'Giz de sinuca azul para uso profissional.', 'Giz', 34.80,
       'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_6RVlIyEnszyTGkhHPLMR8Pzju_RNuwvbKYr4MifbiA&s', 50
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Giz azul');

-- Produtos de exemplo para as categorias que ainda não tinham nenhum (sem foto)
INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Triângulo de madeira', 'Triângulo de madeira para organizar as bolas na abertura.', 'Triângulos', 49.90, NULL, 30
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Triângulo de madeira');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Maleta para taco', 'Maleta rígida para transportar até dois tacos.', 'Maletas', 159.90, NULL, 12
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Maleta para taco');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Luva de sinuca', 'Luva para deslizar o taco com mais suavidade.', 'Acessórios', 29.90, NULL, 40
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Luva de sinuca');
