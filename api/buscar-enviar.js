// Serve a página estática buscar-enviar.html via serverless (evita conflito de SPA)
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    // Em produção (Vercel), busca do build/
    // Em dev local, busca do public/
    const buildPath = path.join(__dirname, '..', 'build', 'buscar-enviar.html');
    const publicPath = path.join(__dirname, '..', 'public', 'buscar-enviar.html');
    
    const filePath = fs.existsSync(buildPath) ? buildPath : publicPath;
    const html = fs.readFileSync(filePath, 'utf-8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.status(200).send(html);
  } catch (e) {
    console.error('Erro ao servir buscar-enviar:', e.message);
    res.status(500).json({ success: false, error: 'Erro ao carregar página' });
  }
};
