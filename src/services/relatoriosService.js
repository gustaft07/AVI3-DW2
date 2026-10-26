const { pool } = require('../config/database');
const { registrarErro } = require('../utils/log');
const { arredondar2 } = require('../utils/validacao');

// Filtro de período (a data final é inclusiva: vai até ao fim do dia).
const PERIODO = 've.data_venda >= ? AND ve.data_venda < DATE_ADD(?, INTERVAL 1 DAY)';

async function gerarRelatorioPerformance(inicio, fim) {
  const params = [inicio, fim];
  try {
    const [
      [resumo],
      [porRegiao],
      [porCliente],
      [melhorVendedor],
      [maiorComissao],
      [metasLinhas],
    ] = await Promise.all([
      // Total de vendas e comissão média geral
      pool.execute(
        `SELECT COUNT(*) AS total_vendas,
                COALESCE(SUM(ve.valor_venda), 0) AS valor_total_vendido,
                COALESCE(SUM(ve.valor_comissao), 0) AS comissao_total,
                COALESCE(AVG(ve.valor_comissao), 0) AS comissao_media_geral
         FROM vendas ve
         WHERE ${PERIODO}`,
        params
      ),
      // Vendas e comissão média por região (JOIN + GROUP BY + SUM + AVG + COUNT)
      pool.execute(
        `SELECT r.id_regiao, r.nome_regiao,
                COUNT(ve.id_venda) AS quantidade_vendas,
                COALESCE(SUM(ve.valor_venda), 0) AS total_vendido,
                COALESCE(AVG(ve.valor_comissao), 0) AS comissao_media
         FROM regioes r
         LEFT JOIN vendas ve ON ve.id_regiao = r.id_regiao
              AND ve.data_venda >= ? AND ve.data_venda < DATE_ADD(?, INTERVAL 1 DAY)
         GROUP BY r.id_regiao, r.nome_regiao
         ORDER BY r.id_regiao`,
        params
      ),
      // Vendas por tipo de cliente (GROUP BY + SUM + COUNT)
      pool.execute(
        `SELECT ve.tipo_cliente,
                COUNT(*) AS quantidade_vendas,
                SUM(ve.valor_venda) AS total_vendido
         FROM vendas ve
         WHERE ${PERIODO}
         GROUP BY ve.tipo_cliente`,
        params
      ),
      // Melhor vendedor: maior valor vendido (JOIN + GROUP BY + SUM)
      pool.execute(
        `SELECT v.id_vendedor, v.nome,
                COUNT(*) AS quantidade_vendas,
                SUM(ve.valor_venda) AS total_vendido
         FROM vendas ve
         JOIN vendedores v ON v.id_vendedor = ve.id_vendedor
         WHERE ${PERIODO}
         GROUP BY v.id_vendedor, v.nome
         ORDER BY total_vendido DESC
         LIMIT 1`,
        params
      ),
      // Maior comissão acumulada (JOIN + GROUP BY + SUM)
      pool.execute(
        `SELECT v.id_vendedor, v.nome,
                SUM(ve.valor_comissao) AS comissao_acumulada
         FROM vendas ve
         JOIN vendedores v ON v.id_vendedor = ve.id_vendedor
         WHERE ${PERIODO}
         GROUP BY v.id_vendedor, v.nome
         ORDER BY comissao_acumulada DESC
         LIMIT 1`,
        params
      ),
      // Total vendido por vendedor em cada mês de referência (JOIN + GROUP BY + SUM)
      pool.execute(
        `SELECT v.id_vendedor, v.nome, v.meta_mensal,
                DATE_FORMAT(ve.data_venda, '%Y-%m') AS mes,
                SUM(ve.valor_venda) AS total_mes
         FROM vendedores v
         JOIN vendas ve ON ve.id_vendedor = v.id_vendedor
         WHERE ${PERIODO}
         GROUP BY v.id_vendedor, v.nome, v.meta_mensal, mes
         ORDER BY mes, v.id_vendedor`,
        params
      ),
    ]);

    // Garante PF e PJ no resultado, mesmo sem vendas.
    const vendasPorCliente = ['PF', 'PJ'].map((tipo) => {
      const linha = porCliente.find((c) => c.tipo_cliente === tipo);
      return {
        tipo_cliente: tipo,
        quantidade_vendas: linha ? linha.quantidade_vendas : 0,
        total_vendido: linha ? arredondar2(linha.total_vendido) : 0,
      };
    });

    // Metas por mês de referência.
    const meses = new Map();
    for (const l of metasLinhas) {
      if (!meses.has(l.mes)) {
        meses.set(l.mes, { mes: l.mes, vendedores_com_vendas: 0, metas_atingidas: 0, vendedores: [] });
      }
      const m = meses.get(l.mes);
      const atingiu = l.total_mes >= l.meta_mensal;
      m.vendedores_com_vendas += 1;
      if (atingiu) m.metas_atingidas += 1;
      m.vendedores.push({
        id_vendedor: l.id_vendedor,
        nome: l.nome,
        meta_mensal: l.meta_mensal,
        total_vendido: arredondar2(l.total_mes),
        percentual_da_meta: arredondar2((l.total_mes / l.meta_mensal) * 100),
        meta_atingida: atingiu,
      });
    }

    return {
      periodo: { inicio, fim },
      total_vendas: resumo.total_vendas,
      valor_total_vendido: arredondar2(resumo.valor_total_vendido),
      comissao_total: arredondar2(resumo.comissao_total),
      comissao_media_geral: arredondar2(resumo.comissao_media_geral),
      vendas_por_regiao: porRegiao.map((r) => ({
        id_regiao: r.id_regiao,
        nome_regiao: r.nome_regiao,
        quantidade_vendas: r.quantidade_vendas,
        total_vendido: arredondar2(r.total_vendido),
      })),
      vendas_por_tipo_cliente: vendasPorCliente,
      melhor_vendedor: melhorVendedor
        ? { ...melhorVendedor, total_vendido: arredondar2(melhorVendedor.total_vendido) }
        : null,
      maior_comissao: maiorComissao
        ? { ...maiorComissao, comissao_acumulada: arredondar2(maiorComissao.comissao_acumulada) }
        : null,
      metas_por_mes: [...meses.values()],
      comissao_media_por_regiao: porRegiao.map((r) => ({
        id_regiao: r.id_regiao,
        nome_regiao: r.nome_regiao,
        comissao_media: arredondar2(r.comissao_media),
      })),
    };
  } catch (erro) {
    registrarErro('gerarRelatorioPerformance', erro);
    throw erro;
  }
}

module.exports = { gerarRelatorioPerformance };
