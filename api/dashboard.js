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
    const dashboardHtml = fs.readFileSync(dashboardPath, 'utf-8');
    
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
