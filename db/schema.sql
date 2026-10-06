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
    -- Uma conta só pode possuir um carrinho ativo/persistente.
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

-- Usuário ADMIN inicial (somente para desenvolvimento).
-- Login: admin@sinucapro.com | Senha: Admin@12345 (somente desenvolvimento).
-- Troque a senha antes de qualquer uso fora do ambiente local.
INSERT INTO users (name, email, password, role)
SELECT 'Administrador', 'admin@sinucapro.com',
       '$2y$12$.EZ0.6VlN0n5QmRBnrMwt.XluuBp8wwQWo9ZTqo8mCysYuC/IiJAm', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@sinucapro.com');

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

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Triângulo de madeira', 'Triângulo de madeira para organizar as bolas na abertura.', 'Triângulos', 49.90, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8kAHsSLkgxQaNv21tnqX-9CciB6Xi9iPTy49nbBeZaA&s=10', 30
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Triângulo de madeira');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Maleta para taco', 'Maleta rígida para transportar até dois tacos.', 'Maletas', 159.90, 'https://acdn-us.mitiendanube.com/stores/002/975/530/products/21-89c28cc7831e8a212816863371287936-640-0.webp', 12
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Maleta para taco');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Luva de sinuca', 'Luva para deslizar o taco com mais suavidade.', 'Acessórios', 29.90, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSN0vyJbHBiz-yvFLB7xxgJBMnTJtr1ip2joykGdgRu6g&s=10', 40
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Luva de sinuca');

-- MESAS
INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Mesa de sinuca profissional 2,70m', 'Mesa oficial com tampo em MDF, pano de lã verde e caçapas de couro.', 'Mesas', 4890.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuH51oRd5Ltx-SO6-EG0WPjrLlkXdgPdzitnl4TLbqRQ&s=10', 3
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Mesa de sinuca profissional 2,70m');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Mesa de sinuca residencial 2,30m', 'Mesa compacta para uso em casa, com pés reforçados e acabamento em madeira.', 'Mesas', 3290.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6pXpkiv9nTh6jd2zMgFu27h5-aicp-wEZT3E0TeFjNQ&s=10', 5
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Mesa de sinuca residencial 2,30m');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Mesa de sinuca dobrável 2,10m', 'Mesa dobrável que facilita o transporte e o armazenamento, com acessórios inclusos.', 'Mesas', 1890.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnRNP5aaQ8cnM4oD5CqtUCtk-dNAR9JjxDq6-ULWUMKw&s', 7
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Mesa de sinuca dobrável 2,10m');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Mesa de sinuca infantil 1,50m', 'Mesa de tamanho reduzido para crianças, com 2 tacos e jogo de bolas.', 'Mesas', 790.00, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSn6aa9SCQWV2CIDDmkWqjfwVssIR9B2QYbOxEhBJwPyA&s', 10
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Mesa de sinuca infantil 1,50m');

-- TACOS
INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Taco de sinuca 2 partes 145cm', 'Taco de madeira maple com 2 partes, ponteira 11mm e empunhadura antiderrapante.', 'Tacos', 189.90, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQA_rZ_THxw2EHXuXpUSGs8Kqk3kEKuOp7LLuFOtTsVg&s', 15
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Taco de sinuca 2 partes 145cm');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Taco profissional de fibra de carbono', 'Taco leve e resistente, sem empenamento, ideal para jogadores avançados.', 'Tacos', 499.90, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS7gOaNPWCL85sR_HqhHygFSaGd-KEMGax00dBXyQrGFA&s=10', 8
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Taco profissional de fibra de carbono');

-- TRIÂNGULOS
INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Triângulo de sinuca de madeira', 'Triângulo clássico de madeira para organizar as bolas no início da partida.', 'Triângulos', 49.90, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbAFY8Qs_eIGVx2RVOnwqhf9MhUOjBvf2cH8mbywW9TA&s', 25
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Triângulo de sinuca de madeira');



-- GIZ

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Giz de sinuca verde (caixa com 12)', 'Giz verde combinando com o pano, com ótima aderência.', 'Giz', 34.90, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTP8q5vU7wiYUnh4bgKwWmP6GIzpw_fvycB2SVNpFp1yQ&s=10', 55
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Giz de sinuca verde (caixa com 12)');


-- MALETAS
INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Maleta rígida para 2 tacos', 'Maleta com compartimentos para 2 tacos de 2 partes.', 'Maletas', 159.90, 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQoxInmklw8C29x7khIybG8AZHVhbP8w37Zu3j9ZlfwDyNvr2r1tFuslQHhQhv7ZP35VK7ZwCdXtE4GPHYaAE0bsvm19Mcik6WzLRueHlAZTgP20cE5-v7k&usqp=CAc', 14
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Maleta rígida para 2 tacos');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Maleta profissional para 4 tacos', 'Maleta de alta resistência com espaço para 4 tacos, giz e acessórios.', 'Maletas', 289.90, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkSxVBNaFWb0KhlJXCHB_luMASh-uTfRAh1oycwQN80Q&s=10', 9
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Maleta profissional para 4 tacos');


-- ACESSÓRIOS
INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Jogo de bolas de sinuca 54mm', 'Conjunto completo com 16 bolas de resina para mesa de sinuca.', 'Bolas', 249.90, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSBgTCvKuM_jZDjxeX8Vzt-R4fiq2yGY2viZPzIOcmmVA&s=10', 12
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Jogo de bolas de sinuca 54mm');

INSERT INTO products (name, description, category, price, image, stock)
SELECT 'Ponteira de couro 11mm (kit com 5)', 'Ponteiras de reposição em couro com boa retenção de giz.', 'Acessórios', 39.90, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQhtuR-f9BZNW8Bo6hBUxJkwC1cMHFzx906vhgASI-fCA&s', 35
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Ponteira de couro 11mm (kit com 5)');