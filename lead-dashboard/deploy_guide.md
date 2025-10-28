# 🚀 Guia de Deploy - Dashboard MTC

**Checklist completo para colocar o dashboard em produção**

---

## 📋 Pré-requisitos

Antes de começar o deploy, certifique-se de ter:

- ✅ Conta na Vercel (grátis)
- ✅ Repositório Git configurado (GitHub, GitLab ou Bitbucket)
- ✅ Projeto Next.js funcionando localmente
- ✅ Credenciais do Supabase (URL + Anon Key)
- ✅ Domínio configurado (dashboard.qigongbrasil.com)

---

## 🔧 Fase 1: Preparação do Código

### 1.1 Verificar Ambiente Local

```bash
# Limpar e reinstalar dependências
rm -rf node_modules .next
npm install

# Verificar types
npm run type-check

# Testar build
npm run build

# Testar produção localmente
npm start
```

**✅ Checklist:**
- [ ] Build completa sem erros
- [ ] Tipos TypeScript corretos
- [ ] Todas as páginas carregam
- [ ] Integração Supabase funcionando

### 1.2 Configurar .gitignore

Verifique se `.gitignore` contém:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Next.js
.next/
out/
build/
dist/

# Production
.vercel

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel
```

### 1.3 Atualizar package.json

Certifique-se de que os scripts estão corretos:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### 1.4 Commit Final

```bash
# Adicionar todos os arquivos
git add .

# Commit
git commit -m "feat: dashboard MTC pronto para produção"

# Push para repositório
git push origin main
```

---

## 🌐 Fase 2: Deploy na Vercel

### 2.1 Criar Conta/Projeto na Vercel

1. Acesse https://vercel.com
2. Faça login (recomendado usar conta GitHub)
3. Click em "Add New Project"
4. Importe o repositório do dashboard

### 2.2 Configurar Projeto

**Na tela de configuração:**

```
Project Name: dashboard-mtc
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 2.3 Configurar Variáveis de Ambiente

No painel da Vercel, vá em **Settings → Environment Variables**

Adicione:

```env
# Supabase (IMPORTANTE: usar as mesmas do quiz em produção)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_key_aqui

# Node Environment
NODE_ENV=production

# NextAuth (se implementado)
NEXTAUTH_URL=https://dashboard.qigongbrasil.com
NEXTAUTH_SECRET=seu_secret_super_seguro_aqui
```

**⚠️ CRÍTICO:**
- Use `NEXT_PUBLIC_` apenas para variáveis que devem ser expostas no client
- Nunca exponha secrets ou service keys no client
- Gere NEXTAUTH_SECRET com: `openssl rand -base64 32`

### 2.4 Deploy

```bash
# Opção 1: Via Dashboard Vercel
Click em "Deploy"

# Opção 2: Via CLI
npm install -g vercel
vercel login
vercel --prod
```

**Processo de Deploy:**
1. ⏳ Building... (2-3 minutos)
2. ✅ Build concluída
3. 🚀 Deploy em produção
4. 🔗 URL gerada: https://dashboard-mtc-xxx.vercel.app

---

## 🌍 Fase 3: Configurar Domínio Customizado

### 3.1 Adicionar Domínio na Vercel

1. Vercel Dashboard → Project → Settings → Domains
2. Click em "Add"
3. Digite: `dashboard.qigongbrasil.com`
4. Click em "Add"

### 3.2 Configurar DNS

**No seu provedor de DNS (ex: Registro.br, Cloudflare):**

Adicione registro CNAME:

```
Type: CNAME
Name: dashboard
Value: cname.vercel-dns.com
TTL: Auto (ou 3600)
```

**Exemplo para subdomain:**
```
dashboard.qigongbrasil.com → cname.vercel-dns.com
```

### 3.3 Aguardar Propagação

- ⏱️ Pode levar de 5 minutos a 48 horas
- Verifique em: https://dnschecker.org
- Vercel configura SSL automaticamente (Let's Encrypt)

### 3.4 Atualizar NEXTAUTH_URL (se aplicável)

Volte em **Environment Variables** e atualize:

```env
NEXTAUTH_URL=https://dashboard.qigongbrasil.com
```

Redeploy:
```bash
vercel --prod
```

---

## 🔒 Fase 4: Segurança e Otimização

### 4.1 Configurar Headers de Segurança

Adicione em `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### 4.2 Configurar Row Level Security (RLS) no Supabase

**⚠️ IMPORTANTE para produção:**

```sql
-- Habilitar RLS na tabela
ALTER TABLE quiz_leads ENABLE ROW LEVEL SECURITY;

-- Política de leitura (todos autenticados)
CREATE POLICY "Permitir leitura para autenticados" ON quiz_leads
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Política de atualização (apenas admins)
CREATE POLICY "Permitir update para admins" ON quiz_leads
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');
```

### 4.3 Configurar Rate Limiting (Opcional)

Instale:
```bash
npm install @upstash/ratelimit @upstash/redis
```

Configure em `middleware.ts`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export default async function middleware(request: NextRequest) {
  const ip = request.ip ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response("Too Many Requests", { status: 429 });
  }
  
  return NextResponse.next();
}
```

---

## 📊 Fase 5: Monitoramento

### 5.1 Configurar Vercel Analytics

1. Vercel Dashboard → Project → Analytics
2. Enable Analytics
3. Visualize métricas em tempo real

**Métricas disponíveis:**
- Page Views
- Visitors
- Performance (Core Web Vitals)
- Top Pages

### 5.2 Configurar Logs

**Visualizar logs em produção:**

```bash
# Via CLI
vercel logs dashboard-mtc --prod

# Ou no dashboard
Vercel → Project → Logs
```

### 5.3 Configurar Alertas (Opcional)

**Integração com Slack/Discord:**

1. Vercel → Integrations
2. Escolha Slack ou Discord
3. Configure webhooks para:
   - Deploy success/fail
   - Errors em produção
   - Performance issues

---

## ✅ Fase 6: Checklist Final

### Funcionalidades

- [ ] Dashboard Home carrega corretamente
- [ ] Métricas aparecem (total de leads, VIP, etc)
- [ ] Gráficos renderizam
- [ ] Tabela de leads funciona
- [ ] Filtros aplicam corretamente
- [ ] Busca funciona
- [ ] Modal de detalhes abre
- [ ] Botão WhatsApp funciona
- [ ] Exportação CSV funciona
- [ ] Exportação PDF funciona
- [ ] Sidebar navega entre páginas

### Performance

- [ ] Lighthouse Score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Time to Interactive < 3.8s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Imagens otimizadas
- [ ] Fonts carregam rápido

### Segurança

- [ ] HTTPS ativo (SSL)
- [ ] Environment variables configuradas
- [ ] RLS habilitado no Supabase
- [ ] Headers de segurança configurados
- [ ] Nenhuma credencial no código
- [ ] .env.local no .gitignore

### Compatibilidade

- [ ] Chrome (últimas 2 versões)
- [ ] Firefox (últimas 2 versões)
- [ ] Safari (últimas 2 versões)
- [ ] Edge (últimas 2 versões)
- [ ] Mobile (iOS Safari, Chrome Mobile)

### Dados

- [ ] Conecta ao banco correto
- [ ] Queries retornam dados
- [ ] Filtros funcionam
- [ ] Updates salvam
- [ ] Sem erros no console

---

## 🎉 Fase 7: Go Live!

### 7.1 Anúncio para Equipe

**Email modelo:**

```
Assunto: 🚀 Dashboard MTC está no ar!

Olá equipe,

O novo Dashboard Administrativo do Quiz MTC está oficialmente 
em produção! 🎉

🔗 Acesse: https://dashboard.qigongbrasil.com

📚 Documentação: [link do guia de uso]

🆘 Suporte: suporte@qigongbrasil.com

Principais funcionalidades:
✅ Visualização de todos os leads em tempo real
✅ Filtros avançados por elemento, score, prioridade
✅ Scripts personalizados de WhatsApp
✅ Exportação de relatórios

Qualquer dúvida, estou à disposição!

Boas vendas! 🌊🌳🌍🔥💨
```

### 7.2 Treinamento da Equipe

**Agende:**
- 📅 Sessão de 1h para apresentação
- 🎥 Grave vídeo tutorial
- 📝 Compartilhe o Guia de Uso
- 💬 Crie grupo de suporte

### 7.3 Monitoramento Pós-Launch

**Primeiras 48h:**
- ✅ Verifique logs a cada 2 horas
- ✅ Monitore performance (Vercel Analytics)
- ✅ Colete feedback da equipe
- ✅ Corrija bugs críticos imediatamente

**Primeira semana:**
- ✅ Análise diária de uso
- ✅ Ajustes baseados em feedback
- ✅ Otimizações de performance
- ✅ Documentação de issues

---

## 🔄 Atualizações Futuras

### Processo de Deploy de Updates

```bash
# 1. Desenvolva localmente
git checkout -b feature/nova-funcionalidade

# 2. Teste
npm run build
npm start

# 3. Commit e push
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade

# 4. Pull Request → main

# 5. Vercel faz auto-deploy ao merge
```

### Rollback (se necessário)

**Via Dashboard Vercel:**
1. Deployments → Histórico
2. Selecione versão anterior
3. Click "Promote to Production"

**Via CLI:**
```bash
vercel rollback
```

---

## 📞 Suporte Pós-Deploy

### Problemas Comuns

**1. "Failed to load"**
- Verifique variáveis de ambiente
- Confirme URL do Supabase

**2. "Build failed"**
- Veja logs: `vercel logs --prod`
- Verifique erros TypeScript

**3. "502 Bad Gateway"**
- Problema temporário da Vercel
- Aguarde 5 min ou contate suporte

**4. Dados não aparecem**
- Verifique conexão Supabase
- Confirme permissões RLS
- Teste queries direto no Supabase

### Contatos de Emergência

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **Dev Team:** dev@qigongbrasil.com

---

## 🎯 Métricas de Sucesso

**Após 1 mês em produção, avalie:**

✅ **Adoção:** 90%+ da equipe usa diariamente  
✅ **Performance:** < 2s de carregamento  
✅ **Estabilidade:** 99.9% uptime  
✅ **Conversão:** Aumento de 20%+ em vendas  
✅ **Satisfação:** NPS > 8/10  

---

**Dashboard em produção! Parabéns pelo deploy! 🚀🎉**