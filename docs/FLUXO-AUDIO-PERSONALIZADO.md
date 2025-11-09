# 🎙️ Fluxo Completo: Mensagem de Áudio Personalizada

## 📋 Arquitetura do Sistema

### Componentes
1. **Script de Campanha** (`mensagem-voz-personalizada.js`) - Envia áudio pré-gerado via automação
2. **Automação Unnichat** (ujzdbrjxV1lpg9X2uM65) - Envia template + chama webhook
3. **Webhook** (`/api/webhook/unnichat/generate-audio`) - Gera e envia áudio personalizado

## 🔄 Fluxo da Automação Unnichat

```
┌─────────────────────────────────────────────────────────┐
│  1. INÍCIO: Recebe dados do lead                        │
│     - phone, email, lead_id, primeiro_nome              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  2. TEMPLATE WhatsApp                                   │
│     - Envia mensagem template aprovada                  │
│     - ABRE JANELA DE 24 HORAS ✓                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  3. DELAY (2-3 segundos)                                │
│     - Aguarda template ser entregue                     │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  4. HTTP REQUEST                                        │
│     POST https://quiz.qigongbrasil.com/api/webhook/     │
│          unnichat/generate-audio                        │
│                                                          │
│     Body: {                                             │
│       "phone": "{{phone}}",                            │
│       "email": "{{email}}",                            │
│       "lead_id": "{{lead_id}}",                        │
│       "primeiro_nome": "{{primeiro_nome}}"             │
│     }                                                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   NOSSO WEBHOOK  │
         └─────────┬────────┘
                   │
    ┌──────────────┴──────────────┐
    │ Processamento no Servidor   │
    │                              │
    │ 1. Busca lead no Supabase    │
    │ 2. Gera script personalizado │
    │ 3. Gera áudio (ElevenLabs)   │
    │ 4. Upload (Supabase Storage) │
    │ 5. Envia áudio via Unnichat  │ ← Sessão JÁ está aberta!
    └──────────────┬───────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  LEAD RECEBE:                                           │
│  1. Template (texto)                                    │
│  2. Áudio personalizado (voz do Mestre Ye)             │
└─────────────────────────────────────────────────────────┘
```

## ✅ Por Que Funciona

**Janela de 24h:**
- O template abre a janela de comunicação
- Qualquer mensagem enviada nos próximos 5 segundos ainda está dentro da janela
- O webhook envia o áudio DENTRO dessa janela ✓

**Teste Manual vs Automação:**
- ❌ Teste manual: sessão não aberta → falha
- ✅ Via automação: template abre sessão → webhook envia → sucesso

## 🧪 Como Testar

### Teste Completo (Recomendado)
```bash
# 1. Disparar automação para um lead de teste
node engatilhar-automacao-audio.js

# 2. Verificar logs no Supabase
node verificar-logs-webhook.js

# 3. Confirmar recebimento no WhatsApp
```

### Verificar Logs Esperados

No Supabase `whatsapp_logs`, você deve ver:

1. `audio_automacao_enviado` - Automação iniciada
2. `webhook_generate_audio_recebido` - Webhook recebeu chamada
3. `audio_enviado` - Áudio gerado e enviado com sucesso

## 📱 Configuração do HTTP Request no Unnichat

**URL:**
```
https://quiz.qigongbrasil.com/api/webhook/unnichat/generate-audio
```

**Método:** POST

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "phone": "{{phone}}",
  "email": "{{email}}",
  "lead_id": "{{lead_id}}",
  "primeiro_nome": "{{primeiro_nome}}"
}
```

**Observações:**
- Use variáveis do Unnichat: `{{phone}}`, `{{email}}`, etc.
- O webhook aceita campos alternativos (telefone, from, nome, etc.)
- Lead pode ser encontrado por phone OU lead_id

## 🎯 Próximos Passos

1. ✅ Código pronto e deployado
2. ✅ Variáveis de ambiente configuradas
3. ⏳ Configurar HTTP Request na automação
4. ⏳ Testar com lead real via automação completa

## 🐛 Troubleshooting

**Webhook não é chamado:**
- Verificar URL no Unnichat (https, não http)
- Confirmar que o bloco HTTP está ativo
- Checar logs do Vercel

**Áudio não é enviado:**
- Verificar se template foi enviado antes
- Confirmar que SUPABASE_SERVICE_ROLE_KEY está configurada
- Validar credenciais Unnichat (API_URL, ACCESS_TOKEN, INSTANCE_ID)

**Lead não encontrado:**
- Verificar se o lead existe no Supabase
- Confirmar formato do telefone (apenas números)
- Checar se email está correto
