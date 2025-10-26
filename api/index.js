// ========================================
// ROOT ENDPOINT: /
// Health check básico
// ========================================

module.exports = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  
  res.json({
    status: 'ok',
    message: 'API Quiz MTC funcionando!',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString()
  });
};
