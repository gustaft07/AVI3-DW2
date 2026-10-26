const { Router } = require('express');
const c = require('../controllers/vendedoresController');

const router = Router();

router.post('/', c.criar);
router.get('/', c.listar);
router.get('/:id', c.buscarPorId);
router.put('/:id', c.atualizar);
router.patch('/:id/desativar', c.desativar);

module.exports = router;
