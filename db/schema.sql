-- 1. Seleciona o banco de dados
USE Ecommerce;

-- 2. Cria a tabela de produtos caso ela ainda não exista
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100) NOT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    imagem VARCHAR(255)
);

-- 3. Insere itens de exemplo na tabela
INSERT INTO produtos (nome, descricao, categoria, preco, imagem) VALUES 
('Taco de madeira', 'Taco de cinuca padrao exelente para uso.', 'Taco', 99.99, 'https://images.tcdn.com.br/img/img_prod/1157245/taco_de_sinuca_garfado_2_20260202191158_e4d1f0d7c907.jpg'),
('Mesa de cinuca', 'Mesa de cinuca, pano verde, grande.', 'Mesa', 2999.99, 'https://acdn-us.mitiendanube.com/stores/005/809/978/products/35f18790382b6a285d60f6dc2d73d1c2-7211787dc032aa737a17416337942908-1024-1024.webp'),
('Bolas de cinuca', 'Bolas padrao de cinuca (16 bolas)', 'Bolas', 189.90, 'https://salaodejogos.com.br/media/catalog/product/cache/d27d2a17979f79ea285678bb24e3a247/5/4/5407_bolas_de_sinuca_54mm_esportes_express_4.jpg'),
('giz azul', 'Giz de cinuca azul de uso profissional', 'Giz', 34.80, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_6RVlIyEnszyTGkhHPLMR8Pzju_RNuwvbKYr4MifbiA&s');