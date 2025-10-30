// Serve a página estática buscar-enviar.html via serverless (evita conflito de SPA)
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    // Em produção (Vercel), o HTML está na mesma pasta da função
    // Em dev local, pode estar em public/
    const sameDirPath = path.join(__dirname, 'buscar-enviar-page.html');
    const publicPath = path.join(__dirname, '..', 'public', 'buscar-enviar.html');
    const buildPath = path.join(__dirname, '..', 'build', 'buscar-enviar.html');
    
    let filePath;
    if (fs.existsSync(sameDirPath)) {
      filePath = sameDirPath;
    } else if (fs.existsSync(buildPath)) {
      filePath = buildPath;
    } else {
      filePath = publicPath;
    }
    
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
