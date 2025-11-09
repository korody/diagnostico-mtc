# 🔧 CORREÇÃO: Upload no Supabase Storage Falhando

## ❌ Problema Identificado

O upload está falhando com erro 400 porque estamos usando a chave `anon` do Supabase, que não tem permissão de escrita no Storage.

## ✅ Solução

Adicionar a **SUPABASE SERVICE_ROLE KEY** no Vercel. Esta chave tem permissões administrativas necessárias para upload.

### Como Obter a Service Role Key

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **kfkhdfnkwhljhhjcvbqp**
3. Vá em: **Settings** → **API**
4. Na seção "Project API keys", copie a **`service_role` key** (secret)
   - ⚠️ NÃO use a `anon` key (pública)
   - ✅ USE a `service_role` key (privada/secreta)

### Adicionar no Vercel

Dashboard do Vercel → Settings → Environment Variables:

```
Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtma2hkZm5rd2hsamhoamN2YnFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6... [sua service_role key]
Environment: Production ✓
```

### Alternativa: Usar Variável Existente

Se você já tem a service_role key no Vercel com outro nome (como `REACT_APP_SUPABASE_SERVICE_KEY`), posso atualizar o código para usá-la.

## 📋 Checklist

- [ ] Obter service_role key do Supabase Dashboard
- [ ] Adicionar SUPABASE_SERVICE_ROLE_KEY no Vercel
- [ ] Redeploy (automático ou manual)
- [ ] Testar novamente: `node testar-webhook-direto.js`

## 🔐 Segurança

⚠️ **NUNCA** commite a service_role key no Git!  
⚠️ Esta chave dá acesso total ao banco de dados.  
✅ Deve ficar apenas nas variáveis de ambiente do Vercel.
