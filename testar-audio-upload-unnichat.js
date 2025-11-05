// testar-audio-upload-unnichat.js
// Fazer upload de áudio via Unnichat e enviar como áudio nativo

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuração
require('dotenv').config({ path: '.env.production' });

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

// ========================================
// 📤 UPLOAD DE ÁUDIO NA UNNICHAT
// ========================================
async function uploadAudioUnnichat(audioUrl) {
  console.log('\n📤 Fazendo upload do áudio na Unnichat...');
  console.log(`   🎙️ URL: ${audioUrl}`);
  
  // Baixar o áudio primeiro
  console.log('   📥 Baixando áudio...');
  const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
  const audioBuffer = Buffer.from(audioResponse.data);
  
  // Salvar temporariamente
  const tempPath = path.join(__dirname, 'temp', 'audio_temp.mp3');
  fs.writeFileSync(tempPath, audioBuffer);
  console.log('   ✅ Áudio baixado');
  
  // Criar FormData para upload
  const formData = new FormData();
  formData.append('instanceId', UNNICHAT_INSTANCE_ID);
  formData.append('file', fs.createReadStream(tempPath), {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg'
  });
  
  try {
    // Tentar endpoint de upload de mídia da Unnichat
    const uploadUrl = `${UNNICHAT_API_URL}/meta/media`;
    console.log(`   ☁️  Fazendo upload para: ${uploadUrl}`);
    
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
        ...formData.getHeaders()
      }
    });
    
    console.log('   ✅ Upload concluído!');
    console.log('   📦 Resposta:', JSON.stringify(response.data, null, 2));
    
    // Limpar arquivo temporário
    fs.unlinkSync(tempPath);
    
    return response.data;
  } catch (error) {
    console.error('   ❌ Erro no upload:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    
    // Limpar arquivo temporário
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    throw error;
  }
}

// ========================================
// 📤 ENVIAR ÁUDIO COM MEDIA ID
// ========================================
async function enviarAudioComMediaId(phone, mediaId) {
  console.log('\n📤 Enviando áudio via WhatsApp com Media ID...');
  console.log(`   📱 Para: ${phone}`);
  console.log(`   🆔 Media ID: ${mediaId}`);
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    type: 'audio',
    audio: {
      id: mediaId
    }
  };
  
  console.log('   📦 Payload:', JSON.stringify(body, null, 2));
  
  try {
    const response = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('   ✅ Mensagem enviada!');
    console.log('   📦 Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('   ❌ Erro ao enviar:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

// ========================================
// 🚀 TESTE COMPLETO
// ========================================
async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   TESTE DE UPLOAD E ENVIO DE ÁUDIO');
  console.log('========================================\n');
  
  const audioUrl = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co/storage/v1/object/public/audio-mensagens/audio_08c35652-9b19-4524-a3c2-35c0f22f26ce_1762288704248.mp3';
  const telefone = '5511998457676';
  
  try {
    // 1. Upload do áudio
    const uploadResult = await uploadAudioUnnichat(audioUrl);
    
    // Verificar se recebeu o Media ID
    const mediaId = uploadResult.id || uploadResult.media_id || uploadResult.mediaId;
    
    if (!mediaId) {
      console.error('❌ Não foi possível obter o Media ID');
      console.error('Resposta do upload:', uploadResult);
      return;
    }
    
    console.log(`\n✅ Media ID obtido: ${mediaId}\n`);
    
    // 2. Enviar mensagem com Media ID
    await enviarAudioComMediaId(telefone, mediaId);
    
    console.log('\n✅ Teste concluído com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Teste falhou!', error.message, '\n');
    process.exit(1);
  }
}

main().catch(console.error);
