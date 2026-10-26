const { pool } = require('../config/database');
const AppError = require('../utils/AppError');
const { registrarErro } = require('../utils/log');
const { calcularComissao } = require('./comissaoService');
const { consultarVendedor } = require('./vendedoresService');

const SELECT_VENDAS = `
  SELECT ve.id_venda, ve.id_vendedor, v.nome AS nome_vendedor,
         ve.id_regiao, r.nome_regiao, ve.data_venda, ve.valor_venda,
         ve.tipo_cliente, ve.valor_comissao
  FROM vendas ve
  JOIN vendedores v ON v.id_vendedor = ve.id_vendedor
  JOIN regioes r ON r.id_regiao = ve.id_regiao`;

async function consultarRegiao(id) {
  const [linhas] = await pool.execute('SELECT * FROM regioes WHERE id_regiao = ?', [id]);
  if (linhas.length === 0) throw new AppError(404, `Região ${id} não encontrada.`);
  return linhas[0];
}

async function consultarVenda(id) {
  const [linhas] = await pool.execute(`${SELECT_VENDAS} WHERE ve.id_venda = ?`, [id]);
  if (linhas.length === 0) throw new AppError(404, `Venda ${id} não encontrada.`);
  return linhas[0];
}

// Valida, calcula a comissão e regista a venda.
async function registrarVenda({ id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente }) {
  try {
    if (id_venda !== null) {
      const [existe] = await pool.execute('SELECT 1 FROM vendas WHERE id_venda = ?', [id_venda]);
      if (existe.length > 0) throw new AppError(409, `Já existe uma venda com o código ${id_venda}.`);
    }

    const vendedor = await consultarVendedor(id_vendedor); // 404 se inexistente
    if (!vendedor.ativo) {
      throw new AppError(400, `O vendedor ${id_vendedor} está inativo e não pode registar vendas.`);
    }
    const regiao = await consultarRegiao(id_regiao); // 404 se inexistente

    const { percentualTotal, valorComissao } = calcularComissao({
      valorVenda: valor_venda,
      percentualBase: vendedor.percentual_base,
      tipoCliente: tipo_cliente,
      percentualRegiao: regiao.percentual_bonus,
    });

    // id_venda NULL => AUTO_INCREMENT; data_venda NULL => NOW()
    const [resultado] = await pool.execute(
      `INSERT INTO vendas (id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valor_comissao)
       VALUES (?, ?, ?, COALESCE(?, NOW()), ?, ?, ?)`,
      [id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente, valorComissao]
    );

    const venda = await consultarVenda(id_venda ?? resultado.insertId);
    return { ...venda, percentual_aplicado: percentualTotal };
  } catch (erro) {
    registrarErro('registrarVenda', erro);
    throw erro;
  }
}

async function listarVendas() {
  try {
    const [linhas] = await pool.execute(`${SELECT_VENDAS} ORDER BY ve.data_venda DESC, ve.id_venda DESC`);
    return linhas;
  } catch (erro) {
    registrarErro('listarVendas', erro);
    throw erro;
  }
}

async function consultarVendasPorVendedor(idVendedor) {
  try {
    await consultarVendedor(idVendedor);
    const [linhas] = await pool.execute(
      `${SELECT_VENDAS} WHERE ve.id_vendedor = ? ORDER BY ve.data_venda DESC, ve.id_venda DESC`,
      [idVendedor]
    );
    return linhas;
  } catch (erro) {
    registrarErro('consultarVendasPorVendedor', erro);
    throw erro;
  }
}

async function consultarVendasPorRegiao(idRegiao) {
  try {
    await consultarRegiao(idRegiao);
    const [linhas] = await pool.execute(
      `${SELECT_VENDAS} WHERE ve.id_regiao = ? ORDER BY ve.data_venda DESC, ve.id_venda DESC`,
      [idRegiao]
    );
    return linhas;
  } catch (erro) {
    registrarErro('consultarVendasPorRegiao', erro);
    throw erro;
  }
}

// Verifica a existência antes de excluir.
async function excluirVenda(id) {
  try {
    await consultarVenda(id);
    await pool.execute('DELETE FROM vendas WHERE id_venda = ?', [id]);
  } catch (erro) {
    registrarErro('excluirVenda', erro);
    throw erro;
  }
}

module.exports = {
  registrarVenda, listarVendas, consultarVendasPorVendedor, consultarVendasPorRegiao, excluirVenda,
};
