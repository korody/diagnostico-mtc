// testar-envio-audio.js
// Script simples para testar envio de áudio já armazenado

const axios = require('axios');
const { formatForUnnichat } = require('./lib/phone-simple');

// Configuração
require('dotenv').config({ path: '.env.production' });

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

// ========================================
// 📤 ENVIAR ÁUDIO VIA WHATSAPP
// ========================================
async function enviarAudioWhatsApp(phone, audioUrl, nome) {
  console.log('\n📤 Enviando áudio via WhatsApp...');
  console.log(`   📱 Para: ${phone}`);
  console.log(`   👤 Nome: ${nome}`);
  console.log(`   🎙️ Áudio: ${audioUrl}`);
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageType: 'audio',
    media: {
      url: audioUrl,
      filename: `mensagem_${nome}.mp3`
    }
  };
  
  console.log('\n📦 Payload:');
  console.log(JSON.stringify(body, null, 2));
  
  try {
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('\n❌ Erro ao enviar:');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

// ========================================
// 🚀 EXECUTAR TESTE
// ========================================
async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   TESTE DE ENVIO DE ÁUDIO');
  console.log('========================================');
  console.log(`🔧 Instance ID: ${UNNICHAT_INSTANCE_ID}`);
  console.log(`🔑 Token: ${UNNICHAT_ACCESS_TOKEN.substring(0, 20)}...`);
  console.log('========================================\n');
  
  // Validar credenciais
  if (!UNNICHAT_API_URL || !UNNICHAT_ACCESS_TOKEN || !UNNICHAT_INSTANCE_ID) {
    console.error('❌ ERRO: Configure as credenciais da Unnichat');
    process.exit(1);
  }
  
  // Áudio do Marcos (CORAÇÃO)
  const audioMarcos = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co/storage/v1/object/public/audio-mensagens/audio_08c35652-9b19-4524-a3c2-35c0f22f26ce_1762288704248.mp3';
  const telefoneMarcos = formatForUnnichat('5511998457676');
  
  try {
    await enviarAudioWhatsApp(telefoneMarcos, audioMarcos, 'Marcos');
    console.log('\n✅ Teste concluído com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Teste falhou!\n');
    process.exit(1);
  }
}

main().catch(console.error);
