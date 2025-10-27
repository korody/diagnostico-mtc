// api/gerar-link-compartilhamento.js
// Gera link único de compartilhamento do desafio para o lead

const { normalizePhone } = require('../lib/phone');
const supabase = require('../lib/supabase');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    
    // Aceita múltiplas formas de telefone (compatível com Unnichat/webhook)
    const phoneRaw = req.body.phone || req.body.from || req.body.contact?.phone || req.body.number || req.body.phoneNumber;
    const email = req.body.email || req.body.contact?.email;
    const name = req.body.name || req.body.contact?.name;
    
    if (!phoneRaw && !email) {
      return res.status(400).json({
        success: false,
        error: 'Phone ou email são obrigatórios'
      });
    }

    // Normalizar telefone se fornecido
    let phoneNormalized = null;
    if (phoneRaw) {
      phoneNormalized = normalizePhone(phoneRaw);
      console.log('📱 Telefone normalizado:', phoneNormalized);
    }

    // Buscar lead no banco com a MESMA estratégia do webhook
    console.log('🔍 Buscando lead no Supabase...');
    let lead = null;

    // 1) Busca exata
    if (phoneNormalized) {
      const { data: leadExato, error: e1 } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('celular', phoneNormalized)
        .maybeSingle();
      if (e1) throw e1;
      if (leadExato) {
        lead = leadExato;
        console.log('✅ Lead encontrado (exato por telefone):', lead.nome);
      }

      // 2) Últimos 9 dígitos
      if (!lead && phoneNormalized.length >= 9) {
        const last9 = phoneNormalized.slice(-9);
        const { data: candidatos, error: e2 } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('celular', `%${last9}%`)
          .limit(5);
        if (e2) throw e2;
        if (candidatos && candidatos.length > 0) {
          lead = candidatos[0];
          console.log('✅ Lead encontrado (últimos 9):', lead.nome);
        }
      }

      // 3) Últimos 8 dígitos (fallback adicional)
      if (!lead && phoneNormalized.length >= 8) {
        const last8 = phoneNormalized.slice(-8);
        const { data: candidatos8, error: e3 } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('celular', `%${last8}%`)
          .limit(5);
        if (e3) throw e3;
        if (candidatos8 && candidatos8.length > 0) {
          lead = candidatos8[0];
          console.log('✅ Lead encontrado (últimos 8):', lead.nome);
        }
      }
    }

    // 4) Fallback por email
    if (!lead && email) {
      const { data: leadEmail, error: e4 } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (e4) throw e4;
      if (leadEmail) {
        lead = leadEmail;
        console.log('✅ Lead encontrado por EMAIL:', lead.nome);
      }
    }

    if (!lead) {
      console.log('❌ Lead não encontrado');
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado',
        phone: phoneNormalized,
        email
      });
    }

    console.log('✅ Lead encontrado:', lead.nome);

    // Se o telefone no DB estiver com formatação diferente, normaliza e atualiza
    try {
      const dbNorm = normalizePhone(lead.celular);
      if (dbNorm && dbNorm !== lead.celular) {
        await supabase
          .from('quiz_leads')
          .update({ celular: dbNorm, updated_at: new Date().toISOString() })
          .eq('id', lead.id);
        console.log('🛠️ Telefone do lead normalizado no banco:', lead.celular, '→', dbNorm);
        lead.celular = dbNorm;
      }
    } catch (e) {
      console.log('⚠️ Não foi possível atualizar telefone normalizado no banco:', e.message);
    }

    // Gerar link único de compartilhamento
    const utm_public = lead.celular || (lead.email ? lead.email.split('@')[0] : 'unknown');
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
      referralLink,
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
