# 🐛 DEBUG: Lead Não Encontrado no Webhook

## ❌ Problema

O webhook está recebendo `lead_id` correto, mas não encontra o lead no Supabase:
- Localmente: ✅ Lead encontrado
- No Vercel: ❌ Lead não encontrado (`undefined`)

## 🔍 Causas Possíveis

### 1. Banco de Dados Diferente
O Vercel pode estar apontando para um banco Supabase diferente do local.

**Verificar:**
- `SUPABASE_URL` no Vercel deve ser: `https://kfkhdfnkwhljhhjcvbqp.supabase.co`
- `SUPABASE_KEY` no Vercel deve ser a mesma do `.env.production`

### 2. Permissões da Chave
A chave `anon` não tem permissão para ler dados protegidos.

**Solução:**
- Usar `SUPABASE_SERVICE_ROLE_KEY` também para leitura
- Ou configurar RLS (Row Level Security) para permitir leitura com `anon` key

### 3. Lead Não Existe em Produção
O lead de teste pode existir apenas localmente.

**Solução:**
- Usar um lead que existe em ambos os ambientes
- Ou criar o lead de teste no banco de produção

## ✅ Correção Aplicada

Atualizei o código para usar `service_role` key para TODAS as operações no Supabase:

```javascript
// Usar service_role para ter permissões completas
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY
);
```

## 📋 Checklist de Verificação no Vercel

1. **Settings → Environment Variables**
   - [ ] `SUPABASE_URL` = `https://kfkhdfnkwhljhhjcvbqp.supabase.co`
   - [ ] `SUPABASE_KEY` = (chave anon do `.env.production`)
   - [ ] `SUPABASE_SERVICE_ROLE_KEY` = (chave service_role do Supabase Dashboard)

2. **Redeploy**
   - [ ] Após adicionar/verificar variáveis, fazer redeploy

3. **Testar Novamente**
   - [ ] Disparar automação: `node engatilhar-automacao-audio.js`
   - [ ] Verificar logs: `node verificar-logs-webhook.js`
   - [ ] Checar logs do Vercel para ver mensagens de debug

## 🔧 Próximos Passos

1. Verificar variáveis de ambiente no Vercel
2. Garantir que `SUPABASE_SERVICE_ROLE_KEY` está configurada
3. Fazer redeploy
4. Testar novamente

Se o erro persistir, os logs de debug agora mostrarão:
- Qual `lead_id` foi tentado
- Se a busca por ID funcionou
- Se a busca por telefone foi tentada
- Mensagens de erro específicas do Supabase
