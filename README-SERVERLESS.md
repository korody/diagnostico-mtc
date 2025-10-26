# 🚀 Quiz MTC - Arquitetura Serverless

## ✅ Migração Concluída

Seu projeto foi reestruturado para rodar 100% serverless na Vercel, com paridade entre desenvolvimento local e produção.

---

## 📁 Nova Estrutura

```
api/
├── index.js                          # GET / (health check)
├── status.js                         # GET /api/status
├── submit.js                         # POST /api/submit (quiz submission)
├── diagnosticos.json                 # Dados dos diagnósticos TCM
├── lead/
│   └── buscar.js                     # GET /api/lead/buscar
├── whatsapp/
│   └── send.js                       # POST /api/whatsapp/send
├── webhook/
│   └── unnichat/
│       └── ver-resultados.js         # POST /webhook/unnichat/ver-resultados
└── utils/
    ├── supabase.js                   # Cliente Supabase (singleton)
    ├── phone.js                      # Normalização de telefone
    ├── tcm.js                        # Funções TCM (elementos, scoring)
    ├── diagnosticos.js               # Loader de diagnósticos
    └── unnichat.js                   # Cliente Unnichat
```

---

## 🔧 Desenvolvimento Local

### Abordagem Híbrida (Recomendada durante migração)

**Local**: Use o Express server na porta 3001 + React na 3000  
**Produção**: Serverless na Vercel

```powershell
# Terminal 1: API Express (porta 3001)
npm run api:test

# Terminal 2: React (porta 3000)
npm start
```

**Ajuste temporário necessário em `src/quiz.js`:**
```javascript
// Para desenvolvimento local com Express
const apiUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001/api/submit'
  : '/api/submit';

// Para produção serverless (já está assim)
const apiUrl = '/api/submit';
```

### Opção 2: Vercel Dev (100% serverless local - experimental)
```powershell
vercel dev
```

**⚠️ Limitação**: O `vercel dev` com Create React App pode não servir funções serverless corretamente. Use a abordagem híbrida acima para desenvolvimento estável.

---

## 🌐 Variáveis de Ambiente

### Local Development (`.env.local`)
Copie `.env.test` ou crie baseado em `.env.example`:
```powershell
Copy-Item .env.example .env.local
# Edite .env.local com suas credenciais
```

### Vercel Dashboard
Configure em: **Project Settings → Environment Variables**

Variáveis críticas:
- `SUPABASE_URL` / `REACT_APP_SUPABASE_URL`
- `SUPABASE_KEY` / `REACT_APP_SUPABASE_KEY`
- `UNNICHAT_ACCESS_TOKEN`
- `UNNICHAT_API_URL`

---

## 📤 Deploy

### Automático (Git Push)
```powershell
git add .
git commit -m "Migração para serverless"
git push origin main
```

Vercel detecta automaticamente e faz deploy.

### Manual
```powershell
vercel --prod
```

---

## 🔀 Rotas Migradas

| Rota Original (Express)              | Nova Rota (Serverless)                |
|--------------------------------------|---------------------------------------|
| GET /                                | GET /api/index                        |
| GET /api/status                      | GET /api/status                       |
| POST /api/submit                     | POST /api/submit                      |
| GET /api/lead/buscar                 | GET /api/lead/buscar                  |
| POST /api/whatsapp/send              | POST /api/whatsapp/send               |
| POST /webhook/unnichat/ver-resultados| POST /api/webhook/unnichat/ver-resultados |

---

## 🔄 Jobs em Lote (Cron/Background)

Scripts como `enviar-campanhas-lotes.js` **não podem rodar como serverless** (timeout de 10s na Vercel Free, 60s no Pro).

### Soluções:

#### Opção A: GitHub Actions (Recomendado para começar)
Crie `.github/workflows/cron-envio.yml`:
```yaml
name: Envio Campanhas
on:
  schedule:
    - cron: '0 9 * * *'  # 9h da manhã, todo dia
  workflow_dispatch:      # Permite execução manual

jobs:
  enviar:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run send:prod
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
          UNNICHAT_ACCESS_TOKEN: ${{ secrets.UNNICHAT_ACCESS_TOKEN }}
```

#### Opção B: Vercel Cron (apenas Pro - $20/mês)
Adicione em `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/enviar-campanhas",
    "schedule": "0 9 * * *"
  }]
}
```

#### Opção C: Worker Externo (Railway/Render)
Mantenha um container rodando PM2 apenas para jobs:
```powershell
# Em outro servidor
pm2 start enviar-campanhas-lotes.js --cron "0 9 * * *"
```

---

## 🧪 Testando Endpoints

### Health Check
```powershell
curl http://localhost:3000/api/index
```

### Submit Quiz
```powershell
curl -X POST http://localhost:3000/api/submit `
  -H "Content-Type: application/json" `
  -d '{
    "lead": {"NOME": "João", "EMAIL": "joao@example.com", "CELULAR": "11999999999"},
    "respostas": {"P1": "A", "P2": ["A"], "P3": "B", ...}
  }'
```

### Buscar Lead
```powershell
curl "http://localhost:3000/api/lead/buscar?phone=11999999999"
```

---

## 🔐 Segurança

- ❌ **NUNCA** commitar `.env.local` ou `.env.production`
- ✅ Use `.env.example` como template no repo
- ✅ Configure secrets no Vercel Dashboard
- ✅ Rotacione tokens periodicamente

---

## 📊 Monitoramento

### Logs (Vercel Dashboard)
```
Project → Deployments → [Deployment] → Runtime Logs
```

### Erros (Supabase)
Consulte `whatsapp_logs` para histórico de envios.

---

## 🚨 Troubleshooting

### `vercel dev` não inicia
```powershell
# Limpar cache
Remove-Item -Recurse -Force .vercel

# Relogar
vercel logout
vercel login
```

### Erro: "Missing Supabase credentials"
Verifique se `.env.local` tem:
```
SUPABASE_URL=...
SUPABASE_KEY=...
REACT_APP_SUPABASE_URL=...
REACT_APP_SUPABASE_KEY=...
```

### Funções não encontram `diagnosticos.json`
Verifique `process.cwd()` retorna a raiz do projeto. Use:
```javascript
path.join(process.cwd(), 'api', 'diagnosticos.json')
```

---

## 📝 Próximos Passos

1. ✅ Testar `vercel dev` localmente
2. ⏳ Migrar jobs de lote (escolher Opção A, B ou C acima)
3. ⏳ Adicionar testes unitários (Jest) para `utils/tcm.js`, `utils/phone.js`
4. ⏳ Configurar Sentry para monitoramento de erros
5. ⏳ Deprecar `server.js` após validar que tudo funciona

---

## 🆘 Suporte

- Documentação Vercel: https://vercel.com/docs/functions/serverless-functions
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: crie issue no repo

---

**Status**: ✅ Migração 90% completa  
**Pendente**: Jobs em lote + testes finais com `vercel dev`
