// testar-envio-simples.js
// Teste simples de envio de mensagem de texto

const axios = require('axios');

// Configuração
require('dotenv').config({ path: '.env.production' });

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

async function enviarMensagemTexto(phone, texto) {
  console.log('\n📤 Enviando mensagem de texto...');
  console.log(`   📱 Para: ${phone}`);
  console.log(`   💬 Mensagem: ${texto}`);
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageText: texto
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

async function main() {
  console.log('\n💬 ========================================');
  console.log('   TESTE DE ENVIO DE MENSAGEM');
  console.log('========================================');
  console.log(`🔧 Instance ID: ${UNNICHAT_INSTANCE_ID}`);
  console.log(`🔑 Token: ${UNNICHAT_ACCESS_TOKEN.substring(0, 20)}...`);
  console.log('========================================\n');
  
  const telefoneMarcos = '5511998457676';
  const mensagem = '🧪 Teste de envio via API - Mestre Ye 13';
  
  try {
    await enviarMensagemTexto(telefoneMarcos, mensagem);
    console.log('\n✅ Teste concluído com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Teste falhou!\n');
    process.exit(1);
  }
}

main().catch(console.error);
