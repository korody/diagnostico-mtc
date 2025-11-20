# Migração do Sistema de Status para Tags

## 📋 Resumo da Migração

**Data**: Dezembro 2024  
**Status**: ✅ **COMPLETO**  
**Leads Migrados**: 2,581 de 2,581 (100%)

## 🎯 Objetivo

Migrar o sistema de rastreamento de status de leads de um campo único (`whatsapp_status`) para um sistema baseado em array de tags (`status_tags`), preservando o histórico completo de interações.

## ❌ Problema Anterior

O campo `whatsapp_status` (VARCHAR) armazenava apenas **um único status por vez**, sobrescrevendo o estado anterior:
- ❌ Perda de histórico de interações
- ❌ Impossível saber se um lead recebeu diagnóstico E desafio
- ❌ Dificuldade em filtrar leads com múltiplas interações

## ✅ Solução Implementada

Sistema de tags com array PostgreSQL (`TEXT[]`):
- ✅ Preserva histórico completo de interações
- ✅ Queries eficientes com operador `cs` (contains)
- ✅ Múltiplas tags simultâneas
- ✅ Backward compatible (mantém `whatsapp_status` para legado)

## 📊 Tags Disponíveis

### Tags de Envio
```javascript
TAGS.DIAGNOSTICO_FINALIZADO   // Quiz completado
TAGS.TEMPLATE_ENVIADO         // Template WhatsApp enviado
TAGS.DIAGNOSTICO_ENVIADO      // Diagnóstico enviado ao lead
TAGS.RESULTADOS_ENVIADOS      // Resultados enviados
TAGS.AUDIO_ENVIADO            // Áudio personalizado enviado
TAGS.AUDIO_AUTOMACAO          // Áudio via automação
TAGS.DESAFIO_ENVIADO          // Desafio da vitalidade enviado
```

### Tags de Status
```javascript
TAGS.FAILED                   // Falha no envio geral
TAGS.AUDIO_FAILED             // Falha no envio de áudio
TAGS.DESAFIO_FAILED           // Falha no envio de desafio
```

## 🔄 Mapeamento de Migração

| whatsapp_status (antigo) | status_tags (novo) |
|--------------------------|-------------------|
| `diagnostico_enviado` | `['diagnostico_enviado']` |
| `desafio_enviado` | `['desafio_enviado']` |
| `audio_personalizado_enviado` | `['audio_enviado', 'audio_automacao']` |
| `resultados_enviados` | `['resultados_enviados']` |
| `template_enviado` | `['template_enviado']` |
| `failed` | `['failed']` |
| `audio_failed` | `['audio_failed']` |
| `desafio_failed` | `['desafio_failed']` |

## 📁 Arquivos Atualizados

### 1. Biblioteca Core
- ✅ `lib/tags.js` - Funções auxiliares e constantes

### 2. Scripts de Envio em Lote
- ✅ `audio-custom-autom-lotes.js`
- ✅ `desafio-envio-lotes.js`
- ✅ `diagnostico-automacao-lotes.js`

### 3. Scripts de Envio Individual
- ✅ `desafio-envio-individual.js`
- ✅ `diagnostico-automacao-individual.js`

### 4. API Serverless (Vercel)
- ✅ `api/submit.js`
- ✅ `api/referral-link.js`
- ✅ `api/webhook/unnichat/send-diagnostic.js`
- ✅ `api/webhook/unnichat/get-diagnostic.js`
- ✅ `api/webhook/unnichat/generate-audio.js`

### 5. Scripts de Verificação
- ✅ `check-alunos-enviados.js`
- ✅ `check-alunos-restantes.js`

### 6. Servidor Local
- ✅ `server.js`

### 7. Script de Migração
- ✅ `scripts/migrar-whatsapp-status-para-tags.js`

## 💻 Uso das Funções

### Adicionar Tags
```javascript
const { addLeadTags, TAGS } = require('./lib/tags');

await addLeadTags(supabase, leadId, [TAGS.DIAGNOSTICO_ENVIADO]);
await addLeadTags(supabase, leadId, [TAGS.AUDIO_ENVIADO, TAGS.AUDIO_AUTOMACAO]);
```

### Verificar Tags
```javascript
const { hasTag, hasAnyTag, TAGS } = require('./lib/tags');

if (hasTag(lead, TAGS.DIAGNOSTICO_ENVIADO)) {
  // Lead já recebeu diagnóstico
}

if (hasAnyTag(lead, [TAGS.AUDIO_ENVIADO, TAGS.AUDIO_AUTOMACAO])) {
  // Lead recebeu áudio por qualquer método
}
```

### Filtrar Leads por Tags
```javascript
// Buscar leads QUE RECEBERAM diagnóstico
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .filter('status_tags', 'cs', `{${TAGS.DIAGNOSTICO_ENVIADO}}`);

// Buscar leads que NÃO RECEBERAM áudio
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .not('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`);

// Buscar leads com diagnóstico OU resultados
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .or(`status_tags.cs.{${TAGS.DIAGNOSTICO_ENVIADO}},status_tags.cs.{${TAGS.RESULTADOS_ENVIADOS}}`);
```

### Remover Tags (raro, apenas correções)
```javascript
const { removeLeadTags, TAGS } = require('./lib/tags');

await removeLeadTags(supabase, leadId, [TAGS.FAILED]);
```

## 📈 Resultados da Migração

```
Total de leads processados: 5,732
Total de leads atualizados: 2,581
Taxa de sucesso: 100%

Distribuição por status migrado:
- desafio_enviado: 1,895 leads
- audio_personalizado_enviado: 1,302 leads
- diagnostico_enviado: 975 leads
- resultados_enviados: 203 leads
- template_enviado: 138 leads
- failed: 37 leads
- audio_failed: 22 leads
- desafio_failed: 9 leads
```

## 🔍 Queries Importantes

### Leads que receberam áudio mas não desafio
```javascript
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .filter('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`)
  .not('status_tags', 'cs', `{${TAGS.DESAFIO_ENVIADO}}`);
```

### Leads com diagnóstico mas sem áudio (candidatos para envio)
```javascript
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .or(`status_tags.cs.{${TAGS.DIAGNOSTICO_ENVIADO}},status_tags.cs.{${TAGS.RESULTADOS_ENVIADOS}}`)
  .not('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`);
```

### Leads com qualquer falha
```javascript
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .or(`status_tags.cs.{${TAGS.FAILED}},status_tags.cs.{${TAGS.AUDIO_FAILED}},status_tags.cs.{${TAGS.DESAFIO_FAILED}}`);
```

## ⚠️ Compatibilidade Reversa

- O campo `whatsapp_status` **continua sendo atualizado** em todos os scripts
- Permite rollback caso necessário
- Logs antigos continuam funcionando
- Queries legadas não quebram

## 🧪 Testes Recomendados

### 1. Verificar Migração
```bash
npm run check:enviados
npm run check:restantes
```

### 2. Testar Envio Individual
```bash
# Editar TELEFONE em desafio-envio-individual.js
npm run desafio:individual
```

### 3. Testar Envio em Lote (dry-run)
```bash
DRY_RUN=1 LIMITE_TESTE=5 npm run desafio:lotes
```

## 📝 Convenções

1. **Sempre use TAGS constants**: Nunca strings hardcoded
2. **Múltiplas tags**: Use array `[TAGS.TAG1, TAGS.TAG2]`
3. **Query syntax**: `cs` operator para array containment
4. **Negação**: Use `.not('status_tags', 'cs', ...)`
5. **OR queries**: Use `.or('status_tags.cs.{tag1},status_tags.cs.{tag2}')`

## 🚀 Próximos Passos

1. ✅ Migração completa
2. ✅ Todos os scripts atualizados
3. ⏳ Monitorar performance das queries com tags
4. ⏳ Criar índice GIN no campo status_tags se necessário:
   ```sql
   CREATE INDEX idx_quiz_leads_status_tags ON quiz_leads USING GIN (status_tags);
   ```
5. ⏳ Deprecar `whatsapp_status` após período de teste (opcional)

## 🆘 Troubleshooting

### Query retorna vazio mesmo com tags
- Verificar se array tem `{}` ao redor: `.cs.{tag}` não `.cs.tag`
- Confirmar que tag está em TAGS constants

### Tag não aparece após addLeadTags
- Verificar logs de erro no console
- Confirmar conexão Supabase
- Verificar permissões RLS (Row Level Security)

### Lead tem whatsapp_status mas não status_tags
- Rodar script de migração novamente (idempotente)
- Verificar se lead foi criado após migração

## 📚 Referências

- PostgreSQL Array Functions: https://www.postgresql.org/docs/current/functions-array.html
- Supabase Array Operators: https://supabase.com/docs/guides/database/arrays
- lib/tags.js: Implementação completa das funções
