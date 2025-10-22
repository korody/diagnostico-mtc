// test-template-single.js - Enviar template para UM número

async function enviarTemplateParaMim() {
  const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
  const UNNICHAT_TOKEN = '68aaf071-82e8-4771-aaab-2963ec81add5';
  const TEMPLATE_ID = '1984901562364518';
  
  // ⚠️ COLOQUE SEU NÚMERO AQUI (com código do país)
  const meuTelefone = '5511998457676'; // ← MUDE AQUI
  const meuNome = 'Marcos Korody'; // ← MUDE AQUI
  
  try {
    console.log('📤 Enviando template de teste...');
    console.log('📱 Para:', meuTelefone);
    
    // 1. Criar contato (se não existir)
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
    
    // 2. Enviar template
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
        bodyParameters: [
          {
            type: 'text',
            text: meuNome.split(' ')[0] // Primeiro nome
          }
        ],
        urlButtonParameters: [],
        headerParameters: []
      })
    });

    const result = await response.json();
    console.log('📥 Resposta:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Template enviado com sucesso!');
      console.log('📱 Verifique seu WhatsApp!');
    } else {
      console.error('\n❌ Erro ao enviar:', result.message || result.error);
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

enviarTemplateParaMim();