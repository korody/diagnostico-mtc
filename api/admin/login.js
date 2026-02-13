module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  const expected = process.env.ADMIN_SECRET;

  if (!expected || password !== expected) {
    return res.status(401).json({ success: false, error: 'Senha incorreta' });
  }

  return res.json({ success: true, message: 'Autenticado' });
};
