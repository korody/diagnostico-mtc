// api/webhook/unnichat/diagnostico-unnichat.js
// Endpoint para retornar diagnóstico do lead para Unnichat, sem envio direto ao lead

const { normalizePhone } = require('../../../lib/phone');
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
    // Busca robusta igual ver-resultados
    let lead = null;
    const phoneNormalized = normalizePhone(phone);
    const candidates = [];
    const digitsOnly = (phone || '').toString().replace(/\D/g, '');
    candidates.push(phoneNormalized);
    if (digitsOnly.startsWith('55')) {
      candidates.push(digitsOnly);
      if (!digitsOnly.startsWith('5511') && digitsOnly.length === 11) {
        candidates.push(digitsOnly.substring(2));
      }
    } else {
      candidates.push(`55${phoneNormalized}`);
    }
    if (phoneNormalized.length >= 10) candidates.push(phoneNormalized.slice(-10));
    if (phoneNormalized.length >= 9) candidates.push(phoneNormalized.slice(-9));
    if (phoneNormalized.length >= 8) candidates.push(phoneNormalized.slice(-8));
    const afterDd = phoneNormalized.replace(/^11/, '');
    if (/^99\d{6,9}/.test(afterDd)) {
      candidates.push(phoneNormalized.replace(/^99/, '9'));
    }
    const dedup = [...new Set(candidates.filter(Boolean))];
    logger.info && logger.info(reqId, '🔎 Candidates de telefone para debug', { raw: phone, normalized: phoneNormalized, candidates: dedup });

    // Tentativa 1: Busca exata
    const { data: leadExato } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('celular', phoneNormalized)
      .maybeSingle();
    if (leadExato) {
      lead = leadExato;
      logger.info && logger.info(reqId, '✅ Lead encontrado (busca exata)', { nome: lead.nome, id: lead.id });
    }

    // Tentativa 2: Últimos 10 dígitos
    if (!lead && phoneNormalized.length >= 10) {
      const ultimos10 = phoneNormalized.slice(-10);
      logger.info && logger.info(reqId, '🔍 Tentativa 2: últimos 10 dígitos', { ultimos10 });
      const { data: leads10 } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('celular', `%${ultimos10}%`)
        .limit(5);
      if (leads10 && leads10.length > 0) {
        lead = leads10[0];
        logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 10 dígitos)', { nome: lead.nome, id: lead.id });
      }
    }

    // Tentativa 3: Últimos 9 dígitos
    if (!lead && phoneNormalized.length >= 9) {
      const ultimos9 = phoneNormalized.slice(-9);
      logger.info && logger.info(reqId, '🔍 Tentativa 3: últimos 9 dígitos', { ultimos9 });
      const { data: leads9 } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('celular', `%${ultimos9}%`)
        .limit(5);
      if (leads9 && leads9.length > 0) {
        lead = leads9[0];
        logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 9 dígitos)', { nome: lead.nome, id: lead.id });
      }
    }

    // Tentativa 4: Últimos 8 dígitos
    if (!lead && phoneNormalized.length >= 8) {
      const ultimos8 = phoneNormalized.slice(-8);
      logger.info && logger.info(reqId, '🔍 Tentativa 4: últimos 8 dígitos', { ultimos8 });
      const { data: leads8 } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('celular', `%${ultimos8}%`)
        .limit(5);
      if (leads8 && leads8.length > 0) {
        lead = leads8[0];
        logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 8 dígitos)', { nome: lead.nome, id: lead.id });
      }
    }

    // Fallback por email
    if (!lead && email) {
      logger.info && logger.info(reqId, '🔍 Fallback: buscando por email', { email });
      const { data: leadByEmail } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (leadByEmail) {
        lead = leadByEmail;
        logger.info && logger.info(reqId, '✅ Lead encontrado por EMAIL', { nome: lead.nome, id: lead.id });
      }
    }

    if (!lead) {
      logger.error && logger.error(reqId, '❌ ERRO: Nenhum lead identificado!', { 
        phone, 
        phoneNormalized, 
        candidates: dedup,
        email,
        body: req.body 
      });
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
      
      // Log VERCEL friendly igual ver-resultados
      logger.info && logger.info(reqId, `📃 DIAGNÓSTICO ENVIADO | whatsapp_logs inserido → { "leadId": "${lead.id}", "nome": "${lead.nome}" }`, { leadId: lead.id, nome: lead.nome });
    } catch (e) {
      logger.error && logger.error(reqId, 'Erro ao atualizar status/tags/logs', e.message);
    }

    // Retornar apenas o campo 'diagnostico' para Unnichat
    return res.status(200).json({ diagnostico });
  } catch (err) {
    logger.error && logger.error(reqId, '❌ ERRO: Falha inesperada', { error: err.message, stack: err.stack });
    return res.status(500).json({ success: false, error: err.message });
  }
};