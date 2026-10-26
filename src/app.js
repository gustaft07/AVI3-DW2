const express = require('express');
const vendedoresRoutes = require('./routes/vendedoresRoutes');
const vendasRoutes = require('./routes/vendasRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const { rotaNaoEncontrada, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());

app.get('/', (req, res) => res.status(200).json({ mensagem: 'API de Vendas e Comissões ativa.' }));
app.use('/vendedores', vendedoresRoutes);
app.use('/vendas', vendasRoutes);
app.use('/relatorios', relatoriosRoutes);

app.use(rotaNaoEncontrada);
app.use(errorHandler);

module.exports = app;
