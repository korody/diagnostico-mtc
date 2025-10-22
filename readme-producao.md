# 🚀 Quiz MTC - Guia de Produção

## 📋 Pré-requisitos

- Node.js instalado
- Credenciais do Supabase (produção)
- Token do Unnichat
- Template WhatsApp aprovado pelo Meta

## 🔧 Configuração

### 1. Variáveis de Ambiente

Certifique-se que `.env.production` está configurado com:
```bash
NODE_ENV=production
SUPABASE_URL=sua-url-producao
SUPABASE_KEY=sua-key-producao
UNNICHAT_ACCESS_TOKEN=seu-token
UNNICHAT_GATILHO_URL=url-do-gatilho-producao
```

### 2. Testar localmente em modo produção
```bash
npm run api:prod
```

## 📱 Comandos Disponíveis

### Ambiente de TESTE:
```bash
npm run api:test          # Rodar API em teste
npm run verify:test       # Verificar leads de teste
npm run template:test     # Enviar template teste
npm run send:test         # Campanha em massa teste
```

### Ambiente de PRODUÇÃO:
```bash
npm run api:prod          # Rodar API em produção
npm run verify:prod       # Verificar leads de produção
npm run template:prod     # Enviar template produção
npm run send:prod         # Campanha em massa produção
```

## 🌐 Deploy

### Opção 1: Railway
1. Conecte seu repositório
2. Configure variáveis de ambiente
3. Deploy automático

### Opção 2: Vercel
1. `npm install -g vercel`
2. `vercel --prod`
3. Configure env vars no painel

### Opção 3: DigitalOcean
1. Crie um App
2. Conecte GitHub
3. Configure variáveis
4. Deploy

## ⚠️ Checklist Pré-Produção

- [ ] `.env.production` configurado
- [ ] Template aprovado pelo Meta
- [ ] Automação ativa no Unnichat
- [ ] Domínio configurado (sem ngrok)
- [ ] Webhook testado em produção
- [ ] Banco de dados de produção criado
- [ ] Teste end-to-end realizado

## 🐛 Troubleshooting

### API não inicia
```bash
# Verificar variáveis
NODE_ENV=production node -e "console.log(process.env)"
```

### Leads não recebem template
```bash
# Verificar status
npm run verify:prod
```

### Webhook não responde
- Verificar se URL está correta no Unnichat
- Verificar logs: `pm2 logs` ou no painel de hosting

## 📊 Monitoramento

### Logs em produção:
```bash
pm2 logs quiz-mtc
```

### Status dos leads:
```bash
npm run verify:prod
```

## 🔐 Segurança

- Nunca commitar arquivos `.env`
- Usar variáveis de ambiente no servidor
- Implementar rate limiting
- Configurar CORS adequadamente

## 📞 Suporte

Para problemas ou dúvidas, consulte a documentação do:
- Supabase: https://supabase.com/docs
- Unnichat: suporte do Unnichat