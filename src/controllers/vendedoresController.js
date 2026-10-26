const vendedores = require('../services/vendedoresService');
const {
  parseId, validarNome, validarMeta, validarPercentual,
} = require('../utils/validacao');

async function criar(req, res, next) {
  try {
    const { nome, meta_mensal, percentual_base } = req.body ?? {};
    const vendedor = await vendedores.cadastrarVendedor({
      nome: validarNome(nome),
      meta_mensal: validarMeta(meta_mensal),
      percentual_base: validarPercentual(percentual_base),
    });
    res.status(201).json(vendedor);
  } catch (erro) {
    next(erro);
  }
}

async function listar(req, res, next) {
  try {
    const apenasAtivos = req.query.ativo === '1' || req.query.ativo === 'true';
    res.status(200).json(await vendedores.listarVendedores({ apenasAtivos }));
  } catch (erro) {
    next(erro);
  }
}

async function buscarPorId(req, res, next) {
  try {
    const id = parseId(req.params.id);
    res.status(200).json(await vendedores.consultarVendedor(id));
  } catch (erro) {
    next(erro);
  }
}

async function atualizar(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const { nome, meta_mensal, percentual_base } = req.body ?? {};
    const vendedor = await vendedores.atualizarVendedor(id, {
      nome: nome === undefined ? undefined : validarNome(nome),
      meta_mensal: validarMeta(meta_mensal),
      percentual_base: validarPercentual(percentual_base),
    });
    res.status(200).json(vendedor);
  } catch (erro) {
    next(erro);
  }
}

async function desativar(req, res, next) {
  try {
    const id = parseId(req.params.id);
    const vendedor = await vendedores.desativarVendedor(id);
    res.status(200).json({ mensagem: 'Vendedor desativado. O histórico de vendas foi preservado.', vendedor });
  } catch (erro) {
    next(erro);
  }
}

module.exports = { criar, listar, buscarPorId, atualizar, desativar };
