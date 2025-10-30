// ========================================
// ENDPOINT: POST /api/whatsapp/send-challenge
// Envio do Desafio da Vitalidade (2 mensagens)
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
    const { leadId } = req.body || {};
    
    console.log('\n🎈 ========================================');
    console.log('   DESAFIO DA VITALIDADE');
    console.log('========================================');
    console.log('🎯 Modo:', SIMULATION ? '🧪 SIMULAÇÃO' : '🔴 PRODUÇÃO');
    console.log('🆔 Lead ID:', leadId || 'N/A');
    console.log('========================================\n');
    
    // Validações
    if (!leadId) {
      console.log('❌ ERRO: leadId obrigatório\n');
      return res.status(400).json({
        success: false,
        error: 'leadId obrigatório'
      });
    }

    // Buscar dados do lead
    console.log('🔍 Buscando lead ID:', leadId);
    
    const { data: lead, error } = await supabase
      .from('quiz_leads')
      .select('id, celular, nome, email')
      .eq('id', leadId)
      .single();
    
    if (error || !lead) {
      console.log('❌ Lead não encontrado:', error?.message || 'ID inválido\n');
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
    }
    
    console.log('✅ Lead encontrado:');
    console.log('   Nome:', lead.nome);
    console.log('   Telefone:', lead.celular);
    console.log('   Email:', lead.email || 'N/A');

    // Normalizar telefone
    const phoneNormalized = normalizePhone(lead.celular);
    const phoneForUnnichat = formatPhoneForUnnichat(phoneNormalized);
    
    console.log('\n📞 PROCESSAMENTO DO TELEFONE:');
    console.log('   Original:', lead.celular);
    console.log('   Normalizado:', phoneNormalized);
    console.log('   Para Unnichat:', phoneForUnnichat);

    // Gerar link de compartilhamento
    const referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${phoneNormalized}&utm_content=msg-inicial-desafio`;
    
    console.log('\n🔗 Link de compartilhamento:', referralLink);

    // Mensagens do Desafio da Vitalidade
    const message1 = `*Quer ganhar acesso ao SUPER COMBO Vitalício do Mestre Ye, sem pagar nada?*

Preparamos algo muito especial para você: o *Desafio da Vitalidade*.

Durante as próximas semanas, você vai receber *missões simples durante as Lives de Aquecimento da Black November da Saúde Vitalícia*.

Cada missão vai te aproximar mais do *equilíbrio, da leveza e da vitalidade que o seu corpo merece.* 🀄

*Veja como participar:*

1. Compartilhe suas missões no Instagram Stories e marque *@mestre_ye*;
2. Convide amigos e familiares para o evento através do seu link único`;

    const message2 = `Para aumentar suas chances de ganhar o *SUPER COMBO Vitalício do Mestre Ye*, compartilhe o link abaixo com o máximo de amigos e familiares.

Cada pessoa que se inscrever através do seu link único aumenta suas chances de ser o grande vencedor ou vencedrora!

*Seu link de compartilhamento*:
${referralLink}

Compartilhe vitalidade. Inspire transformação`;

    console.log('\n📝 MENSAGENS PREPARADAS:');
    console.log('   Mensagem 1:', message1.length, 'caracteres');
    console.log('   Mensagem 2:', message2.length, 'caracteres\n');

    // SIMULAÇÃO
    if (SIMULATION) {
      console.log('🧪 MODO SIMULAÇÃO - Não enviando para Unnichat');
      console.log('   (Apenas registrando no banco de dados)\n');
      
      try {
        console.log('💾 Atualizando status do lead...');
        
        await supabase
          .from('quiz_leads')
          .update({ 
            whatsapp_status: 'desafio_enviado', 
            whatsapp_sent_at: new Date().toISOString() 
          })
          .eq('id', leadId);
        
        try { 
          await addLeadTags(supabase, leadId, ['desafio_enviado']); 
          console.log('🏷️  Tag "desafio_enviado" adicionada');
        } catch (e) {
          console.log('⚠️  Falha ao adicionar tag:', e.message);
        }

        // Registrar os 2 envios
        await supabase.from('whatsapp_logs').insert([
          {
            lead_id: leadId,
            phone: phoneNormalized,
            status: 'simulated',
            metadata: { 
              route: 'api/whatsapp/send-challenge', 
              simulated: true, 
              referral_link: referralLink,
              message: 1
            },
            sent_at: new Date().toISOString()
          },
          {
            lead_id: leadId,
            phone: phoneNormalized,
            status: 'simulated',
            metadata: { 
              route: 'api/whatsapp/send-challenge', 
              simulated: true, 
              referral_link: referralLink,
              message: 2
            },
            sent_at: new Date().toISOString()
          }
        ]);
        
        console.log('✅ Status atualizado no banco (2 mensagens simuladas)');
      } catch (e) {
        console.log('⚠️ Falha ao registrar simulação:', e.message);
      }
      
      console.log('\n✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO\n');
      return res.status(200).json({ 
        success: true, 
        message: 'Desafio simulado (staging/dev)', 
        phone: phoneNormalized, 
        simulation: true,
        messages_sent: 2
      });
    }

    // PRODUÇÃO
    console.log('🔴 MODO PRODUÇÃO - Enviando via Unnichat\n');
    
    if (!process.env.UNNICHAT_ACCESS_TOKEN) {
      console.log('❌ ERRO: UNNICHAT_ACCESS_TOKEN não configurado\n');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_ACCESS_TOKEN ausente)' });
    }
    if (!process.env.UNNICHAT_API_URL) {
      console.log('❌ ERRO: UNNICHAT_API_URL não configurado\n');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_API_URL ausente)' });
    }
    
    // Criar/atualizar contato
    try {
      console.log('📝 Criando/atualizando contato no Unnichat...');
      await updateContact(lead.nome, phoneForUnnichat, lead.email || `${phoneNormalized}@placeholder.com`, ['desafio_vitalidade']);
      console.log('✅ Contato atualizado');
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.log('⚠️  Aviso ao criar contato:', e.message);
    }

    // Enviar mensagem 1
    console.log('\n📤 Enviando mensagem 1/2...');
    await sendMessage(phoneForUnnichat, message1);
    console.log('✅ Mensagem 1/2 enviada!');
    
    // Aguardar antes da segunda mensagem
    console.log('⏳ Aguardando 2 segundos...');
    await new Promise(r => setTimeout(r, 2000));
    
    // Enviar mensagem 2
    console.log('📤 Enviando mensagem 2/2...');
    await sendMessage(phoneForUnnichat, message2);
    console.log('✅ Mensagem 2/2 enviada!\n');

    // Atualizar status no banco
    try {
      console.log('💾 Atualizando status do lead no banco...');
      
      await supabase
        .from('quiz_leads')
        .update({ 
          whatsapp_status: 'desafio_enviado', 
          whatsapp_sent_at: new Date().toISOString() 
        })
        .eq('id', leadId);
      
      try { 
        await addLeadTags(supabase, leadId, ['desafio_enviado']); 
        console.log('🏷️  Tag "desafio_enviado" adicionada');
      } catch (e) {
        console.log('⚠️  Falha ao adicionar tag:', e.message);
      }
      
      // Registrar os 2 envios
      await supabase.from('whatsapp_logs').insert([
        {
          lead_id: leadId,
          phone: phoneNormalized,
          status: 'sent',
          metadata: { 
            route: 'api/whatsapp/send-challenge', 
            referral_link: referralLink,
            message: 1
          },
          sent_at: new Date().toISOString()
        },
        {
          lead_id: leadId,
          phone: phoneNormalized,
          status: 'sent',
          metadata: { 
            route: 'api/whatsapp/send-challenge', 
            referral_link: referralLink,
            message: 2
          },
          sent_at: new Date().toISOString()
        }
      ]);
      
      console.log('✅ Status atualizado no banco (2 mensagens)');
    } catch (e) {
      console.log('⚠️ Falha ao registrar no banco:', e.message);
    }

    console.log('\n🎈 DESAFIO ENVIADO COM SUCESSO!');
    console.log('========================================\n');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Desafio da Vitalidade enviado com sucesso', 
      phone: phoneNormalized,
      messages_sent: 2,
      referral_link: referralLink
    });
    
  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('   ERRO NO ENVIO DO DESAFIO');
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
