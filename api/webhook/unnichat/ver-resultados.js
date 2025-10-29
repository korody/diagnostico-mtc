// ========================================
// WEBHOOK: Ver Resultados (Vercel Serverless)
// URL: /api/webhook-ver-resultados
// ========================================

const { normalizePhone, formatPhoneForUnnichat } = require('../../../lib/phone');
const supabase = require('../../../lib/supabase');
const { addLeadTags } = require('../../../lib/tags');

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const DEBUG = process.env.WHATSAPP_DEBUG === 'true' || process.env.NODE_ENV !== 'production';
const SIMULATION = process.env.WHATSAPP_SIMULATION_MODE === 'true' || process.env.NODE_ENV !== 'production';

// Usa util compartilhado em lib/phone para garantir consistência entre API e serverless
const logger = require('../../../lib/logger');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const reqId = logger && typeof logger.mkid === 'function' ? logger.mkid() : `req-${Date.now()}`;
    if (DEBUG) {
      const safePreview = { ...req.body };
      if (safePreview.phone) safePreview.phone = '[REDACTED]';
      if (safePreview.from) safePreview.from = '[REDACTED]';
      if (safePreview.contact?.phone) safePreview.contact.phone = '[REDACTED]';
      if (safePreview.contact?.email) safePreview.contact.email = '[REDACTED]';
      logger.info && logger.info(reqId, '� WEBHOOK RECEBIDO (resumo payload)', safePreview);
    }
    
    const webhookData = req.body;
    
    // Extrair dados do webhook
    let phoneFromWebhook = 
      webhookData.phone || 
      webhookData.from || 
      webhookData.contact?.phone ||
      webhookData.number ||
      webhookData.phoneNumber;
    
    const emailFromWebhook = webhookData.email || webhookData.contact?.email;
    const nameFromWebhook = webhookData.name || webhookData.contact?.name;
    
    if (DEBUG) {
      logger.info && logger.info(reqId, '📱/📧/👤 Dados do webhook (presença)', { hasPhone: !!phoneFromWebhook, hasEmail: !!emailFromWebhook, name: nameFromWebhook || null });
    }
    
    let lead = null;
    
    // ========================================
    // MÉTODO 1: BUSCAR POR TELEFONE
    // ========================================
    if (phoneFromWebhook) {
  const phoneClean = normalizePhone(phoneFromWebhook);
  if (DEBUG) console.log('🔍 Telefone normalizado (sem DDI):', phoneClean);
      
      // Tentativa 1: Busca exata (telefone salvo SEM DDI 55)
  if (DEBUG) console.log('🔍 Tentativa 1: Busca exata por telefone...');
      const { data: leadExato } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('celular', phoneClean)
        .maybeSingle();
      
      if (leadExato) {
        lead = leadExato;
        logger.info && logger.info(reqId, '✅ Lead encontrado (busca exata)', { nome: lead.nome, id: lead.id });
      }
      
      // Tentativa 2: Últimos 10 dígitos (cobre casos com 9 extra em celulares)
      if (!lead && phoneClean.length >= 10) {
        const ultimos10 = phoneClean.slice(-10);
        if (DEBUG) console.log('🔍 Tentativa 2: Busca pelos últimos 10 dígitos:', ultimos10);
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

      // Tentativa 3: Busca pelos últimos 9 dígitos (caso tenha DDI diferente ou erro)
      if (!lead && phoneClean.length >= 9) {
        const ultimos9 = phoneClean.slice(-9);
        if (DEBUG) console.log('🔍 Tentativa 3: Busca pelos últimos 9 dígitos:', ultimos9);
        
        const { data: leadsParecidos } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('celular', `%${ultimos9}%`)
          .limit(5);
        
        if (leadsParecidos && leadsParecidos.length > 0) {
          lead = leadsParecidos[0];
          logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 9 dígitos)', { nome: lead.nome, id: lead.id });
        }
      }
      
      // Tentativa 4: Busca pelos últimos 8 dígitos (número fixo sem DDD ou celular antigo)
      if (!lead && phoneClean.length >= 8) {
        const ultimos8 = phoneClean.slice(-8);
        if (DEBUG) console.log('🔍 Tentativa 4: Busca pelos últimos 8 dígitos:', ultimos8);
        
        const { data: leadsComUltimos8 } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('celular', `%${ultimos8}%`)
          .limit(5);
        
        if (leadsComUltimos8 && leadsComUltimos8.length > 0) {
          lead = leadsComUltimos8[0];
          logger.info && logger.info(reqId, '✅ Lead encontrado (últimos 8 dígitos)', { nome: lead.nome, id: lead.id });
        }
      }
    }
    
    // ========================================
    // MÉTODO 2: FALLBACK POR EMAIL
    // ========================================
    if (!lead && emailFromWebhook) {
  if (DEBUG) logger.info && logger.info(reqId, '🔍 Fallback: Buscando por email', { email: emailFromWebhook });
      
      const { data: leadByEmail } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('email', emailFromWebhook)
        .maybeSingle();
      
      if (leadByEmail) {
        lead = leadByEmail;
        logger.info && logger.info(reqId, '✅ Lead encontrado por EMAIL', { nome: lead.nome, id: lead.id });
      }
    }

    // ❌ Se não encontrou, retornar erro
    // IMPORTANTE: NÃO usar fallback genérico para evitar enviar diagnóstico para pessoa errada
    // 
    // ESTRATÉGIA DE BUSCA:
    // 1. Busca exata pelo telefone normalizado (sem DDI)
    // 2. Busca pelos últimos 9 dígitos (cobre variações de DDI/DDD)
    // 3. Busca pelos últimos 8 dígitos (cobre fixos e celulares antigos)
    // 4. Busca por email (se fornecido)
    // 
    // Se nenhum método funcionar, retornamos 404 para evitar envio errado
    if (!lead) {
      logger.error && logger.error(reqId, '❌ ERRO: Nenhum lead identificado!', { phoneFromWebhook, normalized: phoneFromWebhook ? normalizePhone(phoneFromWebhook) : null, emailFromWebhook, nameFromWebhook });
      return res.status(404).json({ 
        success: false, 
        message: 'Lead não identificado. Verifique se o telefone está cadastrado corretamente.' 
      });
    }

    if (DEBUG) {
      logger.info && logger.info(reqId, '✅ LEAD IDENTIFICADO', { nome: lead.nome, celular: lead.celular, elemento: lead.elemento_principal });
    }

    // Preparar telefone para Unnichat (normaliza + adiciona DDI 55 somente uma vez)
    const normalizedDbPhone = normalizePhone(lead.celular);
    const phoneForUnnichat = formatPhoneForUnnichat(normalizedDbPhone);

    // Se detectar divergência (ex.: número salvo com 55 ou com espaços), corrigir no banco
    if (normalizedDbPhone && normalizedDbPhone !== lead.celular) {
      try {
        await supabase
          .from('quiz_leads')
          .update({ celular: normalizedDbPhone, updated_at: new Date().toISOString() })
          .eq('id', lead.id);
  if (DEBUG) logger.info && logger.info(reqId, '🛠️ Telefone do lead normalizado no banco', { before: lead.celular, after: normalizedDbPhone });
        // refletir em memória para logs consistentes
        lead.celular = normalizedDbPhone;
      } catch (e) {
        logger.error && logger.error(reqId, '⚠️ Não foi possível atualizar telefone normalizado no banco', e.message);
      }
    }

    // Atualizar contato
    try {
      const contactResp = await fetch(`${UNNICHAT_API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: lead.nome,
          phone: phoneForUnnichat,
          email: lead.email || `${lead.celular}@placeholder.com`,
          tags: ['quiz_resultados_enviados']
        })
      });
      let contactJson = null;
      try { contactJson = await contactResp.json(); } catch (e) { contactJson = { raw: 'non-json response' }; }
      logger.info && logger.info(reqId, 'Contato atualizado (Unnichat)', { status: contactResp.status, body: contactJson });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error && logger.error(reqId, '⚠️ Aviso contato (updateContact) falhou', error.message);
    }

    // Preparar diagnóstico
    const primeiroNome = lead.nome.split(' ')[0];
    const diagnosticoCompleto = lead.diagnostico_completo || 
      'Seu diagnóstico está sendo processado. Em breve você receberá todas as informações!';

    const diagnosticoFormatado = diagnosticoCompleto
      .replace(/🔥 DIAGNÓSTICO:/g, '*🔥 DIAGNÓSTICO:*')
      .replace(/O que seu corpo está dizendo:/g, '*O que seu corpo está dizendo:*')
      .replace(/Por que isso está acontecendo:/g, '*Por que isso está acontecendo:*')
      .replace(/A boa notícia:/g, '*A boa notícia:*')
      .replace(/O que você pode fazer:/g, '*O que você pode fazer:*')
      .replace(/🎯 PRÓXIMO PASSO ESSENCIAL:/g, '*🎯 PRÓXIMO PASSO ESSENCIAL:*');

    const mensagem = `
Olá ${primeiroNome}! 👋

${diagnosticoFormatado}

Fez sentido esse Diagnóstico para você? 🙏
    `.trim();

  if (DEBUG) logger.info && logger.info(reqId, '📨 Enviando diagnóstico...');
    
    // SIMULAÇÃO (staging/dev): não envia para Unnichat, mas atualiza DB e logs
    if (SIMULATION) {
      try {
        await supabase
          .from('quiz_leads')
          .update({ whatsapp_status: 'diagnostico_enviado', whatsapp_sent_at: new Date().toISOString() })
          .eq('id', lead.id);
        try { await addLeadTags(supabase, lead.id, ['diagnostico_enviado']); } catch (e) {}
        await supabase.from('whatsapp_logs').insert({
          lead_id: lead.id,
          phone: lead.celular,
          status: 'simulated',
          metadata: { action: 'ver_resultados', simulated: true },
          sent_at: new Date().toISOString()
        });
      } catch (e) { console.log('⚠️ Falha ao registrar simulação:', e.message); }
      return res.json({ success: true, message: 'Resultados simulados (staging/dev)', leadId: lead.id, leadName: lead.nome, simulation: true });
    }
    
    // Enviar diagnóstico (com 1 retry em caso de 'Contact not found')
    async function sendOnce() {
      const resp = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phoneForUnnichat, messageText: mensagem })
      });
      const json = await resp.json();
      return json;
    }

  let msgResult = await sendOnce();
    if (msgResult && msgResult.message && /Contact not found/i.test(msgResult.message)) {
  if (DEBUG) logger.info && logger.info(reqId, '🔁 Retry após "Contact not found" (forçando atualização de contato)');
      try {
        await fetch(`${UNNICHAT_API_URL}/contact`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: lead.nome,
            phone: phoneForUnnichat,
            email: lead.email || `${lead.celular}@placeholder.com`,
            tags: ['quiz_resultados_enviados','auto_retry']
          })
        });
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        logger.error && logger.error(reqId, '⚠️ Falha ao atualizar contato no retry', e.message);
      }
      msgResult = await sendOnce();
    }

    logger.info && logger.info(reqId, 'Unnichat send result', msgResult);
    if (msgResult.code && msgResult.code !== '200') {
      logger.error && logger.error(reqId, '❌ Erro ao enviar', msgResult);
      throw new Error(msgResult.message || 'Erro ao enviar mensagem');
    }

  if (DEBUG) logger.info && logger.info(reqId, '✅ Diagnóstico enviado com sucesso!');

    // Atualizar status e tags
    try {
      await supabase
        .from('quiz_leads')
        .update({
          whatsapp_status: 'diagnostico_enviado',
          whatsapp_sent_at: new Date().toISOString()
        })
        .eq('id', lead.id);
      try { await addLeadTags(supabase, lead.id, ['diagnostico_enviado']); } catch (e) { logger.error && logger.error(reqId, 'Falha ao addLeadTags', e.message); }

      // Registrar log
      const { error: logErr } = await supabase.from('whatsapp_logs').insert({
        lead_id: lead.id,
        phone: lead.celular,
        status: 'diagnostico_enviado',
        metadata: { 
          action: 'ver_resultados',
          unnichat_response: msgResult,
          triggered_by_webhook: true,
          webhook_payload: webhookData
        },
        sent_at: new Date().toISOString()
      });
      if (logErr) logger.error && logger.error(reqId, 'Falha ao inserir whatsapp_logs', logErr.message);
      else logger.info && logger.info(reqId, 'whatsapp_logs inserido', { leadId: lead.id });
    } catch (e) {
      logger.error && logger.error(reqId, 'Erro atualizando lead ou registrando log', e.message);
    }

    res.json({ 
      success: true, 
      message: 'Resultados enviados',
      leadId: lead.id,
      leadName: lead.nome
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};