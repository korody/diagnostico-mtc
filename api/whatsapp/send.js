// ========================================
// ENDPOINT: POST /api/whatsapp/send
// Envio manual de WhatsApp
// ========================================

const supabase = require('../../lib/supabase');
const { normalizePhone, formatPhoneForUnnichat } = require('../../lib/phone');
const { addLeadTags } = require('../../lib/tags');
const { sendMessage, updateContact } = require('../../lib/unnichat');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }

  try {
    const SIMULATION = process.env.WHATSAPP_SIMULATION_MODE === 'true' || process.env.NODE_ENV !== 'production';
    const { phone, customMessage, leadId, sendDiagnostico, sendChallenge } = req.body || {};
    
    // Determinar tipo de envio
    const messageType = sendChallenge ? 'DESAFIO' : (sendDiagnostico ? 'DIAGNOSTICO' : 'CUSTOM');
    const typeEmoji = sendChallenge ? '🎈' : (sendDiagnostico ? '📋' : '💬');
    
    console.log('\n📨 ========================================');
    console.log(`   ${typeEmoji} ENVIO: ${messageType}`);
    console.log('========================================');
    console.log('🎯 Modo:', SIMULATION ? '🧪 SIMULACAO' : '🔴 PRODUCAO');
    console.log('📱 Telefone recebido:', phone || 'N/A');
    console.log('🆔 Lead ID:', leadId || 'N/A');
    if (customMessage) console.log('💬 Mensagem customizada:', customMessage.length, 'chars');
    console.log('========================================\n');
    
    // Validações básicas
    if (!phone && !leadId) {
      console.log('❌ ERRO: Telefone ou leadId obrigatório\n');
      return res.status(400).json({
        success: false,
        error: 'Telefone ou leadId obrigatório'
      });
    }

    let phoneToUse = phone;
    let messagesToSend = [];
    let leadData = null;
    let referralLink = null;

    // Se forneceu leadId, buscar dados
    if (leadId) {
      console.log('🔍 Buscando lead ID:', leadId);
      
      const { data: lead, error } = await supabase
        .from('quiz_leads')
        .select('id, celular, nome, email, diagnostico_completo, script_abertura')
        .eq('id', leadId)
        .single();
      
      if (error || !lead) {
        console.log('❌ Lead não encontrado:', error?.message || 'ID inválido\n');
        return res.status(404).json({
          success: false,
          error: 'Lead não encontrado'
        });
      }
      
      leadData = lead;
      phoneToUse = lead.celular;
      
      console.log('✅ Lead encontrado:');
      console.log('   Nome:', lead.nome);
      console.log('   Telefone:', lead.celular);
      console.log('   Email:', lead.email || 'N/A');
    }

    // Normalizar telefone
    const phoneNormalized = normalizePhone(phoneToUse);
    const phoneForUnnichat = formatPhoneForUnnichat(phoneNormalized);
    
    console.log('\n📞 PROCESSAMENTO DO TELEFONE:');
    console.log('   Original:', phoneToUse);
    console.log('   Normalizado:', phoneNormalized);
    console.log('   Para Unnichat:', phoneForUnnichat);

    // Preparar mensagens baseado no tipo
    if (sendChallenge) {
      // Desafio da Vitalidade (2 mensagens)
      referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${phoneNormalized}&utm_content=msg-inicial-desafio`;
      
      messagesToSend = [
        {
          text: `*Quer ganhar acesso ao SUPER COMBO Vitalício do Mestre Ye, sem pagar nada?*

Preparamos algo muito especial para você: o *Desafio da Vitalidade*.

Durante as próximas semanas, você vai receber *missões simples durante as Lives de Aquecimento da Black November da Saúde Vitalícia*.

Cada missão vai te aproximar mais do *equilíbrio, da leveza e da vitalidade que o seu corpo merece.* 🀄

*Veja como participar:*

1. Compartilhe suas missões no Instagram Stories e marque *@mestre_ye*;
2. Convide amigos e familiares para o evento através do seu link único`,
          metadata: { message: 1, referral_link: referralLink }
        },
        {
          text: `Cada pessoa que se inscrever através do seu link único aumenta suas chances de ser o grande vencedor ou vencedrora do SUPER COMBO Vitalício do Mestre Ye!

*Seu link de compartilhamento*:
${referralLink}

Compartilhe vitalidade. Inspire transformação`,
          metadata: { message: 2, referral_link: referralLink }
        }
      ];
      
      console.log('\n🔗 Link compartilhamento:', referralLink);
      console.log('📝 2 MENSAGENS preparadas:', messagesToSend[0].text.length, '+', messagesToSend[1].text.length, 'chars\n');
      
    } else {
      // Diagnóstico ou mensagem customizada (1 mensagem)
      let messageText = customMessage || (leadData ? (sendDiagnostico ? (leadData.diagnostico_completo || leadData.script_abertura) : leadData.script_abertura) : '');
      
      // Adicionar pergunta de feedback no final do diagnóstico
      if (sendDiagnostico && messageText) {
        messageText = messageText.trim() + '\n\nFez sentido esse Diagnóstico para você? 🙏';
      }
      
      messagesToSend = [
        {
          text: messageText,
          metadata: { tipo: sendDiagnostico ? 'diagnostico_completo' : 'custom' }
        }
      ];
      
      console.log('\n📝 PREVIEW DA MENSAGEM:');
      console.log('   Tamanho:', messageText.length, 'caracteres');
      console.log('   Primeiros 150 chars:', messageText.substring(0, 150) + '...\n');
    }

    // SIMULAÇÃO (staging/dev): não exige UNNICHAT_*, apenas registra sucesso
    if (SIMULATION) {
      console.log('🧪 MODO SIMULACAO - Nao enviando para Unnichat');
      console.log(`   (Apenas registrando no banco - ${messagesToSend.length} mensagem(ns))\n`);
      
      try {
        if (leadId) {
          console.log('💾 Atualizando status do lead...');
          
          const newStatus = sendChallenge ? 'desafio_enviado' : 'diagnostico_enviado';
          const newTag = sendChallenge ? 'desafio_enviado' : 'diagnostico_enviado';
          
          await supabase
            .from('quiz_leads')
            .update({ 
              whatsapp_status: newStatus, 
              whatsapp_sent_at: new Date().toISOString() 
            })
            .eq('id', leadId);
          
          try { 
            await addLeadTags(supabase, leadId, [newTag]); 
            console.log(`🏷️  Tag "${newTag}" adicionada`);
          } catch (e) {
            console.log('⚠️  Falha ao adicionar tag:', e.message);
          }

          // Registrar logs para cada mensagem
          const logsToInsert = messagesToSend.map(msg => ({
            lead_id: leadId,
            phone: phoneNormalized,
            status: 'simulated',
            metadata: { 
              route: 'api/whatsapp/send', 
              simulated: true, 
              messageType,
              ...msg.metadata
            },
            sent_at: new Date().toISOString()
          }));
          
          await supabase.from('whatsapp_logs').insert(logsToInsert);
          
          console.log(`✅ Status atualizado no banco (${messagesToSend.length} mensagem(ns) simulada(s))`);
        }
      } catch (e) {
        console.log('⚠️ Falha ao registrar simulacao:', e.message);
      }
      
      console.log(`\n✅ ${typeEmoji} SIMULACAO CONCLUIDA COM SUCESSO\n`);
      return res.status(200).json({ 
        success: true, 
        message: `${messageType} simulado (staging/dev)`, 
        phone: phoneNormalized, 
        simulation: true,
        messages_sent: messagesToSend.length
      });
    }

    // Produção: exigir UNNICHAT_*
    console.log('🔴 MODO PRODUCAO - Enviando via Unnichat\n');
    
    if (!process.env.UNNICHAT_ACCESS_TOKEN) {
      console.log('❌ ERRO: UNNICHAT_ACCESS_TOKEN nao configurado\n');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_ACCESS_TOKEN ausente)' });
    }
    if (!process.env.UNNICHAT_API_URL) {
      console.log('❌ ERRO: UNNICHAT_API_URL nao configurado\n');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_API_URL ausente)' });
    }
    
    // Criar/atualizar contato antes (best-effort)
    try {
      if (leadId && leadData) {
        console.log('📝 Criando/atualizando contato no Unnichat...');
        const tags = sendChallenge ? ['desafio_vitalidade'] : ['manual_send'];
        await updateContact(leadData.nome, phoneForUnnichat, leadData.email || `${phoneNormalized}@placeholder.com`, tags);
        console.log('✅ Contato atualizado');
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e) {
      console.log('⚠️  Aviso ao criar contato:', e.message);
    }

    // Enviar mensagens
    const DELAY_BETWEEN_MESSAGES = 2000; // 2 segundos
    let messagesSent = 0;
    
    for (let i = 0; i < messagesToSend.length; i++) {
      const msg = messagesToSend[i];
      const msgNum = i + 1;
      const totalMsgs = messagesToSend.length;
      
      console.log(`\n📤 Enviando mensagem ${msgNum}/${totalMsgs}...`);
      await sendMessage(phoneForUnnichat, msg.text);
      console.log(`✅ Mensagem ${msgNum}/${totalMsgs} enviada!`);
      
      messagesSent++;
      
      // Aguardar antes da próxima mensagem (se houver)
      if (i < messagesToSend.length - 1) {
        console.log(`⏳ Aguardando ${DELAY_BETWEEN_MESSAGES/1000} segundos...`);
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_MESSAGES));
      }
    }
    
    console.log(`\n✅ ${messagesSent} mensagem(ns) enviada(s) via Unnichat!\n`);
    
    // Atualizações pós-envio
    try {
      if (leadId) {
        console.log('💾 Atualizando status do lead no banco...');
        
        const newStatus = sendChallenge ? 'desafio_enviado' : 'diagnostico_enviado';
        const newTag = sendChallenge ? 'desafio_enviado' : 'diagnostico_enviado';
        
        await supabase
          .from('quiz_leads')
          .update({ 
            whatsapp_status: newStatus, 
            whatsapp_sent_at: new Date().toISOString() 
          })
          .eq('id', leadId);
        
        try { 
          await addLeadTags(supabase, leadId, [newTag]); 
          console.log(`🏷️  Tag "${newTag}" adicionada`);
        } catch (e) {
          console.log('⚠️  Falha ao adicionar tag:', e.message);
        }
        
        // Registrar logs para cada mensagem
        const logsToInsert = messagesToSend.map(msg => ({
          lead_id: leadId,
          phone: phoneNormalized,
          status: 'sent',
          metadata: { 
            route: 'api/whatsapp/send', 
            messageType,
            ...msg.metadata
          },
          sent_at: new Date().toISOString()
        }));
        
        await supabase.from('whatsapp_logs').insert(logsToInsert);
        
        console.log(`✅ Status atualizado no banco (${messagesSent} mensagem(ns))`);
      }
    } catch (e) {
      console.log('⚠️ Falha ao registrar pos-envio:', e.message);
    }

    console.log(`\n${typeEmoji} ENVIO CONCLUIDO COM SUCESSO!`);
    console.log('========================================\n');
    
    return res.status(200).json({ 
      success: true, 
      message: `${messageType} enviado com sucesso`, 
      phone: phoneNormalized,
      messages_sent: messagesSent,
      ...(referralLink && { referral_link: referralLink })
    });
    
  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('   ERRO NO ENVIO');
    console.error('========================================');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================\n');
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};