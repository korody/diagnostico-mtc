// ========================================
// ENDPOINT: GET /api/leads/search?q=
// Busca flexível por nome/email/telefone parcial
// Retorna array de até 10 leads
// ========================================

let supabase;

try {
  supabase = require('../../lib/supabase');
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
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parâmetro q é obrigatório' 
      });
    }

    console.log(`🔍 Busca flexível: "${q}"`);

    // Query base: seleciona campos principais e limita resultados
    let query = supabase
      .from('quiz_leads')
      .select('id, nome, celular, email, elemento_principal, lead_score, created_at')
      .limit(10)
      .order('created_at', { ascending: false });

    // Estratégia de busca baseada no input
    if (q.includes('@')) {
      // Busca por email
      console.log('   📧 Tipo: Email');
      query = query.ilike('email', `%${q}%`);
    } else {
      // Busca por nome ou telefone
      const digits = q.replace(/\D/g, '');
      const filters = [`nome.ilike.%${q}%`];
      
      // Se tem email parcial
      if (q.length > 3) {
        filters.push(`email.ilike.%${q}%`);
      }
      
      // Se tem dígitos suficientes, busca por telefone
      if (digits.length >= 6) {
        filters.push(`celular.ilike.%${digits}%`);
        console.log(`   📱 Buscando telefone com: ${digits}`);
      } else {
        console.log(`   👤 Buscando nome: ${q}`);
      }
      
      query = query.or(filters.join(','));
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log(`   ✅ Encontrados: ${data?.length || 0} lead(s)`);
    
    return res.status(200).json({ 
      success: true, 
      results: data || [],
      count: data?.length || 0,
      query: q
    });
    
  } catch (error) {
    console.error('❌ /api/leads/search erro:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
