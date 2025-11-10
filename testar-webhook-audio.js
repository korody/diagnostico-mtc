// testar-webhook-audio.js
// Testa o endpoint de geração de áudio via webhook

const axios = require('axios');

async function testarWebhook() {
  console.log('\n🧪 ========================================');
  console.log('   TESTE: WEBHOOK GERAR ÁUDIO');
  console.log('========================================\n');
  
  const WEBHOOK_URL = 'https://quiz.qigongbrasil.com/api/webhook/unnichat/generate-audio';
  
  // Payload de teste (usando o Ye Xin como exemplo)
  const payload = {
    phone: '5511984968951',  // Ye Xin
    email: 'yexin828@hotmail.com',
    primeiro_nome: 'Ye Xin'
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
      timeout: 60000 // 60 segundos
    });
    
    const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
    
    console.log('✅ ========================================');
    console.log('   SUCESSO!');
    console.log('========================================');
    console.log('⏱️  Tempo:', duracao + 's');
    console.log('📊 Status:', response.status);
    console.log('📦 Resposta:', JSON.stringify(response.data, null, 2));
    console.log('========================================\n');
    
    if (response.data.data?.audio_url) {
      console.log('🎙️ Áudio gerado:', response.data.data.audio_url);
      console.log('👤 Lead:', response.data.data.nome);
      console.log('📱 Telefone:', response.data.data.phone);
      console.log('📝 Tamanho script:', response.data.data.script_length, 'caracteres\n');
    }
    
  } catch (error) {
    console.log('❌ ========================================');
    console.log('   ERRO!');
    console.log('========================================');
    
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📦 Resposta:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('❌ Sem resposta do servidor');
      console.log('Erro:', error.message);
    } else {
      console.log('❌ Erro na requisição:', error.message);
    }
    
    console.log('========================================\n');
    process.exit(1);
  }
}

testarWebhook();
