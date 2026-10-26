const { Router } = require('express');
const c = require('../controllers/relatoriosController');

const router = Router();

router.get('/performance', c.performance);

module.exports = router;
