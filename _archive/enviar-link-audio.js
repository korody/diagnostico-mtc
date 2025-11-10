// enviar-link-audio.js
// Envia mensagem de texto com link do áudio personalizado

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { formatForUnnichat } = require('./lib/phone-simple');

// Configuração
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

// ========================================
// 📤 ENVIAR MENSAGEM COM LINK DO ÁUDIO
// ========================================
async function enviarMensagemComLink(phone, audioUrl, lead) {
  const primeiroNome = lead.nome.split(' ')[0];
  
  const mensagem = `🎙️ Olá *${primeiroNome}*!

Eu sou o *Mestre Ye* e preparei uma mensagem especial personalizada para você.

👉 *Clique aqui para ouvir:*
${audioUrl}

Nessa mensagem eu falo sobre:
✨ Seu diagnóstico (deficiência de ${lead.elemento_principal})
✨ O que você está passando
✨ Como eu posso te ajudar

E principalmente sobre o *SUPER COMBO Vitalício* que vai mudar sua saúde!

🔥 Essa é a última turma. Não perca essa chance!

_Mestre Ye - Medicina Tradicional Chinesa_`;

  console.log('   📤 Enviando mensagem com link...');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageText: mensagem
  };
  
  const response = await axios.post(url, body, {
    headers: {
      'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log('   ✅ Mensagem enviada com sucesso!');
  return response.data;
}

// ========================================
// 🎯 PROCESSAR LEAD
// ========================================
async function processarLead(lead, audioUrl) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📱 Lead: ${lead.nome}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   📧 Email: ${lead.email}`);
  console.log(`   📱 Celular: ${lead.celular}`);
  console.log(`   🎯 Elemento: ${lead.elemento_principal}`);
  console.log(`   🎙️ Áudio: ${audioUrl}`);
  
  try {
    // Enviar mensagem com link
    const phone = formatForUnnichat(lead.celular);
    const result = await enviarMensagemComLink(phone, audioUrl, lead);
    
    // Atualizar banco de dados
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'audio_link_enviado',
        whatsapp_sent_at: new Date().toISOString(),
        whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
      })
      .eq('id', lead.id);
    
    // Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'audio_link_enviado',
      metadata: {
        audio_url: audioUrl,
        whatsapp_response: result,
        campaign: 'black_vitalicia_audio_link'
      },
      sent_at: new Date().toISOString()
    });
    
    console.log('   ✅ Lead processado com sucesso!\n');
    return { success: true };
    
  } catch (error) {
    console.error('   ❌ Erro ao processar lead:', error.message);
    
    // Registrar erro no banco
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'erro_audio_link',
      metadata: { error: error.message, campaign: 'black_vitalicia_audio_link' },
      sent_at: new Date().toISOString()
    });
    
    return { success: false, error: error.message };
  }
}

// ========================================
// 🚀 TESTE COM MARCOS
// ========================================
async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   ENVIO DE LINK DE ÁUDIO PERSONALIZADO');
  console.log('========================================\n');
  
  // Buscar lead do Marcos
  const { data: lead, error } = await supabase
    .from('quiz_leads')
    .select('*')
    .ilike('celular', '%5511998457676%')
    .single();
  
  if (error || !lead) {
    console.error('❌ Lead não encontrado:', error);
    process.exit(1);
  }
  
  // Áudio do Marcos (CORAÇÃO)
  const audioUrl = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co/storage/v1/object/public/audio-mensagens/audio_08c35652-9b19-4524-a3c2-35c0f22f26ce_1762288704248.mp3';
  
  await processarLead(lead, audioUrl);
  
  console.log('🎉 Teste finalizado!\n');
}

main().catch(console.error);
