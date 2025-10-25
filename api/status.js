// api/status.js
module.exports = async (req, res) => {
  res.json({
    status: 'ok',
    message: 'API funcionando!',
    environment: process.env.NODE_ENV || 'staging'
  });
};