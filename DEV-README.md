# Ambiente de Desenvolvimento - Quiz MTC

## ⚠️ IMPORTANTE: Sincronização Server.js ↔ api/

Este projeto usa **2 ambientes**:
- **Local**: `server.js` (Express) - Para desenvolvimento rápido
- **Produção**: `api/*` (Vercel Serverless) - Deploy automático

### 🎯 Regra de Ouro:
**Sempre que alterar uma rota/função, atualize AMBOS os arquivos!**

---

## 🚀 Modo de Desenvolvimento

### **Desenvolvimento Local** - `npm run dev`
```bash
npm run dev
```
- ✅ Rápido para iniciar
- ✅ Bom para desenvolvimento iterativo
- ⚠️ Usa `server.js` (não as funções serverless)
- Roda: `server.js` (Express porta 3001) + React (porta 3000)

---

## � Verificar Sincronização

Use este comando para verificar se há rotas dessincronizadas:

```bash
npm run check-sync
```

Ele mostra:
- ✅ Rotas que existem em ambos os lugares
- ❌ Rotas que faltam em algum lugar
- 💡 Sugestões de onde adicionar

---

## �📋 Quando alterar código

### Se você mexer em **rotas/funções da API**:

1. **Encontre os arquivos correspondentes:**
   - `server.js` (linha ~XXX) - Rota Express
   - `api/nome-da-funcao.js` - Função serverless

2. **Faça a mudança nos DOIS lugares**
   
3. **Teste localmente:**
   ```bash
   npm run dev
   ```

4. **Commit e push:**
   - Vercel faz deploy automático
   - Produção usará `api/*`
   - Local continua usando `server.js`

### Exemplo Prático:

**Adicionando suporte a `sendChallenge` em `/api/whatsapp/send`:**

✅ Editou `server.js` função `sendWhatsAppInternal()` → Adiciona parâmetro `sendChallenge`  
✅ Editou `api/whatsapp/send.js` → Adiciona mesma lógica  
✅ Testou local com `npm run dev`  
✅ Commit & push → Vercel deploya automaticamente

---

## 🔧 Sincronizando `server.js` e `api/`

⚠️ **IMPORTANTE**: Se você editar uma rota/função, precisa atualizar **AMBOS**:

1. **`server.js`** - Para modo Express local
2. **`api/[nome-da-funcao].js`** - Para Vercel (produção e dev)

### Exemplo: Adicionar nova rota

**Em `server.js`:**
```javascript
app.post('/api/minha-rota', async (req, res) => {
  // lógica aqui
});
```

**Em `api/minha-rota.js`:**
```javascript
module.exports = async (req, res) => {
  // MESMA lógica aqui
};
```

---

## 📦 Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Express + React (modo rápido)
- `npm run dev:vercel` - Vercel Dev (modo produção-like)
- `npm run dev:express` - Alias para `npm run dev`

### API Standalone
- `npm run api:test` - Apenas API Express (teste)
- `npm run api:prod` - Apenas API Express (produção)

### Build & Deploy
- `npm run build` - Build React para produção
- `npm run vercel-build` - Build customizado para Vercel

### Envio de Mensagens
- `npm run send:test` - Envio em lote (teste)
- `npm run send:prod` - Envio em lote (produção)
- `npm run desafio:test` - Desafio em lote (teste)
- `npm run desafio:prod` - Desafio em lote (produção)
- `npm run desafio:individual:test` - Desafio individual (teste)
- `npm run desafio:individual:prod` - Desafio individual (produção)

---

## 🎯 Recomendação

Para **desenvolvimento diário**, use:
```bash
npm run dev
```

Antes de **fazer commit/deploy**, teste com:
```bash
npm run dev:vercel
```

Isso garante que não haverá surpresas em produção! 🚀
