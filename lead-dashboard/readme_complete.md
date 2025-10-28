# 🎯 Dashboard Administrativo - Quiz MTC

Dashboard profissional para gestão e análise de leads do **Quiz de Medicina Tradicional Chinesa** (MTC) do Mestre Ye.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-success?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [API Routes](#-api-routes)
- [Deploy](#-deploy)
- [Manutenção](#-manutenção)

---

## 🎯 Visão Geral

O Dashboard MTC é uma aplicação web completa para gerenciamento estratégico de leads capturados pelo quiz em produção em https://quiz.qigongbrasil.com.

### Principais Recursos:

- 📊 **Dashboard com Métricas em Tempo Real** - Visão geral de todos os KPIs
- 👥 **Gestão Completa de Leads** - Tabela interativa com filtros avançados
- 🌊 **Análise por Elementos MTC** - 5 elementos (Água, Madeira, Terra, Fogo, Metal)
- 🎯 **Sistema de Lead Scoring** - Priorização automática (ALTA, MÉDIA, BAIXA)
- 📈 **Funil de Vendas** - Acompanhamento de conversão
- 📄 **Exportação CSV/PDF** - Relatórios profissionais
- 🔍 **Busca e Filtros Avançados** - Múltiplos critérios simultâneos
- 📱 **Interface Responsiva** - Design moderno e intuitivo

---

## ✨ Funcionalidades

### 1. Dashboard Home (Visão Geral)

**Métricas Principais:**
- Total de Leads
- Hot Leads VIP (Score ≥ 80)
- Lead Score Médio
- Taxa de Resposta WhatsApp
- Leads Hoje / Semana / Mês

**Gráficos:**
- Leads por dia (últimos 7 dias)
- Distribuição por Prioridade
- Distribuição por Elemento MTC
- Matriz de Quadrantes (Urgência × Intensidade)

### 2. Gestão de Leads

**Tabela Interativa:**
- ✅ Filtros: Elemento, Prioridade, Quadrante, Status, Score
- ✅ Busca global (nome, email, celular)
- ✅ Ordenação por qualquer coluna
- ✅ Paginação
- ✅ Exportação CSV/Excel
- ✅ Ações: Ver detalhes, WhatsApp, Editar

**Modal de Detalhes:**
- Dados pessoais completos
- Diagnóstico MTC detalhado
- Todas as 13 respostas do quiz
- Script de abertura WhatsApp
- Botão copiar + abrir WhatsApp

### 3. Análise por Elemento MTC

Para cada elemento (RIM, FÍGADO, BAÇO, CORAÇÃO, PULMÃO):
- Total de leads
- Score médio
- Taxa de hot leads
- Perfil demográfico
- Taxa de conversão

### 4. Exportação e Relatórios

**Formatos Disponíveis:**
- 📄 **CSV** - Todos os leads com filtros aplicados
- 📋 **PDF Individual** - Ficha completa do lead
- 📊 **Relatório Executivo** - Análise gerencial completa

---

## 🛠️ Stack Tecnológica

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** React 18+
- **Styling:** Tailwind CSS 3.4+
- **Components:** shadcn/ui + Radix UI
- **Charts:** Recharts 2.10+
- **Tables:** TanStack Table v8
- **Icons:** Lucide React

### Backend/Database
- **Database:** Supabase (PostgreSQL)
- **API:** Next.js API Routes (Serverless)
- **ORM:** Supabase Client SDK

### Utilities
- **Forms:** React Hook Form + Zod
- **Dates:** date-fns 3.0+
- **Export:** Papaparse (CSV), jsPDF (PDF)
- **TypeScript:** 5.3+

### Deploy
- **Hosting:** Vercel
- **Domínio:** dashboard.qigongbrasil.com (sugerido)

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ ou 20+
- npm ou yarn
- Conta no Supabase (já configurada)
- Git

### Passo 1: Clone o Repositório

```bash
git clone https://github.com/seu-usuario/dashboard-mtc.git
cd dashboard-mtc
```

### Passo 2: Instale as Dependências

```bash
npm install
```

**Dependências principais instaladas:**
```bash
# Core
npm install next@latest react@latest react-dom@latest

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI Components (shadcn/ui + Radix)
npm install @radix-ui/react-avatar @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu @radix-ui/react-label
npm install @radix-ui/react-select @radix-ui/react-slot @radix-ui/react-tabs

# Tables & Charts
npm install @tanstack/react-table recharts

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Utilities
npm install date-fns lucide-react
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate

# Export
npm install papaparse jspdf jspdf-autotable

# Dev Dependencies
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D @types/papaparse tailwindcss postcss autoprefixer
```

### Passo 3: Inicialize shadcn/ui

```bash
npx shadcn-ui@latest init
```

Selecione as opções:
- ✅ TypeScript: Yes
- ✅ Style: Default
- ✅ Base color: Slate
- ✅ CSS variables: Yes

### Passo 4: Adicione Componentes shadcn/ui

```bash
npx shadcn-ui@latest add button card badge table dialog select input label avatar tabs
```

---

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase (use as credenciais do projeto Quiz MTC existente)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_aqui

# NextAuth (opcional - se implementar autenticação)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=gere_um_secret_seguro_aqui

# Ambiente
NODE_ENV=development
```

**⚠️ IMPORTANTE:** Use as **mesmas credenciais** do projeto Quiz em produção para acessar o banco `quiz_leads`.

### 2. Configuração do Supabase

A tabela `quiz_leads` já deve existir no banco. Estrutura esperada:

```sql
CREATE TABLE quiz_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  celular TEXT UNIQUE NOT NULL,
  respostas JSONB NOT NULL,
  elemento_principal TEXT,
  lead_score INT4,
  prioridade TEXT,
  quadrante INT4,
  is_hot_lead_vip BOOLEAN,
  whatsapp_status TEXT DEFAULT 'AGUARDANDO_CONTATO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Políticas de Segurança (RLS):**
- Certifique-se de que o usuário tem permissões de leitura/escrita
- Configure Row Level Security conforme necessário

---

## 🚀 Uso

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Abrir em http://localhost:3000
```

### Build para Produção

```bash
# Criar build otimizado
npm run build

# Testar build localmente
npm start
```

### Comandos Úteis

```bash
# Type checking
npm run type-check

# Lint
npm run lint

# Limpar cache
rm -rf .next node_modules
npm install
```

---

## 📁 Estrutura do Projeto

```
dashboard-mtc/
├── src/
│   ├── app/                      # App Router (Next.js 14+)
│   │   ├── layout.tsx            # Layout raiz
│   │   ├── page.tsx              # Dashboard Home
│   │   ├── globals.css           # Estilos globais
│   │   │
│   │   ├── (dashboard)/          # Rotas autenticadas
│   │   │   ├── leads/
│   │   │   │   ├── page.tsx      # Lista de leads
│   │   │   │   └── [id]/page.tsx # Detalhes do lead
│   │   │   ├── elementos/
│   │   │   ├── respostas/
│   │   │   ├── funil/
│   │   │   └── relatorios/
│   │   │
│   │   └── api/                  # API Routes
│   │       ├── leads/route.ts
│   │       ├── stats/route.ts
│   │       └── export/
│   │
│   ├── components/               # Componentes React
│   │   ├── ui/                   # shadcn/ui
│   │   ├── dashboard/            # Componentes específicos
│   │   ├── leads/
│   │   └── charts/
│   │
│   ├── lib/                      # Utilitários
│   │   ├── supabase.ts          # Cliente Supabase
│   │   ├── utils.ts             # Helpers
│   │   └── constants.ts         # Constantes
│   │
│   ├── hooks/                    # Custom Hooks
│   │   ├── useLeads.ts
│   │   ├── useStats.ts
│   │   └── useExport.ts
│   │
│   ├── services/                 # Lógica de negócio
│   │   ├── leadService.ts
│   │   ├── statsService.ts
│   │   └── exportService.ts
│   │
│   └── types/                    # TypeScript Types
│       ├── database.types.ts
│       └── lead.types.ts
│
├── public/                       # Assets estáticos
├── .env.local                    # Variáveis de ambiente
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 🔌 API Routes

### GET `/api/leads`

Busca leads com filtros e paginação.

**Query Params:**
```
?search=maria
&elemento=RIM
&prioridade=ALTA
&quadrante=1
&status=AGUARDANDO_CONTATO
&hotLead=true
&page=1
&limit=50
```

**Response:**
```json
{
  "leads": [...],
  "total": 342,
  "page": 1,
  "limit": 50,
  "totalPages": 7
}
```

### GET `/api/leads/[id]`

Busca lead por ID.

### PATCH `/api/leads/[id]`

Atualiza lead.

**Body:**
```json
{
  "whatsapp_status": "CONTATADO",
  "prioridade": "ALTA"
}
```

### GET `/api/stats`

Busca todas as estatísticas do dashboard.

**Response:**
```json
{
  "totalLeads": 342,
  "hotLeadsVip": 47,
  "leadScoreMedio": 62,
  "leadsHoje": 12,
  "leadsSemana": 87,
  "leadsMes": 342,
  "elementosDistribuicao": [...],
  "prioridadeDistribuicao": [...],
  "quadrantesDistribuicao": [...],
  "leadsPorDia": [...]
}
```

### POST `/api/export/csv`

Exporta leads para CSV.

**Body:**
```json
{
  "filters": {
    "prioridade": "ALTA"
  }
}
```

---

## 🚀 Deploy

### Deploy na Vercel (Recomendado)

1. **Conecte o repositório:**
   ```bash
   vercel login
   vercel
   ```

2. **Configure as variáveis de ambiente:**
   - No dashboard da Vercel, adicione as variáveis do `.env.local`

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Configure o domínio customizado:**
   - dashboard.qigongbrasil.com
   - Adicione registro CNAME no DNS

### Variáveis de Ambiente na Vercel

```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 🔧 Manutenção

### Atualizar Dependências

```bash
# Verificar atualizações
npm outdated

# Atualizar tudo
npm update

# Atualizar Next.js
npm install next@latest
```

### Backup do Banco

```bash
# Via Supabase Dashboard
# Settings > Database > Backup
```

### Monitoramento

- **Logs:** Vercel Dashboard > Project > Logs
- **Performance:** Vercel Analytics
- **Errors:** Sentry (recomendado para produção)

### Troubleshooting

**Erro: "Cannot find module '@/...'**
- Verifique `tsconfig.json` → `paths`

**Erro de conexão Supabase:**
- Verifique as credenciais em `.env.local`
- Confirme que a URL termina com `.supabase.co`

**Build falha:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 👥 Equipe

- **Desenvolvedor:** [Seu Nome]
- **Cliente:** Mestre Ye - Qigong Brasil
- **Suporte:** suporte@qigongbrasil.com

---

## 📄 Licença

Propriedade de **Qigong Brasil** - Todos os direitos reservados.

---

## 🆘 Suporte

Para dúvidas ou problemas:

1. Consulte a [documentação](https://nextjs.org/docs)
2. Abra uma issue no repositório
3. Contate: dev@qigongbrasil.com

---

**Desenvolvido com ❤️ para o Mestre Ye e Qigong Brasil** 🌊🌳🌍🔥💨