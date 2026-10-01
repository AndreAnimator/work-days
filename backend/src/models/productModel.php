<?php
require_once __DIR__ . '/../config/database.php';

function getAllProducts(): array {
    global $pdo;

    $sql = "SELECT id,
                   nome AS name,
                   descricao AS description,
                   preco AS price,
                   imagem AS image,
                   categoria AS category,
                   estoque AS stock
            FROM produtos";

    return $pdo->query($sql)->fetchAll();
}