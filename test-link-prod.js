// test-link-prod.js - Testar endpoint de link em produção
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testLinkGeneration() {
  console.log('\n🧪 TESTE: Gerar Link de Compartilhamento (PROD)');
  console.log('========================================\n');

  const endpoint = 'https://quiz.qigongbrasil.com/api/gerar-link-compartilhamento';
  
  const payload = {
    phone: '5511998457676',
    email: 'marko@persona.cx',
    name: 'marcos'
  };

  console.log('📋 Payload:', JSON.stringify(payload, null, 2));
  console.log('🌐 Endpoint:', endpoint);
  console.log('\n📤 Enviando...\n');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Status:', response.status, response.statusText);
    
    const contentType = response.headers.get('content-type');
    console.log('📝 Content-Type:', contentType);

    const text = await response.text();
    console.log('📦 Response Body (raw):\n', text);

    if (contentType && contentType.includes('application/json')) {
      try {
        const json = JSON.parse(text);
        console.log('\n✅ JSON parseado:\n', JSON.stringify(json, null, 2));
        
        if (json.success) {
          console.log('\n🔗 Link gerado:', json.referralLink);
        } else {
          console.log('\n❌ Erro:', json.error);
        }
      } catch (e) {
        console.log('\n⚠️ Não foi possível parsear JSON:', e.message);
      }
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLinkGeneration();
