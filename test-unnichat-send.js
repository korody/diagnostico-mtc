// test-unnichat-send.js
async function testarEnvioUnnichat() {
  const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
  const UNNICHAT_TOKEN = '68aaf071-82e8-4771-aaab-2963ec81add5';
  
  console.log('📤 Testando envio de mensagem via Unnichat...');
  
  try {
    const response = await fetch(`${UNNICHAT_API_URL}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '11998457676',
        message: 'Teste de mensagem'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    const text = await response.text();
    console.log('Resposta (raw):', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Resposta (JSON):', json);
    } catch (e) {
      console.log('❌ Não é JSON válido!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarEnvioUnnichat();