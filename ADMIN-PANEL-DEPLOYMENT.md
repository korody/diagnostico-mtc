# 🚀 Guia de Deploy - Painel de Admin Quiz MTC

## ✅ O Que Foi Implementado

### Sistema Completo de Administração Dinâmica
- **Painel Admin** (`/admin.html`) - Interface web para gerenciar todas as configurações
- **API Routes** - Endpoints para leitura pública (GET) e escrita protegida (POST)
- **Banco de Dados** - Tabela `admin_config` com JSONB para armazenar configs
- **Frontend Dinâmico** - `resultados.html` e `quiz.js` carregam configs do admin
- **Fallback Resiliente** - Valores hardcoded mantidos como backup

### 4 Categorias de Configurações Gerenciáveis:
1. **Produtos e Preços** - 12 produtos com nome, preço, benefícios, URLs
2. **Funis e URLs** - URLs do funil perpétuo e lançamento
3. **Depoimentos** - 6 categorias com imagens/textos
4. **WhatsApp** - Configurações de envio automático

---

## 📋 Passo a Passo para Deploy

### 1️⃣ Executar Migration SQL no Supabase

**Onde:** [Supabase Dashboard](https://app.supabase.com) → Seu Projeto → SQL Editor

**O que fazer:**
1. Abra o arquivo `migrations/create-admin-config.sql`
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em "Run" para executar

**O que isso faz:**
- Cria tabela `admin_config` (id, config_key, config_value, updated_at, updated_by)
- Configura RLS (leitura pública, escrita via service role)
- Insere seed com todos os valores atuais (produtos, depoimentos, funis, whatsapp)

**Verificação:**
```sql
-- Execute este comando para verificar se funcionou:
SELECT config_key, updated_at FROM admin_config;
```

Você deve ver 4 linhas: `produtos`, `depoimentos`, `funis`, `whatsapp`

---

### 2️⃣ Commit e Push

**Arquivos importantes criados/modificados:**

```bash
# Novos arquivos (COMMIT)
api/admin/config.js           # API para gerenciar configs
api/admin/login.js            # API para autenticação
public/admin.html             # Painel de administração
migrations/create-admin-config.sql  # Schema do banco

# Modificados (COMMIT)
public/resultados.html        # Agora carrega configs do admin
src/quiz.js                   # Agora usa URLs dinâmicas
server.js                     # Rotas do admin adicionadas
build/*                       # Build atualizado
```

**Comando sugerido:**
```bash
git add api/admin/ public/admin.html migrations/create-admin-config.sql
git add public/resultados.html src/quiz.js server.js build/

git commit -m "feat: implementar painel de admin com configs dinâmicas

- Criar API routes /api/admin/config (GET público, POST protegido)
- Criar painel admin em /admin.html (autenticação com ADMIN_SECRET)
- Modificar resultados.html para carregar configs do admin (com fallback)
- Modificar quiz.js para usar URLs de funis dinâmicas
- Adicionar migration SQL para tabela admin_config
- Sistema resiliente: fallback para valores hardcoded se API falhar

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git push origin main
```

---

### 3️⃣ Aguardar Deploy da Vercel

Após o push, a Vercel vai fazer deploy automaticamente. Aguarde alguns minutos.

**Verificar:**
- Acesse https://seu-site.vercel.app
- Abra o console do navegador (F12)
- Deve aparecer: `✅ Configurações do admin carregadas com sucesso`

---

### 4️⃣ Acessar o Painel Admin

**URL:** `https://seu-site.vercel.app/admin.html`

**Login:**
- Senha: Valor da variável `ADMIN_SECRET` (mesma do .env)

**Importante:**
- Se a senha estiver errada, você verá "Senha incorreta"
- Se não tiver `ADMIN_SECRET` configurada na Vercel, o login falhará
- Verifique em: Vercel Dashboard → Seu Projeto → Settings → Environment Variables

---

## 🧪 Testes Completos

### Teste 1: Login no Admin
1. Acesse `/admin.html`
2. Digite a senha (ADMIN_SECRET)
3. Deve aparecer o painel com 4 tabs

### Teste 2: Alterar Preço de Produto
1. Vá na tab "Produtos e Preços"
2. Encontre "PREVENTIVA"
3. Altere o preço de R$ 4.764 para R$ 5.000
4. Clique em "💾 Salvar Produtos"
5. Deve aparecer toast verde "Produtos salvos com sucesso!"

### Teste 3: Verificar Atualização em Resultados
1. Abra `/resultados.html?email=teste@exemplo.com` em nova aba
2. Role até a seção de produtos
3. O produto PREVENTIVA deve mostrar R$ 5.000
4. Abra o console (F12): deve ter `✅ Configurações do admin carregadas com sucesso`

### Teste 4: Testar Fallback (Resiliência)
1. No Supabase, delete temporariamente a tabela admin_config:
   ```sql
   DROP TABLE admin_config;
   ```
2. Recarregue `/resultados.html?email=teste@exemplo.com`
3. Console deve mostrar: `⚠️ Configs do admin não disponíveis, usando valores hardcoded`
4. **A página deve continuar funcionando normalmente!**
5. Restaure a tabela executando a migration novamente

### Teste 5: Alterar URLs de Funis
1. No admin, vá na tab "Funis e URLs"
2. Altere "URL Funil Lançamento" para uma URL de teste
3. Salve
4. Complete o quiz com `?funil=lancamento` na URL
5. Deve redirecionar para a URL que você configurou

### Teste 6: Alterar Depoimentos
1. Tab "Depoimentos"
2. Selecione categoria "Ansiedade"
3. Clique em "➕ Adicionar Depoimento"
4. Tipo: Imagem
5. Caminho: `/testimonials/novo-depoimento.png`
6. Salve
7. Recarregue resultados.html com lead que tem ansiedade
8. Novo depoimento deve aparecer

---

## 🔒 Segurança

### Autenticação
- Login protegido por `ADMIN_SECRET` (variável de ambiente)
- Token armazenado em `sessionStorage` (limpa ao fechar aba)
- API POST valida token em cada requisição

### Permissões
- **GET /api/admin/config** - Público (frontend precisa ler)
- **POST /api/admin/config** - Protegido (requer `Authorization: Bearer <ADMIN_SECRET>`)
- RLS ativo na tabela `admin_config`

### Boas Práticas
- Nunca compartilhe a senha ADMIN_SECRET
- Use HTTPS em produção (Vercel fornece automaticamente)
- Rotacione a senha ADMIN_SECRET periodicamente

---

## 📊 Estrutura dos Dados

### Tabela admin_config
```sql
CREATE TABLE admin_config (
  id UUID PRIMARY KEY,
  config_key TEXT UNIQUE NOT NULL,  -- 'produtos', 'depoimentos', 'funis', 'whatsapp'
  config_value JSONB NOT NULL,      -- Objeto JSON com as configurações
  updated_at TIMESTAMPTZ,
  updated_by TEXT
);
```

### Exemplo de config_value para "produtos":
```json
{
  "preventiva": {
    "nome": "PREVENTIVA: O Plano de Saúde da MTC",
    "preco": 4764,
    "de": 5800,
    "parcelas": "12x de R$ 397",
    "url": "https://curso.qigongbrasil.com/pay/plano-de-saude",
    "categoria": "high-end",
    "minScore": 50,
    "beneficios": [
      "Consultas mensais personalizadas com Mestre Ye",
      "Diagnóstico completo de Medicina Chinesa",
      "Práticas de Qi Gong específicas para seu ${elementoNome}",
      ...
    ]
  },
  ...
}
```

---

## 🛠️ Troubleshooting

### Problema: "Senha incorreta" ao fazer login
**Solução:**
- Verifique se ADMIN_SECRET está configurada na Vercel
- Certifique-se de usar a senha correta
- Limpe sessionStorage: `sessionStorage.clear()`

### Problema: Admin salva mas resultados.html não atualiza
**Solução:**
- Limpe o cache do navegador (Ctrl+Shift+R)
- Verifique o console: deve ter `✅ Configurações do admin carregadas`
- Verifique se a API está retornando os dados: `/api/admin/config?key=produtos`

### Problema: Página em branco ao acessar /admin.html
**Solução:**
- Verifique se o arquivo existe em `public/admin.html`
- Verifique se foi feito rebuild: `npm run build`
- Verifique se `build/admin.html` existe

### Problema: ${elementoNome} aparece literalmente no produto
**Solução:**
- Isso é esperado NO ADMIN (mostra o placeholder)
- No resultados.html deve substituir automaticamente
- Se não substituir, verifique a função `renderizarProduto()`

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. **Teste Completo em Produção**
   - Faça login no admin
   - Altere um produto
   - Complete um quiz
   - Verifique se mudanças aparecem

2. **Backup Inicial**
   - Faça backup do banco via Supabase Dashboard
   - Exporte as configs: GET `/api/admin/config?key=all`

3. **Documentação para Equipe**
   - Compartilhe credenciais do admin (com cuidado!)
   - Ensine como usar o painel
   - Documente processo de alteração de preços

4. **Monitoramento**
   - Configure alertas para erros na API
   - Monitore logs do Supabase
   - Acompanhe uso do painel

---

## ✨ Recursos do Painel Admin

### Tab 1: Produtos e Preços
- ✏️ Editar nome, preço, preço "de", parcelas
- 📝 Editar benefícios (lista)
- 🔗 Alterar URLs de checkout
- ✅ Marcar como recorrente
- ➕ Adicionar novos produtos
- 🗑️ Remover produtos

### Tab 2: Funis e URLs
- 🔄 Alterar URL do funil perpétuo
- 🚀 Alterar URL do funil de lançamento
- Suporta URLs absolutas ou relativas

### Tab 3: Depoimentos
- 📸 Adicionar depoimentos com imagem (path + alt text)
- 📝 Adicionar depoimentos de texto (nome + texto)
- 🗂️ Organizar por categoria (ansiedade, dor_lombar, etc.)
- 👁️ Preview de imagens
- ➕➖ Adicionar/remover por categoria

### Tab 4: WhatsApp
- ✅ Habilitar/desabilitar envios
- 🔢 Configurar rate limit
- ⏱️ Ajustar delays (hot vs normal leads)
- 🕐 Definir horário de funcionamento
- 🧪 Modo simulação (não envia de verdade)

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console (F12)
2. Verifique logs da Vercel (Dashboard → Seu Projeto → Logs)
3. Verifique logs do Supabase (Dashboard → Logs)
4. Revise este documento
5. Entre em contato com suporte técnico

---

**🎉 Painel de Admin pronto para uso!**

Agora você pode gerenciar produtos, preços, depoimentos e funis sem tocar no código.
