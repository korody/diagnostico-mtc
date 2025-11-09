// testar-envio-audio-unnichat.js
// Testa envio de áudio via API do Unnichat

const axios = require('axios');
require('dotenv').config({ path: '.env.production' });

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

// Áudio de teste que foi gerado com sucesso
const AUDIO_URL = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co/storage/v1/object/public/audio-mensagens/audio_08c35652-9b19-4524-a3c2-35c0f22f26ce_1762649851424.mp3';
const PHONE_TESTE = '5511998457676';

async function testarEnvioAudio() {
  console.log('\n🧪 Testando envio de áudio via Unnichat API...\n');
  console.log(`📍 API URL: ${UNNICHAT_API_URL}`);
  console.log(`📱 Phone: ${PHONE_TESTE}`);
  console.log(`🎙️  Audio URL: ${AUDIO_URL}\n`);
  
  // Testar diferentes formatos de payload
  const payloads = [
    {
      nome: 'Formato 1: messageType + audioUrl',
      data: {
        phone: PHONE_TESTE,
        messageType: 'audio',
        audioUrl: AUDIO_URL
      }
    },
    {
      nome: 'Formato 2: type + media',
      data: {
        phone: PHONE_TESTE,
        type: 'audio',
        media: AUDIO_URL
      }
    },
    {
      nome: 'Formato 3: audioMessage',
      data: {
        phone: PHONE_TESTE,
        audioMessage: {
          url: AUDIO_URL
        }
      }
    },
    {
      nome: 'Formato 4: message com audio',
      data: {
        phone: PHONE_TESTE,
        message: {
          audio: AUDIO_URL
        }
      }
    }
  ];
  
  for (const payload of payloads) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📤 Testando: ${payload.nome}`);
    console.log(`${'='.repeat(60)}`);
    console.log('Payload:', JSON.stringify(payload.data, null, 2));
    
    try {
      const response = await axios.post(
        `${UNNICHAT_API_URL}/meta/messages`,
        payload.data,
        {
          headers: {
            'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'x-instance-id': UNNICHAT_INSTANCE_ID
          },
          timeout: 30000
        }
      );
      
      console.log('✅ SUCESSO!');
      console.log('Status:', response.status);
      console.log('Resposta:', JSON.stringify(response.data, null, 2));
      console.log('\n🎉 Este formato funcionou! Use este no código.');
      break; // Parar no primeiro sucesso
      
    } catch (error) {
      console.log('❌ FALHOU');
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Erro:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Erro:', error.message);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 Verificar também:');
  console.log('   1. A sessão WhatsApp está aberta? (enviar template primeiro)');
  console.log('   2. O número está no formato correto? (com ou sem +55)');
  console.log('   3. A instância do Unnichat está ativa?');
  console.log('   4. O áudio é acessível publicamente?');
  console.log('='.repeat(60) + '\n');
}

// Testar acessibilidade do áudio
async function testarAcessoAudio() {
  console.log('🔍 Testando se o áudio é acessível...\n');
  
  try {
    const response = await axios.head(AUDIO_URL);
    console.log('✅ Áudio acessível!');
    console.log(`   Content-Type: ${response.headers['content-type']}`);
    console.log(`   Content-Length: ${response.headers['content-length']} bytes`);
  } catch (error) {
    console.log('❌ Áudio NÃO acessível!');
    console.log(`   Erro: ${error.message}`);
    console.log('   O Supabase Storage pode estar com permissões incorretas.');
  }
}

async function main() {
  await testarAcessoAudio();
  await testarEnvioAudio();
}

main().catch(console.error);
