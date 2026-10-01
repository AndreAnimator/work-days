<?php

class Product
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function getAll(): array
    {
        $sql = "SELECT * FROM produtos ORDER BY id DESC";

        $stmt = $this->db->query($sql);

        return $stmt->fetchAll();
    }
}