// ========================================
// SISTEMA DE IDENTIFICAÇÃO DE ARQUÉTIPOS
// ========================================

export function calcularArquetipo(respostas) {
  const scores = {
    SILENT_WARRIOR: 0,
    SKEPTICAL_SCIENTIST: 0,
    ETERNAL_MOTHER: 0,
    RISING_PHOENIX: 0
  };
  
  // Mapeamentos de perguntas para arquétipos
  const mapeamentos = {
    P14: {
      'A': 'SILENT_WARRIOR',
      'B': 'SKEPTICAL_SCIENTIST',
      'C': 'ETERNAL_MOTHER',
      'D': 'RISING_PHOENIX'
    },
    P15: {
      'A': 'SILENT_WARRIOR',
      'B': 'SKEPTICAL_SCIENTIST',
      'C': 'ETERNAL_MOTHER',
      'D': 'RISING_PHOENIX'
    },
    P16: {
      'A': 'SKEPTICAL_SCIENTIST',
      'B': 'ETERNAL_MOTHER',
      'C': 'SILENT_WARRIOR',
      'D': 'RISING_PHOENIX',
      'E': null // Sem dúvidas
    }
  };
  
  // Calcular scores (peso 5 para cada pergunta)
  ['P14', 'P15', 'P16'].forEach(pergunta => {
    const resposta = respostas[pergunta];
    if (resposta && mapeamentos[pergunta][resposta]) {
      const arquetipo = mapeamentos[pergunta][resposta];
      if (arquetipo) {
        scores[arquetipo] += 5;
      }
    }
  });
  
  // Encontrar arquétipo vencedor
  let maxScore = 0;
  let arquetipoVencedor = 'SILENT_WARRIOR'; // default
  
  for (const [arquetipo, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      arquetipoVencedor = arquetipo;
    }
  }
  
  // Calcular objeção principal (de P16)
  const objecaoMap = {
    'A': 'DESCRENCA',
    'B': 'TEMPO_FAMILIA',
    'C': 'AUTONOMIA',
    'D': 'TRANSFORMACAO_SUPERFICIAL',
    'E': 'NENHUMA'
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
    confianca: maxScore >= 10 ? 'ALTA' : 'MEDIA',
    objecao_principal: objecaoPrincipal,
    autonomia_decisao: autonomiaDecisao,
    investimento_mensal_atual: investimentoMensal
  };
}

// ========================================
// DESCRIÇÕES DOS ARQUÉTIPOS
// ========================================

export const ARQUETIPOS_INFO = {
  SILENT_WARRIOR: {
    nome: 'A Guerreira Silenciosa',
    emoji: '🛡️',
    cor: 'cyan',
    descricao: 'Você é forte e independente, mas carrega tudo sozinha. Não gosta de pedir ajuda e tem medo de ser um peso para os outros.',
    medo_principal: 'Perder autonomia e depender da família',
    forca_principal: 'Resiliência e determinação',
    abordagem_vendas: 'Enfatize autonomia, independência e que ela vai APRENDER a se cuidar sozinha para sempre.',
    script_abertura: 'Percebo que você é uma pessoa forte e independente. O método do Mestre Ye te ensina a ser sua própria terapeuta, para sempre.'
  },
  SKEPTICAL_SCIENTIST: {
    nome: 'A Cientista Cética',
    emoji: '🔬',
    cor: 'blue',
    descricao: 'Você é analítica e precisa de provas antes de acreditar. Já tentou muita coisa que não funcionou.',
    medo_principal: 'Investir e não funcionar novamente',
    forca_principal: 'Capacidade analítica e pesquisa',
    abordagem_vendas: 'Mostre estudos científicos, casos comprovados, lógica clara de como funciona.',
    script_abertura: 'Entendo sua cautela. A MTC tem 5000 anos de evidências e milhares de estudos científicos modernos que comprovam sua eficácia.'
  },
  ETERNAL_MOTHER: {
    nome: 'A Mãe Eterna',
    emoji: '💚',
    cor: 'green',
    descricao: 'Você cuida de todo mundo, menos de você mesma. Sente culpa ao se priorizar.',
    medo_principal: 'Ser egoísta ou não ter tempo para cuidar dos outros',
    forca_principal: 'Generosidade e empatia',
    abordagem_vendas: 'Mostre que cuidar de si = cuidar melhor dos outros. Enfatize praticidade e economia de tempo.',
    script_abertura: 'Você só consegue cuidar bem da sua família se você estiver saudável. São apenas 15 minutos por dia para se renovar.'
  },
  RISING_PHOENIX: {
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
