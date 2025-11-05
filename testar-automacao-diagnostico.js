// ========================================
// 🧪 TESTE DE AUTOMAÇÃO DE DIAGNÓSTICO
// ========================================
require('dotenv').config({ path: '.env.production' });
const axios = require('axios');

const GATILHO_URL = process.env.DIAGNOSTICO_AUTOMACAO_UNNICHAT;

console.log('🔍 Testando automação de diagnóstico...\n');
console.log('📍 URL:', GATILHO_URL);

const payload = {
  name: 'Marcos Teste',
  email: 'teste@email.com',
  phone: '5511998457676'
};

console.log('📦 Payload:', JSON.stringify(payload, null, 2));
console.log('\n🚀 Enviando...\n');

axios.post(GATILHO_URL, payload, {
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ SUCESSO!');
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));
})
.catch(error => {
  console.error('❌ ERRO!');
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  } else {
    console.error('Mensagem:', error.message);
  }
});
