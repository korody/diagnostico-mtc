# Prompt: Implementar Áudio Personalizado Individual no Dashboard

## Contexto do Sistema

Tenho uma aplicação de quiz de diagnóstico de Medicina Tradicional Chinesa (MTC) que gerencia leads no Supabase. Atualmente existe um sistema de envio em lotes que gera áudios personalizados via ElevenLabs e envia por WhatsApp via Unnichat.

## Objetivo

Preciso adicionar a funcionalidade de **envio individual de áudio personalizado** na tela de visualização de cada lead no meu dashboard. O sistema deve:
1. Detectar automaticamente se o lead é aluno ou não (`is_aluno`)
2. Gerar script personalizado com a copy correta
3. Gerar áudio via ElevenLabs
4. Fazer upload no Supabase Storage
5. Disparar automação Unnichat para enviar o áudio via WhatsApp

---

## 📋 Funcionalidade a Implementar

### **Botão: Enviar Áudio Personalizado** 🎙️

**Localização:** Tela de visualização/detalhes do lead

**Comportamento:**
1. Usuário clica no botão
2. Sistema busca dados completos do lead
3. Gera script baseado em `is_aluno` (aluno vs não-aluno)
4. Gera áudio via ElevenLabs (TTS)
5. Upload do áudio no Supabase Storage
6. Dispara automação Unnichat com URL do áudio
7. Atualiza status do lead: `automacao_audio_personalizado`
8. Mostra feedback de sucesso/erro

**UI/UX:**
- Botão gradiente roxo/rosa (#8b5cf6 → #ec4899)
- Ícone: 🎙️
- Label: "Enviar Áudio Personalizado"
- Loading state com spinner
- Desabilitado durante processamento
- Tooltip: "Gera áudio personalizado e envia via WhatsApp"

---

## 🔧 Integrações Necessárias

### 1. **ElevenLabs (Text-to-Speech)**

**Credenciais necessárias:**
```env
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=hdFLFm20uYE7qa0TxNDq
```

**Endpoint:**
```
POST https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}
```

**Headers:**
```javascript
{
  'Accept': 'audio/mpeg',
  'xi-api-key': ELEVENLABS_API_KEY,
  'Content-Type': 'application/json'
}
```

**Body:**
```javascript
{
  text: "Script personalizado aqui...",
  model_id: "eleven_multilingual_v2",
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true
  }
}
```

**Response:**
- Binary audio/mpeg (arraybuffer)
- Converter para Buffer: `Buffer.from(response.data)`

---

### 2. **Supabase Storage**

**Credenciais necessárias:**
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxxxx (service_role key para upload)
```

**Bucket:** `audio-mensagens` (público)

**Upload endpoint:**
```
POST {SUPABASE_URL}/storage/v1/object/audio-mensagens/{fileName}
```

**Headers:**
```javascript
{
  'Authorization': 'Bearer ' + SUPABASE_SERVICE_ROLE_KEY,
  'Content-Type': 'audio/mpeg',
  'x-upsert': 'false'
}
```

**Nome do arquivo:**
```javascript
const fileName = `audio_${leadId}_${Date.now()}.mp3`;
```

**URL pública (retorno):**
```javascript
const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/audio-mensagens/${fileName}`;
```

---

### 3. **Unnichat (WhatsApp)**

**Credenciais necessárias:**
```env
UNNICHAT_API_URL=https://unnichat.com.br/api
UNNICHAT_ACCESS_TOKEN=Bearer_xxxxx
```

**Automação Endpoint:**
```
POST https://unnichat.com.br/a/start/ujzdbrjxV1lpg9X2uM65
```

**Body:**
```javascript
{
  phone: "+5511998457676",  // Formato E.164
  email: "email@exemplo.com", // Opcional
  link_cta: "https://i.sendflow.pro/l/super-combo-vitalicio-alunos" // Link diferenciado por segmento
}
```

**Links CTA por Segmento:**
- **Alunos** (`is_aluno = true`): `https://i.sendflow.pro/l/super-combo-vitalicio-alunos`
- **Não-alunos** (`is_aluno = false` ou `null`): `https://i.sendflow.pro/l/super-combo-vitalicio` (padrão)

**Headers:**
```javascript
{
  'Content-Type': 'application/json'
}
```

**Response:**
```javascript
{
  response: true,
  data: { message: "Success, automation started." }
}
```

**Importante:** 
- A automação Unnichat vai chamar o webhook `/api/webhook/unnichat/generate-audio`
- O webhook retorna a URL do áudio
- Unnichat usa essa URL para enviar o áudio via WhatsApp

---

## 📝 Scripts de Mensagem (Copy)

### **Estrutura Base**

Todos os scripts usam as mesmas variáveis dinâmicas:

```javascript
const primeiroNome = lead.nome.split(' ')[0];
const elemento = lead.elemento_principal; // RIM|FÍGADO|BAÇO|CORAÇÃO|PULMÃO

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

const sintomas = sintomasPorElemento[elemento];
const solucao = solucoesPorElemento[elemento];
const elementoFalado = elementoPronuncia[elemento];
```

---

### **Copy para NÃO-ALUNOS** (is_aluno = false)

Tom: Vendas diretas, urgência, escassez

```javascript
function copyNaoAlunos(primeiroNome, elementoFalado, sintomas, solucao) {
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
```

---

### **Copy para ALUNOS** (is_aluno = true)

Tom: Reativação, benefício tangível, urgência legítima, estrutura PAS

```javascript
function copyAlunos(primeiroNome, elementoFalado, sintomas, solucao) {
  return `Oi ${primeiroNome}, aqui é o Mestre Ye.

Como você já confiou no meu trabalho no passado, decidi dedicar um tempo para analisar seu diagnóstico hoje e notei alguns sinais de desequilíbrio em ${elementoFalado}.

Provavelmente você tem sentido ${sintomas}.

E sei exatamente como ${solucao} — porque você já viu meu método funcionar antes.

${primeiroNome}, preparei uma condição exclusiva para alunos e ex-alunos aproveitarem o SUPER COMBO VITALÍCIO.

É a mesma transformação que você já conhece, só que agora com acesso PERMANENTE a tudo que você precisa para manter os resultados para sempre.

Mas preciso te avisar: essa é a última turma com esse pacote tão completo e vitalício.

Depois disso, não vai ter mais essa condição.

Se faz sentido pra você garantir esse acesso agora, clica no link que vou te mandar.

A minha equipe tá fechando as vagas em breve porque já estamos no limite.

Posso contar com você nessa turma?`;
}
```

---

### **Função de Seleção Automática**

```javascript
function gerarScriptParaLead(lead) {
  const primeiroNome = lead.nome.split(' ')[0];
  const elemento = lead.elemento_principal || 'CORAÇÃO';
  const elementoFalado = elementoPronuncia[elemento.toUpperCase()] || elemento.toLowerCase();
  const sintomas = sintomasPorElemento[elemento.toUpperCase()] || 'desconfortos e dores';
  const solucao = solucoesPorElemento[elemento.toUpperCase()] || 'reequilibrar sua energia';
  
  // Seleção automática baseada em is_aluno
  if (lead.is_aluno === true) {
    return copyAlunos(primeiroNome, elementoFalado, sintomas, solucao);
  } else {
    return copyNaoAlunos(primeiroNome, elementoFalado, sintomas, solucao);
  }
}
```

---

## 🔄 Fluxo Completo (Passo a Passo)

### **1. Usuário clica no botão**

```javascript
async function enviarAudioPersonalizado(leadId) {
  // 1. Buscar lead do Supabase
  const { data: lead, error } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('id', leadId)
    .single();
  
  if (error || !lead) {
    throw new Error('Lead não encontrado');
  }
  
  // Validações
  if (!lead.celular) throw new Error('Lead sem telefone');
  if (!lead.elemento_principal) throw new Error('Lead sem elemento');
  
  // 2. Gerar script personalizado
  const script = gerarScriptParaLead(lead);
  
  // 3. Gerar áudio com ElevenLabs
  const audioBuffer = await gerarAudioElevenLabs(script);
  
  // 4. Upload no Supabase Storage
  const audioUrl = await uploadAudioSupabase(audioBuffer, leadId);
  
  // 5. Disparar automação Unnichat (com link_cta diferenciado)
  await dispararAutomacaoUnnichat(lead.celular, lead.email, lead.is_aluno);
  
  // 6. Atualizar status do lead
  await supabase
    .from('quiz_leads')
    .update({
      whatsapp_status: 'automacao_audio_personalizado',
      updated_at: new Date().toISOString()
    })
    .eq('id', leadId);
  
  return { success: true, audioUrl };
}
```

---

### **2. Gerar áudio (ElevenLabs)**

```javascript
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
```

---

### **3. Upload no Supabase Storage**

```javascript
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
```

---

### **4. Disparar automação Unnichat**

```javascript
async function dispararAutomacaoUnnichat(celular, email, isAluno) {
  // Normalizar telefone para E.164
  const phoneE164 = celular.startsWith('+') ? celular : `+55${celular.replace(/\D/g, '')}`;
  
  // Selecionar link CTA baseado no segmento
  const linkCta = isAluno 
    ? 'https://i.sendflow.pro/l/super-combo-vitalicio-alunos'
    : 'https://i.sendflow.pro/l/super-combo-vitalicio';
  
  const response = await fetch(
    'https://unnichat.com.br/a/start/ujzdbrjxV1lpg9X2uM65',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneE164,
        email: email || '',
        link_cta: linkCta
      })
    }
  );
  
  const data = await response.json();
  
  if (!data.response) {
    throw new Error('Erro ao disparar automação: ' + (data.message || 'Erro desconhecido'));
  }
  
  return data;
}
```

---

## 🎨 Componente UI (React/Next.js)

```jsx
import { useState } from 'react';

function EnviarAudioButton({ lead }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  async function handleEnviar() {
    if (!confirm(`Enviar áudio personalizado para ${lead.nome}?`)) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/audio-personalizado/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage({
          type: 'success',
          text: `✅ Áudio enviado com sucesso! (${data.scriptType})`
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
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all hover:-translate-y-0.5"
      >
        {loading ? (
          <>
            <span className="inline-block animate-spin mr-2">⏳</span>
            Gerando e enviando áudio...
          </>
        ) : (
          <>
            <span className="mr-2">🎙️</span>
            Enviar Áudio Personalizado
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
        <p>⏱️ Tempo estimado: ~30-60 segundos</p>
      </div>
    </div>
  );
}
```

---

## 🔧 API Route (Next.js)

```javascript
// /api/audio-personalizado/enviar.js

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    
    // 2. Gerar script
    const script = gerarScriptParaLead(lead);
    const scriptType = lead.is_aluno ? 'ALUNO' : 'NÃO-ALUNO';
    
    // 3. Gerar áudio
    const audioBuffer = await gerarAudioElevenLabs(script);
    
    // 4. Upload
    const audioUrl = await uploadAudioSupabase(audioBuffer, leadId);
    
    // 5. Disparar automação (com link_cta diferenciado)
    await dispararAutomacaoUnnichat(lead.celular, lead.email, lead.is_aluno);
    
    // 6. Atualizar status
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'automacao_audio_personalizado',
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
    
    // 7. Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: leadId,
      phone: lead.celular,
      status: 'audio_gerado',
      metadata: {
        script_type: scriptType,
        script_length: script.length,
        audio_url: audioUrl,
        campaign: 'audio_personalizado_individual'
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

// ... (incluir aqui as funções gerarScriptParaLead, gerarAudioElevenLabs, uploadAudioSupabase, dispararAutomacaoUnnichat)
```

---

## 🔐 Variáveis de Ambiente

Adicionar no `.env` ou `.env.local`:

```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxx

# ElevenLabs
ELEVENLABS_API_KEY=sk_xxxxx
ELEVENLABS_VOICE_ID=hdFLFm20uYE7qa0TxNDq

# Unnichat (opcional - automação não exige token)
UNNICHAT_API_URL=https://unnichat.com.br/api
UNNICHAT_ACCESS_TOKEN=Bearer_xxxxx
```

---

## ⚠️ Considerações Importantes

### **Normalização de Telefone**
```javascript
// Entrada: "11998457676", "(11) 99845-7676", "+5511998457676"
// Saída: "+5511998457676" (E.164)

function normalizarTelefone(phone) {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('55')) {
    return '+' + digits;
  } else if (digits.length === 11) {
    return '+55' + digits;
  } else {
    throw new Error('Formato de telefone inválido');
  }
}
```

### **Tratamento de Erros**
- ElevenLabs: Verificar saldo de créditos
- Supabase: Verificar permissões do bucket (público)
- Unnichat: Número pode estar bloqueado/inválido

### **Performance**
- Geração de áudio: ~5-15 segundos
- Upload: ~2-5 segundos
- Automação: instantânea
- **Total: ~30-60 segundos** até entrega

### **Limites**
- ElevenLabs: ~10.000 caracteres por request
- Áudio gerado: ~1-3 minutos de duração
- WhatsApp: limite de 16MB por áudio

---

## ✅ Checklist de Implementação

- [ ] Criar API route `/api/audio-personalizado/enviar`
- [ ] Implementar função `gerarScriptParaLead` (com mapas de sintomas/soluções)
- [ ] Implementar função `gerarAudioElevenLabs`
- [ ] Implementar função `uploadAudioSupabase`
- [ ] Implementar função `dispararAutomacaoUnnichat`
- [ ] Criar componente `EnviarAudioButton`
- [ ] Adicionar variáveis de ambiente
- [ ] Testar com lead aluno (is_aluno = true)
- [ ] Testar com lead não-aluno (is_aluno = false)
- [ ] Verificar bucket Supabase (público, permissões corretas)
- [ ] Validar integração Unnichat (webhook retorna URL)
- [ ] Adicionar logs de erro/sucesso
- [ ] Adicionar loading states e feedback visual
- [ ] Testar normalização de telefone (vários formatos)
- [ ] Verificar saldo ElevenLabs antes de enviar

---

## 🎯 Resultado Esperado

Um botão na tela de visualização do lead que:
1. ✅ Detecta automaticamente se é aluno ou não
2. ✅ Gera script com copy personalizada
3. ✅ Cria áudio profissional em português
4. ✅ Armazena áudio no Supabase
5. ✅ Envia via WhatsApp através do Unnichat
6. ✅ Atualiza status do lead
7. ✅ Mostra feedback claro ao usuário
8. ✅ Tempo total: ~30-60 segundos

**Diferencial:** Copy otimizada por segmento (aluno vs não-aluno) seguindo princípios de resposta direta (PAS, prova social, benefício tangível, urgência legítima).
