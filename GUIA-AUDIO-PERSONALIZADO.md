# 🎙️ Guia: Mensagens de Voz Personalizadas

Sistema para enviar mensagens de voz personalizadas usando ElevenLabs + WhatsApp (Unnichat).

## 📋 Pré-requisitos

### 1. **Conta ElevenLabs** (Text-to-Speech)
- Criar conta em: https://elevenlabs.io
- Obter API Key em: https://elevenlabs.io/app/settings/api-keys
- **Plano recomendado:** Starter ($5/mês) = 30.000 caracteres
  - Cada mensagem = ~300 caracteres
  - 30.000 / 300 = **~100 mensagens de voz**

### 2. **Configurar variáveis de ambiente**

Edite `.env.production` e adicione:

```bash
# ElevenLabs API Key (obter em: https://elevenlabs.io/app/settings/api-keys)
ELEVENLABS_API_KEY=sua_chave_api_aqui

# Voice ID (opcional - usar voz masculina em português)
ELEVENLABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
```

### 3. **Escolher a voz ideal**

Teste diferentes vozes em: https://elevenlabs.io/voice-library

**Vozes masculinas recomendadas para português:**
- `pNInz6obpgDQGcFmaJgB` - **Adam** (forte, autoritário) ✅ RECOMENDADA
- `TxGEqnHWrfWFTfGW9XjX` - **Josh** (jovem, amigável)
- `VR6AewLTigWG4xSOukaG` - **Arnold** (sério, profundo)

Você pode clonar sua própria voz (plano Creator+) ou usar vozes prontas.

---

## 🚀 Como usar

### **Passo 1: Teste com poucos leads**

```bash
# Editar mensagem-voz-personalizada.js
const MODO_TESTE = true;  # Apenas gera scripts (não envia)
const LIMITE_ENVIOS = 5;   # Testar com 5 leads

# Executar
node mensagem-voz-personalizada.js
```

Isso vai:
- ✅ Buscar 5 leads do banco
- ✅ Gerar scripts personalizados
- ✅ Mostrar preview dos textos
- ❌ NÃO gera áudio (modo teste)
- ❌ NÃO envia WhatsApp (modo teste)

### **Passo 2: Testar geração de áudio (1 lead)**

```bash
# Editar mensagem-voz-personalizada.js
const MODO_TESTE = false; # Gera e envia de verdade
const LIMITE_ENVIOS = 1;   # Apenas 1 lead (seu número)

# Executar
node mensagem-voz-personalizada.js
```

Isso vai:
- ✅ Gerar áudio com ElevenLabs
- ✅ Enviar para o WhatsApp do lead
- ✅ Salvar log no banco

### **Passo 3: Envio em massa**

```bash
# Editar mensagem-voz-personalizada.js
const MODO_TESTE = false;
const LIMITE_ENVIOS = 100; # Quantos leads processar

# Executar
node mensagem-voz-personalizada.js
```

---

## ⚙️ Personalização

### **Editar template do script**

No arquivo `mensagem-voz-personalizada.js`, função `gerarScript()`:

```javascript
const script = `Olá ${primeiroNome}, aqui é o Mestre Ye.

Eu analisei seu diagnóstico de ${elemento}, e entendo exatamente o que você está passando com ${sintomas}.

[... sua mensagem personalizada ...]

${primeiroNome}, essa é sua chance! Te espero hoje, 20 horas!`;
```

### **Ajustar duração (30 segundos)**

- **Português falado:** ~150 palavras/minuto
- **30 segundos:** ~75 palavras
- **Limite de caracteres:** ~300-350 caracteres

---

## 📊 Filtros de leads

Por padrão, o script busca:
- ✅ Leads com telefone válido
- ✅ Leads com diagnóstico completo
- ✅ Ordenados por lead_score (maior primeiro)

Para filtrar por outros critérios, edite:

```javascript
const { data: leads, error } = await supabase
  .from('quiz_leads')
  .select('*')
  .not('celular', 'is', null)
  .not('elemento_principal', 'is', null)
  .gte('lead_score', 70)  // Apenas leads com score >= 70
  .eq('whatsapp_status', 'AGUARDANDO_CONTATO') // Apenas quem não recebeu
  .order('lead_score', { ascending: false })
  .limit(LIMITE_ENVIOS);
```

---

## 💰 Custos

### **ElevenLabs**
| Plano | Preço | Caracteres | Mensagens (~300 chars) |
|-------|-------|------------|------------------------|
| Free | $0 | 10.000 | ~33 mensagens |
| Starter | $5/mês | 30.000 | ~100 mensagens |
| Creator | $22/mês | 100.000 | ~333 mensagens |

### **WhatsApp (via Unnichat)**
- Depende do seu plano Unnichat
- Mensagens de voz = mensagens de mídia
- Verifique seu limite mensal

---

## 🔧 Troubleshooting

### **Erro: "ElevenLabs API error"**
- ✅ Verificar se API Key está correta
- ✅ Verificar se tem créditos disponíveis
- ✅ Verificar se Voice ID existe

### **Erro: "WhatsApp API error"**
- ✅ Verificar UNNICHAT_ACCESS_TOKEN
- ✅ Verificar formato do telefone (E.164)
- ✅ Verificar se o número está ativo no WhatsApp

### **Áudio não está sendo enviado**
- ✅ Verificar se pasta `/temp` foi criada
- ✅ Verificar permissões de escrita
- ✅ Verificar tamanho do arquivo (max 16MB)

---

## 📈 Monitoramento

Todos os envios são registrados em:
- **Tabela:** `whatsapp_logs`
- **Status:** `audio_personalizado_enviado`
- **Metadata:** Inclui script, caminho do áudio, resposta API

Consultar logs:

```sql
SELECT 
  lead_id,
  phone,
  status,
  metadata->>'script_length' as script_length,
  sent_at
FROM whatsapp_logs
WHERE status = 'audio_personalizado_enviado'
ORDER BY sent_at DESC
LIMIT 20;
```

---

## 🎯 Próximos passos

1. [ ] Testar com seu próprio número primeiro
2. [ ] Ajustar script se necessário
3. [ ] Testar com 5-10 leads de confiança
4. [ ] Enviar para toda a base (em horários adequados)

---

## ⚠️ IMPORTANTE

- **Horário:** Envie entre 9h-21h (respeitar horário comercial)
- **Delay:** Mantenha 15-30s entre envios (evitar bloqueio)
- **Teste:** SEMPRE teste com você primeiro!
- **Backup:** Faça backup do banco antes do envio em massa

---

## 📞 Suporte

Dúvidas? Entre em contato com o desenvolvedor.

**Boa campanha!** 🚀
