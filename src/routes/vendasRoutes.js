const { Router } = require('express');
const c = require('../controllers/vendasController');

const router = Router();

router.post('/', c.registrar);
router.get('/', c.listar);
router.get('/vendedor/:id', c.listarPorVendedor);
router.get('/regiao/:id', c.listarPorRegiao);
router.delete('/:id', c.excluir);

module.exports = router;
