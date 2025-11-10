// enviar-audio-direto.js
// Envia áudio diretamente via API do Unnichat (requer sessão aberta)

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

// Configurações
const PHONE_TESTE = '5511998457676';
const DELAY_APOS_TEMPLATE = 5000; // 5 segundos de espera

// ========================================
// Gerar Script
// ========================================
function gerarScript(lead) {
  const primeiroNome = lead.nome.split(' ')[0];
  const elemento = lead.elemento_principal || 'CORAÇÃO';
  
  const sintomasPorElemento = {
    'RIM': 'dores nas costas, cansaço extremo e sensação de frio',
    'FÍGADO': 'tensão muscular, irritabilidade e rigidez no corpo',
    'BAÇO': 'digestão difícil, inchaço e peso nas pernas',
    'CORAÇÃO': 'insônia, ansiedade e palpitações',
    'PULMÃO': 'respiração curta, resfriados frequentes e cansaço'
  };
  
  const solucoesPorElemento = {
    'RIM': 'fortalecer sua energia vital e recuperar a vitalidade que você perdeu',
    'FÍGADO': 'liberar toda essa tensão acumulada e voltar a ter leveza no corpo',
    'BAÇO': 'reequilibrar sua digestão e ter mais disposição no dia a dia',
    'CORAÇÃO': 'acalmar sua mente, dormir bem e recuperar sua paz interior',
    'PULMÃO': 'fortalecer sua respiração e aumentar sua imunidade'
  };
  
  const elementoPronuncia = {
    'RIM': 'rim', 'FÍGADO': 'fígado', 'BAÇO': 'baço',
    'CORAÇÃO': 'coração', 'PULMÃO': 'pulmão'
  };
  
  const sintomas = sintomasPorElemento[elemento] || 'desconfortos e dores';
  const solucao = solucoesPorElemento[elemento] || 'reequilibrar sua energia';
  const elementoFalado = elementoPronuncia[elemento] || elemento.toLowerCase();
  
  return `Olá ${primeiroNome}, aqui é o Mestre Ye.

Eu analisei seu diagnóstico e percebi a deficiência de ${elementoFalado}.

Sei exatamente o que você está passando com ${sintomas}.

Não deve ser fácil conviver com isso todos os dias.

Mas a boa notícia é que eu sei como ${solucao}.

E é exatamente isso que você vai alcançar ao garantir o SUPER COMBO Vitalício hoje.

Essa oferta é histórica! Eu nunca fiz nada igual.

${primeiroNome}, essa é a última turma. É a sua chance. Não espera a dor ou a doença aparecer pra você se arrepender.

Clica no link que eu vou te mandar agora para garantir a sua vaga antes que minha equipe feche as inscrições.`;
}

// ========================================
// Gerar Áudio
// ========================================
async function gerarAudio(script, leadId) {
  console.log('🎙️ Gerando áudio com ElevenLabs...');
  
  const response = await axios.post(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      text: script,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.5,
        use_speaker_boost: true
      }
    },
    {
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    }
  );
  
  const audioBuffer = Buffer.from(response.data);
  const audioPath = path.join(__dirname, 'temp', `audio_${leadId}.mp3`);
  
  if (!fs.existsSync(path.join(__dirname, 'temp'))) {
    fs.mkdirSync(path.join(__dirname, 'temp'));
  }
  
  fs.writeFileSync(audioPath, audioBuffer);
  console.log(`✅ Áudio gerado: ${audioBuffer.length} bytes`);
  
  return audioPath;
}

// ========================================
// Upload Supabase
// ========================================
async function uploadAudio(audioPath, leadId) {
  console.log('☁️ Fazendo upload no Supabase...');
  
  const audioBuffer = fs.readFileSync(audioPath);
  const fileName = `audio_${leadId}_${Date.now()}.mp3`;
  const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/audio-mensagens/${fileName}`;
  
  await axios.post(uploadUrl, audioBuffer, {
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'false'
    },
    maxBodyLength: Infinity
  });
  
  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/audio-mensagens/${fileName}`;
  console.log('✅ Upload concluído');
  
  return publicUrl;
}

// ========================================
// Enviar Template (abre sessão)
// ========================================
async function enviarTemplate(phone) {
  console.log('\n📨 Enviando template para abrir sessão...');
  
  // Você precisa configurar um template aprovado no Meta
  // Por enquanto, vou tentar enviar uma mensagem de texto simples
  
  const payload = {
    phone: phone,
    message: 'Olá! Você receberá uma mensagem personalizada em áudio. 🎙️'
  };
  
  try {
    const response = await axios.post(
      `${UNNICHAT_API_URL}/meta/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'x-instance-id': UNNICHAT_INSTANCE_ID
        }
      }
    );
    
    console.log('✅ Template enviado (sessão aberta por 24h)');
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar template:', error.response?.data || error.message);
    return false;
  }
}

// ========================================
// Enviar Áudio Direto
// ========================================
async function enviarAudioDireto(phone, audioUrl) {
  console.log('\n🎵 Enviando áudio via API do Unnichat...');
  
  // Tentar formato alternativo com campo "audio"
  const payload = {
    phone: phone,
    audio: audioUrl
  };
  
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(
      `${UNNICHAT_API_URL}/meta/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'x-instance-id': UNNICHAT_INSTANCE_ID
        }
      }
    );
    
    console.log('✅ Áudio enviado com sucesso!');
    console.log('Resposta:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar áudio:', error.response?.data || error.message);
    return false;
  }
}

// ========================================
// MAIN
// ========================================
async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   ENVIO DIRETO DE ÁUDIO PERSONALIZADO');
  console.log('========================================\n');
  
  // 1. Buscar lead
  console.log('🔍 Buscando lead...');
  const { data: lead } = await supabase
    .from('quiz_leads')
    .select('*')
    .ilike('celular', `%${PHONE_TESTE}%`)
    .single();
  
  if (!lead) {
    console.error('❌ Lead não encontrado');
    return;
  }
  
  console.log(`✅ Lead: ${lead.nome} (${lead.elemento_principal})\n`);
  
  // 2. Gerar script e áudio
  const script = gerarScript(lead);
  console.log(`📝 Script: ${script.length} caracteres\n`);
  
  const audioPath = await gerarAudio(script, lead.id);
  const audioUrl = await uploadAudio(audioPath, lead.id);
  
  console.log(`🔗 URL do áudio: ${audioUrl}\n`);
  
  // 3. Enviar áudio direto (janela já aberta)
  const phone = lead.celular.replace(/\D/g, '');
  console.log('📱 Sessão já aberta, enviando áudio direto...\n');
  
  await enviarAudioDireto(phone, audioUrl);
  
  // 4. Limpar
  if (fs.existsSync(audioPath)) {
    fs.unlinkSync(audioPath);
    console.log('\n🗑️  Arquivo temporário removido');
  }
  
  console.log('\n🎉 Processo concluído!\n');
}

main().catch(console.error);
