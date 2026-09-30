<?php
namespace App\Services;

use App\Core\Database;
use App\Repositories\CartRepository;

final class CartService
{
    public function __construct(
        private CartRepository $carts = new CartRepository(),
    ) {}

    /**
     * Funde o carrinho de visitante (por token) com o carrinho da conta.
     *
     * Regra adotada (documentar no README):
     *   - produto só no visitante  -> copiado
     *   - produto nos dois         -> quantidades somadas, limitadas ao estoque
     *   - se o limite do estoque for atingido, o usuário é avisado via `warnings`
     *   - ao final, o carrinho de visitante é destruído e seu token invalidado
     *
     * @return array{warnings: string[]}
     */
    public function mergeVisitorCartIntoUser(string $visitorToken, int $userId): array
    {
        $warnings = [];

        return Database::transaction(function ($pdo) use ($visitorToken, $userId, &$warnings) {

            $visitorCart = $this->carts->findByToken($visitorToken, $pdo);
            if (!$visitorCart) {
                // token inválido/expirado: não é erro fatal, apenas ignora
                return ['warnings' => []];
            }

            $userCart = $this->carts->findOrCreateForUser($userId, $pdo);

            // Segurança: nunca fundir o mesmo carrinho consigo mesmo
            if ((int) $userCart['id'] === (int) $visitorCart['id']) {
                return ['warnings' => []];
            }

            $visitorItems = $this->carts->items((int) $visitorCart['id'], $pdo);
            $userItems    = $this->carts->items((int) $userCart['id'], $pdo);

            // indexa os itens já existentes no carrinho do usuário por product_id
            $userQty = [];
            foreach ($userItems as $item) {
                $userQty[(int) $item['product_id']] = (int) $item['quantity'];
            }

            foreach ($visitorItems as $item) {
                $pid   = (int) $item['product_id'];
                $stock = (int) $item['stock'];
                $active = (bool) $item['active'];

                if (!$active || $stock <= 0) {
                    $warnings[] = sprintf(
                        'O produto "%s" ficou indisponível e não foi adicionado ao seu carrinho.',
                        $item['name']
                    );
                    continue;
                }

                $current = $userQty[$pid] ?? 0;
                $desired = $current + (int) $item['quantity'];
                $final   = min($desired, $stock);

                if ($desired > $stock) {
                    $warnings[] = sprintf(
                        'A quantidade de "%s" foi ajustada para %d (limite do estoque).',
                        $item['name'],
                        $stock
                    );
                }

                $this->carts->upsertItem((int) $userCart['id'], $pid, $final, $pdo);
            }

            // descarta o carrinho de visitante — o token deixa de valer
            $this->carts->destroy((int) $visitorCart['id'], $pdo);

            return ['warnings' => $warnings];
        });
    }
}