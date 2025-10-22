// test-criar-contato.js
async function criarContatoUnnichat() {
  const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
  const UNNICHAT_TOKEN = '68aaf071-82e8-4771-aaab-2963ec81add5';
  
  console.log('📝 Criando contato no Unnichat...');
  
  try {
    // Primeiro, criar o contato
    const createResponse = await fetch(`${UNNICHAT_API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Marcos Korody',
        phone: '11998457676',
        email: 'marcos@teste.com',
        tags: ['teste_webhook']
      })
    });
    
    const createResult = await createResponse.json();
    console.log('📥 Resposta criar contato:', JSON.stringify(createResult, null, 2));
    
    // Aguardar 2 segundos
    console.log('⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Agora tentar enviar mensagem
    console.log('📨 Enviando mensagem...');
    
    const msgResponse = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '11998457676',
        messageText: 'Teste de mensagem após criar contato'
      })
    });
    
    const msgResult = await msgResponse.json();
    console.log('📥 Resposta enviar mensagem:', JSON.stringify(msgResult, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

criarContatoUnnichat();