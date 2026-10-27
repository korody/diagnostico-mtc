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
const { addLeadTags, TAGS } = require('../../../lib/tags');

// Configuração Supabase - usar service_role para ter permissões completas
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SECRET_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY
);

// Configurações ElevenLabs
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'hdFLFm20uYE7qa0TxNDq';

// Configurações Unnichat
const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL;
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;
const UNNICHAT_INSTANCE_ID = process.env.UNNICHAT_INSTANCE_ID;

const { gerarScriptParaLead } = require('../../../lib/audio-copies');

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
// 📤 ENVIAR ÁUDIO VIA UNNICHAT API - REMOVIDO
// Agora apenas retorna a URL para o Unnichat usar
// ========================================

// ========================================
// 🎯 HANDLER PRINCIPAL
// ========================================
module.exports = async function generateAudioHandler(req, res) {
  console.log('\n🎙️ ========================================');
  console.log('   WEBHOOK: GERAR ÁUDIO (V2 - SEM ENVIO)');
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

    const phoneRaw = body.phone || body.telefone || body.from || body.contact || body.number || body.whatsapp || body.celular;
    const email = body.email || body.mail || body.e_mail || '';
    const lead_id = body.lead_id || body.leadId || body.id || undefined;
    const primeiro_nome = body.primeiro_nome || body.first_name || body.nome || undefined;
    
    console.log('📋 Payload COMPLETO recebido:', JSON.stringify(body, null, 2));
    console.log('📋 Dados extraídos:', { phone: phoneRaw, email, lead_id, primeiro_nome });

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
    console.log(`   lead_id: ${lead_id}`);
    console.log(`   phoneRaw: ${phoneRaw}`);
    console.log(`   email: ${email}`);
    let lead;
    
    if (lead_id) {
      console.log(`   Tentando buscar por ID: ${lead_id}`);
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('id', lead_id)
        .maybeSingle();
      
      if (error) {
        console.error('   ❌ Erro ao buscar por ID:', error);
        throw error;
      }
      lead = data;
      console.log(`   Resultado busca por ID: ${lead ? 'encontrado' : 'não encontrado'}`);
    }
    
    if (!lead && phoneRaw) {
      console.log(`   Tentando buscar por telefone: ${phoneRaw}`);
      const result = await findLeadByPhone(supabase, phoneRaw, email);
      lead = result.lead; // findLeadByPhone retorna { lead, method }
      console.log(`   Resultado busca por telefone: ${lead ? 'encontrado' : 'não encontrado'}`);
      if (lead && result.method) {
        console.log(`   Método de busca: ${result.method}`);
      }
    }
    
    if (!lead) {
      console.error('   ❌ Lead não encontrado em nenhuma busca');
      return res.status(404).json({ 
        success: false, 
        error: 'Lead não encontrado',
        debug: {
          lead_id_tentado: lead_id,
          phone_tentado: phoneRaw,
          email_tentado: email
        }
      });
    }
    
    console.log(`✅ Lead encontrado: ${lead.nome} (${lead.celular})`);
    console.log(`🎯 Elemento: ${lead.elemento_principal}`);
    
    // Gerar script
  const script = gerarScriptParaLead(lead);
    console.log(`📝 Script gerado: ${script.length} caracteres`);
    
    // Gerar áudio
    const audioBuffer = await gerarAudio(script, lead.id);
    console.log(`✅ Áudio gerado: ${audioBuffer.length} bytes`);
    
    // Upload
    const audioUrl = await uploadAudio(audioBuffer, lead.id);
    
    // Atualizar banco - marcar como enviado
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'audio_personalizado_enviado',
        updated_at: new Date().toISOString()
      })
      .eq('id', lead.id);
    
    // Adicionar tags (mantém histórico)
    await addLeadTags(supabase, lead.id, [TAGS.AUDIO_ENVIADO]);
    
    console.log('✅ Status atualizado: audio_personalizado_enviado + tags');
    
    // Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'audio_gerado',
      metadata: {
        script_length: script.length,
        audio_url: audioUrl,
        audio_size_bytes: audioBuffer.length,
        campaign: 'black_vitalicia_audio_webhook_v2'
      },
      sent_at: new Date().toISOString()
    });
    
    console.log('========================================');
    console.log('✅ ÁUDIO GERADO COM SUCESSO!');
    console.log('========================================\n');
    
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
