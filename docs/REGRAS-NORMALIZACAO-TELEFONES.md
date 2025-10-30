# Regras de Normalização de Telefones

## Visão Geral

Este documento descreve as regras de normalização, validação e formatação de números de telefone usadas no sistema quiz-mtc.

## Problema Identificado

O sistema anterior tinha um bug crítico onde números com DDD 35, 47, 55, 71 e outros eram confundidos com o DDI brasileiro (55), resultando em:

- `35997258445` sendo normalizado incorretamente para `3597258445` (perdendo o DDD 35)
- `55991679976` sendo normalizado incorretamente para `5555991679976` (duplicando o 55)
- Leads não sendo encontrados no banco quando retornavam via Unnichat

## Formatos Aceitos

### Entrada do Usuário (Formulário)

1. **Formato brasileiro COM DDD** (OBRIGATÓRIO):
   - Celular: `11999999999` (11 dígitos: DDD + 9 + 8 dígitos)
   - Fixo: `1133334444` (10 dígitos: DDD + 8 dígitos)
   - Formatado: `(11) 99999-9999` ou `(11) 3333-4444`

2. **Formato E.164 (internacional)**:
   - Com `+`: `+5511999999999` (BR) ou `+351932736368` (PT)
   - Sem `+`: `351932736368` (12-15 dígitos)

### ⚠️ Formatos NÃO Aceitos

- Números sem DDD: `999999999` (9 dígitos)
- Números locais: `33334444` (8 dígitos)
- DDD inválido: `00999999999`, `01999999999`

## Funções e Comportamentos

### `normalizePhone(phone)`

**Objetivo:** Normalizar telefone para armazenamento no banco (SEMPRE sem DDI 55).

**Regras:**

1. **Números com 13 dígitos começando com 55:**
   - Se DDI + DDD válido: remove DDI 55
   - Exemplo: `5535997258445` → `35997258445`

2. **Números com 12 dígitos começando com 55:**
   - Verifica se próximos 2 dígitos são DDD válido
   - Se sim: remove DDI 55
   - Se não: mantém (pode ser internacional)
   - Exemplo: `553597258445` → `35997258445` (DDD 35 válido)
   - Exemplo: `556597258445` → `556597258445` (DDD 65 é válido, mas este formato não é padrão BR)

3. **Números com 10-11 dígitos:**
   - Verifica se DDD é válido
   - Se válido: retorna normalizado
   - Se inválido: retorna com warning
   - Exemplo: `35997258445` → `35997258445` ✅
   - Exemplo: `00997258445` → `00997258445` ⚠️ (warning)

4. **Números com 8-9 dígitos:**
   - Retorna com warning (falta DDD)
   - Exemplo: `997258445` → `997258445` ⚠️

5. **Remove zeros à esquerda:**
   - Formato antigo `0XX`: `01199845767` → `1199845767`

### `formatPhoneForUnnichat(phone)`

**Objetivo:** Preparar telefone para envio ao Unnichat (SEMPRE com DDI completo).

**Regras:**

1. **Números BR com 10-11 dígitos e DDD válido:**
   - Adiciona DDI 55
   - Exemplo: `11999999999` → `5511999999999`
   - Exemplo: `35997258445` → `5535997258445`

2. **Números BR com DDD inválido:**
   - NÃO adiciona DDI
   - Loga erro
   - Retorna o número original
   - Exemplo: `00999999999` → `00999999999` ❌

3. **Números com 12-15 dígitos:**
   - Mantém como está (já tem DDI)
   - Exemplo: `5511999999999` → `5511999999999`
   - Exemplo: `351932736368` → `351932736368`

4. **Números com 8-9 dígitos (sem DDD):**
   - **NÃO ACEITA MAIS** (correção do bug)
   - Retorna string vazia
   - Loga erro crítico
   - Exemplo: `999999999` → `` ❌ (ERRO)

### `isValidBrazilianPhone(phone)`

**Objetivo:** Validar se um telefone brasileiro está no formato correto.

**Regras:**

1. Deve ter 10 ou 11 dígitos
2. Primeiros 2 dígitos devem ser DDD válido (11-99, exceto não alocados)
3. Para 11 dígitos: 3º dígito deve ser 9 (celular)
4. Para 10 dígitos: formato fixo ou celular antigo

**Exemplos:**

- `11999999999` → ✅ (celular SP)
- `1133334444` → ✅ (fixo SP)
- `35997258445` → ✅ (celular MG)
- `55991679976` → ✅ (celular RS)
- `999999999` → ❌ (sem DDD)
- `00999999999` → ❌ (DDD inválido)
- `11899999999` → ❌ (11 dígitos mas não começa com 9)

## DDDs Válidos Brasileiros

Lista completa dos DDDs alocados pela Anatel:

### São Paulo (11-19)
11, 12, 13, 14, 15, 16, 17, 18, 19

### Rio de Janeiro (21-24)
21, 22, 24

### Espírito Santo (27-28)
27, 28

### Minas Gerais (31-38)
31, 32, 33, 34, 35, 37, 38

### Paraná (41-46)
41, 42, 43, 44, 45, 46

### Santa Catarina (47-49)
47, 48, 49

### Rio Grande do Sul (51-55)
51, 53, 54, 55

### Centro-Oeste/Norte (61-69)
61 (DF), 62, 64 (GO), 63 (TO), 65, 66 (MT), 67 (MS), 68 (AC), 69 (RO)

### Nordeste - Bahia/Sergipe (71-79)
71, 73, 74, 75, 77 (BA), 79 (SE)

### Nordeste - PE/AL/PB/RN/CE/PI (81-89)
81, 87 (PE), 82 (AL), 83 (PB), 84 (RN), 85, 88 (CE), 86, 89 (PI)

### Norte - PA/AM/RR/AP/MA (91-99)
91, 93, 94 (PA), 92, 97 (AM), 95 (RR), 96 (AP), 98, 99 (MA)

## Fluxo Completo

### 1. Entrada do Usuário (Formulário React)

```javascript
// Usuário digita: (35) 99725-8445
// Validação: ✅ DDD 35 válido, 11 dígitos, começa com 9
// Armazena em state: "35997258445"
```

### 2. Envio para API (`/api/submit`)

```javascript
// Recebe: "35997258445"
// normalizePhone("35997258445") → "35997258445"
// isValidBrazilianPhone("35997258445") → true ✅
// Salva no DB: celular = "35997258445"
```

### 3. Webhook do Unnichat (`/api/webhook/unnichat/ver-resultados`)

```javascript
// Webhook recebe: phone = "553597258445"
// normalizePhone("553597258445") → "35997258445"

// Busca no DB:
// 1. Exata: celular = "35997258445" ✅ ENCONTRADO
// 2. Se não: últimos 10 dígitos
// 3. Se não: últimos 9 dígitos
// 4. Se não: últimos 8 dígitos
```

### 4. Envio para Unnichat

```javascript
// Lead encontrado: celular = "35997258445"
// normalizePhone("35997258445") → "35997258445"
// formatPhoneForUnnichat("35997258445") → "5535997258445"
// POST /meta/messages: { phone: "5535997258445", ... } ✅
```

## Correção de Dados Antigos

Para corrigir telefones mal normalizados no banco:

```bash
# Modo dry-run (apenas visualiza)
node scripts/backfill-fix-phones.js --dry-run

# Aplicar correções
node scripts/backfill-fix-phones.js
```

O script identifica e corrige:
- Números com 10 dígitos que deveriam ter 11 (adiciona 9 após DDD)
- Números muito curtos (< 10 dígitos) são marcados para correção manual

## Testes

Execute os testes unitários para validar as regras:

```bash
node test-phone-normalization.js
```

Testes incluem todos os casos documentados em `docs/PROBLEMA_DE_NORMALIZACAO.md`.

## Referências

- Documento original: `docs/PROBLEMA_DE_NORMALIZACAO.md`
- Código fonte: `lib/phone.js`
- Validação frontend: `src/quiz.js` (linhas 223-268)
- API submit: `api/submit.js`
- Webhook: `api/webhook/unnichat/ver-resultados.js`

---

**Última atualização:** 2025-10-30  
**Versão das regras:** 2.0 (correção do bug de DDD)
