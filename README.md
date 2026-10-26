# API de Vendas, Comissões e Metas

Back-End em **Node.js + Express + MySQL** (`mysql2/promise`) para gerir vendedores, vendas, comissões e metas de uma rede de lojas.

## Estrutura

```
api-vendas/
├── .env.example            # modelo das variáveis de ambiente
├── package.json
├── sql/db_vendas.sql       # banco, tabelas, FKs e dados de teste
└── src/
    ├── server.js           # arranque (testa a ligação ao MySQL)
    ├── app.js              # Express, rotas e tratamento de erros
    ├── config/database.js  # pool mysql2/promise (credenciais via .env)
    ├── routes/             # vendedores, vendas, relatórios
    ├── controllers/        # validação HTTP e códigos de resposta
    ├── services/           # funções async + SQL parametrizado
    │   └── comissaoService.js   # calcularComissao() (regra única)
    ├── middlewares/errorHandler.js
    └── utils/              # AppError, validações, log
```

## Instalação

Requisitos: Node.js 18+ e MySQL 8.0.16+.

1. `npm install`
2. Copie `.env.example` para `.env` e preencha `DB_USER` e `DB_PASSWORD`.
3. Crie o banco e os dados de teste: `mysql -u root -p < sql/db_vendas.sql`
4. `npm start` (ou `npm run dev`). A API sobe em `http://localhost:3000`.

## Regra de comissão

`comissão = valor_venda × (percentual_base + bónus_cliente + bónus_região) / 100`

- Cliente: PF +2%, PJ +3% (constante em `comissaoService.js`)
- Região: lido de `regioes.percentual_bonus` (Norte 1, Nordeste 1, Sudeste 0, Sul 0,5)
- A comissão fica gravada em `vendas.valor_comissao` no momento da venda; alterar o percentual do vendedor depois não reescreve o histórico.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | /vendedores | Cadastrar (`nome`, `meta_mensal`, `percentual_base`) |
| GET | /vendedores | Listar (`?ativo=1` só ativos) |
| GET | /vendedores/:id | Consultar |
| PUT | /vendedores/:id | Atualizar `meta_mensal` e `percentual_base` (`nome` opcional) |
| PATCH | /vendedores/:id/desativar | Desativar (mantém o histórico) |
| POST | /vendas | Registrar (`id_vendedor`, `id_regiao`, `valor_venda`, `tipo_cliente`; opcionais `id_venda`, `data_venda`) |
| GET | /vendas | Listar |
| GET | /vendas/vendedor/:id | Por vendedor |
| GET | /vendas/regiao/:id | Por região |
| DELETE | /vendas/:id | Excluir (verifica existência) |
| GET | /relatorios/performance?inicio=YYYY-MM-DD&fim=YYYY-MM-DD | Relatório (período inclusivo) |

Códigos: 200, 201, 400 (validação / vendedor inativo), 404 (não encontrado), 409 (código de venda duplicado), 503 (MySQL indisponível), 500.

## Roteiro de testes (Postman / Insomnia / Thunder Client)

1. **Comissão correta** – `POST /vendas` `{"id_vendedor":1,"id_regiao":1,"valor_venda":2000,"tipo_cliente":"PJ"}` → `valor_comissao: 180` (5% + 3% + 1% = 9%).
2. **Código duplicado** – repita com `"id_venda": 1` → 409.
3. **Vendedor inexistente** – `"id_vendedor": 99` → 404.
4. **Vendedor inativo** – `PATCH /vendedores/4/desativar` e depois `POST /vendas` com `id_vendedor: 4` → 400.
5. **Valor inválido** – `"valor_venda": -10` → 400.
6. **Atualizar meta** – `PUT /vendedores/2` `{"meta_mensal":25000,"percentual_base":4.5}`.
7. **Consultas** – `GET /vendas/vendedor/1`, `GET /vendas/regiao/4`.
8. **Excluir** – `DELETE /vendas/16` (200) e de novo (404).
9. **Relatório** – `GET /relatorios/performance?inicio=2026-10-01&fim=2026-10-31`. Com os dados de teste, Ana, Carla e Eduarda atingem a meta em outubro.
10. **Erro de ligação** – pare o MySQL ou altere `DB_PASSWORD` e faça um pedido → 503.

## Notas

- Todas as consultas usam `pool.execute()` com `?` (sem concatenar valores em SQL).
- As metas são avaliadas por mês de referência (`YYYY-MM`) dentro do período pedido; em períodos que cortam um mês, só as vendas dentro do período contam.
- `.env` está no `.gitignore`; só `.env.example` vai para o GitHub.
