// ========================================
// ENDPOINT: POST /api/whatsapp/send
// Envio manual de WhatsApp
// ========================================

const supabase = require('../../lib/supabase');
const { formatToE164, formatForUnnichat, formatForDisplay } = require('../../lib/phone-simple');
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
    const messageType = sendChallenge ? 'DESAFIO' : (sendDiagnostico ? 'DIAGNÓSTICO' : 'MENSAGEM CUSTOMIZADA');
    const typeEmoji = sendChallenge ? '🎈' : (sendDiagnostico ? '📋' : '💬');
    
    // Log resumido para coluna "Messages" do Vercel
    console.log(`${typeEmoji} ${messageType} | leadId: ${leadId?.substring(0, 8) || 'N/A'}... | ${SIMULATION ? '🧪 SIM' : '🔴 PROD'}`);
    
    console.log('\n' + '='.repeat(70));
    console.log(`${typeEmoji} ENVIO WHATSAPP: ${messageType}`);
    console.log('='.repeat(70));
    console.log(`🎯 Modo: ${SIMULATION ? '🧪 SIMULAÇÃO (não envia)' : '🔴 PRODUÇÃO (envia real)'}`);
    console.log(`📱 Telefone: ${phone || 'N/A'}`);
    console.log(`🆔 Lead ID: ${leadId || 'N/A'}`);
    if (customMessage) console.log(`💬 Custom: ${customMessage.length} caracteres`);
    console.log('='.repeat(70));
    
    // Validações básicas
    if (!phone && !leadId) {
      console.log('\n❌ ERRO: Telefone ou leadId obrigatório');
      console.log('='.repeat(70) + '\n');
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
      console.log('\n🔍 Buscando lead no banco...');
      console.log(`   ID: ${leadId}`);
      
      const { data: lead, error } = await supabase
        .from('quiz_leads')
        .select('id, celular, nome, email, diagnostico_completo, script_abertura')
        .eq('id', leadId)
        .single();
      
      if (error || !lead) {
        console.log(`\n❌ Lead não encontrado: ${error?.message || 'ID inválido'}`);
        console.log('='.repeat(70) + '\n');
        return res.status(404).json({
          success: false,
          error: 'Lead não encontrado'
        });
      }
      
      leadData = lead;
      phoneToUse = lead.celular;
      
      // Log resumido para Messages
      console.log(`✅ Lead encontrado: ${lead.nome} | Tel: ${lead.celular}`);
      
      console.log('✅ Lead encontrado!');
      console.log(`   👤 Nome: ${lead.nome}`);
      console.log(`   📱 Telefone: ${lead.celular}`);
      console.log(`   📧 Email: ${lead.email || 'N/A'}`);
    }

    // Processar telefone (já deve estar em E.164 se veio do banco)
    const phoneE164 = phoneToUse.startsWith('+') ? phoneToUse : formatToE164(phoneToUse);
    const phoneForUnnichat = formatForUnnichat(phoneE164);
    
    console.log('\n📞 Processando telefone:');
    console.log(`   Original (do banco): ${phoneToUse}`);
    console.log(`   E.164 (interno): ${phoneE164}`);
    console.log(`   Unnichat (sem +): ${phoneForUnnichat}`);
    console.log(`   Display: ${formatForDisplay(phoneE164)}`);
    console.log(`   ⚠️  IMPORTANTE: Unnichat receberá: ${phoneForUnnichat}`);

    // Preparar mensagens baseado no tipo
    if (sendChallenge) {
      // Desafio da Vitalidade (2 mensagens)
      referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${phoneE164}&utm_content=msg-inicial-desafio`;
      
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
      
      console.log('\n🎈 Desafio da Vitalidade:');
      console.log(`   🔗 Link: ${referralLink}`);
      console.log(`   📝 Mensagens: 2 (${messagesToSend[0].text.length} + ${messagesToSend[1].text.length} chars)`);
      
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
      
      console.log(`\n${sendDiagnostico ? '�' : '💬'} Mensagem preparada:`);
      console.log(`   📏 Tamanho: ${messageText.length} caracteres`);
      console.log(`   📄 Preview: ${messageText.substring(0, 100)}...`);
    }

    // SIMULAÇÃO (staging/dev): não exige UNNICHAT_*, apenas registra sucesso
    if (SIMULATION) {
      console.log('\n🧪 MODO SIMULAÇÃO ATIVO');
      console.log(`   ⚠️  Não enviará para Unnichat (apenas registro no banco)`);
      console.log(`   📊 Mensagens a simular: ${messagesToSend.length}`);
      
      try {
        if (leadId) {
          console.log('\n💾 Registrando no banco...');
          
          const newStatus = sendChallenge ? 'desafio_enviado' : 'diagnostico_enviado';
          const newTag = sendChallenge ? 'desafio_enviado' : 'diagnostico_enviado';
          
          await supabase
            .from('quiz_leads')
            .update({ 
              whatsapp_status: newStatus, 
              whatsapp_sent_at: new Date().toISOString() 
            })
            .eq('id', leadId);
          
          console.log(`   ✅ Status atualizado: ${newStatus}`);
          
          try { 
            await addLeadTags(supabase, leadId, [newTag]); 
            console.log(`   🏷️  Tag adicionada: ${newTag}`);
          } catch (e) {
            console.log(`   ⚠️  Tag falhou: ${e.message}`);
          }

          // Registrar logs para cada mensagem
          const logsToInsert = messagesToSend.map(msg => ({
            lead_id: leadId,
            phone: phoneE164,
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
          
          console.log(`   ✅ Logs inseridos: ${messagesToSend.length} mensagem(ns)`);
        }
      } catch (e) {
        console.log(`\n⚠️  Erro ao registrar simulação: ${e.message}`);
      }
      
      // Log resumido para Messages
      console.log(`🧪 SIMULADO: ${messagesToSend.length} msg(s) para ${leadData?.nome || phoneE164} | ${messageType}`);
      
      console.log(`\n${'='.repeat(70)}`);
      console.log(`${typeEmoji} SIMULAÇÃO CONCLUÍDA COM SUCESSO`);
      console.log('='.repeat(70) + '\n');
      return res.status(200).json({ 
        success: true, 
        message: `${messageType} simulado (staging/dev)`, 
        phone: phoneE164, 
        simulation: true,
        messages_sent: messagesToSend.length
      });
    }

    // Produção: exigir UNNICHAT_*
    console.log('\n🔴 MODO PRODUÇÃO - Enviando via Unnichat');
    
    if (!process.env.UNNICHAT_ACCESS_TOKEN) {
      console.log('\n❌ ERRO: UNNICHAT_ACCESS_TOKEN não configurado');
      console.log('='.repeat(70) + '\n');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_ACCESS_TOKEN ausente)' });
    }
    if (!process.env.UNNICHAT_API_URL) {
      console.log('\n❌ ERRO: UNNICHAT_API_URL não configurado');
      console.log('='.repeat(70) + '\n');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_API_URL ausente)' });
    }
    
    // Criar/atualizar contato antes (best-effort)
    try {
      if (leadId && leadData) {
        console.log('\n📝 Atualizando contato no Unnichat...');
        const tags = sendChallenge ? ['desafio_vitalidade'] : ['manual_send'];
        await updateContact(leadData.nome, phoneForUnnichat, leadData.email || `${phoneE164.replace('+', '')}@placeholder.com`, tags);
        console.log('   ✅ Contato atualizado');
        console.log('   ⏳ Aguardando 800ms...');
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e) {
      console.log(`   ⚠️  Erro ao atualizar contato: ${e.message}`);
    }

    // Enviar mensagens
    const DELAY_BETWEEN_MESSAGES = 2000; // 2 segundos
    let messagesSent = 0;
    
    console.log(`\n📤 Iniciando envio de ${messagesToSend.length} mensagem(ns)...`);
    console.log('-'.repeat(70));
    
    for (let i = 0; i < messagesToSend.length; i++) {
      const msg = messagesToSend[i];
      const msgNum = i + 1;
      const totalMsgs = messagesToSend.length;
      
      console.log(`\n📨 Mensagem ${msgNum}/${totalMsgs}:`);
      console.log(`   📏 Tamanho: ${msg.text.length} chars`);
      console.log(`   📤 Enviando para Unnichat: ${phoneForUnnichat}`);
      console.log(`   🔍 Verificar: NÃO deve ter + no número acima`);
      
      await sendMessage(phoneForUnnichat, msg.text);
      messagesSent++;
      
      console.log(`   ✅ Enviada com sucesso!`);
      
      // Aguardar antes da próxima mensagem (se houver)
      if (i < messagesToSend.length - 1) {
        console.log(`   ⏳ Aguardando ${DELAY_BETWEEN_MESSAGES/1000}s antes da próxima...`);
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_MESSAGES));
      }
    }
    
    console.log('\n' + '-'.repeat(70));
    console.log(`✅ Total enviado: ${messagesSent}/${messagesToSend.length} mensagem(ns)`);
    
    // Atualizações pós-envio
    try {
      if (leadId) {
        console.log('\n💾 Registrando no banco de dados...');
        
        const newStatus = sendChallenge ? 'desafio_enviado' : 'diagnostico_enviado';
        const newTag = sendChallenge ? 'desafio_enviado' : 'diagnostico_enviado';
        
        await supabase
          .from('quiz_leads')
          .update({ 
            whatsapp_status: newStatus, 
            whatsapp_sent_at: new Date().toISOString() 
          })
          .eq('id', leadId);
        
        console.log(`   ✅ Status atualizado: ${newStatus}`);
        
        try { 
          await addLeadTags(supabase, leadId, [newTag]); 
          console.log(`   🏷️  Tag adicionada: ${newTag}`);
        } catch (e) {
          console.log(`   ⚠️  Tag falhou: ${e.message}`);
        }
        
        // Registrar logs para cada mensagem
        const logsToInsert = messagesToSend.map(msg => ({
          lead_id: leadId,
          phone: phoneE164,
          status: 'sent',
          metadata: { 
            route: 'api/whatsapp/send', 
            messageType,
            ...msg.metadata
          },
          sent_at: new Date().toISOString()
        }));
        
        await supabase.from('whatsapp_logs').insert(logsToInsert);
        
        console.log(`   ✅ Logs inseridos: ${messagesSent} registro(s)`);
      }
    } catch (e) {
      console.log(`\n⚠️  Erro ao registrar pós-envio: ${e.message}`);
    }

    // Log resumido para Messages
    console.log(`✅ ENVIADO: ${messagesSent} msg(s) para ${leadData?.nome || phoneE164} | ${messageType}`);
    
    console.log('\n' + '='.repeat(70));
    console.log(`${typeEmoji} ENVIO CONCLUÍDO COM SUCESSO`);
    console.log('='.repeat(70) + '\n');
    
    return res.status(200).json({ 
      success: true, 
      message: `${messageType} enviado com sucesso`, 
      phone: phoneE164,
      messages_sent: messagesSent,
      ...(referralLink && { referral_link: referralLink })
    });
    
  } catch (error) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ ERRO NO ENVIO WHATSAPP');
    console.error('='.repeat(70));
    console.error(`📛 Tipo: ${error.constructor.name}`);
    console.error(`💬 Mensagem: ${error.message}`);
    console.error(`📚 Stack:\n${error.stack}`);
    console.error('='.repeat(70) + '\n');
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};