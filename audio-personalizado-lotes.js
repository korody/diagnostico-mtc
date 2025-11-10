// audio-personalizado-lotes.js
// Envia áudio personalizado em lotes para não-alunos

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ========================================
// CONFIGURAÇÕES
// ========================================
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const UNNICHAT_AUTOMACAO_AUDIO_URL = 'https://unnichat.com.br/a/start/ujzdbrjxV1lpg9X2uM65';

// Configurações de lote
const LOTE_SIZE = parseInt(process.env.LOTE_SIZE) || 5; // 5 por lote (gera áudio)
const DELAY_ENTRE_ENVIOS = parseInt(process.env.DELAY_ENTRE_ENVIOS) || 10000; // 10s
const DELAY_ENTRE_LOTES = parseInt(process.env.DELAY_ENTRE_LOTES) || 60000; // 60s
const LIMITE_TESTE = process.env.LIMITE_TESTE ? parseInt(process.env.LIMITE_TESTE) : 50;
const DRY_RUN = process.env.DRY_RUN === '1';

// TELEFONE ESPECÍFICO - vazio = envia para todos os filtrados
const TELEFONE_ESPECIFICO = ''; // agora envia lista de não-alunos

console.log('\n🎙️ ========================================');
console.log('   CAMPANHA DE ÁUDIO EM LOTES');
console.log('   Black Vitalícia - Não-Alunos');
console.log('========================================');
console.log('📦 Tamanho do lote:', LOTE_SIZE, 'leads');
console.log('⏱️  Delay entre envios:', DELAY_ENTRE_ENVIOS/1000 + 's');
console.log('⏸️  Delay entre lotes:', DELAY_ENTRE_LOTES/1000 + 's');
console.log('🔒 Limite de teste:', LIMITE_TESTE, 'leads');
if (DRY_RUN) console.log('🧪 DRY_RUN ativo: não envia nem atualiza');
console.log('========================================\n');

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
  
  return `Oi ${primeiroNome}, aqui é o Mestre Ye.

Eu analisei seu diagnóstico e percebi a deficiência de ${elementoFalado}.

Sei exatamente o que você está passando com ${sintomas}.

Não deve ser fácil conviver com isso todos os dias.

Mas a boa notícia é que eu sei como ${solucao}.

E é exatamente isso que você vai alcançar ao garantir o SUPER COMBO Vitalício hoje.

Essa oferta é histórica! Eu nunca fiz nada igual.

${primeiroNome}, essa é a última turma. É a sua chance. Não espera seus sintomas piorarem pra você se arrepender.

Clica no link que eu vou te mandar agora para garantir a sua vaga antes que seja tarde.

A minha equipe tá querendo fechar as inscrições em breve, porque estamos chegando no nosso limite de alunos.

Posso contar com você na nossa turma?`;
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
// Disparar Automação
// ========================================
async function dispararAutomacao(lead, audioUrl) {
  const primeiroNome = lead.nome.split(' ')[0];
  const phone = lead.celular.replace(/\D/g, '');
  
  const payload = {
    primeiro_nome: primeiroNome,
    phone: phone,
    email: lead.email || '',
    link_audio: audioUrl
  };
  
  const response = await axios.post(UNNICHAT_AUTOMACAO_AUDIO_URL, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  
  return response.data;
}

// ========================================
// Processar Lead
// ========================================
async function processarLead(lead, index, total) {
  console.log(`\n👤 [${index + 1}/${total}] ${lead.nome}`);
  console.log(`   📱 ${lead.celular}`);
  console.log(`   🎯 ${lead.elemento_principal} | Score: ${lead.lead_score}`);
  
  try {
    if (DRY_RUN) {
      console.log('   [DRY_RUN] PULAR processamento');
      return { success: true };
    }

    // Disparar automação Unnichat apenas com telefone e email
    console.log('   🤖 Disparando automação Unnichat...');
    const primeiroNome = lead.nome.split(' ')[0];
    const phone = lead.celular.replace(/\D/g, '');
    const payload = {
      phone: phone,
      email: lead.email || '',
      primeiro_nome: primeiroNome
    };
    const response = await axios.post(UNNICHAT_AUTOMACAO_AUDIO_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('   ✅ Automação disparada:', response.data);
    return { success: true };
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ========================================
// MAIN
// ========================================
async function main() {
  const inicioGeral = new Date();
  
  // 1. Buscar não-alunos elegíveis
  console.log('🔍 Buscando lead...\n');
  
  let query = supabase
    .from('quiz_leads')
    .select('*');
  
  // Se tem telefone específico, buscar só ele (por celular)
  if (TELEFONE_ESPECIFICO) {
    // Busca por celular normalizado (sem DDD, com DDD, com +55, etc)
    query = query.or(`celular.ilike.%${TELEFONE_ESPECIFICO}%,celular.ilike.%55${TELEFONE_ESPECIFICO}%,celular.ilike.%+55${TELEFONE_ESPECIFICO}%`);
  } else {
    // Senão, buscar não-alunos elegíveis
    query = query
      .eq('is_aluno', false)
      .not('celular', 'is', null)
      .not('elemento_principal', 'is', null)
      .not('whatsapp_status', 'eq', 'audio_personalizado_enviado')
      // Priorizar menores lead_score primeiro
      .order('lead_score', { ascending: true });
  }
  
  const { data: leads, error } = await query;
  
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`✅ ${leads.length} não-alunos encontrados\n`);
  
  if (!leads || leads.length === 0) {
    console.log('🎉 Nenhum não-aluno pendente!\n');
    return;
  }
  
  // 2. Aplicar limite
  const leadsParaEnviar = LIMITE_TESTE ? leads.slice(0, LIMITE_TESTE) : leads;
  
  console.log(`📋 Enviando para ${leadsParaEnviar.length} leads:\n`);
  leadsParaEnviar.slice(0, 5).forEach((l, i) => {
    console.log(`   ${i+1}. ${l.nome} - ${l.elemento_principal} (Score: ${l.lead_score})`);
  });
  if (leadsParaEnviar.length > 5) {
    console.log(`   ... e mais ${leadsParaEnviar.length - 5}`);
  }
  
  // 3. Confirmação
  const totalLotes = Math.ceil(leadsParaEnviar.length / LOTE_SIZE);
  const tempoEstimado = Math.ceil(
    (leadsParaEnviar.length * DELAY_ENTRE_ENVIOS + totalLotes * DELAY_ENTRE_LOTES) / 60000
  );
  
  console.log(`\n⚠️  ========================================`);
  console.log(`   CONFIRMAÇÃO`);
  console.log(`========================================`);
  console.log(`📊 Total: ${leadsParaEnviar.length} leads`);
  console.log(`📦 Lotes: ${totalLotes}`);
  console.log(`⏱️  Tempo estimado: ${tempoEstimado} min`);
  console.log(`========================================\n`);
  
  console.log('⏳ Iniciando em 5 segundos...\n');
  await new Promise(r => setTimeout(r, 5000));
  
  // 4. Processar lotes
  let totalEnviados = 0;
  let totalErros = 0;
  
  for (let i = 0; i < totalLotes; i++) {
    const loteAtual = i + 1;
    const inicio = i * LOTE_SIZE;
    const fim = Math.min((i + 1) * LOTE_SIZE, leadsParaEnviar.length);
    const leadsLote = leadsParaEnviar.slice(inicio, fim);
    
    console.log(`\n📦 ======== LOTE ${loteAtual}/${totalLotes} ========\n`);
    
    for (let j = 0; j < leadsLote.length; j++) {
      const lead = leadsLote[j];
      const indexGeral = inicio + j;
      
      const result = await processarLead(lead, indexGeral, leadsParaEnviar.length);
      
      if (result.success) totalEnviados++;
      else totalErros++;
      
      // Delay entre envios
      if (j < leadsLote.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_ENTRE_ENVIOS));
      }
    }
    
    console.log(`\n💾 Checkpoint: ${totalEnviados}/${leadsParaEnviar.length} enviados`);
    console.log(`   ✅ Sucesso: ${totalEnviados} | ❌ Erros: ${totalErros}`);
    
    // Delay entre lotes
    if (loteAtual < totalLotes) {
      console.log(`\n⏸️  Pausa entre lotes: ${DELAY_ENTRE_LOTES/1000}s`);
      await new Promise(r => setTimeout(r, DELAY_ENTRE_LOTES));
    }
  }
  
  // 5. Resumo final
  const fimGeral = new Date();
  const duracao = Math.round((fimGeral - inicioGeral) / 60000);
  
  console.log('\n\n🎉 ========================================');
  console.log('   CAMPANHA FINALIZADA!');
  console.log('========================================');
  console.log('✅ Enviados:', totalEnviados);
  console.log('❌ Erros:', totalErros);
  console.log('📊 Taxa:', ((totalEnviados / leadsParaEnviar.length) * 100).toFixed(1) + '%');
  console.log('⏱️  Duração:', duracao, 'min');
  console.log('========================================\n');
  
  if (LIMITE_TESTE && leads.length > LIMITE_TESTE) {
    console.log(`💡 Para enviar todos (${leads.length} leads):`);
    console.log('   LIMITE_TESTE=0 node audio-personalizado-lotes.js\n');
  }
}

main().catch(console.error);
