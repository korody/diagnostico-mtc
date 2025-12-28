// ========================================
// SISTEMA DE IDENTIFICAÇÃO DE ARQUÉTIPOS
// ========================================

function calcularArquetipo(respostas) {
  const scores = {
    GUERREIRA_SILENCIOSA: 0,
    CIENTISTA_CETICA: 0,
    MAE_ETERNA: 0,
    FENIX_RENASCENTE: 0
  };
  
  // Mapeamentos de perguntas para arquétipos
  // P14: O que FAZ primeiro quando tem problema de saúde (peso 7)
  // P16: O que mais pesa na decisão sobre novo cuidado (peso 8)
  const mapeamentos = {
    P14: {
      peso: 7,
      map: {
        'A': 'GUERREIRA_SILENCIOSA',  // Espera melhorar naturalmente (independente)
        'B': 'CIENTISTA_CETICA',      // Procura informações (analítica)
        'C': 'MAE_ETERNA',            // Deixa para depois (prioriza outros)
        'D': 'FENIX_RENASCENTE'       // Reflete sobre causas (transformação)
      }
    },
    P16: {
      peso: 8,
      map: {
        'A': 'CIENTISTA_CETICA',      // Resultados comprovados (precisa de provas)
        'B': 'MAE_ETERNA',            // Encaixar na rotina (tempo)
        'C': 'GUERREIRA_SILENCIOSA',  // Flexibilidade (autonomia)
        'D': 'FENIX_RENASCENTE',      // Diferença duradoura (transformação)
        'E': null                      // Alinhado com momento (neutro)
      }
    }
  };
  
  // Calcular scores (pesos ajustados: P14=7, P16=8)
  ['P14', 'P16'].forEach(pergunta => {
    const resposta = respostas[pergunta];
    const config = mapeamentos[pergunta];
    
    if (resposta && config && config.map[resposta]) {
      const arquetipo = config.map[resposta];
      if (arquetipo) {
        scores[arquetipo] += config.peso;
      }
    }
  });
  
  // Encontrar arquétipo vencedor
  let maxScore = 0;
  let arquetipoVencedor = 'MAE_ETERNA'; // default
  
  for (const [arquetipo, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      arquetipoVencedor = arquetipo;
    }
  }
  
  // Calcular objeção principal (inferida de P16)
  // Agora baseado em "o que mais pesa na decisão"
  const objecaoMap = {
    'A': 'DESCRENCA',                    // Precisa de provas = desconfia
    'B': 'TEMPO_FAMILIA',                // Rotina = falta tempo
    'C': 'AUTONOMIA',                    // Flexibilidade = quer independência
    'D': 'TRANSFORMACAO_SUPERFICIAL',    // Diferença duradoura = medo do superficial
    'E': 'NENHUMA'                       // Alinhado = sem objeção aparente
  };
  
  const objecaoPrincipal = objecaoMap[respostas.P16] || 'DESCRENCA';
  
  // Calcular autonomia de decisão (de P19)
  const autonomiaMap = {
    'A': 'ALTA',
    'B': 'MEDIA_ALTA',
    'C': 'MEDIA',
    'D': 'BAIXA'
  };
  
  const autonomiaDecisao = autonomiaMap[respostas.P19] || 'MEDIA';
  
  // Calcular investimento mensal atual (de P20)
  let investimentoMensal = 0;
  if (respostas.P20 && Array.isArray(respostas.P20)) {
    const investimentoMap = {
      'A': 200, // Fisioterapia
      'B': 150, // Academia
      'C': 250, // Terapias alternativas
      'D': 100, // Suplementos
      'E': 300, // Consultas particulares
      'F': 0    // Não investe
    };
    respostas.P20.forEach(opcao => {
      investimentoMensal += investimentoMap[opcao] || 0;
    });
  }
  
  return {
    arquetipo_principal: arquetipoVencedor,
    scores_arquetipos: scores,
    confianca: maxScore >= 10 ? 0.8 : 0.5,  // 0.0 a 1.0 (80% ou 50%)
    objecao_principal: objecaoPrincipal,
    autonomia_decisao: autonomiaDecisao,
    investimento_mensal_atual: investimentoMensal
  };
}

// ========================================
// DESCRIÇÕES DOS ARQUÉTIPOS
// ========================================

const ARQUETIPOS_INFO = {
  GUERREIRA_SILENCIOSA: {
    nome: 'A Guerreira Silenciosa',
    emoji: '🛡️',
    cor: 'cyan',
    descricao: 'Você é forte e independente, mas carrega tudo sozinha. Não gosta de pedir ajuda e tem medo de ser um peso para os outros.',
    medo_principal: 'Perder autonomia e depender da família',
    forca_principal: 'Resiliência e determinação',
    abordagem_vendas: 'Enfatize autonomia, independência e que ela vai APRENDER a se cuidar sozinha para sempre.',
    script_abertura: 'Percebo que você é uma pessoa forte e independente. O método do Mestre Ye te ensina a ser sua própria terapeuta, para sempre.'
  },
  CIENTISTA_CETICA: {
    nome: 'A Cientista Cética',
    emoji: '🔬',
    cor: 'blue',
    descricao: 'Você é analítica e precisa de provas antes de acreditar. Já tentou muita coisa que não funcionou.',
    medo_principal: 'Investir e não funcionar novamente',
    forca_principal: 'Capacidade analítica e pesquisa',
    abordagem_vendas: 'Mostre estudos científicos, casos comprovados, lógica clara de como funciona.',
    script_abertura: 'Entendo sua cautela. A MTC tem 5000 anos de evidências e milhares de estudos científicos modernos que comprovam sua eficácia.'
  },
  MAE_ETERNA: {
    nome: 'A Mãe Eterna',
    emoji: '💚',
    cor: 'green',
    descricao: 'Você cuida de todo mundo, menos de você mesma. Sente culpa ao se priorizar.',
    medo_principal: 'Ser egoísta ou não ter tempo para cuidar dos outros',
    forca_principal: 'Generosidade e empatia',
    abordagem_vendas: 'Mostre que cuidar de si = cuidar melhor dos outros. Enfatize praticidade e economia de tempo.',
    script_abertura: 'Você só consegue cuidar bem da sua família se você estiver saudável. São apenas 15 minutos por dia para se renovar.'
  },
  FENIX_RENASCENTE: {
    nome: 'A Fênix Renascente',
    emoji: '🔥',
    cor: 'orange',
    descricao: 'Você busca transformação profunda e novo propósito de vida. Para você, não é só sobre a dor física.',
    medo_principal: 'Solução superficial que não transforma de verdade',
    forca_principal: 'Coragem e busca por propósito',
    abordagem_vendas: 'Fale de jornada, transformação, renascimento. Não é tratamento, é reinvenção.',
    script_abertura: 'Você está pronta para uma verdadeira jornada de transformação. A MTC não trata só sintomas, ela reconecta você com seu propósito.'
  }
};

// CommonJS exports
module.exports = { calcularArquetipo, ARQUETIPOS_INFO };
