// ========================================
// ENDPOINT: GET /api/lead/buscar?phone=XXX
// Busca EXATA por telefone (retorna 1 lead ou 404)
// Usa findLeadByPhone: busca inteligente em 3 passos
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
  
  if (!phone) {
    return res.status(400).json({ 
      success: false, 
      error: 'Telefone não fornecido' 
    });
  }
  
  try {
    console.log('🔍 Buscando lead com telefone:', phone);
    
    // Buscar usando função simplificada (E.164)
    const result = await findLeadByPhone(supabase, phone, null);
    
    if (!result || !result.lead) {
      console.log('❌ Lead não encontrado:', phone);
      return res.status(404).json({ 
        success: false, 
        error: 'Lead não encontrado: ' + phone
      });
    }
    
    const lead = result.lead;
    console.log('✅ Lead encontrado:', lead.nome, '(método:', result.method + ')');
    
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