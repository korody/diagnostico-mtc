const supabase = require('../../lib/supabase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase não configurado' });
  }

  // GET: Leitura pública
  if (req.method === 'GET') {
    try {
      const { key } = req.query;

      if (key === 'all') {
        const { data, error } = await supabase
          .from('admin_config')
          .select('config_key, config_value, updated_at');

        if (error) return res.status(500).json({ success: false, error: error.message });

        const configs = {};
        (data || []).forEach(row => { configs[row.config_key] = row.config_value; });
        return res.json({ success: true, configs });
      }

      if (!key) return res.status(400).json({ success: false, error: 'key é obrigatório' });

      const { data, error } = await supabase
        .from('admin_config')
        .select('config_value, updated_at')
        .eq('config_key', key)
        .maybeSingle();

      if (error) return res.status(500).json({ success: false, error: error.message });
      if (!data) return res.status(404).json({ success: false, error: 'Configuração não encontrada' });

      return res.json({ success: true, key, value: data.config_value, updated_at: data.updated_at });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // POST: Escrita protegida por ADMIN_SECRET
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    const expected = process.env.ADMIN_SECRET;

    if (!expected || token !== expected) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }

    try {
      const { key, value } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ success: false, error: 'key e value são obrigatórios' });
      }

      const { data, error } = await supabase
        .from('admin_config')
        .upsert({
          config_key: key,
          config_value: value,
          updated_at: new Date().toISOString(),
          updated_by: 'admin'
        }, { onConflict: 'config_key' })
        .select();

      if (error) return res.status(500).json({ success: false, error: error.message });

      return res.json({ success: true, message: 'Configuração salva', data: data[0] });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
