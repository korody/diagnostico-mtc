// ========================================
// ENDPOINT: GET /api/leads/search?q=
// Busca flexível por nome/email/telefone (serverless)
// ========================================

let supabase, normalizePhone;

try {
  supabase = require('../../lib/supabase');
  ({ normalizePhone } = require('../../lib/phone'));
} catch (error) {
  console.error('❌ Erro ao carregar módulos:', error.message);
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase não inicializado' });
  }

  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.status(400).json({ success: false, error: 'Parâmetro q é obrigatório' });

    let query = supabase.from('quiz_leads').select('*').limit(10);

    if (q.includes('@')) {
      query = query.ilike('email', `%${q}%`);
    } else {
      const digits = q.replace(/\D/g, '');
      const filters = [
        `nome.ilike.%${q}%`,
        `email.ilike.%${q}%`
      ];
      if (digits.length >= 6) {
        filters.push(`celular.ilike.%${digits}%`);
      }
      query = query.or(filters.join(','));
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ success: true, results: data || [] });
  } catch (error) {
    console.error('❌ /api/leads/search erro:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
