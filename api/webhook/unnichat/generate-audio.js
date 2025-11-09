// ========================================
// 🎙️ WEBHOOK: GERAR E ENVIAR ÁUDIO PERSONALIZADO
// ========================================
// Este endpoint é chamado pela automação do Unnichat via POST request
// Fluxo:
// 1. Recebe phone/email/lead_id da automação
// 2. Busca lead no Supabase
// 3. Gera script personalizado
// 4. Gera áudio com ElevenLabs
// 5. Faz upload no Supabase Storage
// 6. Envia áudio via Unnichat API diretamente

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { findLeadByPhone } = require('../../../lib/phone-simple');

// Configuração Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY
);

// Configurações ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'hdFLFm20uYE7qa0TxNDq';

// Configurações Unnichat
const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

// ========================================
// 📝 GERAR SCRIPT PERSONALIZADO
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
    'RIM': 'rim',
    'FÍGADO': 'fígado',
    'BAÇO': 'baço',
    'CORAÇÃO': 'coração',
    'PULMÃO': 'pulmão'
  };
  
  const sintomas = sintomasPorElemento[elemento] || 'desconfortos e dores';
  const solucao = solucoesPorElemento[elemento] || 'reequilibrar sua energia e recuperar sua saúde';
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
// 🎙️ GERAR ÁUDIO COM ELEVENLABS
// ========================================
async function gerarAudio(script, leadId) {
  console.log('🎙️ Gerando áudio com ElevenLabs...');
  
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
// 📤 UPLOAD NO SUPABASE STORAGE
// ========================================
async function uploadAudio(audioBuffer, leadId) {
  console.log('☁️ Fazendo upload no Supabase Storage...');
  
  const fileName = `audio_${leadId}_${Date.now()}.mp3`;
  const uploadUrl = `${process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/audio-mensagens/${fileName}`;
  
  // Usar service_role key para ter permissão de escrita no Storage
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
  console.log('✅ Upload concluído:', publicUrl);
  
  return publicUrl;
}

// ========================================
// 📤 ENVIAR ÁUDIO VIA UNNICHAT API
// ========================================
async function enviarAudioWhatsApp(phone, audioUrl, lead) {
  console.log('📤 Enviando áudio via Unnichat API...');
  
  const phoneFormatted = phone.replace(/\D/g, '');
  
  const payload = {
    phone: phoneFormatted,
    messageType: 'audio',
    audioUrl: audioUrl
  };
  
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
  return response.data;
}

// ========================================
// 🎯 HANDLER PRINCIPAL
// ========================================
module.exports = async function generateAudioHandler(req, res) {
  console.log('\n🎙️ ========================================');
  console.log('   WEBHOOK: GERAR E ENVIAR ÁUDIO');
  console.log('========================================');
  
  try {
    // CORS/preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ success: true });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Método não permitido' });
    }

    // Validar credenciais
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY não configurada');
    }
    if (!UNNICHAT_API_URL || !UNNICHAT_ACCESS_TOKEN) {
      throw new Error('Credenciais Unnichat não configuradas');
    }
    
    // Extrair dados do payload
    let body = req.body;

    // Alguns provedores enviam body como string
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { /* ignore */ }
    }

    // Aceitar x-www-form-urlencoded
    if (!body || Object.keys(body).length === 0) {
      // Vercel já parseia urlencoded em req.body; mas como fallback, use query
      body = { ...(req.query || {}) };
    }

    const phoneRaw = body.phone || body.telefone || body.from || body.contact;
    const email = body.email || body.mail || '';
    const lead_id = body.lead_id || body.leadId || body.id || undefined;
    const primeiro_nome = body.primeiro_nome || body.first_name || body.nome || undefined;
    
    console.log('📋 Payload recebido:', { phone: phoneRaw, email, lead_id, primeiro_nome });

    // Log inicial para diagnóstico
    try {
      await supabase.from('whatsapp_logs').insert({
        lead_id: lead_id || null,
        phone: phoneRaw || null,
        status: 'webhook_generate_audio_recebido',
        metadata: { raw: body },
        sent_at: new Date().toISOString()
      });
    } catch (_) { /* noop */ }

    if (!phoneRaw && !lead_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'phone ou lead_id é obrigatório' 
      });
    }
    
    // Buscar lead no banco
    console.log('🔍 Buscando lead...');
    let lead;
    
    if (lead_id) {
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('id', lead_id)
        .maybeSingle();
      
      if (error) throw error;
      lead = data;
    }
    
    if (!lead && phoneRaw) {
      lead = await findLeadByPhone(supabase, phoneRaw, email);
    }
    
    if (!lead) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lead não encontrado' 
      });
    }
    
    console.log(`✅ Lead encontrado: ${lead.nome} (${lead.celular})`);
    console.log(`🎯 Elemento: ${lead.elemento_principal}`);
    
    // Gerar script
    const script = gerarScript(lead);
    console.log(`📝 Script gerado: ${script.length} caracteres`);
    
    // Gerar áudio
    const audioBuffer = await gerarAudio(script, lead.id);
    console.log(`✅ Áudio gerado: ${audioBuffer.length} bytes`);
    
    // Upload
    const audioUrl = await uploadAudio(audioBuffer, lead.id);
    
    // Enviar via WhatsApp
    const whatsappResponse = await enviarAudioWhatsApp(lead.celular || phoneRaw, audioUrl, lead);
    
    // Atualizar banco
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'audio_enviado',
        whatsapp_sent_at: new Date().toISOString()
      })
      .eq('id', lead.id);
    
    // Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'audio_enviado',
      metadata: {
        script_length: script.length,
        audio_url: audioUrl,
        whatsapp_response: whatsappResponse,
        campaign: 'black_vitalicia_audio_webhook'
      },
      sent_at: new Date().toISOString()
    });
    
    console.log('========================================');
    console.log('✅ ÁUDIO ENVIADO COM SUCESSO!');
    console.log('========================================\n');
    
    return res.json({
      success: true,
      message: 'Áudio gerado e enviado com sucesso',
      data: {
        lead_id: lead.id,
        nome: lead.nome,
        phone: lead.celular,
        audio_url: audioUrl,
        script_length: script.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
    
    try {
      await supabase.from('whatsapp_logs').insert({
        status: 'webhook_generate_audio_erro',
        metadata: { error: error.message, stack: error.stack },
        sent_at: new Date().toISOString()
      });
    } catch (_) { /* noop */ }

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
