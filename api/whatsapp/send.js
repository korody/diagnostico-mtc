// api/whatsapp/send.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }

  try {
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

    // Normalizar telefone
    const phoneClean = phoneToUse.replace(/\D/g, '').replace(/^55/, '');
    
    // ✅ STAGING: Apenas simular (não enviar de verdade)
    console.log('🧪 STAGING MODE: Simulando envio (não envia de verdade)');
    console.log('📱 Para:', phoneClean);
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Simulação concluída!\n');
    
    return res.status(200).json({
      success: true,
      message: '✅ Mensagem simulada com sucesso (staging)',
      phone: phoneClean,
      environment: 'staging',
      note: 'Em staging, mensagens não são enviadas de verdade'
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};