-- Atualiza um banco JÁ EXISTENTE para as páginas de categoria.
-- Pode ser executado mais de uma vez sem duplicar dados.
--
--   docker exec -i work-days-db mysql -uuser -pcode Ecommerce < db/update_categories.sql

-- Nomes das categorias iguais aos do site (plural)
UPDATE products SET category = 'Tacos' WHERE category = 'Taco';
UPDATE products SET category = 'Mesas' WHERE category = 'Mesa';

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
