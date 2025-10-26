# 📊 Dashboard MTC - Documentação

## Visão Geral

Dashboard profissional para monitoramento diário de leads e conversões do sistema de diagnóstico MTC.

## 🚀 Acesso

### Produção
- **URL:** https://quiz.qigongbrasil.com/dashboard
- **Senha:** `persona2025` (senha única para toda equipe)

### Desenvolvimento Local
```bash
# 1. Iniciar servidor API
npm run api:test

# 2. Acessar dashboard
http://localhost:3001/dashboard.html

# 3. Testar APIs
node test-dashboard.js
```

## 📈 Métricas Disponíveis

### 1. Totais de Leads
- Hoje, 3 dias, semana, mês, all-time
- Total absoluto com evolução temporal

### 2. Taxa de Conversão do Quiz
- Cadastrados vs. Completaram diagnóstico
- Percentual e números absolutos

### 3. Distribuição por Status WhatsApp
- Gráfico de pizza interativo
- Contagem por status (resultados_enviados, desafio_enviado, etc.)

### 4. Distribuição por Elemento MTC
- Gráfico de barras
- Qual elemento mais comum (%, números absolutos)

### 5. Lead Score
- Score médio
- Distribuição (baixo, médio, alto)
- Total de leads VIP

### 6. Taxa de Sucesso de Envios
- Enviados vs. Falhas
- Percentual de sucesso
- Total de tentativas

### 7. Leads por Prioridade
- Alta, Média, Baixa, Sem Prioridade
- Visualização em cards coloridos

### 8. Evolução Temporal
- Gráfico de linha (leads/dia)
- Últimos 30 dias

### 9. Funil Completo
- Quiz → Diagnóstico → WhatsApp → Desafio
- Gráfico de funil horizontal
- Taxa de conversão em cada etapa

## 🎯 Conversões Principais (Métricas de Negócio)

### Implementadas
1. **Quiz → Diagnóstico:** Percentual de pessoas que completaram o diagnóstico
2. **Diagnóstico → WhatsApp:** Percentual que recebeu mensagem inicial
3. **WhatsApp → Desafio:** Percentual que recebeu convite para desafio

### Em Desenvolvimento (integração futura)
4. **Inscritos → Quiz:** Dados do ActiveCampaign
5. **Cadastro → Grupos:** Dados da API Unnichat
6. **Conversão Final:** Página de captura → Grupos

## 🔔 Sistema de Alertas

### Alertas Automáticos
- **Lead VIP:** Notificação quando novo lead VIP entra (últimas 24h)
- **Taxa de Falha > 10%:** Alerta crítico se taxa de falha passar do limite
- **Resumo Diário:** Email automático às 18h (21h UTC)

### Configuração
```env
# Slack Webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Cron Secret (para segurança)
CRON_SECRET=seu-secret-aqui

# Senha do Dashboard
DASHBOARD_PASSWORD=persona2025
```

## 🔧 Recursos Técnicos

### Auto-Refresh
- Atualização automática a cada 5 minutos
- Botão manual de refresh disponível

### Exportação de Dados
- Botão "Exportar CSV"
- Baixa métricas principais em formato CSV
- Nome do arquivo: `dashboard-mtc-YYYY-MM-DD.csv`

### Filtros (em desenvolvimento)
- Por data
- Por elemento MTC
- Por quadrante de marketing
- Por leads mais quentes (VIP)

### Gráficos Interativos
- Chart.js para visualizações profissionais
- Hover para detalhes
- Responsivo (mobile-friendly)

## 📡 APIs Backend

### GET/POST /api/dashboard/metrics
Retorna todas as métricas do dashboard.

**Resposta:**
```json
{
  "success": true,
  "metricas": {
    "timestamp": "2025-10-26T...",
    "totais_leads": { "hoje": 5, "semana": 23, ... },
    "distribuicao_status_whatsapp": { "resultados_enviados": 150, ... },
    "distribuicao_elemento_mtc": { "MADEIRA": { "count": 45, "percentage": "22.5" }, ... },
    "lead_score": { "media": 72.3, "vips": 12, ... },
    "sucesso_envios": { "taxa_sucesso": 94.2, "total_envios": 380, ... },
    "distribuicao_prioridade": { "alta": 45, "media": 120, ... },
    "evolucao_temporal": [{ "data": "2025-10-01", "leads": 8 }, ...],
    "funil": { "total_quiz_completado": 200, ... },
    "conversoes_principais": { "conversao_cadastro_diagnostico": "100.0", ... }
  }
}
```

### GET/POST /api/dashboard/alerts
Retorna alertas ativos e dados para notificações.

**Resposta:**
```json
{
  "success": true,
  "alertas": {
    "timestamp": "2025-10-26T...",
    "vips_recentes": { "count": 2, "leads": [...] },
    "taxa_falha": { "taxa_falha": 5.2, "acima_limite": false },
    "resumo_diario": { "total_leads": 12, ... },
    "alertas_ativos": [
      {
        "tipo": "VIP",
        "severidade": "alta",
        "mensagem": "2 lead(s) VIP nas últimas 24h"
      }
    ]
  }
}
```

### GET /api/cron/daily-summary
Endpoint para cron job (protegido por CRON_SECRET).

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

## 🔐 Autenticação

### Sistema Atual
- Senha única compartilhada (`persona2025`)
- Armazenada no localStorage do browser
- Logout limpa o localStorage

### Upgrade Futuro (se necessário)
- Sistema de usuários individuais
- JWT tokens
- Roles (admin, viewer, etc.)
- Audit log de acessos

## 🚢 Deploy

### Vercel (Automático)
```bash
# 1. Fazer commit das mudanças
git add .
git commit -m "Add dashboard profissional"
git push origin main

# 2. Vercel faz deploy automático
# 3. Acessar: https://quiz.qigongbrasil.com/dashboard
```

### Variáveis de Ambiente (Vercel)
Configurar no painel da Vercel:
- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_KEY`
- `SLACK_WEBHOOK_URL`
- `CRON_SECRET`
- `DASHBOARD_PASSWORD` (opcional)

### Configurar Cron no Vercel
O cron já está configurado em `vercel.json`:
```json
"crons": [{
  "path": "/api/cron/daily-summary",
  "schedule": "0 21 * * *"
}]
```

Isso enviará o resumo diário às 21h UTC (18h Brasília).

## 📧 Integração com Slack

### Configuração
1. Acesse: https://api.slack.com/messaging/webhooks
2. Crie um Incoming Webhook
3. Escolha o canal (ex: `#dashboard-alerts`)
4. Copie a URL do webhook
5. Adicione ao `.env.production`:
   ```env
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
   ```

### Tipos de Notificação
- 🔥 **Lead VIP:** Alerta vermelho quando lead VIP entra
- ⚠️ **Taxa de Falha:** Alerta laranja se falhas > 10%
- 📊 **Resumo Diário:** Verde, enviado automaticamente às 18h

## 🐛 Troubleshooting

### Dashboard não carrega
1. Verificar se APIs estão respondendo:
   ```bash
   curl https://quiz.qigongbrasil.com/api/dashboard/metrics
   ```
2. Verificar console do browser (F12)
3. Testar localmente: `npm run api:test`

### Gráficos não aparecem
1. Verificar se Chart.js está carregando (console do browser)
2. Verificar dados retornados pelas APIs
3. Limpar cache do browser (Ctrl+Shift+R)

### Cron não está enviando
1. Verificar logs do Vercel
2. Confirmar `CRON_SECRET` está configurado
3. Testar endpoint manualmente:
   ```bash
   curl -H "Authorization: Bearer SEU_CRON_SECRET" \
        https://quiz.qigongbrasil.com/api/cron/daily-summary
   ```

### Senha não funciona
1. Senha padrão: `persona2025`
2. Verificar `DASHBOARD_PASSWORD` no `.env` (se configurado)
3. Limpar localStorage: `localStorage.clear()` no console

## 📝 Roadmap

### Próximas Implementações
- [ ] Integração com ActiveCampaign (total de inscritos)
- [ ] Integração com Unnichat (dados de grupos)
- [ ] Filtros avançados (data, elemento, quadrante)
- [ ] Download de relatório PDF
- [ ] Comparação entre períodos
- [ ] Mapa de calor de horários/dias com mais leads
- [ ] Predição de conversão com ML
- [ ] Sistema de usuários individuais
- [ ] Dashboard mobile (PWA)

## 🤝 Suporte

Para dúvidas ou problemas:
1. Verificar esta documentação
2. Consultar logs do Vercel
3. Testar localmente com `test-dashboard.js`
4. Contatar: equipe@persona.cx

---

**Versão:** 1.0.0  
**Última Atualização:** 26/10/2025  
**Desenvolvido por:** Persona.cx com ❤️
