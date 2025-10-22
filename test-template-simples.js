// test-template-simples.js
async function enviarTemplateSimplesParaMim() {
  const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
  const UNNICHAT_TOKEN = '68aaf071-82e8-4771-aaab-2963ec81add5';
  const TEMPLATE_ID = '1995511267968993'; // ← Template simples
  
  // SEU NÚMERO
  const meuTelefone = '5511998457676'; // ← Coloque seu número aqui
  const meuNome = 'Marcos';
  
  try {
    console.log('📤 Enviando template SIMPLES de teste...');
    console.log('📱 Para:', meuTelefone);
    
    // 1. Criar/atualizar contato
    console.log('📝 Criando contato...');
    
    await fetch(`${UNNICHAT_API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: meuNome,
        phone: meuTelefone,
        email: `${meuTelefone}@teste.com`,
        tags: ['teste_webhook']
      })
    });
    
    console.log('⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. Enviar template SIMPLES (sem parâmetros!)
    console.log('📨 Enviando template...');
    
    const response = await fetch(`${UNNICHAT_API_URL}/meta/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: meuTelefone,
        templateId: TEMPLATE_ID,
        bodyParameters: [], // ← SEM PARÂMETROS!
        urlButtonParameters: [],
        headerParameters: []
      })
    });

    const result = await response.json();
    console.log('📥 Resposta:', JSON.stringify(result, null, 2));

    if (response.ok && result.success !== false) {
      console.log('\n✅ Template enviado com sucesso!');
      console.log('📱 Verifique seu WhatsApp!');
    } else {
      console.error('\n❌ Erro ao enviar:', result.message || result.error);
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

enviarTemplateSimplesParaMim();