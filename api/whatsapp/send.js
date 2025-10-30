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
    const { phone, customMessage, leadId, sendDiagnostico } = req.body || {};
    
    console.log('\n� ========================================');
    console.log('   ENDPOINT: /api/whatsapp/send');
    console.log('========================================');
    console.log('🎯 Modo:', SIMULATION ? '🧪 SIMULAÇÃO' : '🔴 PRODUÇÃO');
    console.log('📱 Telefone recebido:', phone || 'N/A');
    console.log('🆔 Lead ID:', leadId || 'N/A');
    console.log('� Enviar diagnóstico:', sendDiagnostico ? 'SIM' : 'NÃO');
    console.log('�💬 Mensagem customizada:', customMessage ? 'SIM ('+customMessage.length+' chars)' : 'NÃO');
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
    let messageToSend = customMessage;

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
      
      phoneToUse = lead.celular;
      // Se não veio uma mensagem customizada, usar o diagnóstico completo quando solicitado
      if (!messageToSend) {
        messageToSend = sendDiagnostico ? (lead.diagnostico_completo || lead.script_abertura) : lead.script_abertura;
      }
      
      console.log('✅ Lead encontrado:');
      console.log('   Nome:', lead.nome);
      console.log('   Telefone:', lead.celular);
      console.log('   Email:', lead.email || 'N/A');
      console.log('   Tipo mensagem:', sendDiagnostico ? 'DIAGNÓSTICO COMPLETO' : 'SCRIPT ABERTURA');
    }

    // Normalizar telefone e preparar para Unnichat
    const phoneNormalized = normalizePhone(phoneToUse);
    const phoneForUnnichat = formatPhoneForUnnichat(phoneNormalized);
    
    console.log('\n� PROCESSAMENTO DO TELEFONE:');
    console.log('   Original:', phoneToUse);
    console.log('   Normalizado:', phoneNormalized);
    console.log('   Para Unnichat:', phoneForUnnichat);
    console.log('\n📝 PREVIEW DA MENSAGEM:');
    console.log('   Tamanho:', (messageToSend || '').length, 'caracteres');
    console.log('   Primeiros 150 chars:', (messageToSend || '').substring(0, 150) + '...');
    console.log('');

    // SIMULAÇÃO (staging/dev): não exige UNNICHAT_*, apenas registra sucesso
    if (SIMULATION) {
      console.log('🧪 MODO SIMULAÇÃO - Não enviando para Unnichat');
      console.log('   (Apenas registrando no banco de dados)\n');
      
      try {
        // Atualiza status se estiver enviando diagnóstico
        if (leadId && sendDiagnostico) {
          console.log('💾 Atualizando status do lead...');
          
          await supabase
            .from('quiz_leads')
            .update({ whatsapp_status: 'diagnostico_enviado', whatsapp_sent_at: new Date().toISOString() })
            .eq('id', leadId);
          
          try { 
            await addLeadTags(supabase, leadId, ['diagnostico_enviado']); 
            console.log('🏷️  Tag "diagnostico_enviado" adicionada');
          } catch (e) {
            console.log('⚠️  Falha ao adicionar tag:', e.message);
          }

          await supabase.from('whatsapp_logs').insert({
            lead_id: leadId,
            phone: phoneNormalized,
            status: 'simulated',
            metadata: { route: 'api/whatsapp/send', simulated: true, sendDiagnostico: !!sendDiagnostico },
            sent_at: new Date().toISOString()
          });
          
          console.log('✅ Status atualizado no banco');
        }
      } catch (e) {
        console.log('⚠️ Falha ao registrar simulação:', e.message);
      }
      
      console.log('\n✅ SIMULAÇÃO CONCLUÍDA COM SUCESSO\n');
      return res.status(200).json({ success: true, message: 'Simulado (staging/dev)', phone: phoneNormalized, simulation: true });
    }

    // Produção: exigir UNNICHAT_*
    console.log('🔴 MODO PRODUÇÃO - Enviando via Unnichat\n');
    
    if (!process.env.UNNICHAT_ACCESS_TOKEN) {
      console.log('❌ ERRO: UNNICHAT_ACCESS_TOKEN não configurado\n');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_ACCESS_TOKEN ausente)' });
    }
    if (!process.env.UNNICHAT_API_URL) {
      console.log('❌ ERRO: UNNICHAT_API_URL não configurado\n');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_API_URL ausente)' });
    }
    
    // Criar/atualizar contato antes (best-effort)
    try {
      if (leadId) {
        console.log('📝 Criando/atualizando contato no Unnichat...');
        await updateContact('Contato Quiz', phoneForUnnichat, `${phoneNormalized}@placeholder.com`, ['manual_send']);
        console.log('✅ Contato atualizado');
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e) {
      console.log('⚠️  Aviso ao criar contato:', e.message);
    }

    // Enviar via Unnichat
    console.log('\n📤 Enviando mensagem via Unnichat...');
    await sendMessage(phoneForUnnichat, messageToSend);
    
    console.log('✅ Mensagem enviada com sucesso via Unnichat!\n');
    
    // Atualizações pós-envio (diagnóstico)
    try {
      if (leadId && sendDiagnostico) {
        console.log('💾 Atualizando status do lead no banco...');
        
        await supabase
          .from('quiz_leads')
          .update({ whatsapp_status: 'diagnostico_enviado', whatsapp_sent_at: new Date().toISOString() })
          .eq('id', leadId);
        
        try { 
          await addLeadTags(supabase, leadId, ['diagnostico_enviado']); 
          console.log('🏷️  Tag "diagnostico_enviado" adicionada');
        } catch (e) {
          console.log('⚠️  Falha ao adicionar tag:', e.message);
        }
        
        await supabase.from('whatsapp_logs').insert({
          lead_id: leadId,
          phone: phoneNormalized,
          status: 'sent',
          metadata: { route: 'api/whatsapp/send', sendDiagnostico: true },
          sent_at: new Date().toISOString()
        });
        
        console.log('✅ Status atualizado no banco');
      }
    } catch (e) {
      console.log('⚠️ Falha ao registrar pós-envio:', e.message);
    }

    console.log('\n✅ ENVIO CONCLUÍDO COM SUCESSO');
    console.log('========================================\n');
    
    return res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso', phone: phoneNormalized });
    
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