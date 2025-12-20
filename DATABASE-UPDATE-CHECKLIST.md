# ✅ Checklist: Atualização do Banco de Dados

## 📋 Resumo das Mudanças

Após adicionar as **5 novas perguntas (P14-P20)** e o **sistema de arquétipos comportamentais**, você precisa atualizar o banco de dados Supabase para armazenar os novos campos.

---

## 🎯 O QUE PRECISA SER FEITO

### ✅ **1. Campo `respostas` (JSONB)**
**Status: ✅ NENHUMA AÇÃO NECESSÁRIA**

- O campo `respostas` já é **JSONB** (JSON flexível)
- Suporta automaticamente P14, P15, P16, P19, P20
- Leads antigos e novos funcionarão perfeitamente

---

### 🔧 **2. Novos Campos de Arquétipos**
**Status: ⚠️ REQUER SQL NO SUPABASE**

Você precisa adicionar **6 novas colunas** à tabela `quiz_leads`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `arquetipo_principal` | TEXT | Arquétipo vencedor (SILENT_WARRIOR, SKEPTICAL_SCIENTIST, ETERNAL_MOTHER, RISING_PHOENIX) |
| `scores_arquetipos` | JSONB | Scores de todos os 4 arquétipos |
| `confianca_arquetipo` | NUMERIC(5,2) | Confiança do arquétipo (0-1) |
| `objecao_principal` | TEXT | Principal objeção (MEDO_FALHAR, FALTA_TEMPO, etc.) |
| `autonomia_decisao` | TEXT | Nível de autonomia (TOTAL, ALTA, MEDIA, BAIXA) |
| `investimento_mensal_atual` | NUMERIC(10,2) | Investimento mensal em saúde (R$) |

---

## 🚀 COMO EXECUTAR

### **Passo 1: Acesse o Supabase SQL Editor**
1. Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Clique em **SQL Editor** no menu lateral

### **Passo 2: Execute o Script SQL**
1. Abra o arquivo: `scripts/add-arquetipo-columns.sql`
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione `Ctrl/Cmd + Enter`)

### **Passo 3: Verificar Sucesso**
Você verá uma mensagem de sucesso e a query de verificação mostrará as 6 novas colunas criadas.

---

## 📊 COMPATIBILIDADE RETROATIVA

### ✅ **Leads Antigos (sem arquétipos)**
- Continuarão funcionando normalmente
- Novos campos ficarão como `NULL`
- Frontend verifica existência dos dados antes de renderizar
- Nenhum erro será gerado

### ✅ **Leads Novos (com arquétipos)**
- Terão todos os campos preenchidos
- Página de resultados mostrará arquétipos
- Análise completa com scores e badges

---

## 🔍 VALIDAÇÃO

Após executar o SQL, rode esta query para confirmar:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'quiz_leads'
  AND column_name IN (
    'arquetipo_principal',
    'scores_arquetipos',
    'confianca_arquetipo',
    'objecao_principal',
    'autonomia_decisao',
    'investimento_mensal_atual'
  )
ORDER BY column_name;
```

**Resultado esperado:** 6 linhas mostrando os novos campos.

---

## 📝 CHECKLIST DE IMPLANTAÇÃO

- [ ] **1.** Executar `scripts/add-arquetipo-columns.sql` no Supabase SQL Editor
- [ ] **2.** Verificar que as 6 colunas foram criadas com sucesso
- [ ] **3.** Verificar que os 3 índices foram criados (`idx_quiz_leads_arquetipo`, `idx_quiz_leads_autonomia`, `idx_quiz_leads_objecao`)
- [ ] **4.** Testar o quiz localmente (`npm run dev`)
- [ ] **5.** Fazer um quiz completo de teste
- [ ] **6.** Verificar que os dados foram salvos no Supabase
- [ ] **7.** Deploy para produção (Vercel faz automaticamente no push)
- [ ] **8.** Testar quiz em produção com dados reais

---

## ⚠️ IMPORTANTE

**NÃO é necessário migrar dados antigos.** Os campos novos permitem `NULL`, então:
- ✅ Leads antigos continuam funcionando
- ✅ Novos leads terão os dados completos
- ✅ Nenhum downtime necessário

---

## 🆘 Se algo der errado

### Erro: "column already exists"
**Solução:** O script usa `IF NOT EXISTS`, então é seguro rodar múltiplas vezes. Ignore o erro.

### Erro: "permission denied"
**Solução:** Verifique que você está logado como admin do projeto Supabase.

### Dados não aparecem no frontend
**Checklist:**
1. ✅ SQL executado no Supabase?
2. ✅ API atualizada no Vercel? (push no GitHub)
3. ✅ Cache do navegador limpo? (Ctrl+Shift+R)
4. ✅ Console do navegador mostra erros?

---

## 📞 Suporte

Se tiver dúvidas:
1. Verifique os logs do Supabase
2. Verifique os logs da Vercel
3. Console do navegador (F12)

**Localização do script:** `scripts/add-arquetipo-columns.sql`
**Backup automático:** Supabase faz backup automático, reversão é possível

---

## ✅ CONCLUSÃO

Executar **1 único script SQL** e pronto! 🎉

Todo o resto (frontend, API, cálculos) já está implementado e commitado.
