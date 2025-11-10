// testar-webhook-simples.js
// Testa o endpoint apenas para validar recebimento de dados

const axios = require('axios');

async function testarWebhook() {
  console.log('\n🧪 ========================================');
  console.log('   TESTE SIMPLES: WEBHOOK (SEM ÁUDIO)');
  console.log('========================================\n');
  
  const WEBHOOK_URL = 'https://quiz.qigongbrasil.com/api/webhook/unnichat/generate-audio-v2';
  
  // Payload conforme o Unnichat envia
  const payload = {
    phone: '5511984968951',  // Telefone do contato
    referral_link: 'https://qigongbrasil.com/ref/12345',
    link_audio_diagnostico: 'https://example.com/audio.mp3',
    primeiro_nome: 'Ye'
  };
  
  console.log('📤 Enviando requisição...');
  console.log('🔗 URL:', WEBHOOK_URL);
  console.log('📋 Payload:', JSON.stringify(payload, null, 2));
  console.log('\n⏳ Aguardando resposta...\n');
  
  try {
    const inicio = Date.now();
    
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000 // 30 segundos
    });
    
    const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
    
    console.log('✅ ========================================');
    console.log('   RESPOSTA RECEBIDA!');
    console.log('========================================');
    console.log('⏱️  Tempo:', duracao + 's');
    console.log('📊 Status:', response.status);
    console.log('📦 Resposta completa:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('========================================\n');
    
  } catch (error) {
    console.log('❌ ========================================');
    console.log('   ERRO!');
    console.log('========================================');
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📦 Resposta de erro:');
      console.log(JSON.stringify(error.response.data, null, 2));
      console.log('\n🔍 Debug info:');
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('❌ Sem resposta do servidor');
      console.log('Erro:', error.message);
    } else {
      console.log('❌ Erro na requisição:', error.message);
    }
    
    console.log('========================================\n');
  }
}

testarWebhook();
