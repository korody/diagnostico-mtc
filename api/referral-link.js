// api/referral-link.js
// Gera link único de compartilhamento do desafio para o lead

const { findLeadByPhone } = require('../lib/phone-simple');
const supabase = require('../lib/supabase');
const logger = require('../lib/logger');
const { addLeadTags, TAGS } = require('../lib/tags');

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
    
    // Log curto para Vercel Messages
    const phonePreview = req.body.phone || req.body.from || req.body.contact?.phone || 'no-phone';
    console.log(`🔗 REFERRAL-LINK | ${phonePreview}`);
    
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

    // Buscar lead usando função simplificada (E.164)
    logger.info && logger.info(reqId, '🔍 Buscando lead no Supabase');
    
    const result = await findLeadByPhone(supabase, phoneRaw, email);

    if (!result || !result.lead) {
      logger.error && logger.error(reqId, '❌ Lead não encontrado', { phone: phoneNormalized, email });
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado',
        phone: phoneNormalized,
        email
      });
    }

    const lead = result.lead;
    
    // Log curto para Vercel Messages
    console.log(`✅ Lead: ${lead.nome} | método: ${result.method}`);
    
    logger.info && logger.info(reqId, '✅ Lead encontrado', { nome: lead.nome, id: lead.id, searchMethod: result.method });

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

      await supabase
        .from('quiz_leads')
        .update({
          whatsapp_sent_at: nowIso,
          whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
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
      await addLeadTags(supabase, lead.id, [TAGS.DESAFIO_ENVIADO]);

  logger.info && logger.info(reqId, '🎈DESAFIO ENVIADO | Status atualizado para desafio_enviado e log registrado.');
    } catch (e) {
      logger.error && logger.error(reqId, '⚠️ Falha ao atualizar status/log do desafio', e.message);
    }

    // Log curto final para Vercel Messages
    console.log(`🔗 LINK RECOMENDAÇÃO | ${lead.nome} | ${referralLink.substring(0, 50)}...`);

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
    console.log(`❌ ERRO REFERRAL-LINK | ${error.message}`);
    logger.error && logger.error(reqId, '❌ Erro ao gerar link', { message: error.message, stack: error.stack });
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
