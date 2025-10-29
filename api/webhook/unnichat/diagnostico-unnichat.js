// api/webhook/unnichat/diagnostico-unnichat.js
// Endpoint para retornar diagnóstico do lead para Unnichat, sem envio direto ao lead

const { createClient } = require('@supabase/supabase-js');
const { normalizePhone } = require('../../../lib/phone');
const { calcularDiagnosticoCompleto } = require('../../../lib/diagnosticos');
const { addLeadTags } = require('../../../lib/tags');
const logger = require('../../../lib/logger');

// Carregar variáveis de ambiente
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  const { phone, name, email } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Telefone é obrigatório' });
  }

  try {
    const reqId = logger && typeof logger.mkid === 'function' ? logger.mkid() : `req-${Date.now()}`;
    const phoneNormalized = normalizePhone(phone);
    // Buscar lead no Supabase
    const { data: lead, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('celular', phoneNormalized)
      .single();

    if (error || !lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    // Calcular/preparar diagnóstico
    let diagnostico = lead.diagnostico_completo;
    if (!diagnostico) {
      diagnostico = calcularDiagnosticoCompleto(lead);
    }

    // Atualizar status, tags e registrar log
    try {
      // Atualizar status do lead
      await supabase
        .from('quiz_leads')
        .update({
          whatsapp_status: 'diagnostico_enviado',
          whatsapp_sent_at: new Date().toISOString()
        })
        .eq('id', lead.id);
      // Adicionar tag
      await addLeadTags(supabase, lead.id, ['diagnostico_enviado']);
      // Registrar log
      await supabase.from('whatsapp_logs').insert({
        lead_id: lead.id,
        phone: lead.celular,
        status: 'diagnostico_enviado',
        metadata: {
          action: 'diagnostico-unnichat',
          triggered_by_webhook: true,
          webhook_payload: req.body
        },
        sent_at: new Date().toISOString()
      });
      logger.info && logger.info(reqId, 'Status/tags/logs atualizados para consulta de diagnóstico', { leadId: lead.id });
    } catch (e) {
      logger.error && logger.error(reqId, 'Erro ao atualizar status/tags/logs', e.message);
    }

    // Retornar apenas o campo 'diagnostico' para Unnichat
    return res.status(200).json({ diagnostico });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
