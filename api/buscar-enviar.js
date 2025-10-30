// Serve a página estática buscar-enviar.html via serverless (evita conflito de SPA)
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'public', 'buscar-enviar.html');
    const html = fs.readFileSync(filePath, 'utf-8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (e) {
    console.error('Erro ao servir buscar-enviar:', e.message);
    res.status(500).json({ success: false, error: 'Erro ao carregar página' });
  }
};
