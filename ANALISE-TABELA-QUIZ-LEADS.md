# 📊 Análise da Tabela quiz_leads - Estado Atual vs Necessário

## 🔍 Como Verificar

Execute o script: **`scripts/check-quiz-leads-schema.sql`** no Supabase SQL Editor

Ele mostrará:
1. Todas as colunas existentes
2. Tipos de dados
3. Índices criados
4. Estatísticas de preenchimento
5. Amostra dos últimos 3 leads

---

## 📋 ESTRUTURA ATUAL (Baseada nos Scripts Anteriores)

### ✅ **Campos Base (Originais)**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único do lead (PRIMARY KEY) |
| `nome` | TEXT | Nome completo |
| `email` | TEXT | Email |
| `celular` | TEXT | Telefone (formato E.164) |
| `respostas` | JSONB | Todas as respostas do quiz (P1-P20) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

### ✅ **Campos de Diagnóstico MTC (Adicionados)**
| Campo | Tipo | Descrição | Script |
|-------|------|-----------|--------|
| `elemento_principal` | TEXT | Elemento dominante (RIM, FÍGADO, etc.) | EXECUTAR-NO-SUPABASE.sql |
| `codigo_perfil` | TEXT | Código do perfil (ex: RI-5) | Provavelmente já existe |
| `nome_perfil` | TEXT | Nome do elemento (ex: "Elemento ÁGUA") | Provavelmente já existe |
| `arquetipo` | TEXT | Arquétipo MTC (ex: "A Sábia") | Provavelmente já existe |
| `emoji` | TEXT | Emoji do elemento | Provavelmente já existe |
| `quadrante` | INTEGER | Quadrante 1-4 (intensidade x urgência) | EXECUTAR-NO-SUPABASE.sql |
| `diagnostico_resumo` | TEXT | Resumo curto | Provavelmente já existe |
| `diagnostico_completo` | TEXT | Diagnóstico completo | Provavelmente já existe |
| `script_abertura` | TEXT | Script de vendas | Provavelmente já existe |

### ✅ **Campos de Scoring (Adicionados)**
| Campo | Tipo | Descrição | Script |
|-------|------|-----------|--------|
| `lead_score` | INTEGER | Score 0-100 | EXECUTAR-NO-SUPABASE.sql |
| `prioridade` | TEXT | ALTA, MÉDIA, BAIXA | EXECUTAR-NO-SUPABASE.sql |
| `is_hot_lead_vip` | BOOLEAN | Flag VIP | EXECUTAR-NO-SUPABASE.sql |
| `contagem_elementos` | JSONB | Contagem por elemento | EXECUTAR-NO-SUPABASE.sql |
| `intensidade_calculada` | INTEGER | 1-5 | EXECUTAR-NO-SUPABASE.sql |
| `urgencia_calculada` | INTEGER | 1-5 | EXECUTAR-NO-SUPABASE.sql |

### ✅ **Campos de Autenticação (Adicionados)**
| Campo | Tipo | Descrição | Script |
|-------|------|-----------|--------|
| `user_id` | UUID | Referência ao auth.users | add-user-id-column.sql |
| `redirect_url` | TEXT | URL de redirecionamento | add-user-id-column.sql |

### ⚠️ **CAMPOS DE PERFIL COMERCIAL (A ADICIONAR)**
| Campo | Tipo | Descrição | Script | Status |
|-------|------|-----------|--------|--------|
| `perfil_comercial` | TEXT | SILENT_WARRIOR, etc. | **add-arquetipo-columns.sql** | ❌ FALTANDO |
| `scores_arquetipos` | JSONB | Scores dos 4 arquétipos | **add-arquetipo-columns.sql** | ❌ FALTANDO |
| `confianca_arquetipo` | NUMERIC(5,2) | Confiança 0-1 | **add-arquetipo-columns.sql** | ❌ FALTANDO |
| `objecao_principal` | TEXT | Objeção identificada | **add-arquetipo-columns.sql** | ❌ FALTANDO |
| `autonomia_decisao` | TEXT | TOTAL, ALTA, MEDIA, BAIXA | **add-arquetipo-columns.sql** | ❌ FALTANDO |
| `investimento_mensal_atual` | NUMERIC(10,2) | Investimento R$ | **add-arquetipo-columns.sql** | ❌ FALTANDO |

---

## 📊 TOTAL ESTIMADO DE COLUNAS

### Antes dos Arquétipos: ~25-30 colunas
### Depois dos Arquétipos: ~31-36 colunas

---

## 🎯 AÇÃO NECESSÁRIA

### **OPÇÃO 1: Verificar Primeiro (Recomendado)**
```sql
-- Execute no Supabase SQL Editor
\d quiz_leads;

-- OU use nosso script completo
-- scripts/check-quiz-leads-schema.sql
```

### **OPÇÃO 2: Executar Direto (Safe)**
```sql
-- O script usa IF NOT EXISTS, então é seguro
-- scripts/add-arquetipo-columns.sql
```

---

## 🔍 DIAGNÓSTICO RÁPIDO

Execute esta query rápida no Supabase:

```sql
SELECT 
    COUNT(*) FILTER (WHERE column_name = 'perfil_comercial') AS tem_perfil_comercial,
    COUNT(*) FILTER (WHERE column_name = 'scores_arquetipos') AS tem_scores_arquetipos,
    COUNT(*) FILTER (WHERE column_name = 'confianca_arquetipo') AS tem_confianca_arquetipo,
    COUNT(*) FILTER (WHERE column_name = 'objecao_principal') AS tem_objecao_principal,
    COUNT(*) FILTER (WHERE column_name = 'autonomia_decisao') AS tem_autonomia_decisao,
    COUNT(*) FILTER (WHERE column_name = 'investimento_mensal_atual') AS tem_investimento_mensal
FROM information_schema.columns
WHERE table_name = 'quiz_leads' AND table_schema = 'public';
```

**Resultado esperado:**
- **Tudo 0** → Precisa executar `add-arquetipo-columns.sql`
- **Tudo 1** → Já está OK! Nada a fazer
- **Alguns 1, outros 0** → Executar script (IF NOT EXISTS vai pular os existentes)

---

## ⚠️ IMPORTANTE: Campos com Propósitos Diferentes

Note a diferença entre:

1. **`arquetipo`** (TEXT) = Arquétipo MTC do Elemento (JÁ EXISTE)
   - Valores: "A Sábia", "A Guerreira", "A Cuidadora", etc.
   - Relacionado ao diagnóstico de saúde/MTC
   - Baseado em sintomas físicos (P1-P13)

2. **`perfil_comercial`** (TEXT) = Perfil Comportamental para Vendas (NOVO)
   - Valores: "SILENT_WARRIOR", "SKEPTICAL_SCIENTIST", etc.
   - Relacionado à abordagem de vendas
   - Baseado em comportamento comercial (P14-P16)

Nomes distintos para evitar confusão!

---

## 📝 CHECKLIST

- [ ] 1. Executar `check-quiz-leads-schema.sql` para ver estrutura atual
- [ ] 2. Verificar se campos de arquétipos comportamentais existem
- [ ] 3. Se NÃO existirem, executar `add-arquetipo-columns.sql`
- [ ] 4. Verificar criação com query de diagnóstico rápido
- [ ] 5. Testar quiz completo
- [ ] 6. Confirmar dados salvos no Supabase

---

## 🆘 Em Caso de Dúvida

**Pergunta:** "Não sei se os campos já existem"
**Resposta:** Execute a query de diagnóstico rápido acima (5 linhas)

**Pergunta:** "Posso executar o script múltiplas vezes?"
**Resposta:** SIM! Usa `IF NOT EXISTS`, é 100% seguro

**Pergunta:** "Vai quebrar leads antigos?"
**Resposta:** NÃO! Campos novos permitem NULL, compatibilidade total

---

## 🎯 CONCLUSÃO

**Estado Atual Provável:**
- ✅ Campos base: OK
- ✅ Campos MTC: OK
- ✅ Campos scoring: OK
- ✅ Campos auth: OK
- ❌ **Campos arquétipos comportamentais: FALTANDO**

**Solução:** Executar `scripts/add-arquetipo-columns.sql` no Supabase

---

## 📞 Próximos Passos

1. Execute `check-quiz-leads-schema.sql` para confirmar
2. Me envie o resultado (número de colunas existentes)
3. Executamos o script de arquétipos se necessário
4. Testamos o quiz completo
