# 🔧 Configuração do HTTP Request no Unnichat

## ✅ Checklist de Configuração

### 1️⃣ Bloco HTTP Request na Automação
Na automação do Unnichat (ujzdbrjxV1lpg9X2uM65), adicione/verifique o bloco HTTP Request:

### 2️⃣ Configurações do Request

**URL:**
```
https://quiz.qigongbrasil.com/api/webhook/unnichat/generate-audio
```

**Método:**
```
POST
```

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

### 3️⃣ Variáveis Disponíveis na Automação

Certifique-se de que essas variáveis estão sendo passadas quando a automação é iniciada:

- `{{phone}}` - Telefone do lead (obrigatório)
- `{{email}}` - Email do lead (opcional)
- `{{lead_id}}` - ID do lead no banco (opcional, mas recomendado)
- `{{primeiro_nome}}` - Primeiro nome do lead (opcional)

### 4️⃣ Ordem dos Blocos na Automação

1. **Início da Automação** (recebe variáveis)
2. **Template WhatsApp** (abre sessão de 24h)
3. **Delay** (opcional, 2-5 segundos)
4. **HTTP Request** (chama nossa API para gerar áudio)
5. **Blocos subsequentes** (se houver)

### 5️⃣ Alternativa: Campos Alternativos

Nosso webhook também aceita esses nomes de campos alternativos:

**Para telefone:**
- `phone`
- `from`
- `celular`
- `telefone`

**Para email:**
- `email`
- `mail`

**Para nome:**
- `primeiro_nome`
- `name`
- `nome`

**Para lead_id:**
- `lead_id`
- `leadId`
- `id`

## 🧪 Teste Manual do Webhook

Para testar se o webhook está funcionando, você pode fazer um POST manual:

```bash
curl -X POST https://quiz.qigongbrasil.com/api/webhook/unnichat/generate-audio \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "5511998457676",
    "email": "marko@persona.cx",
    "lead_id": "08c35652-9b19-4524-a3c2-35c0f22f26ce",
    "primeiro_nome": "marcos"
  }'
```

## 📊 Verificar Logs Após Configuração

Após configurar e testar, execute:

```bash
node verificar-logs-webhook.js
```

Você deve ver logs com status:
- `webhook_generate_audio_recebido` - Webhook recebeu a requisição
- `audio_enviado` - Áudio foi gerado e enviado com sucesso
- `webhook_generate_audio_erro` - Houve algum erro (verifique metadata para detalhes)

## ⚠️ Problemas Comuns

### Webhook não é chamado:
- ✅ Verificar se o bloco HTTP está ativo na automação
- ✅ Confirmar URL sem typos
- ✅ Método deve ser POST (não GET)

### Webhook retorna erro:
- ✅ Verificar se pelo menos o campo `phone` está presente
- ✅ Telefone deve ter apenas números (sem +, espaços, parênteses)
- ✅ Lead deve existir no banco de dados

### Áudio não chega no WhatsApp:
- ✅ Verificar se a sessão de 24h está aberta (template deve ser enviado antes)
- ✅ Confirmar que o Unnichat tem permissão para enviar mídia
- ✅ Verificar se o áudio foi gerado e está acessível (URL pública do Supabase)
