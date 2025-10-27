// ========================================
// ENDPOINT: GET /api/lead/buscar?phone=XXX
// Busca lead por telefone
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
  
  if (!phone) {
    return res.status(400).json({ 
      success: false, 
      error: 'Telefone não fornecido' 
    });
  }
  
  try {
    const phoneClean = normalizePhone(phone);
    
    console.log('🔍 Buscando lead com telefone:', phoneClean);
    
    // Tentar busca exata
    let { data: lead, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('celular', phoneClean)
      .maybeSingle();
    
    if (error) throw error;
    
    // Fallback: últimos 9 dígitos
    if (!lead && phoneClean.length >= 9) {
      const last9 = phoneClean.slice(-9);
      console.log('🔍 Tentando busca pelos últimos 9 dígitos:', last9);
      
      const { data: candidates } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('celular', `%${last9}%`)
        .limit(5);
      
      if (candidates && candidates.length > 0) {
        lead = candidates[0];
        console.log('✅ Lead encontrado (últimos 9):', lead.nome);
      }
    }
    
    // Fallback: últimos 8 dígitos
    if (!lead && phoneClean.length >= 8) {
      const last8 = phoneClean.slice(-8);
      console.log('🔍 Tentando busca pelos últimos 8 dígitos:', last8);
      
      const { data: candidates } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('celular', `%${last8}%`)
        .limit(5);
      
      if (candidates && candidates.length > 0) {
        lead = candidates[0];
        console.log('✅ Lead encontrado (últimos 8):', lead.nome);
      }
    }
    
    if (!lead) {
      console.log('❌ Lead não encontrado:', phoneClean);
      return res.status(404).json({ 
        success: false, 
        error: 'Lead não encontrado: ' + phoneClean
      });
    }
    
    console.log('✅ Lead encontrado:', lead.nome);
    
    res.json({ 
      success: true, 
      lead 
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};