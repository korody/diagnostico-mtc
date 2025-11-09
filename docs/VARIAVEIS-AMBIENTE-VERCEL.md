# 🔧 Variáveis de Ambiente Necessárias no Vercel

## ✅ Checklist de Variáveis

Para o webhook `generate-audio.js` funcionar, você precisa adicionar as seguintes variáveis de ambiente no Vercel:

### 1️⃣ ElevenLabs (Geração de Áudio)

```
ELEVENLABS_API_KEY=sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ELEVENLABS_VOICE_ID=hdFLFm20uYE7qa0TxNDq
```

### 2️⃣ Supabase (já devem estar configuradas)

```
SUPABASE_URL=https://kfkhdfnkwhljhhjcvbqp.supabase.co
SUPABASE_KEY=eyJ...
```

OU (formato alternativo que o código também aceita):

```
REACT_APP_SUPABASE_URL=https://kfkhdfnkwhljhhjcvbqp.supabase.co
REACT_APP_SUPABASE_KEY=eyJ...
```

### 3️⃣ Unnichat (já devem estar configuradas)

```
UNNICHAT_API_URL=https://api.unnichat.com.br
UNNICHAT_ACCESS_TOKEN=seu_token_aqui
UNNICHAT_INSTANCE_ID=seu_instance_id
```

## 📋 Como Adicionar no Vercel

### Opção A: Via Dashboard Web

1. Acesse: https://vercel.com
2. Selecione seu projeto: **quiz-mtc**
3. Vá em **Settings** > **Environment Variables**
4. Para cada variável:
   - **Name**: Nome da variável (ex: `ELEVENLABS_API_KEY`)
   - **Value**: Valor da variável
   - **Environment**: Selecione `Production` (e `Preview` se quiser testar)
5. Clique em **Save**

### Opção B: Via CLI

Se você tem o Vercel CLI instalado:

```bash
vercel env add ELEVENLABS_API_KEY
# Cole o valor quando solicitado
# Selecione: Production

vercel env add ELEVENLABS_VOICE_ID
# Cole: hdFLFm20uYE7qa0TxNDq
# Selecione: Production
```

## 🔄 Após Adicionar as Variáveis

As variáveis de ambiente só são aplicadas em novos deploys. Você precisa:

### Opção 1: Redeploy via Dashboard
1. Vá em **Deployments**
2. Clique nos 3 pontos do último deployment
3. Selecione **Redeploy**

### Opção 2: Redeploy via Git
```bash
git commit --allow-empty -m "Redeploy: adicionar variáveis ElevenLabs"
git push origin main
```

### Opção 3: Redeploy via CLI
```bash
vercel --prod
```

## ✅ Verificar se Funcionou

Após o redeploy, teste novamente:

```bash
node testar-webhook-direto.js
```

Você deve ver:
- ✅ Status: 200
- ✅ `"success": true`
- ✅ `"message": "Áudio gerado e enviado com sucesso"`

## 📊 Verificar Logs no Vercel

1. Vá em **Deployments** > último deployment
2. Clique em **View Function Logs**
3. Execute o teste
4. Veja os logs em tempo real (deve aparecer "🎙️ Gerando áudio com ElevenLabs...")

## 🎯 Valores das Variáveis

Se você não tem os valores, encontre no seu `.env.production` local:

```bash
# No PowerShell (Windows):
Get-Content .env.production | Select-String "ELEVENLABS"

# Ou abra o arquivo:
notepad .env.production
```

**IMPORTANTE:** Nunca commite o arquivo `.env.production` no Git!
