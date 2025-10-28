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
    
    console.log('📤 Simulando envio WhatsApp (staging)');
    console.log('📱 Telefone:', phone);
    console.log('💬 Mensagem:', customMessage?.substring(0, 100) + '...');
    
    // Validações básicas
    if (!phone && !leadId) {
      return res.status(400).json({
        success: false,
        error: 'Telefone ou leadId obrigatório'
      });
    }

    let phoneToUse = phone;
    let messageToSend = customMessage;

    // Se forneceu leadId, buscar dados
    if (leadId) {
      const { data: lead, error } = await supabase
        .from('quiz_leads')
        .select('id, celular, nome, email, diagnostico_completo, script_abertura')
        .eq('id', leadId)
        .single();
      
      if (error || !lead) {
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
      console.log('✅ Lead encontrado:', lead.nome);
    }

    // Normalizar telefone e preparar para Unnichat
    const phoneNormalized = normalizePhone(phoneToUse);
    const phoneForUnnichat = formatPhoneForUnnichat(phoneNormalized);
    
    console.log('📱 Enviando para:', phoneForUnnichat);
    console.log('📝 Conteúdo:', (messageToSend || '').substring(0, 120) + '...');

    // SIMULAÇÃO (staging/dev): não exige UNNICHAT_*, apenas registra sucesso
    if (SIMULATION) {
      try {
        // Atualiza status se estiver enviando diagnóstico
        if (leadId && sendDiagnostico) {
      await supabase
                  .from('quiz_leads')
                  .update({ whatsapp_status: 'diagnostico_enviado', whatsapp_sent_at: new Date().toISOString() })
            .eq('id', leadId);
      try { await addLeadTags(supabase, leadId, ['diagnostico_enviado']); } catch (e) {}

          await supabase.from('whatsapp_logs').insert({
            lead_id: leadId,
            phone: phoneNormalized,
            status: 'simulated',
            metadata: { route: 'api/whatsapp/send', simulated: true, sendDiagnostico: !!sendDiagnostico },
            sent_at: new Date().toISOString()
          });
        }
      } catch (e) {
        console.log('⚠️ Falha ao registrar simulação:', e.message);
      }
      return res.status(200).json({ success: true, message: 'Simulado (staging/dev)', phone: phoneNormalized, simulation: true });
    }

    // Produção: exigir UNNICHAT_*
    if (!process.env.UNNICHAT_ACCESS_TOKEN) {
      console.log('⚠️  UNNICHAT_ACCESS_TOKEN não configurado');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_ACCESS_TOKEN ausente)' });
    }
    if (!process.env.UNNICHAT_API_URL) {
      console.log('⚠️  UNNICHAT_API_URL não configurado');
      return res.status(500).json({ success: false, error: 'WhatsApp não configurado (UNNICHAT_API_URL ausente)' });
    }
    
    // Criar/atualizar contato antes (best-effort)
    try {
      if (leadId) {
        await updateContact('Contato Quiz', phoneForUnnichat, `${phoneNormalized}@placeholder.com`, ['manual_send']);
        await new Promise(r => setTimeout(r, 800));
      }
    } catch (e) {
      console.log('⚠️ Aviso contato:', e.message);
    }

    // Enviar via Unnichat
    await sendMessage(phoneForUnnichat, messageToSend);
    
    console.log('✅ Mensagem enviada com sucesso!\n');
    
    // Atualizações pós-envio (diagnóstico)
    try {
      if (leadId && sendDiagnostico) {
  await supabase
                .from('quiz_leads')
                .update({ whatsapp_status: 'diagnostico_enviado', whatsapp_sent_at: new Date().toISOString() })
          .eq('id', leadId);
  try { await addLeadTags(supabase, leadId, ['diagnostico_enviado']); } catch (e) {}
        await supabase.from('whatsapp_logs').insert({
          lead_id: leadId,
          phone: phoneNormalized,
          status: 'sent',
          metadata: { route: 'api/whatsapp/send', sendDiagnostico: true },
          sent_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.log('⚠️ Falha ao registrar pós-envio:', e.message);
    }

    return res.status(200).json({ success: true, message: 'Mensagem enviada com sucesso', phone: phoneNormalized });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};