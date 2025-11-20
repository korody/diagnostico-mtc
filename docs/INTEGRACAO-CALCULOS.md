# INTEGRAÇÃO DE CÁLCULOS AUTOMÁTICOS NO QUIZ

## ✅ IMPLEMENTADO

### Arquivos Modificados

#### 1. `api/submit.js` (Vercel Serverless)
**Mudança**: Adicionados 3 campos no objeto `dadosParaSalvar`:
```javascript
contagem_elementos: contagem,
intensidade_calculada: intensidade,
urgencia_calculada: urgencia
```

#### 2. `server.js` (Desenvolvimento Local)
**Mudança**: Mesma alteração para manter paridade com o ambiente serverless.

### Campos Agora Salvos no Banco

Quando um quiz é submetido, os seguintes campos calculados são **automaticamente** salvos:

| Campo | Tipo | Exemplo | Descrição |
|-------|------|---------|-----------|
| `elemento_principal` | TEXT | "RIM" | Elemento MTC dominante |
| `contagem_elementos` | JSONB | `{"RIM": 6, "FÍGADO": 3, ...}` | **NOVO** - Pontos por elemento |
| `intensidade_calculada` | INT | 4 | **NOVO** - Intensidade das dores (1-5) |
| `urgencia_calculada` | INT | 5 | **NOVO** - Urgência (1-5) |
| `quadrante` | INT | 1 | Quadrante de prioridade (1-4) |
| `lead_score` | INT | 85 | Score de qualificação (0-100) |
| `prioridade` | TEXT | "ALTA" | Prioridade (ALTA/MÉDIA/BAIXA) |
| `is_hot_lead_vip` | BOOLEAN | true | Se é lead VIP |

## 📋 PRÓXIMOS PASSOS

### 1. Executar SQL no Supabase

Se as colunas ainda não existem na tabela `quiz_leads`, execute:

```bash
# Abra o Supabase SQL Editor e rode:
scripts/add-missing-columns.sql
```

Ou copie e cole este SQL direto no Supabase:

```sql
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS contagem_elementos JSONB;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS intensidade_calculada INTEGER;
ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS urgencia_calculada INTEGER;
```

### 2. Testar Localmente

```bash
# Rodar servidor local
npm run api:test

# Em outro terminal, rodar teste
node scripts/test-calculos.js
```

### 3. Deploy para Produção

```bash
git add .
git commit -m "feat: salvar contagem_elementos, intensidade e urgência calculadas"
git push origin main
```

O Vercel vai fazer deploy automático.

## 🔍 COMO FUNCIONA

### Fluxo Atual (Simplificado)

```javascript
// 1. Quiz é submetido com respostas
const { lead, respostas } = req.body;

// 2. Cálculos são feitos (JÁ EXISTIA)
const contagem = contarElementos(respostas);
const intensidade = calcularIntensidade(respostas);
const urgencia = calcularUrgencia(respostas);
// ... outros cálculos

// 3. Tudo é salvo no banco (AGORA INCLUI OS 3 NOVOS CAMPOS)
await supabase.from('quiz_leads').insert({
  nome: lead.NOME,
  email: lead.EMAIL,
  respostas: respostas,
  elemento_principal: elementoPrincipal,
  contagem_elementos: contagem,           // ✅ NOVO
  intensidade_calculada: intensidade,     // ✅ NOVO
  urgencia_calculada: urgencia,          // ✅ NOVO
  lead_score: leadScore,
  quadrante: quadrante,
  // ... outros campos
});
```

## 🎯 QUERIES ÚTEIS

### Buscar leads com maior urgência
```sql
SELECT nome, elemento_principal, urgencia_calculada, lead_score
FROM quiz_leads
WHERE urgencia_calculada >= 4
ORDER BY urgencia_calculada DESC, lead_score DESC;
```

### Buscar leads por elemento e intensidade
```sql
SELECT nome, elemento_principal, intensidade_calculada, contagem_elementos
FROM quiz_leads
WHERE elemento_principal = 'RIM'
  AND intensidade_calculada >= 4
ORDER BY lead_score DESC;
```

### Análise de distribuição de elementos
```sql
SELECT 
  elemento_principal,
  COUNT(*) as total_leads,
  AVG(intensidade_calculada) as media_intensidade,
  AVG(urgencia_calculada) as media_urgencia
FROM quiz_leads
WHERE elemento_principal IS NOT NULL
GROUP BY elemento_principal
ORDER BY total_leads DESC;
```

## ✅ VALIDAÇÃO

Para verificar se está funcionando:

1. Submeta um quiz de teste
2. Vá no Supabase Table Editor → `quiz_leads`
3. Procure o lead mais recente
4. Verifique se os campos `contagem_elementos`, `intensidade_calculada` e `urgencia_calculada` estão preenchidos

Ou rode:
```bash
node scripts/test-calculos.js
```

## 📊 EXEMPLO REAL

Lead de teste após submeter quiz:

```json
{
  "nome": "Maria Silva",
  "elemento_principal": "RIM",
  "contagem_elementos": {
    "RIM": 6,
    "FÍGADO": 3,
    "BAÇO": 1,
    "CORAÇÃO": 2,
    "PULMÃO": 0
  },
  "intensidade_calculada": 4,
  "urgencia_calculada": 5,
  "quadrante": 1,
  "lead_score": 85,
  "prioridade": "ALTA",
  "is_hot_lead_vip": true
}
```

## 🚨 IMPORTANTE

- ✅ Leads **novos** terão todos os campos calculados automaticamente
- ⚠️ Leads **antigos** (criados antes desta atualização) podem ter esses campos NULL
- ✅ Isso é **normal** e não afeta o funcionamento do sistema
- 💡 Se quiser recalcular leads antigos, podemos criar um script de migração depois

## 📝 RESUMO

| Item | Status |
|------|--------|
| Função de cálculo | ✅ Já existia |
| Salvar no banco | ✅ Implementado |
| SQL para colunas | ✅ Criado |
| Script de teste | ✅ Criado |
| Deploy | ⏳ Pendente |

**Próxima ação**: Executar SQL no Supabase e testar!
