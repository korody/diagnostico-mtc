// test-unnichat-send.js
async function testarEnvioUnnichat() {
  const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
  const UNNICHAT_TOKEN = '68aaf071-82e8-4771-aaab-2963ec81add5';
  
  console.log('📤 Testando formatos de telefone...\n');
  
  const formatos = [
    '11998457676',      // sem 55
    '5511998457676',    // com 55
    '+5511998457676'    // com +55
  ];
  
  for (const phone of formatos) {
    console.log(`\n🔍 Testando: ${phone}`);
    
    try {
      const response = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: phone,
          messageText: `Teste com formato: ${phone}`
        })
      });
      
      const result = await response.json();
      console.log(`Status: ${response.status}`);
      console.log('Resposta:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log(`✅ FUNCIONOU com: ${phone}\n`);
        break;
      }
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
    }
  }
}

testarEnvioUnnichat();