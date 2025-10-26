# 🚀 GUIA RÁPIDO DE SETUP DO DASHBOARD

## ✅ O que foi criado:

### Backend APIs:
1. **`api/dashboard/metrics.js`** - Todas as métricas (totais, conversões, distribuições, evolução temporal)
2. **`api/dashboard/alerts.js`** - Sistema de alertas (VIPs, falhas, resumo diário)
3. **`api/utils/notifications.js`** - Serviço de notificações Slack
4. **`api/cron/daily-summary.js`** - Cron job para resumo diário às 18h

### Frontend:
5. **`public/dashboard.html`** - Dashboard React profissional com:
   - Login com senha única
   - Gráficos interativos (Chart.js)
   - Auto-refresh a cada 5min
   - Export CSV
   - Todos os KPIs solicitados

### Configuração:
6. **`vercel.json`** - Atualizado com rotas do dashboard e cron job
7. **`server.js`** - Rotas do dashboard adicionadas para teste local
8. **`test-dashboard.js`** - Script de testes
9. **`DASHBOARD-README.md`** - Documentação completa

---

## 🔧 SETUP RÁPIDO (5 minutos):

### Passo 1: Testar Localmente (Opcional)
```bash
# Se você tem .env.local configurado:
npm run api:test

# Em outro terminal:
node test-dashboard.js

# Acessar: http://localhost:3001/dashboard.html
# Senha: persona2025
```

### Passo 2: Deploy para Produção
```bash
# Fazer commit
git add .
git commit -m "Add dashboard profissional MTC"
git push origin main

# Vercel faz deploy automático
# Acessar: https://quiz.qigongbrasil.com/dashboard
```

### Passo 3: Configurar Slack (Opcional)
1. Acesse: https://api.slack.com/messaging/webhooks
2. Crie webhook no canal `#dashboard-alerts`
3. No painel da Vercel, adicione variável:
   ```
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX
   ```
4. Adicione também:
   ```
   CRON_SECRET=um-secret-aleatorio-seguro
   ```

---

## 📊 MÉTRICAS IMPLEMENTADAS:

### ✅ Principais (solicitadas):
- ✅ Conversão Cadastro → Diagnóstico (100% - todos no Supabase completaram)
- ✅ Conversão Diagnóstico → WhatsApp (% de quem recebeu msg inicial)
- ✅ Conversão WhatsApp → Desafio (% de quem recebeu convite)
- ⚠️ Conversão Inscritos → Cadastro (precisa ActiveCampaign - placeholder criado)
- ⚠️ Conversão Grupos (precisa API Unnichat - placeholder criado)

### ✅ Adicionais:
- Total de leads (hoje/3dias/semana/mês/all-time)
- Taxa de conversão quiz
- Distribuição status WhatsApp (gráfico pizza)
- Distribuição elementos MTC (gráfico barras + %)
- Lead score médio + VIPs
- Taxa de sucesso envios
- Leads por prioridade
- Evolução temporal (30 dias)
- Funil completo

### 🚨 Alertas:
- Novo lead VIP (últimas 24h)
- Taxa de falha > 10%
- Resumo diário automático às 18h (Slack)

---

## 🎨 RECURSOS DO DASHBOARD:

### Interface:
- ✅ Design moderno com gradiente roxo
- ✅ Cards interativos com hover
- ✅ 4 gráficos profissionais (pizza, barras, linha, funil)
- ✅ Responsivo (mobile-friendly)
- ✅ Login com senha única

### Funcionalidades:
- ✅ Auto-refresh a cada 5 minutos
- ✅ Botão manual de refresh
- ✅ Export CSV
- ✅ Alertas visuais
- ✅ Timestamp de última atualização
- ⏳ Filtros (estrutura pronta para adicionar)

---

## 🔐 ACESSO:

### Produção:
- **URL:** https://quiz.qigongbrasil.com/dashboard
- **Senha:** `persona2025`

### Mudar senha:
Edite em `public/dashboard.html` na linha ~23:
```javascript
const senhaCorreta = 'persona2025'; // Mudar aqui
```

Ou configure variável de ambiente `DASHBOARD_PASSWORD` (requer modificação no código).

---

## 📝 PRÓXIMOS PASSOS (Futuro):

### Integrações Pendentes:
1. **ActiveCampaign API**
   - Total de inscritos na página
   - Conversão página → cadastro
   - Endpoint: `api/integrations/activecampaign.js`

2. **Unnichat API - Grupos**
   - Quantos entraram nos grupos
   - Conversão cadastro → grupos
   - Endpoint: `api/integrations/unnichat-groups.js`

### Melhorias Futuras:
- [ ] Filtros por data/elemento/quadrante
- [ ] Download relatório PDF
- [ ] Comparação entre períodos
- [ ] Mapa de calor (horários/dias)
- [ ] Sistema multi-usuário
- [ ] PWA (app mobile)

---

## ⚡ TROUBLESHOOTING:

### Dashboard não carrega:
```bash
# Testar API:
curl https://quiz.qigongbrasil.com/api/dashboard/metrics

# Verificar logs Vercel:
# https://vercel.com/seu-projeto/logs
```

### Gráficos não aparecem:
1. F12 → Console (verificar erros JavaScript)
2. Limpar cache: Ctrl+Shift+R
3. Verificar se Chart.js carregou

### Cron não envia:
```bash
# Testar manualmente:
curl -H "Authorization: Bearer SEU_CRON_SECRET" \
     https://quiz.qigongbrasil.com/api/cron/daily-summary
```

---

## 📞 CONTATO:

Dúvidas ou problemas? equipe@persona.cx

---

**Status:** ✅ Pronto para deploy  
**Tempo estimado para produção:** 2-5 minutos  
**Documentação completa:** `DASHBOARD-README.md`
