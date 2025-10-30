// Redirect antigo /enviar-diagnosticos para /buscar-enviar (backward compatibility)
// Temporariamente servindo HTML diretamente até o deploy estabilizar
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    // Tenta servir o HTML novo (busca no diretório api/ onde está o arquivo copiado)
    const sameDirPath = path.join(__dirname, 'buscar-enviar.html');
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
    
    const html = fs.readFileSync(filePath, 'utf-8');
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.status(200).send(html);
  } catch (e) {
    // Fallback para redirect se der erro
    console.error('Erro ao servir HTML, redirecionando:', e.message);
    console.error('Stack:', e.stack);
    res.redirect(301, '/api/buscar-enviar');
  }
};
