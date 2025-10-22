// api/whatsapp/send.js
const UnnichatClient = require('../utils/unnichat');
const Logger = require('../utils/logger');

// Template de mensagem personalizada
function gerarMensagemWhatsApp(lead) {
  const { nome, elemento_primario, diagnostico_completo } = lead;
  
  const primeiroNome = nome.split(' ')[0];
  
  return `Olá, ${primeiroNome}! 👋

Aqui é o Mestre Ye.

Acabei de receber o resultado do seu diagnóstico pela Medicina Tradicional Chinesa e vim te trazer uma notícia importante! 🎯

${diagnostico_completo}

📅 *Black November da Saúde Vitalícia*

Preparei algo especial para você que está buscando resolver isso de verdade.

De 25 a 29 de novembro teremos encontros exclusivos onde você vai:

✨ Entender exatamente o que está causando esses sintomas
🎯 Descobrir práticas específicas para o seu elemento (${elemento_primario})
💪 Começar a sentir resultados já nos primeiros dias

Quantas pessoas você conhece que realmente conseguiram resolver problemas assim sem remédios ou cirurgias?

Eu te mostro como. 😊

Me conta: você está disponível nesses dias?`;
}

// Exporta uma função que recebe o supabase
module.exports = (supabase) => async (req, res) => {
  // Validação de método
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido' 
    });
  }

  try {
    const { leadId, phone, message, customMessage } = req.body;

    console.log('\n📱 ========================================');
    console.log('   ENVIANDO MENSAGEM WHATSAPP');
    console.log('========================================');

    // Validações
    if (!leadId && !phone) {
      return res.status(400).json({
        success: false,
        error: 'leadId ou phone são obrigatórios'
      });
    }

    // Busca dados do lead se fornecido leadId
    let lead = null;
    let phoneNumber = phone;

    if (leadId) {
      console.log('🔍 Buscando lead:', leadId);
      
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('id', leadId)
        .single();

      console.log('📊 Resultado da query:', { 
        encontrado: !!data, 
        erro: error?.message 
      });

      if (error || !data) {
        console.log('❌ Lead não encontrado');
        return res.status(404).json({
          success: false,
          error: 'Lead não encontrado',
          details: error?.message
        });
      }

      lead = data;
      phoneNumber = lead.celular;
      console.log('✅ Lead encontrado:', lead.nome);
    }

    // Valida telefone
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Número de telefone não encontrado'
      });
    }

    console.log('📞 Telefone:', phoneNumber);

    // Gera mensagem
    let messageToSend;
    
    if (customMessage) {
      messageToSend = customMessage;
      console.log('💬 Usando mensagem personalizada');
    } else if (message) {
      messageToSend = message;
    } else if (lead && lead.script_abertura) {
      messageToSend = lead.script_abertura;
      console.log('💬 Usando script_abertura do lead');
    } else if (lead) {
      messageToSend = gerarMensagemWhatsApp(lead);
      console.log('💬 Gerando mensagem automática');
    } else {
      return res.status(400).json({
        success: false,
        error: 'Mensagem não fornecida'
      });
    }

    // Inicializa cliente Unnichat
    console.log('🔌 Conectando ao Unnichat...');
    const unnichat = new UnnichatClient();

    // Verifica se instância está conectada
    const instanceStatus = await unnichat.getInstanceStatus();
    if (!instanceStatus.connected) {
      console.log('❌ WhatsApp não conectado');
      return res.status(503).json({
        success: false,
        error: 'WhatsApp não conectado',
        details: instanceStatus
      });
    }

    console.log('✅ WhatsApp conectado');

    // Envia mensagem
    console.log('📤 Enviando mensagem...');
    const result = await unnichat.sendTextMessage(phoneNumber, messageToSend);

    if (!result.success) {
      console.log('❌ Falha no envio:', result.error);
      
      // Registra falha
      if (leadId) {
        await Logger.logFailure(leadId, phoneNumber, result.error);
        
        // Atualiza lead
        await supabase
          .from('quiz_leads')
          .update({
            whatsapp_status: 'failed',
            whatsapp_error: result.error,
            whatsapp_attempts: lead ? (lead.whatsapp_attempts || 0) + 1 : 1
          })
          .eq('id', leadId);
      }

      return res.status(500).json({
        success: false,
        error: 'Falha ao enviar mensagem',
        details: result.error
      });
    }

    console.log('✅ Mensagem enviada com sucesso!');
    console.log('📨 Message ID:', result.messageId);

    // Registra sucesso
    if (leadId) {
      await Logger.logSend(leadId, phoneNumber, result.messageId, 'sent', {
        message_preview: messageToSend.substring(0, 100),
        unnichat_response: result.data
      });

      // Atualiza lead
      await supabase
        .from('quiz_leads')
        .update({
          whatsapp_status: 'sent',
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_message_id: result.messageId,
          whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
        })
        .eq('id', leadId);
    }

    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      messageId: result.messageId,
      phone: phoneNumber,
      leadId: leadId,
      message: 'Mensagem enviada com sucesso'
    });

  } catch (error) {
    console.error('\n❌ ERRO NO ENVIO WHATSAPP:');
    console.error(error);
    console.error('\n');
    
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
};