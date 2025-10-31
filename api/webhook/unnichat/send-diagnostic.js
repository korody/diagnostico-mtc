// ========================================
// WEBHOOK: Send Diagnostic (Vercel Serverless)
// URL: /api/webhook/unnichat/send-diagnostic
// ========================================

const { findLeadByPhone, formatForUnnichat } = require('../../../lib/phone-simple');
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
    
    // Log curto para Vercel Messages
    const phonePreview = req.body.phone || req.body.from || req.body.contact?.phone || 'no-phone';
    console.log(`🔔 SEND-DIAGNOSTIC | ${phonePreview} | Unnichat webhook`);
    
    if (DEBUG) {
      const safePreview = { ...req.body };
      if (safePreview.phone) safePreview.phone = '[REDACTED]';
      if (safePreview.from) safePreview.from = '[REDACTED]';
      if (safePreview.contact?.phone) safePreview.contact.phone = '[REDACTED]';
      if (safePreview.contact?.email) safePreview.contact.email = '[REDACTED]';
      logger.info && logger.info(reqId, '🔔 WEBHOOK RECEBIDO (resumo payload)', safePreview);
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
    
    // Buscar lead usando função simplificada (3 tentativas: exata E.164, email, últimos 8/9 dígitos)
    if (DEBUG) {
      logger.info && logger.info(reqId, '🔍 Buscando lead...', { phone: phoneFromWebhook, email: emailFromWebhook });
    }
    
    const result = await findLeadByPhone(supabase, phoneFromWebhook, emailFromWebhook);
      
    if (!result || !result.lead) {
      logger.error && logger.error(reqId, '❌ Lead não encontrado', { 
        phoneFromWebhook, 
        emailFromWebhook, 
        nameFromWebhook 
      });
      return res.status(404).json({ 
        success: false, 
        message: 'Lead não identificado. Verifique se o telefone está cadastrado corretamente.' 
      });
    }

    const lead = result.lead;
    const searchMethod = result.method;

    // Log curto para Vercel Messages
    console.log(`✅ Lead: ${lead.nome} | ${lead.elemento_principal || 'sem-elemento'} | método: ${searchMethod}`);

    if (DEBUG) {
      logger.info && logger.info(reqId, '✅ Lead encontrado', { 
        nome: lead.nome, 
        celular: lead.celular, 
        elemento: lead.elemento_principal,
        searchMethod: searchMethod
      });
    }

    // Preparar telefone para Unnichat (E.164 sem +)
    const phoneForUnnichat = formatForUnnichat(lead.celular);
    
    if (DEBUG) {
      logger.info && logger.info(reqId, '� Telefone para Unnichat', { phoneForUnnichat });
    }

    // Atualizar contato no Unnichat
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
          email: lead.email || `${lead.celular.replace('+', '')}@placeholder.com`,
          tags: ['quiz_resultados_enviados']
        })
      });
      
      let contactJson = null;
      try { 
        contactJson = await contactResp.json(); 
      } catch (e) { 
        contactJson = { raw: 'non-json response' }; 
      }
      
      logger.info && logger.info(reqId, '📝 Contato atualizado', { 
        status: contactResp.status, 
        body: contactJson 
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      logger.error && logger.error(reqId, '⚠️ Falha ao atualizar contato', error.message);
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

    if (DEBUG) {
      logger.info && logger.info(reqId, '📨 Enviando diagnóstico...');
    }
    
    // SIMULAÇÃO (staging/dev): não envia para Unnichat, mas atualiza DB
    if (SIMULATION) {
      try {
        await supabase
          .from('quiz_leads')
          .update({ 
            whatsapp_status: 'diagnostico_enviado', 
            whatsapp_sent_at: new Date().toISOString() 
          })
          .eq('id', lead.id);
        
        try { 
          await addLeadTags(supabase, lead.id, ['diagnostico_enviado']); 
        } catch (e) {
          logger.error && logger.error(reqId, '⚠️ Falha ao adicionar tag', e.message);
        }
        
        await supabase.from('whatsapp_logs').insert({
          lead_id: lead.id,
          phone: lead.celular,
          status: 'simulated',
          metadata: { 
            action: 'ver_resultados', 
            simulated: true,
            webhook_payload: webhookData
          },
          sent_at: new Date().toISOString()
        });
      } catch (e) { 
        logger.error && logger.error(reqId, '⚠️ Falha ao registrar simulação', e.message); 
      }
      
      return res.json({ 
        success: true, 
        message: 'Resultados simulados (staging/dev)', 
        leadId: lead.id, 
        leadName: lead.nome, 
        simulation: true 
      });
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
    
    // Retry se contato não encontrado
    if (msgResult && msgResult.message && /Contact not found/i.test(msgResult.message)) {
      if (DEBUG) {
        logger.info && logger.info(reqId, '🔁 Retry após "Contact not found"');
      }
      
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
            email: lead.email || `${lead.celular.replace('+', '')}@placeholder.com`,
            tags: ['quiz_resultados_enviados', 'auto_retry']
          })
        });
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        logger.error && logger.error(reqId, '⚠️ Falha no retry', e.message);
      }
      
      msgResult = await sendOnce();
    }

    logger.info && logger.info(reqId, '📬 Resultado Unnichat', msgResult);
    
    if (msgResult.code && msgResult.code !== '200') {
      logger.error && logger.error(reqId, '❌ Erro ao enviar', msgResult);
      throw new Error(msgResult.message || 'Erro ao enviar mensagem');
    }

    if (DEBUG) {
      logger.info && logger.info(reqId, '✅ Diagnóstico enviado!');
    }
    
    // Log curto para Vercel Messages
    console.log(`📤 DIAGNÓSTICO ENVIADO | ${lead.nome} | WhatsApp: ${phoneForUnnichat}`);

    // Atualizar status e registrar logs
    try {
      await supabase
        .from('quiz_leads')
        .update({
          whatsapp_status: 'diagnostico_enviado',
          whatsapp_sent_at: new Date().toISOString()
        })
        .eq('id', lead.id);
      
      try { 
        await addLeadTags(supabase, lead.id, ['diagnostico_enviado']); 
      } catch (e) { 
        logger.error && logger.error(reqId, '⚠️ Falha ao adicionar tag', e.message); 
      }

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
      
      if (logErr) {
        logger.error && logger.error(reqId, '⚠️ Falha ao inserir log', logErr.message);
      } else {
        logger.info && logger.info(reqId, '📃 Log registrado', { leadId: lead.id });
      }
    } catch (e) {
      logger.error && logger.error(reqId, '⚠️ Erro ao atualizar status', e.message);
    }

    console.log(`✅ SUCESSO | ${lead.nome} | Diagnóstico entregue via WhatsApp`);
    
    res.json({ 
      success: true, 
      message: 'Resultados enviados',
      leadId: lead.id,
      leadName: lead.nome
    });

  } catch (error) {
    console.log(`❌ ERRO SEND-DIAGNOSTIC | ${error.message}`);
    console.error('❌ Erro no webhook:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};