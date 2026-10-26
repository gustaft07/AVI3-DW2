const AppError = require('../utils/AppError');

const ERROS_CONEXAO = [
  'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR', 'ER_CON_COUNT_ERROR',
];

function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: `Rota ${req.method} ${req.originalUrl} não encontrada.` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(erro, req, res, next) {
  if (erro instanceof AppError) {
    return res.status(erro.status).json({ erro: erro.message });
  }
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.' });
  }
  if (erro.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Registo duplicado.' });
  }
  if (erro.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ erro: 'Referência inválida (vendedor ou região inexistente).' });
  }
  if (ERROS_CONEXAO.includes(erro.code)) {
    console.error('Erro de ligação à base de dados:', erro.code, erro.message);
    return res.status(503).json({ erro: 'Base de dados indisponível. Tente novamente mais tarde.' });
  }
  console.error('Erro inesperado:', erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}

module.exports = { rotaNaoEncontrada, errorHandler };
