// api/webhook/unnichat/ver-resultados.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }

  try {
    console.log('\n📥 WEBHOOK RECEBIDO');
    console.log('📋 Payload completo:', JSON.stringify(req.body, null, 2));
    
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
    // MÉTODO 1: BUSCAR POR TELEFONE (MÚLTIPLAS TENTATIVAS)
    // ========================================
    if (phoneFromWebhook) {
      const phoneClean = phoneFromWebhook.replace(/\D/g, '').replace(/^55/, '');
      console.log('🔍 Telefone normalizado:', phoneClean);
      
      // TENTATIVA 1: Busca exata
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
      
      // TENTATIVA 2: Buscar pelos últimos 9 dígitos
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
          console.log('   Telefone no banco:', lead.celular);
        }
      }
      
      // TENTATIVA 3: Buscar pelos últimos 8 dígitos
      if (!lead && phoneClean.length >= 8) {
        const ultimos8 = phoneClean.slice(-8);
        console.log('🔍 Tentativa 3: Busca pelos últimos 8 dígitos:', ultimos8);
        
        const { data: leadsParecidos } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('celular', `%${ultimos8}`)
          .limit(5);
        
        if (leadsParecidos && leadsParecidos.length > 0) {
          lead = leadsParecidos[0];
          console.log('✅ Lead encontrado (últimos 8 dígitos):', lead.nome);
          console.log('   Telefone no banco:', lead.celular);
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
    // MÉTODO 3: FALLBACK POR NOME
    // ========================================
    if (!lead && nameFromWebhook) {
      console.log('🔍 Fallback: Buscando por nome:', nameFromWebhook);
      
      const { data: leadsByName } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('nome', `%${nameFromWebhook}%`)
        .limit(5);
      
      if (leadsByName && leadsByName.length > 0) {
        lead = leadsByName[0];
        console.log('⚠️ Lead encontrado por NOME:', lead.nome);
        console.log('   (Múltiplos resultados possíveis)');
      }
    }
    
    // ========================================
    // MÉTODO 4: FALLBACK FINAL - Último com template_enviado
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
        console.log('   Telefone:', lead.celular);
      }
    }

    // ❌ Se ainda não encontrou
    if (!lead) {
      console.error('❌ ERRO: Nenhum lead identificado!');
      console.error('   Telefone buscado:', phoneFromWebhook);
      console.error('   Email buscado:', emailFromWebhook);
      console.error('   Nome buscado:', nameFromWebhook);
      
      return res.status(404).json({ 
        success: false, 
        message: 'Lead não identificado',
        debug: {
          phone: phoneFromWebhook,
          email: emailFromWebhook,
          name: nameFromWebhook
        }
      });
    }

    console.log('\n✅ LEAD FINAL IDENTIFICADO:');
    console.log('   Nome:', lead.nome);
    console.log('   Telefone:', lead.celular);
    console.log('   Email:', lead.email);
    console.log('   Elemento:', lead.elemento_principal);

    const phoneForUnnichat = `55${lead.celular.replace(/\D/g, '')}`;

    // Atualizar/criar contato no Unnichat
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
    
    // Enviar diagnóstico via Unnichat
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

    // Atualizar status no banco
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
        webhook_payload: webhookData,
        search_method: phoneFromWebhook ? 'phone' : emailFromWebhook ? 'email' : 'fallback'
      },
      sent_at: new Date().toISOString()
    });

    console.log('========================================\n');

    res.json({ 
      success: true, 
      message: 'Resultados enviados',
      leadId: lead.id,
      leadName: lead.nome
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
};