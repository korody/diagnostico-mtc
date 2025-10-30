// Página de Busca e Envio de Mensagens (Admin)
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    // HTML template está na mesma pasta com prefixo _ para não virar rota
    const templatePath = path.join(__dirname, '_buscar-enviar-template.html');
    const publicPath = path.join(__dirname, '..', 'public', 'buscar-enviar.html');
    
    const filePath = fs.existsSync(templatePath) ? templatePath : publicPath;
    let html = fs.readFileSync(filePath, 'utf-8');
    
    // Cache bust: adiciona timestamp no HTML
    const timestamp = new Date().toISOString();
    html = html.replace('</head>', `<!-- Deploy: ${timestamp} --></head>`);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).send(html);
  } catch (e) {
    console.error('Erro ao servir buscar-enviar:', e.message);
    console.error('Stack:', e.stack);
    res.status(500).json({ success: false, error: 'Erro ao carregar página: ' + e.message });
  }
};
