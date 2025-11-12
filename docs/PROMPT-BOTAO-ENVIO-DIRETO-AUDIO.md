# Prompt: Botão de Envio Direto de Áudio (Sem Automação Unnichat)

## Contexto

Tenho um webhook `/api/webhook/unnichat/generate-audio` que gera áudio personalizado via ElevenLabs e retorna a URL do arquivo. Atualmente ele é chamado pela automação do Unnichat.

Preciso criar um **botão no meu dashboard** que envie o áudio **diretamente via WhatsApp**, **SEM passar pela automação** do Unnichat. O botão deve:

1. Chamar o endpoint de geração de áudio
2. Receber a URL do áudio gerado
3. Enviar o áudio via API do Unnichat diretamente
4. Enviar o link CTA em uma mensagem de texto separada
5. Atualizar o status do lead

---

## 🎯 Objetivo

Criar um endpoint `/api/enviar-audio-direto` e um componente de botão que:
- Gera o áudio personalizado (via webhook existente)
- Envia o áudio via WhatsApp usando a API do Unnichat (não a automação)
- Envia o link CTA apropriado em mensagem de texto
- Atualiza status do lead

---

## 📋 Fluxo Completo

```
1. Usuário clica no botão "Enviar Áudio Direto" na tela do lead
2. Dashboard chama POST /api/enviar-audio-direto { leadId }
3. Servidor:
   a. Busca lead no Supabase
   b. Valida telefone e elemento
   c. Gera script personalizado (is_aluno)
   d. Gera áudio via ElevenLabs
   e. Faz upload no Supabase Storage
   f. Envia áudio via API Unnichat (/meta/messages)
   g. Envia link CTA via API Unnichat (/meta/messages)
   h. Atualiza whatsapp_status = 'audio_direto_enviado'
   i. Registra log em whatsapp_logs
4. Retorna sucesso/erro ao dashboard
```

---

## 🔧 Endpoint Existente (Webhook)

**URL:** `/api/webhook/unnichat/generate-audio`

**Entrada (POST body):**
```json
{
  "phone": "5511998457676"
}
```

**Saída:**
```json
{
  "audio_url": "https://xxxxx.supabase.co/storage/v1/object/public/audio-mensagens/audio_123_1234567890.mp3"
}
```

**Função interna:**
- Busca lead por telefone (normalização: exato → últimos 9 → últimos 8)
- Gera script via `gerarScriptParaLead(lead)` (seleciona copy por `is_aluno`)
- Gera áudio via ElevenLabs
- Upload no Supabase Storage
- Retorna URL pública do áudio

---

## 🆕 Novo Endpoint: Envio Direto

**URL:** `/api/enviar-audio-direto`

**Método:** POST

**Headers:**
```javascript
{
  'Content-Type': 'application/json'
}
```

**Body:**
```json
{
  "leadId": "123"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "message": "Áudio enviado com sucesso",
  "audioUrl": "https://xxxxx.supabase.co/storage/v1/object/public/audio-mensagens/audio_123.mp3",
  "scriptType": "ALUNO",
  "leadName": "João Silva"
}
```

**Response (Erro):**
```json
{
  "success": false,
  "error": "Lead sem telefone"
}
```

---

## 🔌 API do Unnichat para Envio Direto

### Endpoint: Enviar Mensagem

**URL:** `https://unnichat.com.br/api/meta/messages`

**Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer SEU_TOKEN_AQUI'
}
```

### 1. Enviar Áudio

**Body:**
```json
{
  "phone": "5511998457676",
  "messageType": "audio",
  "messageAudio": "https://xxxxx.supabase.co/storage/v1/object/public/audio-mensagens/audio_123.mp3"
}
```

### 2. Enviar Texto (Link CTA)

**Body:**
```json
{
  "phone": "5511998457676",
  "messageType": "text",
  "messageText": "Clique no link para garantir sua vaga: https://i.sendflow.pro/l/super-combo-vitalicio-alunos"
}
```

**Response esperada:**
```json
{
  "code": "200",
  "message": "Message sent successfully"
}
```

---

## 💻 Implementação do Endpoint

```javascript
// /api/enviar-audio-direto.js

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
const UNNICHAT_ACCESS_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;

// Importar função de geração de script
const { gerarScriptParaLead } = require('../../lib/audio-copies');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { leadId } = req.body;

  if (!leadId) {
    return res.status(400).json({ success: false, error: 'leadId obrigatório' });
  }

  try {
    // 1. Buscar lead
    const { data: lead, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    // Validações
    if (!lead.celular) {
      return res.status(400).json({ success: false, error: 'Lead sem telefone' });
    }
    if (!lead.elemento_principal) {
      return res.status(400).json({ success: false, error: 'Lead sem elemento' });
    }

    // 2. Gerar script personalizado
    const script = gerarScriptParaLead(lead);
    const scriptType = lead.is_aluno ? 'ALUNO' : 'NÃO-ALUNO';

    // 3. Gerar áudio via ElevenLabs
    const audioBuffer = await gerarAudioElevenLabs(script);

    // 4. Upload no Supabase Storage
    const audioUrl = await uploadAudioSupabase(audioBuffer, leadId);

    // 5. Normalizar telefone para Unnichat
    const phoneNormalized = normalizarTelefone(lead.celular);

    // 6. Enviar áudio via Unnichat
    await enviarAudioUnnichat(phoneNormalized, audioUrl);

    // 7. Enviar link CTA via Unnichat
    const linkCta = lead.is_aluno
      ? 'https://i.sendflow.pro/l/super-combo-vitalicio-alunos'
      : 'https://i.sendflow.pro/l/super-combo-vitalicio';
    
    const mensagemCta = `Clique no link para garantir sua vaga: ${linkCta}`;
    await enviarTextoUnnichat(phoneNormalized, mensagemCta);

    // 8. Atualizar status do lead
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'audio_direto_enviado',
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    // 9. Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: leadId,
      phone: lead.celular,
      status: 'audio_direto_enviado',
      metadata: {
        script_type: scriptType,
        script_length: script.length,
        audio_url: audioUrl,
        link_cta: linkCta,
        campaign: 'audio_direto_dashboard'
      },
      sent_at: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      message: 'Áudio enviado com sucesso',
      audioUrl,
      scriptType,
      leadName: lead.nome
    });

  } catch (error) {
    console.error('Erro ao enviar áudio:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

async function gerarAudioElevenLabs(script) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error('Erro ao gerar áudio: ' + response.statusText);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadAudioSupabase(audioBuffer, leadId) {
  const fileName = `audio_${leadId}_${Date.now()}.mp3`;
  const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/audio-mensagens/${fileName}`;

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'false'
    },
    body: audioBuffer
  });

  if (!response.ok) {
    throw new Error('Erro ao fazer upload: ' + response.statusText);
  }

  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/audio-mensagens/${fileName}`;
  return publicUrl;
}

function normalizarTelefone(phone) {
  // Remove tudo exceto dígitos
  const digits = phone.replace(/\D/g, '');
  
  // Se já tem DDI (55), retorna
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  
  // Se tem 11 dígitos (DDD + número), adiciona 55
  if (digits.length === 11) {
    return '55' + digits;
  }
  
  // Se tem 10 dígitos, adiciona 55
  if (digits.length === 10) {
    return '55' + digits;
  }
  
  throw new Error('Formato de telefone inválido');
}

async function enviarAudioUnnichat(phone, audioUrl) {
  const response = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      phone: phone,
      messageType: 'audio',
      messageAudio: audioUrl
    })
  });

  const data = await response.json();

  if (data.code !== '200') {
    throw new Error(`Erro ao enviar áudio: ${data.message || 'Erro desconhecido'}`);
  }

  return data;
}

async function enviarTextoUnnichat(phone, texto) {
  const response = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${UNNICHAT_ACCESS_TOKEN}`
    },
    body: JSON.stringify({
      phone: phone,
      messageType: 'text',
      messageText: texto
    })
  });

  const data = await response.json();

  if (data.code !== '200') {
    throw new Error(`Erro ao enviar texto: ${data.message || 'Erro desconhecido'}`);
  }

  return data;
}
```

---

## 🎨 Componente UI (React/Next.js)

```jsx
import { useState } from 'react';

function EnviarAudioDiretoButton({ lead }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleEnviar() {
    if (!confirm(`Enviar áudio diretamente para ${lead.nome}?`)) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/enviar-audio-direto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `✅ Áudio enviado! (${data.scriptType})`
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `❌ Erro: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleEnviar}
        disabled={loading || !lead.celular || !lead.elemento_principal}
        className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all hover:-translate-y-0.5"
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin mr-2">⏳</span>
            Enviando áudio direto...
          </>
        ) : (
          <>
            <span className="mr-2">🚀</span>
            Enviar Áudio Direto
          </>
        )}
      </button>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>📋 Copy: {lead.is_aluno ? 'ALUNO (reativação)' : 'NÃO-ALUNO (vendas)'}</p>
        <p>🎯 Elemento: {lead.elemento_principal || 'N/A'}</p>
        <p>⚡ Envio direto (sem automação)</p>
      </div>
    </div>
  );
}
```

---

## 🔐 Variáveis de Ambiente Necessárias

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# ElevenLabs
ELEVENLABS_API_KEY=sk_xxxxx
ELEVENLABS_VOICE_ID=hdFLFm20uYE7qa0TxNDq

# Unnichat
UNNICHAT_API_URL=https://unnichat.com.br/api
UNNICHAT_ACCESS_TOKEN=Bearer_xxxxx
```

---

## 📊 Diferenças: Automação vs Envio Direto

| Aspecto | Automação Unnichat | Envio Direto |
|---------|-------------------|--------------|
| **Geração de áudio** | Webhook chamado pela automação | API chama ElevenLabs diretamente |
| **Envio WhatsApp** | Unnichat automation flow | API `/meta/messages` |
| **Controle** | Depende da automação configurada | Total controle no código |
| **Velocidade** | ~30-60s (via automação) | ~15-30s (direto) |
| **Status** | `automacao_audio_personalizado` | `audio_direto_enviado` |
| **Uso** | Envio em massa/lotes | Envio individual on-demand |

---

## ✅ Checklist de Implementação

- [ ] Criar endpoint `/api/enviar-audio-direto`
- [ ] Importar `gerarScriptParaLead` de `lib/audio-copies.js`
- [ ] Implementar `gerarAudioElevenLabs`
- [ ] Implementar `uploadAudioSupabase`
- [ ] Implementar `enviarAudioUnnichat`
- [ ] Implementar `enviarTextoUnnichat`
- [ ] Implementar `normalizarTelefone`
- [ ] Criar componente `EnviarAudioDiretoButton`
- [ ] Adicionar variáveis de ambiente (UNNICHAT_ACCESS_TOKEN)
- [ ] Testar com lead aluno
- [ ] Testar com lead não-aluno
- [ ] Verificar logs no Supabase
- [ ] Validar recebimento no WhatsApp

---

## 🎯 Resultado Esperado

Um botão "Enviar Áudio Direto" que:
1. ✅ Gera áudio personalizado em ~10-15s
2. ✅ Envia áudio via WhatsApp (API Unnichat)
3. ✅ Envia link CTA apropriado (aluno vs não-aluno)
4. ✅ Atualiza status `audio_direto_enviado`
5. ✅ Registra log completo
6. ✅ Funciona independente da automação
7. ✅ Feedback visual ao usuário

**Vantagens:**
- ⚡ Mais rápido (sem intermediário da automação)
- 🎯 Controle total do fluxo
- 📊 Melhor rastreabilidade
- 🔧 Mais fácil de debugar
