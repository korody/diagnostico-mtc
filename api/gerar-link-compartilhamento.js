// api/gerar-link-compartilhamento.js
// Gera link único de compartilhamento do desafio para o lead

const { createClient } = require('@supabase/supabase-js');
const { normalizePhone } = require('../lib/phone');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('\n📞 API: Gerar Link de Compartilhamento');
    console.log('📋 Payload:', JSON.stringify(req.body, null, 2));
    
    const { phone, email, name } = req.body;
    
    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        error: 'Phone ou email são obrigatórios'
      });
    }

    // Normalizar telefone se fornecido
    let phoneNormalized = null;
    if (phone) {
      phoneNormalized = normalizePhone(phone);
      console.log('📱 Telefone normalizado:', phoneNormalized);
    }

    // Buscar lead no banco
    console.log('🔍 Buscando lead no Supabase...');
    
    let query = supabase.from('quiz_leads').select('*');
    
    if (phoneNormalized) {
      query = query.eq('celular', phoneNormalized);
    } else if (email) {
      query = query.eq('email', email);
    }
    
    const { data: lead, error } = await query.maybeSingle();
    
    if (error) {
      console.error('❌ Erro ao buscar lead:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar lead',
        details: error.message
      });
    }
    
    if (!lead) {
      console.log('❌ Lead não encontrado');
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado',
        phone: phoneNormalized,
        email: email
      });
    }

    console.log('✅ Lead encontrado:', lead.nome);

    // Gerar link único de compartilhamento
    const utm_public = lead.celular || lead.email?.split('@')[0] || 'unknown';
    const referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${utm_public}&utm_content=convite-desafio`;

    console.log('🔗 Link gerado:', referralLink);

    // Opcional: salvar o link gerado no lead (para tracking)
    await supabase
      .from('quiz_leads')
      .update({
        referral_link_generated_at: new Date().toISOString()
      })
      .eq('id', lead.id);

    // Retornar resposta
    return res.status(200).json({
      success: true,
      referralLink: referralLink,
      lead: {
        id: lead.id,
        nome: lead.nome,
        celular: lead.celular,
        email: lead.email
      }
    });

  } catch (error) {
    console.error('❌ Erro ao gerar link:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
