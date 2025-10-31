// api/webhook/unnichat/get-diagnostic.js
// Endpoint para retornar diagnóstico do lead para Unnichat, sem envio direto ao lead

const { findLeadByPhone } = require('../../../lib/phone-simple');
const { addLeadTags } = require('../../../lib/tags');
const logger = require('../../../lib/logger');
const supabase = require('../../../lib/supabase');

module.exports = async (req, res) => {
  const reqId = logger && typeof logger.mkid === 'function' ? logger.mkid() : `req-${Date.now()}`;
  
  // Log curto para Vercel Messages
  console.log(`🔔 GET-DIAGNOSTIC | ${req.body.phone || 'no-phone'} | Unnichat webhook`);
  
  logger.info && logger.info(reqId, '🔔 Get-Diagnostic recebido', { body: req.body });

  if (req.method !== 'POST') {
    logger.error && logger.error(reqId, 'Método não permitido', { method: req.method });
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  const { phone, name, email } = req.body;
  if (!phone) {
    logger.error && logger.error(reqId, '❌ ERRO: Telefone é obrigatório', { body: req.body });
    return res.status(400).json({ success: false, error: 'Telefone é obrigatório' });
  }

  try {
    // Buscar lead usando função simplificada (3 tentativas: exata, email, últimos 8/9 dígitos)
    logger.info && logger.info(reqId, '🔍 Buscando lead', { phone, email });
    const result = await findLeadByPhone(supabase, phone, email);
    
    if (!result || !result.lead) {
      logger.error && logger.error(reqId, '❌ Lead não encontrado', { phone, email });
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    const lead = result.lead;
    const searchMethod = result.method;

    logger.info && logger.info(reqId, '✅ Lead encontrado', { 
      nome: lead.nome, 
      id: lead.id,
      celular: lead.celular, 
      elemento: lead.elemento_principal,
      searchMethod: searchMethod
    });
    
    // Log curto para Vercel Messages
    console.log(`✅ Lead: ${lead.nome} | ${lead.elemento_principal || 'sem-elemento'} | método: ${searchMethod}`);

    // Verificar se tem diagnóstico no banco
    const diagnostico = lead.diagnostico_completo || lead.script_abertura;
    
    if (!diagnostico) {
      logger.error && logger.error(reqId, '❌ Lead sem diagnóstico', { leadId: lead.id });
      return res.status(404).json({ 
        success: false, 
        error: 'Lead encontrado mas diagnóstico não disponível. Complete o quiz primeiro.' 
      });
    }
    
    logger.info && logger.info(reqId, '📋 Diagnóstico encontrado', { leadId: lead.id });

    // Atualizar status, tags e registrar log
    logger.info && logger.info(reqId, '💾 Atualizando status do lead no banco', { leadId: lead.id });
    try {
      // Atualizar status do lead
      const { error: updateError } = await supabase
        .from('quiz_leads')
        .update({
          whatsapp_status: 'diagnostico_enviado',
          whatsapp_sent_at: new Date().toISOString()
        })
        .eq('id', lead.id);
      
      if (updateError) {
        logger.error && logger.error(reqId, '❌ Erro ao atualizar lead', updateError.message);
      } else {
        logger.info && logger.info(reqId, '✅ Status do lead atualizado', { leadId: lead.id });
      }
      
      // Adicionar tag
      try {
        await addLeadTags(supabase, lead.id, ['diagnostico_enviado']);
        logger.info && logger.info(reqId, '✅ Tag adicionada', { leadId: lead.id, tag: 'diagnostico_enviado' });
      } catch (tagErr) {
        logger.error && logger.error(reqId, '⚠️ Falha ao adicionar tag', tagErr.message);
      }
      
      // Registrar log
      const { error: logError } = await supabase.from('whatsapp_logs').insert({
        lead_id: lead.id,
        phone: lead.celular,
        status: 'diagnostico_enviado',
        metadata: {
          action: 'get-diagnostic',
          triggered_by_webhook: true,
          webhook_payload: req.body,
          telefone_recebido: phone
        },
        sent_at: new Date().toISOString()
      });
      
      if (logError) {
        logger.error && logger.error(reqId, '❌ Erro ao inserir whatsapp_logs', logError.message);
      } else {
        // Log VERCEL friendly igual send-diagnostic
        logger.info && logger.info(reqId, '📝 Registrando Logs | whatsapp_logs inserido', { leadId: lead.id, nome: lead.nome });
      }
    } catch (e) {
      logger.error && logger.error(reqId, '❌ Erro geral ao atualizar status/tags/logs', { error: e.message, stack: e.stack });
    }

    logger.info && logger.info(reqId, '📃 DIAGNÓSTICO ENVIADO', { leadId: lead.id, diagnosticoLength: diagnostico?.length || 0 });
    
    // Log curto final para Vercel Messages
    console.log(`📤 DIAGNÓSTICO RETORNADO | ${lead.nome} | ${diagnostico?.length || 0} chars`);
    
    return res.status(200).json({
      diagnostico
    });
  } catch (err) {
    console.log(`❌ ERRO GET-DIAGNOSTIC | ${err.message}`);
    logger.error && logger.error(reqId, '❌ ERRO: Falha inesperada', { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: err.message });
  }
};