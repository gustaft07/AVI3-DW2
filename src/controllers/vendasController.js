const vendas = require('../services/vendasService');
const {
  parseId, validarValorVenda, validarTipoCliente, normalizarDataHora,
} = require('../utils/validacao');

async function registrar(req, res, next) {
  try {
    const { id_venda, id_vendedor, id_regiao, data_venda, valor_venda, tipo_cliente } = req.body ?? {};
    const venda = await vendas.registrarVenda({
      id_venda: id_venda === undefined || id_venda === null ? null : parseId(id_venda, 'id_venda'),
      id_vendedor: parseId(id_vendedor, 'id_vendedor'),
      id_regiao: parseId(id_regiao, 'id_regiao'),
      data_venda: data_venda ? normalizarDataHora(data_venda) : null,
      valor_venda: validarValorVenda(valor_venda),
      tipo_cliente: validarTipoCliente(tipo_cliente),
    });
    res.status(201).json(venda);
  } catch (erro) {
    next(erro);
  }
}

async function listar(req, res, next) {
  try {
    res.status(200).json(await vendas.listarVendas());
  } catch (erro) {
    next(erro);
  }
}

async function listarPorVendedor(req, res, next) {
  try {
    const id = parseId(req.params.id);
    res.status(200).json(await vendas.consultarVendasPorVendedor(id));
  } catch (erro) {
    next(erro);
  }
}

async function listarPorRegiao(req, res, next) {
  try {
    const id = parseId(req.params.id);
    res.status(200).json(await vendas.consultarVendasPorRegiao(id));
  } catch (erro) {
    next(erro);
  }
}

async function excluir(req, res, next) {
  try {
    const id = parseId(req.params.id);
    await vendas.excluirVenda(id);
    res.status(200).json({ mensagem: `Venda ${id} excluída com sucesso.` });
  } catch (erro) {
    next(erro);
  }
}

module.exports = { registrar, listar, listarPorVendedor, listarPorRegiao, excluir };
