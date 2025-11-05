// testar-audio-ogg.js
// Converter áudio para OGG e tentar enviar

const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuração
require('dotenv').config({ path: '.env.production' });

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Configurar caminho do ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

async function baixarAudio(audioUrl, outputPath) {
  console.log('   📥 Baixando áudio MP3...');
  const response = await axios.get(audioUrl, { responseType: 'arraybuffer' });
  fs.writeFileSync(outputPath, response.data);
  console.log('   ✅ Áudio baixado');
}

async function converterParaOGG(inputPath, outputPath) {
  console.log('   🔄 Convertendo para OGG (Opus)...');
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('ogg')
      .audioCodec('libopus')
      .audioBitrate('64k')
      .audioChannels(1)
      .audioFrequency(16000)
      .on('end', () => {
        console.log('   ✅ Conversão concluída');
        resolve();
      })
      .on('error', (err) => {
        console.error('   ❌ Erro na conversão:', err.message);
        reject(err);
      })
      .save(outputPath);
  });
}

async function uploadOGGSupabase(oggPath, leadId) {
  console.log('   ☁️  Fazendo upload do OGG no Supabase...');
  
  const audioBuffer = fs.readFileSync(oggPath);
  const fileName = `audio_${leadId}_${Date.now()}.ogg`;
  
  const { data, error } = await supabase.storage
    .from('audio-mensagens')
    .upload(fileName, audioBuffer, {
      contentType: 'audio/ogg',
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    throw new Error(`Supabase Storage error: ${error.message}`);
  }
  
  const { data: publicUrlData } = supabase.storage
    .from('audio-mensagens')
    .getPublicUrl(fileName);
  
  const publicUrl = publicUrlData.publicUrl;
  console.log('   ✅ Upload concluído:', publicUrl);
  
  return publicUrl;
}

async function enviarAudioOGG(phone, audioUrl) {
  console.log('   📤 Enviando áudio OGG via WhatsApp...');
  
  const url = `${UNNICHAT_API_URL}/meta/messages`;
  
  const body = {
    instanceId: UNNICHAT_INSTANCE_ID,
    phone: phone,
    messageType: 'audio',
    media: {
      url: audioUrl
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
    
    console.log('   ✅ Resposta da API:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('   ❌ Erro ao enviar:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', JSON.stringify(error.response?.data, null, 2));
    throw error;
  }
}

async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   TESTE DE ENVIO DE ÁUDIO OGG');
  console.log('========================================\n');
  
  const telefone = '5511998457676';
  const audioUrlMP3 = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co/storage/v1/object/public/audio-mensagens/audio_08c35652-9b19-4524-a3c2-35c0f22f26ce_1762288704248.mp3';
  
  // Criar pasta temp se não existir
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }
  
  const mp3Path = path.join(tempDir, 'teste.mp3');
  const oggPath = path.join(tempDir, 'teste.ogg');
  
  try {
    // 1. Baixar MP3
    await baixarAudio(audioUrlMP3, mp3Path);
    
    // 2. Converter para OGG
    await converterParaOGG(mp3Path, oggPath);
    
    // 3. Upload do OGG no Supabase
    const leadId = '08c35652-9b19-4524-a3c2-35c0f22f26ce';
    const audioUrlOGG = await uploadOGGSupabase(oggPath, leadId);
    
    // 4. Enviar via WhatsApp
    await enviarAudioOGG(telefone, audioUrlOGG);
    
    // 5. Limpar arquivos temporários
    fs.unlinkSync(mp3Path);
    fs.unlinkSync(oggPath);
    console.log('   🗑️  Arquivos temporários removidos\n');
    
    console.log('✅ Teste concluído com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Teste falhou!', error.message, '\n');
    
    // Limpar arquivos se existirem
    if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
    if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
    
    process.exit(1);
  }
}

main().catch(console.error);
