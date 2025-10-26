// ========================================
// ENDPOINT: POST /api/whatsapp/send
// Envio manual de WhatsApp
// ========================================

const supabase = require('../../lib/supabase');
const { normalizePhone } = require('../../lib/phone');
const { sendMessage } = require('../../lib/unnichat');

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
    // Verificar configuração ANTES de tentar enviar
    if (!process.env.UNNICHAT_ACCESS_TOKEN) {
      console.log('⚠️  UNNICHAT_ACCESS_TOKEN não configurado');
      return res.status(500).json({
        success: false,
        error: 'WhatsApp não configurado (UNNICHAT_ACCESS_TOKEN ausente)'
      });
    }

    if (!process.env.UNNICHAT_API_URL) {
      console.log('⚠️  UNNICHAT_API_URL não configurado');
      return res.status(500).json({
        success: false,
        error: 'WhatsApp não configurado (UNNICHAT_API_URL ausente)'
      });
    }

    const { phone, customMessage, leadId } = req.body;
    
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
    
    // Se forneceu leadId, buscar dados
    if (leadId) {
      const { data: lead, error } = await supabase
        .from('quiz_leads')
        .select('celular, nome')
        .eq('id', leadId)
        .single();
      
      if (error || !lead) {
        return res.status(404).json({
          success: false,
          error: 'Lead não encontrado'
        });
      }
      
      phoneToUse = lead.celular;
      console.log('✅ Lead encontrado:', lead.nome);
    }

    // Normalizar telefone e preparar para Unnichat
    const phoneNormalized = normalizePhone(phoneToUse);
    const phoneForUnnichat = `55${phoneNormalized}`;
    
    console.log('📱 Enviando para:', phoneForUnnichat);
    
    // Enviar via Unnichat
    await sendMessage(phoneForUnnichat, customMessage);
    
    console.log('✅ Mensagem enviada com sucesso!\n');
    
    return res.status(200).json({
      success: true,
      message: 'Mensagem enviada com sucesso',
      phone: phoneNormalized
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};