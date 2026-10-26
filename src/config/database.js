require('dotenv').config();
const mysql = require('mysql2/promise');

// Pool de conexões: reutiliza ligações e suporta pedidos em paralelo.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'db_vendas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // DECIMAL/SUM/AVG devolvidos como number (e não string)
  dateStrings: true,    // DATETIME devolvido como 'YYYY-MM-DD HH:MM:SS' (sem conversão de fuso)
});

async function testarConexao() {
  try {
    await pool.query('SELECT 1');
    console.log('Conexão com o MySQL estabelecida com sucesso.');
  } catch (erro) {
    console.error('Falha ao ligar ao MySQL:', erro.message);
    throw erro;
  }
}

module.exports = { pool, testarConexao };
