# Sistema de Tags - Guia Rápido para Desenvolvedores

## 🚀 Quick Start

```javascript
// 1. Importar funções e constantes
const { addLeadTags, hasTag, hasAnyTag, TAGS } = require('./lib/tags');

// 2. Adicionar tags após enviar mensagem
await addLeadTags(supabase, leadId, [TAGS.DIAGNOSTICO_ENVIADO]);

// 3. Verificar tags antes de enviar
if (!hasTag(lead, TAGS.AUDIO_ENVIADO)) {
  // Enviar áudio
  await sendAudio(lead);
  await addLeadTags(supabase, leadId, [TAGS.AUDIO_ENVIADO]);
}
```

## 📋 Tags Disponíveis (TAGS Constants)

```javascript
// Diagnóstico e Resultados
TAGS.DIAGNOSTICO_FINALIZADO   // Quiz completado pelo lead
TAGS.TEMPLATE_ENVIADO         // Template inicial enviado
TAGS.DIAGNOSTICO_ENVIADO      // Diagnóstico personalizado enviado
TAGS.RESULTADOS_ENVIADOS      // Resultados enviados via automação

// Áudio Personalizado
TAGS.AUDIO_ENVIADO            // Áudio personalizado enviado (qualquer método)
TAGS.AUDIO_AUTOMACAO          // Áudio via automação de lotes

// Desafio da Vitalidade
TAGS.DESAFIO_ENVIADO          // Desafio enviado com link de compartilhamento

// Status de Erro
TAGS.FAILED                   // Falha geral no envio
TAGS.AUDIO_FAILED             // Falha específica no envio de áudio
TAGS.DESAFIO_FAILED           // Falha específica no envio de desafio
```

## 🔍 Queries Comuns

### Buscar leads SEM uma tag específica
```javascript
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .not('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`);
```

### Buscar leads COM uma tag específica
```javascript
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .filter('status_tags', 'cs', `{${TAGS.DIAGNOSTICO_ENVIADO}}`);
```

### Buscar leads com Tag A OU Tag B
```javascript
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .or(`status_tags.cs.{${TAGS.DIAGNOSTICO_ENVIADO}},status_tags.cs.{${TAGS.RESULTADOS_ENVIADOS}}`);
```

### Buscar leads com Tag A E SEM Tag B
```javascript
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .filter('status_tags', 'cs', `{${TAGS.DIAGNOSTICO_ENVIADO}}`)
  .not('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`);
```

### Buscar leads com múltiplas tags (AND)
```javascript
const { data } = await supabase
  .from('quiz_leads')
  .select('*')
  .filter('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`)
  .filter('status_tags', 'cs', `{${TAGS.DESAFIO_ENVIADO}}`);
```

## 🛠️ Funções Helper

### addLeadTags(supabase, leadId, tags)
Adiciona tags a um lead (merges com existentes, sem duplicatas)

```javascript
// Adicionar uma tag
await addLeadTags(supabase, leadId, [TAGS.AUDIO_ENVIADO]);

// Adicionar múltiplas tags
await addLeadTags(supabase, leadId, [
  TAGS.AUDIO_ENVIADO,
  TAGS.AUDIO_AUTOMACAO
]);
```

### hasTag(lead, tag)
Verifica se lead tem uma tag específica

```javascript
if (hasTag(lead, TAGS.DIAGNOSTICO_ENVIADO)) {
  console.log('Lead já recebeu diagnóstico');
}
```

### hasAnyTag(lead, tags)
Verifica se lead tem QUALQUER uma das tags especificadas

```javascript
if (hasAnyTag(lead, [TAGS.AUDIO_ENVIADO, TAGS.AUDIO_AUTOMACAO])) {
  console.log('Lead já recebeu áudio');
}
```

### removeLeadTags(supabase, leadId, tags)
Remove tags específicas (raro, apenas para correções)

```javascript
await removeLeadTags(supabase, leadId, [TAGS.FAILED]);
```

### mergeTags(existing, newTags)
Merge arrays de tags sem duplicatas

```javascript
const merged = mergeTags(
  ['diagnostico_enviado', 'audio_enviado'],
  ['audio_enviado', 'desafio_enviado']
);
// Resultado: ['diagnostico_enviado', 'audio_enviado', 'desafio_enviado']
```

## 📊 Padrões de Uso

### 1. Script de Envio em Lote

```javascript
const { addLeadTags, hasTag, TAGS } = require('./lib/tags');

// Buscar leads elegíveis (sem tag de envio)
const { data: leads } = await supabase
  .from('quiz_leads')
  .select('*')
  .filter('is_aluno', 'eq', true)
  .not('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`)
  .limit(50);

// Enviar para cada lead
for (const lead of leads) {
  try {
    await sendMessage(lead);
    
    // Adicionar tag de sucesso
    await addLeadTags(supabase, lead.id, [TAGS.AUDIO_ENVIADO, TAGS.AUDIO_AUTOMACAO]);
    
  } catch (error) {
    // Adicionar tag de falha
    await addLeadTags(supabase, lead.id, [TAGS.AUDIO_FAILED]);
  }
}
```

### 2. Webhook/API Endpoint

```javascript
const { addLeadTags, TAGS } = require('../lib/tags');

module.exports = async (req, res) => {
  const lead = await findLead(req.body.phone);
  
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  
  // Enviar mensagem
  await sendDiagnostic(lead);
  
  // Atualizar status legado (backward compatibility)
  await supabase
    .from('quiz_leads')
    .update({ whatsapp_status: 'diagnostico_enviado' })
    .eq('id', lead.id);
  
  // Adicionar tag
  await addLeadTags(supabase, lead.id, [TAGS.DIAGNOSTICO_ENVIADO]);
  
  res.json({ success: true });
};
```

### 3. Filtro com Múltiplas Condições

```javascript
// Buscar alunos que:
// - Receberam diagnóstico
// - NÃO receberam áudio
// - NÃO são BNY2
const { data: candidates } = await supabase
  .from('quiz_leads')
  .select('id, nome, celular, lead_score, status_tags')
  .filter('is_aluno', 'eq', true)
  .filter('is_aluno_bny2', 'eq', false)
  .or(`status_tags.cs.{${TAGS.DIAGNOSTICO_ENVIADO}},status_tags.cs.{${TAGS.RESULTADOS_ENVIADOS}}`)
  .not('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`)
  .order('lead_score', { ascending: false });
```

## ⚠️ Erros Comuns

### ❌ ERRADO: Usar strings hardcoded
```javascript
await addLeadTags(supabase, leadId, ['diagnostico_enviado']); // ❌
```

### ✅ CERTO: Usar TAGS constants
```javascript
await addLeadTags(supabase, leadId, [TAGS.DIAGNOSTICO_ENVIADO]); // ✅
```

### ❌ ERRADO: Esquecer chaves {} no query
```javascript
.filter('status_tags', 'cs', TAGS.AUDIO_ENVIADO) // ❌ Retorna vazio
```

### ✅ CERTO: Usar {} para array containment
```javascript
.filter('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`) // ✅
```

### ❌ ERRADO: Não passar array para addLeadTags
```javascript
await addLeadTags(supabase, leadId, TAGS.AUDIO_ENVIADO); // ❌
```

### ✅ CERTO: Sempre passar array
```javascript
await addLeadTags(supabase, leadId, [TAGS.AUDIO_ENVIADO]); // ✅
```

## 🧪 Testar Localmente

### 1. Verificar leads com tags
```bash
node check-alunos-enviados.js
```

### 2. Verificar leads sem tags
```bash
node check-alunos-restantes.js
```

### 3. Testar envio individual (dry-run)
```bash
DRY_RUN=1 node desafio-envio-individual.js
```

### 4. Testar envio em lote (limite)
```bash
LIMITE_TESTE=5 DRY_RUN=1 node audio-custom-autom-lotes.js
```

## 📖 Documentação Completa

- **Migração**: `docs/MIGRACAO-STATUS-TAGS.md`
- **Implementação**: `lib/tags.js`
- **Testes**: Scripts em `check-*.js`

## 💡 Dicas

1. **Performance**: Queries com tags são eficientes. Se necessário, criar índice GIN:
   ```sql
   CREATE INDEX idx_quiz_leads_status_tags ON quiz_leads USING GIN (status_tags);
   ```

2. **Debugging**: Sempre logar tags antes de queries complexas:
   ```javascript
   console.log('Buscando leads sem:', TAGS.AUDIO_ENVIADO);
   ```

3. **Testes**: Use `LIMITE_TESTE` e `DRY_RUN` antes de envios reais

4. **Backward Compatibility**: Sempre atualizar `whatsapp_status` junto com tags

5. **Logs**: Incluir tags nos metadados dos logs:
   ```javascript
   await supabase.from('whatsapp_logs').insert({
     lead_id: lead.id,
     status: 'audio_enviado',
     metadata: { tags_added: [TAGS.AUDIO_ENVIADO] }
   });
   ```
