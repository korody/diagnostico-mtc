// test-buscar-contato.js

async function testarBusca() {
  const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
  const UNNICHAT_TOKEN = '68aaf071-82e8-4771-aaab-2963ec81add5';
  const phoneNumber = '11998457676'; // Um dos números de teste
  
  try {
    const response = await fetch(`${UNNICHAT_API_URL}/contact/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneNumber
      })
    });

    const result = await response.json();
    console.log('📦 Resposta completa da busca:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('\n🔑 Campos disponíveis:');
    console.log(Object.keys(result));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarBusca();