// testar-webhook-direto.js
// Testa o webhook generate-audio fazendo um POST direto (simula o Unnichat)

const axios = require('axios');

const WEBHOOK_URL = 'https://quiz.qigongbrasil.com/api/webhook/unnichat/generate-audio';

async function testarWebhook() {
  console.log('\n🧪 Testando webhook generate-audio...\n');
  console.log(`📍 URL: ${WEBHOOK_URL}`);
  
  const payload = {
    phone: '5511998457676',
    email: 'marko@persona.cx',
    lead_id: '08c35652-9b19-4524-a3c2-35c0f22f26ce',
    primeiro_nome: 'marcos'
  };
  
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  console.log('\n⏳ Enviando requisição...\n');
  
  try {
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 segundos (ElevenLabs pode demorar)
    });
    
    console.log('✅ Resposta recebida!');
    console.log(`📊 Status: ${response.status}`);
    console.log('📦 Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n🎉 Webhook funcionou! O áudio deve ter sido gerado e enviado.');
      console.log('\n🔍 Próximos passos:');
      console.log('   1. Verificar se o áudio chegou no WhatsApp');
      console.log('   2. Conferir os logs no Supabase (rode: node verificar-logs-webhook.js)');
      console.log('   3. Configurar o bloco HTTP Request na automação do Unnichat');
    } else {
      console.log('\n⚠️  Webhook retornou erro. Veja detalhes acima.');
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao chamar webhook:');
    
    if (error.response) {
      console.error(`📊 Status: ${error.response.status}`);
      console.error('📦 Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📡 Nenhuma resposta recebida do servidor');
      console.error('Erro:', error.message);
    } else {
      console.error('Erro:', error.message);
    }
    
    console.log('\n🔧 Possíveis causas:');
    console.log('   1. Webhook não está deployado (rode: git push origin main)');
    console.log('   2. Timeout (ElevenLabs demorando muito)');
    console.log('   3. Erro na geração do áudio ou upload');
    console.log('   4. Lead não encontrado no banco');
  }
}

testarWebhook().catch(console.error);
