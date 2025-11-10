// enviar-audio-direto-lista.js
// Envia áudio personalizado direto via API Unnichat (sem automação)

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

// Lista de telefones
const TELEFONES = [
  '5512988981317',
  '5511991358458',
  '5549999251500'
];

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
  return audioPath;
}

// ========================================
// Upload Supabase
// ========================================
async function uploadAudio(audioPath, leadId) {
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
  return publicUrl;
}

// ========================================
// Enviar Áudio Direto
// ========================================
async function enviarAudioDireto(phone, audioUrl) {
  const payload = {
    phone: phone,
    messageMedia: audioUrl
  };
  
  const response = await axios.post(
    `${UNNICHAT_API_URL}/meta/messages`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
}

// ========================================
// Processar Lead
// ========================================
async function processarLead(telefone, index, total) {
  console.log(`\n👤 [${index + 1}/${total}] Telefone: ${telefone}`);
  
  try {
    // 1. Buscar lead
    const { data: lead, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .ilike('celular', `%${telefone}%`)
      .single();
    
    if (error || !lead) {
      console.log('   ❌ Lead não encontrado');
      return { success: false, error: 'Lead não encontrado' };
    }
    
    console.log(`   ✅ ${lead.nome}`);
    console.log(`   📧 ${lead.email}`);
    console.log(`   🎯 ${lead.elemento_principal}`);
    
    // 2. Gerar script
    const script = gerarScript(lead);
    console.log(`   📝 Script: ${script.length} caracteres`);
    
    // 3. Gerar áudio
    console.log('   🎙️ Gerando áudio...');
    const audioPath = await gerarAudio(script, lead.id);
    
    // 4. Upload Supabase
    console.log('   ☁️ Upload Supabase...');
    const audioUrl = await uploadAudio(audioPath, lead.id);
    console.log(`   🔗 ${audioUrl}`);
    
    // 5. Enviar direto
    console.log('   📤 Enviando áudio direto...');
    const phoneClean = lead.celular.replace(/\D/g, '');
    const result = await enviarAudioDireto(phoneClean, audioUrl);
    
    console.log('   📥 Resposta:', JSON.stringify(result, null, 2));
    
    // 6. Atualizar Supabase
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'audio_personalizado_enviado',
        whatsapp_sent_at: new Date().toISOString()
      })
      .eq('id', lead.id);
    
    // 7. Log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'audio_personalizado_enviado',
      metadata: {
        audio_url: audioUrl,
        unnichat_response: result,
        campaign: 'audio_direto_messageMedia'
      },
      sent_at: new Date().toISOString()
    });
    
    // 8. Limpar
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    
    console.log('   ✅ Sucesso!');
    return { success: true };
    
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    if (error.response?.data) {
      console.log('   📋 Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
    return { success: false, error: error.message };
  }
}

// ========================================
// MAIN
// ========================================
async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   ENVIO DIRETO DE ÁUDIO (SEM AUTOMAÇÃO)');
  console.log('========================================');
  console.log(`📊 Total: ${TELEFONES.length} leads`);
  console.log('⚠️  Modo: DIRETO VIA API UNNICHAT');
  console.log('========================================\n');
  
  let sucesso = 0;
  let erro = 0;
  
  for (let i = 0; i < TELEFONES.length; i++) {
    const result = await processarLead(TELEFONES[i], i, TELEFONES.length);
    
    if (result.success) sucesso++;
    else erro++;
    
    // Delay entre envios
    if (i < TELEFONES.length - 1) {
      console.log('\n⏳ Aguardando 5s...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  console.log('\n========================================');
  console.log('📊 RESUMO');
  console.log('========================================');
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Erro: ${erro}`);
  console.log(`📊 Total: ${TELEFONES.length}`);
  console.log('========================================\n');
}

main().catch(console.error);
