# Sistema de Funis Múltiplos - Documentação

## Visão Geral

O Quiz MTC agora suporta **2 funis diferentes**:

1. **Funil Perpétuo** (padrão) → Página de resultados `/resultados.html`
2. **Funil de Lançamento** → URL customizada

## Como Usar

### 1. Funil Perpétuo (Padrão)

Quando o usuário acessa o quiz **sem parâmetro** ou com `?funil=perpetuo`, ele será direcionado para a página de resultados padrão:

```
https://quiz.qigongbrasil.com/?funil=perpetuo
```

**Destino após completar o quiz:**
```
/resultados.html?email=user@example.com
```

### 2. Funil de Lançamento

Quando o usuário acessa o quiz com `?funil=lancamento`, ele será direcionado para a URL do funil de lançamento:

```
https://quiz.qigongbrasil.com/?funil=lancamento
```

**Destino após completar o quiz:**
```
https://mestre-ye.vercel.app?email=user@example.com
```

## Configuração da URL do Funil de Lançamento

Para alterar a URL do funil de lançamento, edite o arquivo `src/quiz.js`:

```javascript
if (funil === 'lancamento') {
  // CONFIGURAÇÃO: Altere esta URL para a página do seu funil de lançamento
  redirectUrl = `https://mestre-ye.vercel.app?email=${encodeURIComponent(dadosLead.EMAIL)}`;
}
```

## Exemplos de URLs de Entrada

### Funil Perpétuo
```
https://quiz.qigongbrasil.com/
https://quiz.qigongbrasil.com/?funil=perpetuo
https://quiz.qigongbrasil.com/?nome=João&email=joao@example.com&funil=perpetuo
```

### Funil de Lançamento
```
https://quiz.qigongbrasil.com/?funil=lancamento
https://quiz.qigongbrasil.com/?nome=Maria&email=maria@example.com&funil=lancamento
```

## Combinação com Outros Parâmetros

O parâmetro `funil` pode ser combinado com outros parâmetros de URL:

```
https://quiz.qigongbrasil.com/?nome=João&email=joao@email.com&celular=5511999999999&funil=lancamento
```

Quando o usuário já vem com dados preenchidos (nome, email, celular), o quiz:
1. Pula a etapa de identificação
2. Vai direto para as perguntas
3. Ao finalizar, redireciona para o funil especificado

## Rastreamento

O tipo de funil é salvo no banco de dados (Supabase) no campo `funil`:
- `"perpetuo"` - Funil perpétuo
- `"lancamento"` - Funil de lançamento

Isso permite:
- Análise de conversão por funil
- Segmentação de leads por origem
- Métricas separadas para cada funil

## Implementação Técnica

### Frontend (quiz.js)

1. **Captura o parâmetro da URL:**
```javascript
funil: getParam('funil', 'funnel') || 'perpetuo'
```

2. **Salva no estado do componente:**
```javascript
const [funil, setFunil] = useState(urlParams.funil);
```

3. **Envia no payload para o backend:**
```javascript
const payload = {
  lead: { ... },
  respostas: { ... },
  funil: funil
};
```

4. **Redireciona baseado no funil:**
```javascript
if (funil === 'lancamento') {
  redirectUrl = 'https://mestre-ye.vercel.app?email=...';
} else {
  redirectUrl = '/resultados.html?email=...';
}
```

### Backend (server.js)

1. **Recebe o parâmetro:**
```javascript
const { lead, respostas, funil } = req.body;
```

2. **Salva no banco de dados:**
```javascript
const dadosParaSalvar = {
  // ... outros campos
  funil: funil || 'perpetuo'
};
```

## Estrutura do Banco de Dados

### Tabela: `leads`

Nova coluna adicionada:

| Campo  | Tipo | Descrição |
|--------|------|-----------|
| `funil` | `text` | Tipo do funil: `"perpetuo"` ou `"lancamento"` |

## Casos de Uso

### Campanha de Lançamento

Durante um período de lançamento, você pode:
1. Configurar a URL do funil de lançamento
2. Compartilhar links com `?funil=lancamento`
3. Direcionar todos os leads para a página de lançamento
4. Analisar conversões separadamente

### A/B Testing

Você pode fazer testes A/B:
- **Grupo A:** `?funil=perpetuo` (VSL padrão)
- **Grupo B:** `?funil=lancamento` (VSL de lançamento)

E comparar as taxas de conversão de cada grupo.

### Segmentação por Origem

Diferentes fontes de tráfego podem usar funis diferentes:
- **Tráfego orgânico:** Funil perpétuo
- **Campanha paga:** Funil de lançamento
- **Afiliados:** Funil customizado

## Próximos Passos

Se você precisar de **mais de 2 funis**, você pode:

1. Adicionar novos valores para o parâmetro `funil`:
   - `?funil=afiliados`
   - `?funil=evergreen`
   - `?funil=webinar`

2. Adicionar novas condições no redirecionamento:
```javascript
if (funil === 'lancamento') {
  redirectUrl = 'https://lancamento.qigongbrasil.com';
} else if (funil === 'afiliados') {
  redirectUrl = 'https://afiliados.qigongbrasil.com';
} else if (funil === 'webinar') {
  redirectUrl = 'https://webinar.qigongbrasil.com';
} else {
  redirectUrl = '/resultados.html'; // Padrão
}
```

## Suporte

Se precisar de ajuda ou tiver dúvidas, consulte:
- Código fonte: `src/quiz.js` (linhas 9-28, 688-703)
- Backend: `server.js` (linha 589)
