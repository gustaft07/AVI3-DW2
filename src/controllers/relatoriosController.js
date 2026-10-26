const { gerarRelatorioPerformance } = require('../services/relatoriosService');
const AppError = require('../utils/AppError');
const { validarDataISO } = require('../utils/validacao');

async function performance(req, res, next) {
  try {
    const inicio = validarDataISO(req.query.inicio, 'inicio');
    const fim = validarDataISO(req.query.fim, 'fim');
    if (inicio > fim) {
      throw new AppError(400, 'A data "inicio" não pode ser posterior à data "fim".');
    }
    res.status(200).json(await gerarRelatorioPerformance(inicio, fim));
  } catch (erro) {
    next(erro);
  }
}

module.exports = { performance };
