// testar-audio-direto.js
// Testar diferentes formatos de envio de áudio

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuração
require('dotenv').config({ path: '.env.production' });

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

// Teste 1: Tentar com messageType 'ptt' (Push-to-Talk - áudio de voz)
async function tentativa1(phone, audioUrl) {
  console.log('\n📤 TENTATIVA 1: messageType = "ptt" (Push-to-Talk)');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageType: 'ptt',
    media: {
      url: audioUrl
    }
  };
  
  console.log('📦 Payload:', JSON.stringify(body, null, 2));
  
  try {
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sucesso!', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Falhou:', error.response?.status, error.response?.data);
    return false;
  }
}

// Teste 2: Tentar sem o objeto 'media', só 'mediaUrl'
async function tentativa2(phone, audioUrl) {
  console.log('\n📤 TENTATIVA 2: Campo "mediaUrl" direto');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageType: 'audio',
    mediaUrl: audioUrl
  };
  
  console.log('📦 Payload:', JSON.stringify(body, null, 2));
  
  try {
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sucesso!', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Falhou:', error.response?.status, error.response?.data);
    return false;
  }
}

// Teste 3: Tentar com 'voice' ao invés de 'audio'
async function tentativa3(phone, audioUrl) {
  console.log('\n📤 TENTATIVA 3: messageType = "voice"');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageType: 'voice',
    media: {
      url: audioUrl
    }
  };
  
  console.log('📦 Payload:', JSON.stringify(body, null, 2));
  
  try {
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sucesso!', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Falhou:', error.response?.status, error.response?.data);
    return false;
  }
}

// Teste 4: Link do áudio direto no campo 'link'
async function tentativa4(phone, audioUrl) {
  console.log('\n📤 TENTATIVA 4: Apenas campo "link"');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageType: 'audio',
    link: audioUrl
  };
  
  console.log('📦 Payload:', JSON.stringify(body, null, 2));
  
  try {
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sucesso!', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Falhou:', error.response?.status, error.response?.data);
    return false;
  }
}

// Teste 5: Com URL no campo media.link
async function tentativa5(phone, audioUrl) {
  console.log('\n📤 TENTATIVA 5: media.link ao invés de media.url');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageType: 'audio',
    media: {
      link: audioUrl
    }
  };
  
  console.log('📦 Payload:', JSON.stringify(body, null, 2));
  
  try {
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Sucesso!', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Falhou:', error.response?.status, error.response?.data);
    return false;
  }
}

async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   TESTANDO MÚLTIPLOS FORMATOS DE ÁUDIO');
  console.log('========================================\n');
  
  const audioUrl = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co/storage/v1/object/public/audio-mensagens/audio_08c35652-9b19-4524-a3c2-35c0f22f26ce_1762288704248.mp3';
  const telefone = '5511998457676';
  
  const tentativas = [
    tentativa1,
    tentativa2,
    tentativa3,
    tentativa4,
    tentativa5
  ];
  
  for (let i = 0; i < tentativas.length; i++) {
    const sucesso = await tentativas[i](telefone, audioUrl);
    
    if (sucesso) {
      console.log(`\n🎉 ENCONTRADO! A tentativa ${i + 1} funcionou!\n`);
      return;
    }
    
    // Aguardar um pouco entre tentativas
    if (i < tentativas.length - 1) {
      console.log('\n⏳ Aguardando 2 segundos...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n😕 Nenhuma tentativa funcionou. Pode precisar de outro endpoint ou formato.\n');
}

main().catch(console.error);
