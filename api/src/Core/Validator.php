<?php
namespace App\Core;

final class Validator
{
    private array $errors = [];

    public function __construct(private array $data) {}

    public function required(string $field, string $label): self
    {
        $v = $this->data[$field] ?? null;
        if ($v === null || (is_string($v) && trim($v) === '')) {
            $this->errors[$field][] = "O campo {$label} é obrigatório.";
        }
        return $this;
    }

    public function email(string $field, string $label = 'e-mail'): self
    {
        $v = $this->data[$field] ?? null;
        if ($v !== null && $v !== '' && !filter_var($v, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field][] = "Informe um {$label} válido.";
        }
        return $this;
    }

    public function min(string $field, int $min, string $label): self
    {
        $v = $this->data[$field] ?? null;
        if (is_string($v) && $v !== '' && mb_strlen($v) < $min) {
            $this->errors[$field][] = "O campo {$label} deve ter ao menos {$min} caracteres.";
        }
        return $this;
    }

    public function confirmed(string $field, string $confirmationField, string $label): self
    {
        $a = $this->data[$field] ?? null;
        $b = $this->data[$confirmationField] ?? null;
        if ($a !== $b) {
            $this->errors[$confirmationField][] = "A confirmação de {$label} não confere.";
        }
        return $this;
    }

    public function in(string $field, array $allowed, string $label): self
    {
        $v = $this->data[$field] ?? null;
        if ($v !== null && $v !== '' && !in_array($v, $allowed, true)) {
            $this->errors[$field][] = "Valor inválido para {$label}.";
        }
        return $this;
    }

    public function fails(): bool { return $this->errors !== []; }
    public function errors(): array { return $this->errors; }

    public function validate(): void
    {
        if ($this->fails()) {
            throw new HttpException(422, 'Dados inválidos.', $this->errors());
        }
    }
}