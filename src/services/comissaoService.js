const AppError = require('../utils/AppError');

// Bónus por tipo de cliente (em pontos percentuais).
const BONUS_CLIENTE = { PF: 2, PJ: 3 };

/**
 * Regra única de cálculo de comissão (evita duplicação de lógica).
 * Comissão = valor_venda × (percentual_base + bónus_cliente + bónus_região) / 100
 * Os percentuais são SOMADOS (sem composição).
 *
 * O cálculo é feito em centavos inteiros para evitar erros de ponto flutuante.
 * O bónus da região vem da tabela `regioes` (percentual_bonus).
 */
function calcularComissao({ valorVenda, percentualBase, tipoCliente, percentualRegiao }) {
  const bonusCliente = BONUS_CLIENTE[tipoCliente];
  if (bonusCliente === undefined) {
    throw new AppError(400, '"tipo_cliente" deve ser "PF" ou "PJ".');
  }

  const percentualTotal = Number(percentualBase) + bonusCliente + Number(percentualRegiao);
  const centavosVenda = Math.round(Number(valorVenda) * 100);
  const centesimosPercentual = Math.round(percentualTotal * 100); // ex.: 9% -> 900
  const centavosComissao = Math.round((centavosVenda * centesimosPercentual) / 10000);

  return {
    percentualTotal: centesimosPercentual / 100,
    valorComissao: centavosComissao / 100,
  };
}

module.exports = { calcularComissao, BONUS_CLIENTE };
