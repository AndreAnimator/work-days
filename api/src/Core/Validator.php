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

    /** Garante que o valor, se enviado, seja texto (evita arrays/objetos no JSON). */
    public function string(string $field, string $label): self
    {
        $v = $this->data[$field] ?? null;
        if ($v !== null && !is_string($v)) {
            $this->errors[$field][] = "O campo {$label} deve ser um texto.";
        }
        return $this;
    }

    public function max(string $field, int $max, string $label): self
    {
        $v = $this->data[$field] ?? null;
        if (is_string($v) && mb_strlen($v) > $max) {
            $this->errors[$field][] = "O campo {$label} deve ter no máximo {$max} caracteres.";
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

        // Confirmação ausente já é reportada por required(); evita mensagem duplicada.
        if ($b === null || $b === '') {
            return $this;
        }

        if ($a !== $b) {
            $this->errors[$confirmationField][] = "A confirmação de {$label} não confere.";
        }
        return $this;
    }

    public function integer(string $field, string $label, ?int $min = null, ?int $max = null): self
    {
        $v = $this->data[$field] ?? null;
        if ($v === null || $v === '') return $this;

        $valid = filter_var($v, FILTER_VALIDATE_INT) !== false;
        if (!$valid) {
            $this->errors[$field][] = "O campo {$label} deve ser um número inteiro.";
            return $this;
        }

        $number = (int) $v;
        if ($min !== null && $number < $min) {
            $this->errors[$field][] = "O campo {$label} deve ser no mínimo {$min}.";
        }
        if ($max !== null && $number > $max) {
            $this->errors[$field][] = "O campo {$label} deve ser no máximo {$max}.";
        }
        return $this;
    }

    public function decimal(string $field, string $label, float $min = 0, ?float $max = null, int $scale = 2): self
    {
        $v = $this->data[$field] ?? null;
        if ($v === null || $v === '') return $this;

        if (!is_int($v) && !is_float($v) && !is_string($v)) {
            $this->errors[$field][] = "O campo {$label} deve ser numérico.";
            return $this;
        }

        $normalized = is_string($v) ? str_replace(',', '.', trim($v)) : (string) $v;
        if (!preg_match('/^\d+(?:\.\d+)?$/', $normalized)) {
            $this->errors[$field][] = "O campo {$label} deve ser numérico.";
            return $this;
        }

        if (str_contains($normalized, '.')) {
            $decimals = strlen($normalized) - strpos($normalized, '.') - 1;
            if ($decimals > $scale) {
                $this->errors[$field][] = "O campo {$label} deve ter no máximo {$scale} casas decimais.";
                return $this;
            }
        }

        $number = (float) $normalized;
        if ($number < $min) {
            $this->errors[$field][] = "O campo {$label} deve ser no mínimo {$min}.";
        }
        if ($max !== null && $number > $max) {
            $this->errors[$field][] = "O campo {$label} deve ser no máximo {$max}.";
        }
        return $this;
    }

    public function boolean(string $field, string $label): self
    {
        $v = $this->data[$field] ?? null;
        if ($v === null) return $this;
        if (!is_bool($v) && !in_array($v, [0, 1, '0', '1'], true)) {
            $this->errors[$field][] = "O campo {$label} deve ser booleano.";
        }
        return $this;
    }

    public function url(string $field, string $label): self
    {
        $v = $this->data[$field] ?? null;
        if ($v === null || $v === '') return $this;
        if (!filter_var($v, FILTER_VALIDATE_URL) || !preg_match('/^https?:\/\//i', $v)) {
            $this->errors[$field][] = "O campo {$label} deve conter uma URL http(s) válida.";
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