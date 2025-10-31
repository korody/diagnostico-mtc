# 🚨 CHECKLIST DEPLOY EMERGENCIAL - HOTFIX calcularDiagnosticoCompleto

## ❌ PROBLEMA
- **Erro:** `calcularDiagnosticoCompleto is not a function`
- **Quando:** Ainda ocorrendo às 22:11:47 (30+ min após push)
- **Afetados:** Leads encontrados por email sem diagnóstico
- **Commit com fix:** `3d0d0c5c` (21:40)
- **Status:** Código antigo ainda em produção ⚠️

---

## ✅ AÇÕES EXECUTADAS

- [x] Hotfix criado e commitado (`3d0d0c5c`)
- [x] Push para GitHub main branch
- [x] Commit vazio criado para forçar redeploy (`336fdf6e`)
- [x] Segundo push para GitHub

---

## 📋 VERIFICAR AGORA (AÇÕES MANUAIS)

### 1. Dashboard Vercel
**URL:** https://vercel.com/korody/diagnostico-mtc/deployments

**Verificar:**
- [ ] Último deploy está em "Ready" ou "Building"?
- [ ] Há algum deploy "Failed" ou "Canceled"?
- [ ] Commit `336fdf6e` ou `3d0d0c5c` aparece na lista?

### 2. Se Deploy Falhou
**Possíveis causas:**
- Build error (erro de sintaxe)
- Timeout no build
- Problema de configuração Vercel

**Ação:** Verificar logs de build no Vercel

### 3. Se Deploy não iniciou
**Possíveis causas:**
- Webhook GitHub → Vercel não configurado
- Branch incorreta configurada (main vs master)
- Git Integration desabilitada

**Ação:** 
- [ ] Verificar Settings → Git Integration
- [ ] Verificar se branch correta está configurada
- [ ] Re-conectar repositório se necessário

### 4. Forçar Deploy Manual (se automático não funcionar)
**Passos:**
1. No Dashboard Vercel, clicar em "Deployments"
2. Clicar em "..." (três pontos) no último deploy bem-sucedido
3. Clicar em "Redeploy"
4. Selecionar "Use existing Build Cache: No"
5. Confirmar deploy

---

## 🧪 TESTAR APÓS DEPLOY

### Teste 1: Verificar versão do código
```bash
# Verificar se hotfix está ativo
curl https://SEU_DOMINIO/api/webhook/unnichat/diagnostico-unnichat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phone":"5512996624329","email":"AIKOMARINHO@GMAIL.COM"}'
```

**Resultado esperado:**
- ✅ `{"success": false, "error": "Diagnóstico não disponível"}`
- ❌ `calcularDiagnosticoCompleto is not a function` (código antigo)

### Teste 2: Lead com diagnóstico
```bash
# Testar com Edna Martins (TEM diagnóstico)
curl https://SEU_DOMINIO/api/webhook/unnichat/diagnostico-unnichat \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"phone":"5511975129828"}'
```

**Resultado esperado:**
- ✅ `{"diagnostico": "...texto do diagnóstico..."}`

---

## 🔍 VERIFICAR LOGS EM TEMPO REAL

### Opção 1: Vercel Dashboard
1. Ir para: https://vercel.com/korody/diagnostico-mtc
2. Clicar em "Logs" ou "Runtime Logs"
3. Filtrar por "diagnostico-unnichat"

### Opção 2: Vercel CLI (se instalado)
```bash
vercel logs diagnostico-mtc --follow
```

---

## 📊 INDICADORES DE SUCESSO

### Deploy bem-sucedido quando:
- [ ] Último deployment status = "Ready" ✅
- [ ] Commit hash = `336fdf6e` ou `3d0d0c5c`
- [ ] Build time < 2 minutos
- [ ] Sem erros de build nos logs
- [ ] Teste manual retorna erro 404 (não função inexistente)

### Hotfix funcionando quando:
- [ ] Leads COM diagnóstico: retornam JSON com diagnóstico
- [ ] Leads SEM diagnóstico: retornam erro 404 claro
- [ ] NUNCA mais: `calcularDiagnosticoCompleto is not a function`

---

## 🚨 SE NADA FUNCIONAR

### Opção de emergência: Deploy manual via CLI
```bash
# Instalar Vercel CLI (se não tiver)
npm install -g vercel

# Login
vercel login

# Deploy forçado
cd C:\projetos\quiz-mtc
vercel --prod --force
```

---

## 📝 PRÓXIMOS PASSOS APÓS DEPLOY

1. Monitorar logs por 15-30 minutos
2. Verificar se erros param de aparecer
3. Confirmar que leads COM diagnóstico funcionam
4. Documentar causa raiz do delay no deploy
5. Considerar alertas automáticos para falhas de deploy

---

**Criado:** 30/10/2025 22:15  
**Última atualização:** Aguardando confirmação de deploy  
**Prioridade:** 🚨 CRÍTICA
