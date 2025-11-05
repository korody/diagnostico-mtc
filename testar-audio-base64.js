// testar-audio-base64.js
// Tentar enviar áudio como base64

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuração
require('dotenv').config({ path: '.env.production' });

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

async function baixarAudio(audioUrl) {
  console.log('   📥 Baixando áudio...');
  const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
  const audioBuffer = Buffer.from(response.data);
  console.log('   ✅ Áudio baixado');
  return audioBuffer;
}

// Teste 1: Enviar áudio como base64
async function tentativa1(phone, audioBuffer) {
  console.log('\n📤 TENTATIVA 1: Áudio como base64 no campo media.data');
  
  const base64Audio = audioBuffer.toString('base64');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    type: 'audio',
    audio: {
      data: base64Audio,
      mimetype: 'audio/mpeg',
      filename: 'audio.mp3'
    }
  };
  
  console.log(`   📦 Tamanho do base64: ${base64Audio.length} chars`);
  
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
    console.error('❌ Falhou:', error.response?.status, error.response?.data?.message || error.message);
    return false;
  }
}

// Teste 2: Campo messageType + media.data
async function tentativa2(phone, audioBuffer) {
  console.log('\n📤 TENTATIVA 2: messageType="audio" + media.data (base64)');
  
  const base64Audio = audioBuffer.toString('base64');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageType: 'audio',
    media: {
      data: base64Audio,
      mimetype: 'audio/mpeg'
    }
  };
  
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
    console.error('❌ Falhou:', error.response?.status, error.response?.data?.message || error.message);
    return false;
  }
}

// Teste 3: PTT (Push-to-Talk) com base64
async function tentativa3(phone, audioBuffer) {
  console.log('\n📤 TENTATIVA 3: type="ptt" + audio.data (base64)');
  
  const base64Audio = audioBuffer.toString('base64');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    type: 'ptt',
    audio: {
      data: base64Audio,
      mimetype: 'audio/ogg; codecs=opus'
    }
  };
  
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
    console.error('❌ Falhou:', error.response?.status, error.response?.data?.message || error.message);
    return false;
  }
}

async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   TESTANDO ÁUDIO COM BASE64');
  console.log('========================================\n');
  
  const audioUrl = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co/storage/v1/object/public/audio-mensagens/audio_08c35652-9b19-4524-a3c2-35c0f22f26ce_1762288704248.mp3';
  const telefone = '5511998457676';
  
  const audioBuffer = await baixarAudio(audioUrl);
  
  const tentativas = [
    () => tentativa1(telefone, audioBuffer),
    () => tentativa2(telefone, audioBuffer),
    () => tentativa3(telefone, audioBuffer),
  ];
  
  for (let i = 0; i < tentativas.length; i++) {
    const sucesso = await tentativas[i]();
    
    if (sucesso) {
      console.log(`\n🎉 ENCONTRADO! A tentativa ${i + 1} funcionou!\n`);
      return;
    }
    
    if (i < tentativas.length - 1) {
      console.log('\n⏳ Aguardando 2 segundos...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n😕 Nenhuma tentativa funcionou.\n');
}

main().catch(console.error);
