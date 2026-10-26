const AppError = require('./AppError');

// Regista apenas erros inesperados (erros de negócio são esperados e tratados).
function registrarErro(contexto, erro) {
  if (!(erro instanceof AppError)) {
    console.error(`Erro em ${contexto}:`, erro.message);
  }
}

module.exports = { registrarErro };
