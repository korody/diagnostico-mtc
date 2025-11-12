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

// URLs de automação por segmento
const UNNICHAT_AUTOMACAO_ALUNOS_URL = 'https://unnichat.com.br/a/start/dCVT3wSK3h6OXtVJeb7W';
const UNNICHAT_AUTOMACAO_NAO_ALUNOS_URL = 'https://unnichat.com.br/a/start/ujzdbrjxV1lpg9X2uM65';

// Configurações de lote
const LOTE_SIZE = parseInt(process.env.LOTE_SIZE) || 10; // 10 por lote
const DELAY_ENTRE_ENVIOS = parseInt(process.env.DELAY_ENTRE_ENVIOS) || 4000; // 4s
const DELAY_ENTRE_LOTES = parseInt(process.env.DELAY_ENTRE_LOTES) || 30000; // 30s entre lotes
const LIMITE_TESTE = process.env.LIMITE_TESTE ? parseInt(process.env.LIMITE_TESTE) : 500;
const DRY_RUN = process.env.DRY_RUN === '1';

// TELEFONE ESPECÍFICO - vazio = envia para todos os filtrados
// Suporte para --phone via CLI
const phoneArg = process.argv.find(arg => arg.startsWith('--phone='));
const TELEFONE_ESPECIFICO = phoneArg ? phoneArg.split('=')[1] : ''; // agora envia lista de não-alunos

// Suporte para --alunos (envia para alunos ao invés de não-alunos)
const ENVIAR_PARA_ALUNOS = process.argv.includes('--alunos');

// Suporte para --top-score (ordenar por maior score ao invés de menor)
const TOP_SCORE = process.argv.includes('--top-score');

// Suporte para --excluir-bny2 (não enviar para alunos BNY2)
const EXCLUIR_BNY2 = process.argv.includes('--excluir-bny2');

console.log('\n🎙️ ========================================');
console.log('   CAMPANHA DE ÁUDIO EM LOTES');
console.log(`   Black Vitalícia - ${ENVIAR_PARA_ALUNOS ? 'Alunos' : 'Não-Alunos'}`);
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
const { gerarScriptParaLead } = require('./lib/audio-copies');

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
  
  // Selecionar link CTA baseado no segmento
  const linkCta = lead.is_aluno 
    ? 'https://i.sendflow.pro/l/super-combo-vitalicio-alunos'
    : 'https://i.sendflow.pro/l/super-combo-vitalicio';
  
  const payload = {
    primeiro_nome: primeiroNome,
    phone: phone,
    email: lead.email || '',
    link_audio: audioUrl,
    link_cta: linkCta
  };
  
  // Selecionar URL de automação baseado no segmento
  const automacaoUrl = lead.is_aluno 
    ? UNNICHAT_AUTOMACAO_ALUNOS_URL
    : UNNICHAT_AUTOMACAO_NAO_ALUNOS_URL;
  
  const response = await axios.post(automacaoUrl, payload, {
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
    
    // Selecionar link CTA e URL de automação baseado no segmento
    const linkCta = lead.is_aluno 
      ? 'https://i.sendflow.pro/l/super-combo-vitalicio-alunos'
      : 'https://i.sendflow.pro/l/super-combo-vitalicio';
    
    const automacaoUrl = lead.is_aluno 
      ? UNNICHAT_AUTOMACAO_ALUNOS_URL
      : UNNICHAT_AUTOMACAO_NAO_ALUNOS_URL;
    
    const payload = {
      phone: phone,
      email: lead.email || '',
      primeiro_nome: primeiroNome,
      link_cta: linkCta
    };
    const response = await axios.post(automacaoUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('   ✅ Automação disparada:', response.data);
    console.log(`   🔗 Link CTA: ${linkCta} (${lead.is_aluno ? 'ALUNO' : 'NÃO-ALUNO'})`);
    console.log(`   🎯 URL Automação: ${automacaoUrl}`);
    
    // Atualizar status no banco - marca como automação iniciada
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'automacao_audio_personalizado',
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id);
    
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
    // Senão, buscar alunos ou não-alunos elegíveis
    const targetIsAluno = ENVIAR_PARA_ALUNOS;
    query = query
      .eq('is_aluno', targetIsAluno)
      .not('celular', 'is', null)
      .not('elemento_principal', 'is', null)
      .not('whatsapp_status', 'in', '("audio_personalizado_enviado","automacao_audio_personalizado")');
    
    // Excluir BNY2 se flag ativa
    if (EXCLUIR_BNY2) {
      query = query.neq('is_aluno_bny2', true);
    }
    
    // Alunos: menor score primeiro (reativar os mais frios) OU top score se flag ativa
    // Não-alunos: maior score primeiro (melhor qualidade)
    if (ENVIAR_PARA_ALUNOS) {
      query = query.order('lead_score', { ascending: !TOP_SCORE });
    } else {
      query = query.order('lead_score', { ascending: false });
    }
  }
  
  const { data: leads, error } = await query;
  
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`✅ ${leads.length} ${ENVIAR_PARA_ALUNOS ? 'alunos' : 'não-alunos'} encontrados\n`);
  
  if (!leads || leads.length === 0) {
    console.log(`🎉 Nenhum ${ENVIAR_PARA_ALUNOS ? 'aluno' : 'não-aluno'} pendente!\n`);
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
