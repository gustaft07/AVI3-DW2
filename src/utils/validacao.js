const AppError = require('./AppError');

const arredondar2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

function paraNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor === 'string' && valor.trim() !== '') return Number(valor);
  return NaN;
}

function parseId(valor, campo = 'id') {
  const n = paraNumero(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new AppError(400, `"${campo}" deve ser um inteiro positivo.`);
  }
  return n;
}

function validarNome(valor) {
  if (typeof valor !== 'string' || valor.trim() === '' || valor.trim().length > 100) {
    throw new AppError(400, '"nome" é obrigatório (texto com até 100 caracteres).');
  }
  return valor.trim();
}

function validarMeta(valor) {
  const n = paraNumero(valor);
  if (!Number.isFinite(n) || n <= 0 || n > 9999999999.99 || arredondar2(n) !== n) {
    throw new AppError(400, '"meta_mensal" deve ser um número positivo com até 2 casas decimais.');
  }
  return n;
}

function validarPercentual(valor) {
  const n = paraNumero(valor);
  if (!Number.isFinite(n) || n < 0 || n > 100 || arredondar2(n) !== n) {
    throw new AppError(400, '"percentual_base" deve estar entre 0 e 100 (até 2 casas decimais).');
  }
  return n;
}

function validarValorVenda(valor) {
  const n = paraNumero(valor);
  if (!Number.isFinite(n) || n <= 0 || n > 9999999999.99 || arredondar2(n) !== n) {
    throw new AppError(400, '"valor_venda" deve ser um número positivo com até 2 casas decimais.');
  }
  return n;
}

function validarTipoCliente(valor) {
  if (valor !== 'PF' && valor !== 'PJ') {
    throw new AppError(400, '"tipo_cliente" deve ser "PF" ou "PJ".');
  }
  return valor;
}

function dataValida(a, m, d, h = 0, mi = 0, s = 0) {
  const dt = new Date(Date.UTC(a, m - 1, d, h, mi, s));
  return (
    dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d &&
    h < 24 && mi < 60 && s < 60
  );
}

// Aceita 'YYYY-MM-DD', 'YYYY-MM-DD HH:MM[:SS]' ou ISO com 'T'. Devolve 'YYYY-MM-DD HH:MM:SS'.
function normalizarDataHora(valor) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(valor).trim());
  if (!m) throw new AppError(400, '"data_venda" inválida. Use YYYY-MM-DD ou YYYY-MM-DD HH:MM:SS.');
  const [a, mes, d, h = '00', mi = '00', s = '00'] = m.slice(1);
  if (!dataValida(+a, +mes, +d, +h, +mi, +s)) {
    throw new AppError(400, '"data_venda" não corresponde a uma data/hora válida.');
  }
  return `${a}-${mes}-${d} ${h}:${mi}:${s}`;
}

// Apenas 'YYYY-MM-DD' (usado nos filtros do relatório).
function validarDataISO(valor, campo) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(typeof valor === 'string' ? valor.trim() : '');
  if (!m || !dataValida(+m[1], +m[2], +m[3])) {
    throw new AppError(400, `Parâmetro "${campo}" obrigatório no formato YYYY-MM-DD.`);
  }
  return valor.trim();
}

module.exports = {
  arredondar2, parseId, validarNome, validarMeta, validarPercentual,
  validarValorVenda, validarTipoCliente, normalizarDataHora, validarDataISO,
};
