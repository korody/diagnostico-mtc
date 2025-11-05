// teste-simples-endpoint.js
const https = require('https');

const data = JSON.stringify({
  name: 'Marcos Korody',
  phone: '5511998457676',
  email: 'marko@persona.cx',
  link_audio: 'https://kfkhdfnkwhljhhjcvbqp.supabase.co/storage/v1/object/public/audio-mensagens/audio_08c35652-9b19-4524-a3c2-35c0f22f26ce_1762288704248.mp3'
});

const options = {
  hostname: 'unnichat.com.br',
  port: 443,
  path: '/a/start/ujzdbrjxV1lpg9X2uM65',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('📤 Enviando requisição...');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Body:', data);
console.log('');

const req = https.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('');

  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Resposta:');
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro:', error);
});

req.write(data);
req.end();
