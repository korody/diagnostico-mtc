// ========================================
// ENDPOINT: GET /api/lead/find?phone=XXX ou ?email=XXX
// Busca EXATA por telefone ou e-mail (retorna 1 lead ou 404)
// Phone: usa findLeadByPhone (busca inteligente em 3 passos)
// Email: busca case-insensitive no campo email
// Para busca FLEXÍVEL (nome/email/parcial) use /api/leads/search
// ========================================

let supabase, findLeadByPhone;

try {
  supabase = require('../../lib/supabase');
  ({ findLeadByPhone } = require('../../lib/phone-simple'));
} catch (error) {
  console.error('❌ Erro ao carregar módulos:', error.message);
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar se módulos carregaram
  if (!supabase) {
    return res.status(500).json({
      success: false,
      error: 'Erro de configuração: Supabase não inicializado'
    });
  }

  const phone = req.query.phone || req.body?.phone;
  const email = req.query.email || req.body?.email;
  
  if (!phone && !email) {
    return res.status(400).json({ 
      success: false, 
      error: 'Telefone ou e-mail não fornecido' 
    });
  }
  
  try {
    let lead = null;
    let searchMethod = '';
    
    // Busca por telefone
    if (phone) {
      console.log('🔍 Buscando lead com telefone:', phone);
      const result = await findLeadByPhone(supabase, phone, null);
      if (result && result.lead) {
        lead = result.lead;
        searchMethod = result.method;
        console.log('✅ Lead encontrado por telefone:', lead.nome, '(método:', searchMethod + ')');
      }
    }
    
    // Busca por e-mail (se não encontrou por telefone)
    if (!lead && email) {
      console.log('🔍 Buscando lead com e-mail:', email);
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('email', email)
        .limit(1);
      
      if (error) {
        console.error('❌ Erro ao buscar por e-mail:', error);
      } else if (data && data.length > 0) {
        lead = data[0];
        searchMethod = 'email';
        console.log('✅ Lead encontrado por e-mail:', lead.nome);
      }
    }
    
    if (!lead) {
      const searchTerm = phone || email;
      console.log('❌ Lead não encontrado:', searchTerm);
      return res.status(404).json({ 
        success: false, 
        error: 'Lead não encontrado: ' + searchTerm
      });
    }
    
    res.json({ 
      success: true, 
      lead,
      searchMethod
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};