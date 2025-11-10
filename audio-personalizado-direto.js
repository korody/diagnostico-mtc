// audio-diagnostico-direto.js
// Envia áudio personalizado via automação simplificada do Unnichat
// Uso: node audio-diagnostico-direto.js

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const AUTOMACAO_URL = 'https://unnichat.com.br/a/start/aTftldjLlsszUdfBW9Az';

// ========================================
// CONFIGURAÇÃO
// ========================================

// Defina os telefones que deseja enviar (pode ser array vazio para usar filtros)
const TELEFONES_ESPECIFICOS = ['5511984968951'];

// Ou use filtros do Supabase
const FILTROS = {
  // elemento_principal: 'RIM',
  // lead_score_gte: 90,
  // is_aluno: false,
  // whatsapp_status_not: 'audio_personalizado_enviado'
};

// Limite de envios (0 = sem limite)
const LIMITE_ENVIOS = 1;

// Delay entre envios (em milissegundos)
const DELAY_ENTRE_ENVIOS = 5000;

// ========================================
// Gerar Script Personalizado
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
// Gerar Áudio via ElevenLabs
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
// Upload no Supabase Storage
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
// Disparar Automação Unnichat
// ========================================
async function dispararAutomacao(lead, audioUrl) {
  const primeiroNome = lead.nome.split(' ')[0];
  
  const response = await axios.post(AUTOMACAO_URL, {
    phone: lead.celular,
    email: lead.email,
    lead_id: lead.id,
    primeiro_nome: primeiroNome,
    link_audio: audioUrl
  });
  
  return response.data;
}

// ========================================
// Buscar Leads
// ========================================
async function buscarLeads() {
  // Se há telefones específicos, buscar por eles
  if (TELEFONES_ESPECIFICOS.length > 0) {
    console.log(`📱 Buscando ${TELEFONES_ESPECIFICOS.length} telefones específicos...`);
    
    const leads = [];
    for (const telefone of TELEFONES_ESPECIFICOS) {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('celular', `%${telefone}%`)
        .single();
      
      if (!error && data) {
        leads.push(data);
      } else {
        console.log(`   ⚠️  Telefone ${telefone} não encontrado`);
      }
    }
    
    return leads;
  }
  
  // Caso contrário, usar filtros
  let query = supabase
    .from('quiz_leads')
    .select('*');
  
  // Aplicar filtros
  if (FILTROS.elemento_principal) {
    query = query.eq('elemento_principal', FILTROS.elemento_principal);
  }
  
  if (FILTROS.lead_score_gte) {
    query = query.gte('lead_score', FILTROS.lead_score_gte);
  }
  
  if (FILTROS.is_aluno !== undefined) {
    query = query.eq('is_aluno', FILTROS.is_aluno);
  }
  
  if (FILTROS.whatsapp_status_not) {
    query = query.neq('whatsapp_status', FILTROS.whatsapp_status_not);
  }
  
  // Aplicar limite
  if (LIMITE_ENVIOS > 0) {
    query = query.limit(LIMITE_ENVIOS);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Erro ao buscar leads: ${error.message}`);
  }
  
  return data || [];
}

// ========================================
// Processar Lead
// ========================================
async function processarLead(lead, index, total) {
  console.log(`\n👤 [${index + 1}/${total}] ${lead.nome}`);
  console.log(`   📱 ${lead.celular}`);
  console.log(`   📧 ${lead.email}`);
  console.log(`   🎯 ${lead.elemento_principal} (Score: ${lead.lead_score})`);
  
  try {
    // Verificar se já recebeu
    if (lead.whatsapp_status === 'audio_personalizado_enviado') {
      console.log('   ⚠️  Já recebeu áudio! Enviando novamente...');
    }
    
    // 1. Gerar script
    const script = gerarScript(lead);
    console.log(`   📝 Script: ${script.length} caracteres`);
    
    // 2. Gerar áudio
    console.log('   🎙️ Gerando áudio...');
    const audioPath = await gerarAudio(script, lead.id);
    
    // 3. Upload
    console.log('   ☁️ Upload Supabase...');
    const audioUrl = await uploadAudio(audioPath, lead.id);
    console.log(`   🔗 ${audioUrl}`);
    
    // 4. Disparar automação
    console.log('   🚀 Disparando automação...');
    const result = await dispararAutomacao(lead, audioUrl);
    console.log('   📥 Resposta:', result.data?.message || 'OK');
    
    // 5. Atualizar Supabase
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'audio_personalizado_enviado',
        whatsapp_sent_at: new Date().toISOString()
      })
      .eq('id', lead.id);
    
    // 6. Log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'audio_personalizado_enviado',
      metadata: {
        audio_url: audioUrl,
        unnichat_response: result,
        campaign: 'audio_diagnostico_direto'
      },
      sent_at: new Date().toISOString()
    });
    
    // 7. Limpar arquivo temporário
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
  console.log('   ÁUDIO DIAGNÓSTICO DIRETO');
  console.log('========================================');
  console.log(`🔗 Automação: ${AUTOMACAO_URL}`);
  console.log('========================================\n');
  
  // Buscar leads
  const leads = await buscarLeads();
  
  if (leads.length === 0) {
    console.log('❌ Nenhum lead encontrado com os critérios definidos.\n');
    return;
  }
  
  console.log(`📊 Total de leads: ${leads.length}\n`);
  
  // Confirmação
  if (leads.length > 5) {
    console.log('⚠️  ATENÇÃO: Você está prestes a enviar para mais de 5 leads.');
    console.log('   Pressione Ctrl+C para cancelar ou aguarde 5 segundos...\n');
    await new Promise(r => setTimeout(r, 5000));
  }
  
  let sucesso = 0;
  let erro = 0;
  
  for (let i = 0; i < leads.length; i++) {
    const result = await processarLead(leads[i], i, leads.length);
    
    if (result.success) sucesso++;
    else erro++;
    
    // Delay entre envios
    if (i < leads.length - 1) {
      console.log(`\n⏳ Aguardando ${DELAY_ENTRE_ENVIOS / 1000}s...\n`);
      await new Promise(r => setTimeout(r, DELAY_ENTRE_ENVIOS));
    }
  }
  
  console.log('\n========================================');
  console.log('📊 RESUMO FINAL');
  console.log('========================================');
  console.log(`✅ Sucesso: ${sucesso}`);
  console.log(`❌ Erro: ${erro}`);
  console.log(`📊 Total: ${leads.length}`);
  console.log(`📈 Taxa de sucesso: ${((sucesso / leads.length) * 100).toFixed(1)}%`);
  console.log('========================================\n');
}

main().catch(console.error);
