// api/status.js
// Endpoint para informar ambiente (production/staging) para badge da interface

module.exports = async (req, res) => {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'staging';
  res.status(200).json({ environment: env });
};
