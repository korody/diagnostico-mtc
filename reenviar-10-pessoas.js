// reenviar-10-pessoas.js
// Reenvia áudio para as 10 pessoas do último lote com automação correta

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const UNNICHAT_AUTOMACAO_URL = 'https://unnichat.com.br/a/start/ujzdbrjxV1lpg9X2uM65';

// 10 pessoas do último lote
const TELEFONES = [
  '5511992511956',  // Selma Fenselau
  '5518996171961',  // João Milton maronesi
  '5549999325314',  // Anilde
  '5511991885005',  // Elio Maccaferri
  '5511947244655',  // Maria de Lourdes da Gama Bezey
  '5563992096177',  // Fatima Abrao
  '5521964163476',  // Conceição Lourenço
  '5512981670038',  // Edna
  '5551995793005',  // Sandra Maria Arnecke Dias
  '5543991130045'   // vera antoniassi
];

const DELAY_ENTRE_ENVIOS = 4000;

function gerarScript(lead) {
  const primeiroNome = lead.nome.split(' ')[0];
  const elemento = lead.elemento_principal || 'CORAÇÃO';
  
  const sintomasPorElemento = {
    'RIM': 'dores nas costas, cansaço extremo e sensação de frio',
    'FÍGADO': 'tensão muscular, irritabilidade e rigidez no corpo',
    'BAÇO': 'digestão difícil, inchaço e peso nas pernas',
    'PULMÃO': 'falta de ar, tristeza e dificuldade para respirar profundamente',
    'CORAÇÃO': 'ansiedade, palpitações e insônia'
  };

  const sintomas = sintomasPorElemento[elemento] || 'desequilíbrios energéticos';

  return `Olá ${primeiroNome}, aqui é o Mestre Ye.

Acabei de analisar o seu resultado do diagnóstico e queria falar com você pessoalmente sobre isso.

Pelos seus sintomas de ${sintomas}, identifiquei que o seu ${elemento} está precisando de atenção urgente.

Esses sinais que você está sentindo não são normais e indicam que seu corpo está pedindo ajuda.

A boa notícia é que eu criei um tratamento específico que pode reverter isso em poucas semanas.

Estou abrindo apenas 20 vagas para o meu programa de recuperação energética com desconto especial.

Vou te mandar os detalhes agora. Presta bastante atenção porque essa oportunidade não vai durar muito tempo.`;
}

async function gerarAudio(texto) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        text: texto,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
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
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Erro ao gerar áudio: ${error.message}`);
  }
}

async function uploadAudio(audioBuffer, leadId) {
  try {
    const fileName = `audio_${leadId}_${Date.now()}.mp3`;
    const { data, error } = await supabase.storage
      .from('audio-mensagens')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('audio-mensagens')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }
}

async function dispararAutomacao(phone, audioUrl) {
  try {
    const response = await axios.post(UNNICHAT_AUTOMACAO_URL, {
      phone: phone,
      audio_url: audioUrl
    });
    return response.data;
  } catch (error) {
    throw new Error(`Erro ao disparar automação: ${error.message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   REENVIO PARA 10 PESSOAS');
  console.log('   Automação: ujzdbrjxV1lpg9X2uM65');
  console.log('========================================');
  console.log(`📱 Total: ${TELEFONES.length} pessoas`);
  console.log('========================================\n');

  let sucessos = 0;
  let erros = 0;

  for (let i = 0; i < TELEFONES.length; i++) {
    const telefone = TELEFONES[i];
    const telefoneFormatado = telefone.startsWith('55') ? `+${telefone}` : `+55${telefone}`;
    
    try {
      console.log(`\n👤 [${i + 1}/${TELEFONES.length}]`);
      
      // Buscar lead
      const { data: leads } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('celular', telefoneFormatado)
        .limit(1);

      if (!leads || leads.length === 0) {
        console.log(`   ❌ Lead não encontrado: ${telefoneFormatado}`);
        erros++;
        continue;
      }

      const lead = leads[0];
      console.log(`   📱 ${lead.nome}`);
      console.log(`   🎯 ${lead.elemento_principal} | Score: ${lead.lead_score}`);

      // Gerar script
      const script = gerarScript(lead);
      console.log(`   📝 Script: ${script.length} caracteres`);

      // Gerar áudio
      console.log('   🎙️ Gerando áudio...');
      const audioBuffer = await gerarAudio(script);

      // Upload
      console.log('   ☁️ Upload Supabase...');
      const audioUrl = await uploadAudio(audioBuffer, lead.id);

      // Disparar automação
      console.log('   🤖 Disparando automação...');
      await dispararAutomacao(telefoneFormatado, audioUrl);

      // Atualizar status
      await supabase
        .from('quiz_leads')
        .update({ 
          whatsapp_status: 'audio_personalizado_enviado',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      console.log('   ✅ Sucesso!');
      sucessos++;

      // Delay entre envios
      if (i < TELEFONES.length - 1) {
        await sleep(DELAY_ENTRE_ENVIOS);
      }

    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      erros++;
    }
  }

  console.log('\n\n🎉 ========================================');
  console.log('   REENVIO FINALIZADO!');
  console.log('========================================');
  console.log(`✅ Enviados: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📊 Taxa: ${((sucessos / TELEFONES.length) * 100).toFixed(1)}%`);
  console.log('========================================\n');
}

main().catch(console.error);
