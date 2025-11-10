// mensagem-voz-personalizada.js
// Gera e envia mensagens de voz personalizadas via ElevenLabs + WhatsApp

const { createClient } = require('@supabase/supabase-js');
const { formatForUnnichat } = require('./lib/phone-simple');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuração
const isProduction = true;
const envFile = '.env.production';
require('dotenv').config({ path: envFile });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ========================================
// 🎙️ CONFIGURAÇÕES ELEVENLABS
// ========================================
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'SUA_CHAVE_AQUI';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam (voz masculina padrão)
// Outras vozes populares:
// - pNInz6obpgDQGcFmaJgB: Adam (masculino, forte)
// - TxGEqnHWrfWFTfGW9XjX: Josh (masculino, jovem)
// - VR6AewLTigWG4xSOukaG: Arnold (masculino, sério)

// ========================================
// 📱 CONFIGURAÇÕES WHATSAPP
// ========================================
const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;
const UNNICHAT_AUTOMACAO_AUDIO_URL = process.env.AUDIO_DIAGNOSTICO_AUTOMACAO_UNNICHAT || 'https://unnichat.com.br/a/start/ujzdbrjxV1lpg9X2uM65';

// ========================================
// ⏱️ CONFIGURAÇÕES DE ENVIO
// ========================================
const DELAY_BETWEEN_LEADS = 15000; // 15 segundos entre cada lead
const MODO_TESTE = false; // MUDE PARA false PARA ENVIAR DE VERDADE
const MODO_TESTE_SEM_UPLOAD = false; // Gerar áudio personalizado para cada lead
const REUSAR_ULTIMO_AUDIO = false; // Usar o último áudio gerado sem gerar novo
const LIMITE_ENVIOS = 1; // Quantos envios fazer (para teste)
const FILTRAR_POR_TELEFONE = '5562991488735'; // Telefone específico para testar (apenas números)
const AUDIO_TESTE_URL = 'https://kfkhdfnkwhljhhjcvbqp.supabase.co/storage/v1/object/public/audio-mensagens/audio_5dcb1c17-bdfc-493e-975c-03f635198bbd_1762361159370.mp3'; // Último áudio gerado

// ========================================
// 📝 TEMPLATE DO SCRIPT (30 segundos)
// ========================================
function gerarScript(lead) {
  const primeiroNome = lead.nome.split(' ')[0];
  const elemento = lead.elemento_principal || 'CORAÇÃO';
  
  // Mapa de sintomas por elemento
  const sintomasPorElemento = {
    'RIM': 'dores nas costas, cansaço extremo e sensação de frio',
    'FÍGADO': 'tensão muscular, irritabilidade e rigidez no corpo',
    'BAÇO': 'digestão difícil, inchaço e peso nas pernas',
    'CORAÇÃO': 'insônia, ansiedade e palpitações',
    'PULMÃO': 'respiração curta, resfriados frequentes e cansaço'
  };
  
  const sintomas = sintomasPorElemento[elemento] || 'desconfortos e dores';
  
  // Soluções específicas por elemento
  const solucoesPorElemento = {
    'RIM': 'fortalecer sua energia vital e recuperar a vitalidade que você perdeu',
    'FÍGADO': 'liberar toda essa tensão acumulada e voltar a ter leveza no corpo',
    'BAÇO': 'reequilibrar sua digestão e ter mais disposição no dia a dia',
    'CORAÇÃO': 'acalmar sua mente, dormir bem e recuperar sua paz interior',
    'PULMÃO': 'fortalecer sua respiração e aumentar sua imunidade'
  };
  
  const solucao = solucoesPorElemento[elemento] || 'reequilibrar sua energia e recuperar sua saúde';
  
  // Mapeamento de pronúncia correta para ElevenLabs
  const elementoPronuncia = {
    'RIM': 'rim',
    'FÍGADO': 'fígado',
    'BAÇO': 'baço',
    'CORAÇÃO': 'coração',
    'PULMÃO': 'pulmão'
  };
  
  const elementoFalado = elementoPronuncia[elemento] || elemento.toLowerCase();
  
  // Script de 35-40 segundos (aproximadamente 90-100 palavras)
  const script = `Olá ${primeiroNome}, aqui é o Mestre Ye.

Eu analisei seu diagnóstico e percebi a deficiência de ${elementoFalado}.

Sei exatamente o que você está passando com ${sintomas}.

Não deve ser fácil conviver com isso todos os dias.

Mas a boa notícia é que eu sei como ${solucao}.

E é exatamente isso que você vai alcançar ao garantir o SUPER COMBO Vitalício hoje.

Essa oferta é histórica! Eu nunca fiz nada igual.

${primeiroNome}, essa é a última turma. É a sua chance. Não espera a dor ou a doença aparecer pra você se arrepender.

Clica no link que eu vou te mandar agora para garantir a sua vaga antes que minha equipe feche as inscrições.`;

  return script;
}

// ========================================
// 🎙️ GERAR ÁUDIO COM ELEVENLABS
// ========================================
async function gerarAudio(script, leadId) {
  console.log('   🎙️ Gerando áudio com ElevenLabs...');
  
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;
  
  const body = {
    text: script,
    model_id: 'eleven_multilingual_v2', // Modelo com suporte a português
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    }
  };
  
  const response = await axios.post(url, body, {
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    responseType: 'arraybuffer'
  });
  
  // Salvar arquivo de áudio
  const audioBuffer = Buffer.from(response.data);
  const audioPath = path.join(__dirname, 'temp', `audio_${leadId}.mp3`);
  
  // Criar pasta temp se não existir
  if (!fs.existsSync(path.join(__dirname, 'temp'))) {
    fs.mkdirSync(path.join(__dirname, 'temp'));
  }
  
  fs.writeFileSync(audioPath, audioBuffer);
  console.log('   ✅ Áudio gerado:', audioPath);
  
  return audioPath;
}

// ========================================
// 📤 UPLOAD ÁUDIO NO SUPABASE STORAGE
// ========================================
async function uploadAudioSupabase(audioPath, leadId) {
  console.log('   ☁️  Fazendo upload no Supabase Storage...');
  
  const audioBuffer = fs.readFileSync(audioPath);
  const fileName = `audio_${leadId}_${Date.now()}.mp3`;
  
  // Upload direto via API REST (alternativa ao cliente que estava dando erro)
  const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/audio-mensagens/${fileName}`;
  
  try {
    const response = await axios.post(uploadUrl, audioBuffer, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_KEY}`,
        'Content-Type': 'audio/mpeg',
        'x-upsert': 'false'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    
    if (response.status !== 200) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
    
    // Construir URL pública
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/audio-mensagens/${fileName}`;
    console.log('   ✅ Upload concluído:', publicUrl);
    
    return publicUrl;
  } catch (error) {
    console.error('   ❌ Erro no upload:', error.message);
    throw new Error(`Supabase Storage error: ${error.message}`);
  }
}

// ========================================
// 📤 DISPARAR AUTOMAÇÃO COM ÁUDIO
// ========================================
async function enviarAudioWhatsApp(phone, audioUrl, lead) {
  console.log('   🤖 Disparando automação do Unnichat...');
  
  const primeiroNome = lead.nome.split(' ')[0];
  
  const payload = {
    primeiro_nome: primeiroNome,
    phone: phone,
    email: lead.email || '',
    link_audio: audioUrl
  };
  
  console.log(`   📤 Enviando para automação: ${lead.nome}`);
  console.log(`   📋 Payload:`, JSON.stringify(payload, null, 2));
  
  const response = await axios.post(UNNICHAT_AUTOMACAO_AUDIO_URL, payload, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  const result = response.data;
  
  if (!result.response) {
    throw new Error(`Automação error: ${JSON.stringify(result)}`);
  }
  
  console.log('   ✅ Automação disparada com sucesso!');
  return result;
}

// ========================================
// 🎯 PROCESSAR LEAD
// ========================================
async function processarLead(lead, index, total) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📱 Lead ${index + 1}/${total}: ${lead.nome}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   📧 Email: ${lead.email}`);
  console.log(`   📱 Celular: ${lead.celular}`);
  console.log(`   🎯 Elemento: ${lead.elemento_principal}`);
  console.log(`   📊 Lead Score: ${lead.lead_score}`);
  
  try {
    // 1. Gerar script personalizado
    const script = gerarScript(lead);
    console.log(`\n   📝 Script gerado (${script.length} caracteres):`);
    console.log(`   ${'-'.repeat(50)}`);
    console.log(`   ${script.split('\n').join('\n   ')}`);
    console.log(`   ${'-'.repeat(50)}\n`);
    
    if (MODO_TESTE) {
      console.log('   ⚠️  MODO TESTE - Áudio não será gerado nem enviado');
      return { success: true, test: true };
    }
    
    let audioUrl;
    let audioPath = null;
    
    if (REUSAR_ULTIMO_AUDIO) {
      console.log('   ♻️  REUSANDO ÚLTIMO ÁUDIO - Sem gerar novo');
      audioUrl = AUDIO_TESTE_URL;
    } else if (MODO_TESTE_SEM_UPLOAD) {
      console.log('   🧪 MODO TESTE SEM UPLOAD - Usando áudio de teste');
      audioUrl = AUDIO_TESTE_URL;
    } else {
      // 2. Gerar áudio com ElevenLabs
      audioPath = await gerarAudio(script, lead.id);
      
      // 3. Upload no Supabase Storage
      audioUrl = await uploadAudioSupabase(audioPath, lead.id);
    }
    
    // 4. Disparar automação do Unnichat
    // Remover qualquer formatação do telefone (enviar apenas números)
    const phone = lead.celular.replace(/\D/g, '');
    const result = await enviarAudioWhatsApp(phone, audioUrl, lead);
    
    // 5. Atualizar banco de dados
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'audio_personalizado_enviado',
        whatsapp_sent_at: new Date().toISOString(),
        whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
      })
      .eq('id', lead.id);
    
    // 6. Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'audio_personalizado_enviado',
      metadata: {
        script_length: script.length,
        audio_url: audioUrl,
        whatsapp_response: result,
        campaign: 'black_vitalicia_audio_personalizado'
      },
      sent_at: new Date().toISOString()
    });
    
    // 7. Limpar arquivo temporário
    if (audioPath && fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
      console.log('   🗑️  Arquivo temporário removido');
    }
    
    console.log('   ✅ Lead processado com sucesso!\n');
    return { success: true };
    
  } catch (error) {
    console.error('   ❌ Erro ao processar lead:', error.message);
    
    // Registrar erro no banco
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'erro_audio_personalizado',
      metadata: { error: error.message, campaign: 'black_vitalicia_audio_personalizado' },
      sent_at: new Date().toISOString()
    });
    
    return { success: false, error: error.message };
  }
}

// ========================================
// 🚀 FUNÇÃO PRINCIPAL
// ========================================
async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   CAMPANHA DE ÁUDIO PERSONALIZADO');
  console.log('   Black Vitalícia - Mestre Ye');
  console.log('========================================');
  console.log(`🔧 Ambiente: ${isProduction ? '🔴 PRODUÇÃO' : '🟡 STAGING'}`);
  console.log(`🎙️ Voz: ${ELEVENLABS_VOICE_ID}`);
  console.log(`⚠️  Modo: ${MODO_TESTE ? '🧪 TESTE' : '🚀 ENVIO REAL'}`);
  console.log(`📊 Limite: ${LIMITE_ENVIOS} leads`);
  console.log(`⏱️  Delay: ${DELAY_BETWEEN_LEADS / 1000}s entre envios`);
  console.log('========================================\n');
  
  // Validar credenciais
  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'SUA_CHAVE_AQUI') {
    console.error('❌ ERRO: Configure ELEVENLABS_API_KEY no .env.production');
    process.exit(1);
  }
  
  if (!UNNICHAT_API_URL || !UNNICHAT_ACCESS_TOKEN || !UNNICHAT_INSTANCE_ID) {
    console.error('❌ ERRO: Configure UNNICHAT_API_URL, UNNICHAT_ACCESS_TOKEN e UNNICHAT_INSTANCE_ID');
    process.exit(1);
  }
  
  // Buscar leads elegíveis
  console.log('🔍 Buscando leads no banco de dados...\n');
  
  let query = supabase
    .from('quiz_leads')
    .select('*')
    .not('celular', 'is', null)
    .not('elemento_principal', 'is', null)
    .eq('is_aluno', false); // APENAS NÃO-ALUNOS
  
  // Filtrar por telefone ou nome específico (para teste)
  if (FILTRAR_POR_TELEFONE) {
    console.log(`🎯 Filtrando por: ${FILTRAR_POR_TELEFONE}\n`);
    query = query.or(`celular.ilike.%${FILTRAR_POR_TELEFONE}%,nome.ilike.%${FILTRAR_POR_TELEFONE}%`);
  }
  
  const { data: leads, error } = await query
    .order('lead_score', { ascending: false })
    .limit(LIMITE_ENVIOS);
  
  if (error) {
    console.error('❌ Erro ao buscar leads:', error);
    process.exit(1);
  }
  
  if (!leads || leads.length === 0) {
    console.log('⚠️  Nenhum lead encontrado!');
    return;
  }
  
  console.log(`✅ ${leads.length} leads encontrados!\n`);
  
  // Estatísticas
  const stats = {
    total: leads.length,
    sucesso: 0,
    erro: 0,
    teste: 0
  };
  
  // Processar cada lead
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const result = await processarLead(lead, i, leads.length);
    
    if (result.test) {
      stats.teste++;
    } else if (result.success) {
      stats.sucesso++;
    } else {
      stats.erro++;
    }
    
    // Delay entre leads (exceto no último)
    if (i < leads.length - 1) {
      console.log(`⏳ Aguardando ${DELAY_BETWEEN_LEADS / 1000}s antes do próximo...\n`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_LEADS));
    }
  }
  
  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA CAMPANHA');
  console.log('='.repeat(60));
  console.log(`✅ Sucesso: ${stats.sucesso}`);
  console.log(`❌ Erro: ${stats.erro}`);
  if (stats.teste > 0) {
    console.log(`🧪 Teste: ${stats.teste}`);
  }
  console.log(`📊 Total processado: ${stats.total}`);
  console.log('='.repeat(60) + '\n');
  
  console.log('🎉 Campanha finalizada!\n');
}

// Executar
main().catch(console.error);
