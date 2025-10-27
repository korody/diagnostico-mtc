/**
 * Dashboard MTC - Serverless Function
 * Serve o dashboard HTML diretamente como serverless function
 */

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  try {
    // Ler o arquivo dashboard HTML
    const dashboardPath = path.join(__dirname, '..', 'public', 'dashboard.html');
  let dashboardHtml = fs.readFileSync(dashboardPath, 'utf-8');
  const password = process.env.DASHBOARD_PASSWORD || 'persona2025';
  const apiSecret = process.env.DASHBOARD_API_SECRET || '';
  // Injetar segredos no window para uso apenas no client
  const inject = `\n<script>window.__DASHBOARD_PASSWORD=${JSON.stringify(password)};window.__DASHBOARD_API_SECRET=${JSON.stringify(apiSecret)};</script>\n`;
  dashboardHtml = dashboardHtml.replace('</body>', `${inject}</body>`);
    
    // Retornar HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(dashboardHtml);
  } catch (error) {
    console.error('Erro ao servir dashboard:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao carregar dashboard',
      message: error.message 
    });
  }
};
