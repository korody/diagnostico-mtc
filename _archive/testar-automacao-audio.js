// testar-automacao-audio.js
// Enviar dados para automação do Unnichat com link do áudio

const axios = require('axios');

async function testarAutomacao() {
  console.log('\n🤖 ========================================');
  console.log('   TESTE DE AUTOMAÇÃO UNNICHAT');
  console.log('========================================\n');
  
  const url = 'https://unnichat.com.br/a/start/OTY7xJ6IynlPPmAGxUEt';
  
  // Teste sem o link do áudio
  const payload = {
    name: 'Marcos Korody',
    phone: '5511998457676'
  };
  
  console.log('📦 Payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n🚀 Enviando para:', url);
  
  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Resposta da API:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log('\n🎉 Automação disparada com sucesso!\n');
    
    return response.data;
  } catch (error) {
    console.error('\n❌ Erro ao enviar:');
    console.error('Status:', error.response?.status);
    console.error('StatusText:', error.response?.statusText);
    console.error('Headers:', error.response?.headers);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    // Log completo do erro
    if (error.response && error.response.data) {
      console.error('\n📄 Resposta completa:');
      console.error(error.response.data);
    }
    
    throw error;
  }
}

testarAutomacao().catch(console.error);
