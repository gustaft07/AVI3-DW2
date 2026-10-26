const { pool } = require('../config/database');
const AppError = require('../utils/AppError');
const { registrarErro } = require('../utils/log');

const formatar = (v) => ({ ...v, ativo: Boolean(v.ativo) });

async function cadastrarVendedor({ nome, meta_mensal, percentual_base }) {
  try {
    const [resultado] = await pool.execute(
      'INSERT INTO vendedores (nome, meta_mensal, percentual_base) VALUES (?, ?, ?)',
      [nome, meta_mensal, percentual_base]
    );
    return await consultarVendedor(resultado.insertId);
  } catch (erro) {
    registrarErro('cadastrarVendedor', erro);
    throw erro;
  }
}

async function listarVendedores({ apenasAtivos = false } = {}) {
  try {
    const sql = apenasAtivos
      ? 'SELECT * FROM vendedores WHERE ativo = ? ORDER BY id_vendedor'
      : 'SELECT * FROM vendedores ORDER BY id_vendedor';
    const [linhas] = await pool.execute(sql, apenasAtivos ? [1] : []);
    return linhas.map(formatar);
  } catch (erro) {
    registrarErro('listarVendedores', erro);
    throw erro;
  }
}

async function consultarVendedor(id) {
  try {
    const [linhas] = await pool.execute('SELECT * FROM vendedores WHERE id_vendedor = ?', [id]);
    if (linhas.length === 0) throw new AppError(404, `Vendedor ${id} não encontrado.`);
    return formatar(linhas[0]);
  } catch (erro) {
    registrarErro('consultarVendedor', erro);
    throw erro;
  }
}

// Atualiza meta mensal e percentual base (nome é opcional).
async function atualizarVendedor(id, { nome, meta_mensal, percentual_base }) {
  try {
    await consultarVendedor(id); // garante 404 se não existir
    await pool.execute(
      'UPDATE vendedores SET nome = COALESCE(?, nome), meta_mensal = ?, percentual_base = ? WHERE id_vendedor = ?',
      [nome ?? null, meta_mensal, percentual_base, id]
    );
    return await consultarVendedor(id);
  } catch (erro) {
    registrarErro('atualizarVendedor', erro);
    throw erro;
  }
}

// Desativação lógica: o histórico de vendas é preservado.
async function desativarVendedor(id) {
  try {
    await consultarVendedor(id);
    await pool.execute('UPDATE vendedores SET ativo = ? WHERE id_vendedor = ?', [0, id]);
    return await consultarVendedor(id);
  } catch (erro) {
    registrarErro('desativarVendedor', erro);
    throw erro;
  }
}

module.exports = {
  cadastrarVendedor, listarVendedores, consultarVendedor, atualizarVendedor, desativarVendedor,
};
