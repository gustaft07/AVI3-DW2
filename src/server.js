require('dotenv').config();
const app = require('./app');
const { testarConexao } = require('./config/database');

const PORT = Number(process.env.PORT) || 3000;

async function iniciar() {
  try {
    await testarConexao();
    app.listen(PORT, () => console.log(`Servidor a correr em http://localhost:${PORT}`));
  } catch (erro) {
    console.error('Não foi possível iniciar a aplicação. Verifique o MySQL e o ficheiro .env.');
    process.exit(1);
  }
}

iniciar();
