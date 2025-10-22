// test-webhook-manual.js
async function testarWebhook() {
  try {
    const response = await fetch('http://localhost:3001/webhook/unnichat/ver-resultados', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '11998457676',
        name: 'Marcos Korody',
        contactId: 'test123'
      })
    });

    const result = await response.json();
    console.log('📥 Resposta:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarWebhook();