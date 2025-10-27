// Quick test runner for production gerar-link-compartilhamento
// Usage: node test-gerar-link-compartilhamento.js [phoneOrEmail]
// Optional env: BASE_URL (defaults to https://quiz.qigongbrasil.com.br)

const axios = require('axios');

async function main() {
  const baseUrl = process.env.BASE_URL || 'https://quiz.qigongbrasil.com.br';
  const arg = process.argv[2];

  let payload = {};
  if (arg) {
    if (arg.includes('@')) payload.email = arg; else payload.phone = arg;
  } else {
    // Safe default: use email fallback from recent sample; replace if needed
    payload.email = 'Detlev@fenselau.com.br';
  }

  console.log('POST', baseUrl + '/api/gerar-link-compartilhamento');
  console.log('Payload:', payload);

  try {
    const { data } = await axios.post(baseUrl + '/api/gerar-link-compartilhamento', payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('Response:', data);
  } catch (err) {
    if (err.response) {
      console.error('HTTP', err.response.status, err.response.data);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

main();
