// api/webhook/unnichat/diagnostico-unnichat.js
// Endpoint para retornar diagnóstico do lead para Unnichat, sem envio direto ao lead

const { findLeadByPhone } = require('../../../lib/phone-simple');
const { calcularDiagnosticoCompleto } = require('../../../lib/diagnosticos');
const { addLeadTags } = require('../../../lib/tags');
const logger = require('../../../lib/logger');
const supabase = require('../../../lib/supabase'); // ✅ MUDANÇA CRÍTICA: Usar cliente compartilhado

module.exports = async (req, res) => {
  const reqId = logger && typeof logger.mkid === 'function' ? logger.mkid() : `req-${Date.now()}`;
  logger.info && logger.info(reqId, '🔔 Diagnostico-Unnichat recebido', { body: req.body });

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
    const lead = await findLeadByPhone(supabase, phone, email);
    
    if (!lead) {
      logger.error && logger.error(reqId, '❌ Lead não encontrado', { phone, email });
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    logger.info && logger.info(reqId, '✅ Lead encontrado', { 
      nome: lead.nome, 
      id: lead.id,
      celular: lead.celular, 
      elemento: lead.elemento_principal
    });

    // Calcular/preparar diagnóstico
    let diagnostico = lead.diagnostico_completo;
    if (!diagnostico) {
      logger.info && logger.info(reqId, '🔧 Calculando diagnóstico (não estava no DB)', { leadId: lead.id });
      diagnostico = calcularDiagnosticoCompleto(lead);
    } else {
      logger.info && logger.info(reqId, '📋 Diagnóstico já existe no DB', { leadId: lead.id });
    }

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
          action: 'diagnostico-unnichat',
          triggered_by_webhook: true,
          webhook_payload: req.body,
          telefone_recebido: phone
        },
        sent_at: new Date().toISOString()
      });
      
      if (logError) {
        logger.error && logger.error(reqId, '❌ Erro ao inserir whatsapp_logs', logError.message);
      } else {
        // Log VERCEL friendly igual ver-resultados
        logger.info && logger.info(reqId, '📝 Registrando Logs | whatsapp_logs inserido', { leadId: lead.id, nome: lead.nome });
      }
    } catch (e) {
      logger.error && logger.error(reqId, '❌ Erro geral ao atualizar status/tags/logs', { error: e.message, stack: e.stack });
    }

    logger.info && logger.info(reqId, '📃 DIAGNÓSTICO ENVIADO', { leadId: lead.id, diagnosticoLength: diagnostico?.length || 0 });
    // Retornar apenas o campo 'diagnostico' para Unnichat
    return res.status(200).json({ diagnostico });
  } catch (err) {
    logger.error && logger.error(reqId, '❌ ERRO: Falha inesperada', { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: err.message });
  }
};