<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;

final class AdminController
{
    /**
     * GET /api/admin/check
     *
     * Só chega aqui quem passou por Authenticate::class . ':admin'
     * (401 sem token válido, 403 para cliente). O frontend usa esta rota para
     * confirmar o papel NO SERVIDOR antes de exibir o painel, em vez de confiar
     * no que está no localStorage (que o usuário pode editar).
     */
    public function check(Request $request, array $params): void
    {
        Response::json(['authorized' => true, 'user' => $request->user()]);
    }
}
