// ========================================
// 🎙️ WEBHOOK V2: GERAR ÁUDIO SEM ENVIAR
// ========================================
// Este endpoint apenas GERA e FAZ UPLOAD do áudio
// Retorna a URL para o Unnichat usar na automação
// Não tenta enviar o áudio - deixa isso para o Unnichat

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { findLeadByPhone } = require('../../../lib/phone-simple');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY
);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'hdFLFm20uYE7qa0TxNDq';

// ========================================
// 📝 GERAR SCRIPT
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

Clica no link que eu vou te mandar agora para garantir a sua vaga antes que seja tarde.

A minha equipe tá querendo fechar as inscrições em breve, porque estamos chegando no limite de alunos dessa turma de encerramento.

Posso contar com você na nossa turma?`;
}

// ========================================
// 🎙️ GERAR ÁUDIO
// ========================================
async function gerarAudio(script) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`;
  
  const response = await axios.post(url, {
    text: script,
    model_id: 'eleven_multilingual_v2',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    }
  }, {
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    responseType: 'arraybuffer'
  });
  
  return Buffer.from(response.data);
}

// ========================================
// 📤 UPLOAD NO SUPABASE
// ========================================
async function uploadAudio(audioBuffer, leadId) {
  const fileName = `audio_${leadId}_${Date.now()}.mp3`;
  const uploadUrl = `${process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/audio-mensagens/${fileName}`;
  
  const authKey = process.env.SUPABASE_SERVICE_ROLE_KEY 
    || process.env.REACT_APP_SUPABASE_SERVICE_KEY 
    || process.env.SUPABASE_KEY 
    || process.env.REACT_APP_SUPABASE_KEY;
  
  await axios.post(uploadUrl, audioBuffer, {
    headers: {
      'Authorization': `Bearer ${authKey}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'false'
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  });
  
  const publicUrl = `${process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/audio-mensagens/${fileName}`;
  return publicUrl;
}

// ========================================
// 🎯 HANDLER
// ========================================
module.exports = async function generateAudioV2(req, res) {
  console.log('\n🎙️ [WEBHOOK V2] Gerar Áudio');
  
  try {
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Método não permitido' });
    }

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY não configurada');
    }
    
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { /* ignore */ }
    }
    if (!body || Object.keys(body).length === 0) {
      body = { ...(req.query || {}) };
    }

    const phoneRaw = body.phone || body.telefone || body.from || body.contact;
    const email = body.email || body.mail || '';
    const lead_id = body.lead_id || body.leadId || body.id || undefined;
    
    console.log('📋 Payload:', { phone: phoneRaw, email, lead_id });

    if (!phoneRaw && !lead_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'phone ou lead_id é obrigatório' 
      });
    }
    
    // Buscar lead
    console.log('🔍 Buscando lead...');
    let lead;
    
    if (lead_id) {
      const { data } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('id', lead_id)
        .maybeSingle();
      lead = data;
    }
    
    if (!lead && phoneRaw) {
      const result = await findLeadByPhone(supabase, phoneRaw, email);
      lead = result.lead;
    }
    
    if (!lead) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lead não encontrado'
      });
    }
    
    console.log(`✅ Lead: ${lead.nome}`);
    
    // Gerar script
    const script = gerarScript(lead);
    console.log(`📝 Script: ${script.length} chars`);
    
    // Gerar áudio
    console.log('🎙️ Gerando áudio...');
    const audioBuffer = await gerarAudio(script);
    console.log(`✅ Áudio: ${audioBuffer.length} bytes`);
    
    // Upload
    console.log('☁️ Upload...');
    const audioUrl = await uploadAudio(audioBuffer, lead.id);
    console.log(`✅ URL: ${audioUrl}`);
    
    // Atualizar banco (sem marcar como enviado ainda)
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'audio_gerado_aguardando_envio',
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id);
    
    // Log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'audio_gerado',
      metadata: {
        script_length: script.length,
        audio_url: audioUrl,
        audio_size_bytes: audioBuffer.length,
        campaign: 'webhook_v2'
      },
      sent_at: new Date().toISOString()
    });
    
    console.log('✅ Sucesso!\n');
    
    // Retornar URL para o Unnichat usar
    return res.json({
      success: true,
      message: 'Áudio gerado com sucesso',
      data: {
        lead_id: lead.id,
        nome: lead.nome,
        primeiro_nome: lead.nome.split(' ')[0],
        phone: lead.celular,
        audio_url: audioUrl,
        script_length: script.length,
        audio_size_bytes: audioBuffer.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
