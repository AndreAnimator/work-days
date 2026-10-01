<?php
namespace App\Core;

class HttpException extends \RuntimeException
{
    public function __construct(
        public readonly int $status,
        string $message,
        public readonly array $errors = []
    ) {
        parent::__construct($message);
    }
}