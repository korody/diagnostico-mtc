// ========================================
// WEBHOOK: Ver Resultados (Vercel Serverless)
// URL: /api/webhook-ver-resultados
// ========================================

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;

/**
 * Normaliza telefone para busca
 */
function normalizePhone(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('55')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

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
    console.log('\n📥 WEBHOOK RECEBIDO');
    console.log('📋 Payload:', JSON.stringify(req.body, null, 2));
    
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
    
    console.log('📱 Telefone recebido:', phoneFromWebhook);
    console.log('📧 Email recebido:', emailFromWebhook);
    console.log('👤 Nome recebido:', nameFromWebhook);
    
    let lead = null;
    
    // ========================================
    // MÉTODO 1: BUSCAR POR TELEFONE
    // ========================================
    if (phoneFromWebhook) {
      const phoneClean = normalizePhone(phoneFromWebhook);
      console.log('🔍 Telefone normalizado:', phoneClean);
      
      // Buscar exato
      console.log('🔍 Tentativa 1: Busca exata por telefone...');
      const { data: leadExato } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('celular', phoneClean)
        .maybeSingle();
      
      if (leadExato) {
        lead = leadExato;
        console.log('✅ Lead encontrado (busca exata):', lead.nome);
      }
      
      // Buscar pelos últimos 9 dígitos
      if (!lead && phoneClean.length >= 9) {
        const ultimos9 = phoneClean.slice(-9);
        console.log('🔍 Tentativa 2: Busca pelos últimos 9 dígitos:', ultimos9);
        
        const { data: leadsParecidos } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('celular', `%${ultimos9}%`)
          .limit(5);
        
        if (leadsParecidos && leadsParecidos.length > 0) {
          lead = leadsParecidos[0];
          console.log('✅ Lead encontrado (últimos 9 dígitos):', lead.nome);
        }
      }
    }
    
    // ========================================
    // MÉTODO 2: FALLBACK POR EMAIL
    // ========================================
    if (!lead && emailFromWebhook) {
      console.log('🔍 Fallback: Buscando por email:', emailFromWebhook);
      
      const { data: leadByEmail } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('email', emailFromWebhook)
        .maybeSingle();
      
      if (leadByEmail) {
        lead = leadByEmail;
        console.log('✅ Lead encontrado por EMAIL:', lead.nome);
      }
    }
    
    // ========================================
    // MÉTODO 3: FALLBACK FINAL
    // ========================================
    if (!lead) {
      console.log('🔍 Fallback final: Último lead com template_enviado');
      
      const { data: leads } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('whatsapp_status', 'template_enviado')
        .order('whatsapp_sent_at', { ascending: false })
        .limit(1);
      
      if (leads && leads.length > 0) {
        lead = leads[0];
        console.log('⚠️ Lead identificado por fallback final:', lead.nome);
      }
    }

    // ❌ Se não encontrou
    if (!lead) {
      console.error('❌ ERRO: Nenhum lead identificado!');
      return res.status(404).json({ 
        success: false, 
        message: 'Lead não identificado' 
      });
    }

    console.log('\n✅ LEAD IDENTIFICADO:');
    console.log('   Nome:', lead.nome);
    console.log('   Telefone:', lead.celular);
    console.log('   Elemento:', lead.elemento_principal);

    // Preparar telefone para Unnichat
    const phoneForUnnichat = `55${lead.celular.replace(/\D/g, '')}`;

    // Atualizar contato
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
          tags: ['quiz_resultados_enviados']
        })
      });
      
      console.log('✅ Contato atualizado');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log('⚠️ Aviso contato:', error.message);
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

💬 Tem dúvidas sobre seu diagnóstico?
Responda esta mensagem que o Mestre Ye te ajuda! 🙏
    `.trim();

    console.log('📨 Enviando diagnóstico...');
    
    // Enviar diagnóstico
    const msgResponse = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneForUnnichat,
        messageText: mensagem
      })
    });

    const msgResult = await msgResponse.json();

    if (msgResult.code && msgResult.code !== '200') {
      console.error('❌ Erro ao enviar:', msgResult);
      throw new Error(msgResult.message || 'Erro ao enviar mensagem');
    }

    console.log('✅ Diagnóstico enviado com sucesso!\n');

    // Atualizar status
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'resultados_enviados',
        whatsapp_sent_at: new Date().toISOString()
      })
      .eq('id', lead.id);

    // Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'resultados_enviados',
      metadata: { 
        action: 'ver_resultados',
        unnichat_response: msgResult,
        triggered_by_webhook: true,
        webhook_payload: webhookData
      },
      sent_at: new Date().toISOString()
    });

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