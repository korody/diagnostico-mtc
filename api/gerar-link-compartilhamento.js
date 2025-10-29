// api/gerar-link-compartilhamento.js
// Gera link único de compartilhamento do desafio para o lead

const { normalizePhone } = require('../lib/phone');
const supabase = require('../lib/supabase');
const logger = require('../lib/logger');

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
    const reqId = logger && typeof logger.mkid === 'function' ? logger.mkid() : `req-${Date.now()}`;
    logger.info && logger.info(reqId, '📞 API: Gerar Link de Compartilhamento', { payload: req.body });
    
    // Aceita múltiplas formas de telefone (compatível com Unnichat/webhook)
    const phoneRaw = req.body.phone || req.body.from || req.body.contact?.phone || req.body.number || req.body.phoneNumber;
    const email = req.body.email || req.body.contact?.email;
    const name = req.body.name || req.body.contact?.name;
    
    if (!phoneRaw && !email) {
      logger.error && logger.error(reqId, 'Phone ou email ausentes no payload');
      return res.status(400).json({
        success: false,
        error: 'Phone ou email são obrigatórios'
      });
    }

    // Normalizar telefone se fornecido
    let phoneNormalized = null;
    if (phoneRaw) {
      phoneNormalized = normalizePhone(phoneRaw);
      logger.info && logger.info(reqId, '📱 Telefone normalizado', { phoneNormalized });
    }

    // Buscar lead no banco com a MESMA estratégia do webhook
  logger.info && logger.info(reqId, '🔍 Buscando lead no Supabase');
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
        logger.info && logger.info(reqId, '✅ Lead encontrado (exato por telefone)', { nome: lead.nome, id: lead.id });
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
          logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 9)', { nome: lead.nome, id: lead.id });
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
          logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 8)', { nome: lead.nome, id: lead.id });
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
        logger.info && logger.info(reqId, '✅ Lead encontrado por EMAIL', { nome: lead.nome, id: lead.id });
      }
    }

    if (!lead) {
      logger.error && logger.error(reqId, '❌ Lead não encontrado', { phone: phoneNormalized, email });
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado',
        phone: phoneNormalized,
        email
      });
    }

    logger.info && logger.info(reqId, '✅ Lead encontrado', { nome: lead.nome, id: lead.id });

    // Se o telefone no DB estiver com formatação diferente, normaliza e atualiza
    try {
      const dbNorm = normalizePhone(lead.celular);
      if (dbNorm && dbNorm !== lead.celular) {
        await supabase
          .from('quiz_leads')
          .update({ celular: dbNorm, updated_at: new Date().toISOString() })
          .eq('id', lead.id);
        logger.info && logger.info(reqId, '🛠️ Telefone do lead normalizado no banco', { before: lead.celular, after: dbNorm });
        lead.celular = dbNorm;
      }
    } catch (e) {
      console.log('⚠️ Não foi possível atualizar telefone normalizado no banco:', e.message);
    }

    // Gerar link único de compartilhamento
    const utm_public = lead.celular || (lead.email ? lead.email.split('@')[0] : 'unknown');
    const referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${utm_public}&utm_content=convite-desafio`;

  logger.info && logger.info(reqId, '🔗 Link gerado', { referralLink });

    // Opcional: salvar o link gerado no lead (para tracking)
    await supabase
      .from('quiz_leads')
      .update({
        referral_link_generated_at: new Date().toISOString()
      })
      .eq('id', lead.id);

    // Novo: marcar status do desafio como enviado quando a automação chama este endpoint
    // Motivo: o fluxo de Automação do Unnichat envia a 1ª mensagem, chama esta API para gerar o link
    // e em seguida envia a 2ª mensagem com o link. Consideramos o desafio "enviado" neste ponto.
    try {
      const nowIso = new Date().toISOString();
      const shouldBumpAttempts = lead.whatsapp_status !== 'desafio_enviado';

      await supabase
        .from('quiz_leads')
        .update({
          whatsapp_status: 'desafio_enviado',
          whatsapp_sent_at: nowIso,
          whatsapp_attempts: (lead.whatsapp_attempts || 0) + (shouldBumpAttempts ? 1 : 0)
        })
        .eq('id', lead.id);

      // Registrar log da automação (sem PII sensível além do necessário)
      await supabase.from('whatsapp_logs').insert([
        {
          lead_id: lead.id,
          phone: lead.celular,
          status: 'desafio_enviado',
          metadata: {
            source: 'unnichat_automation',
            endpoint: 'gerar-link-compartilhamento',
            referral_link: referralLink
          },
          sent_at: nowIso
        }
      ]);

      // Adicionar tag
      try { await require('../lib/tags').addLeadTags(supabase, lead.id, ['desafio_enviado']); } catch (e) {}

      logger.info && logger.info(reqId, '📬 Status atualizado para desafio_enviado e log registrado.');
    } catch (e) {
      logger.error && logger.error(reqId, '⚠️ Falha ao atualizar status/log do desafio', e.message);
    }

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
    logger.error && logger.error(reqId, '❌ Erro ao gerar link', { message: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
