// ========================================
// SISTEMA DE DIAGNÓSTICO MTC
// Medicina Tradicional Chinesa - 5 Elementos + Arquétipos
// ========================================

const { calcularArquetipo } = require('./calcularArquetipo');

// ========================================
// 1. MAPEAMENTO DE ELEMENTOS POR PERGUNTA
// ========================================
//
// NOVA ESTRUTURA (Julho 2026):
// - P2: Regiões do corpo (múltipla, max 2)
// - P4: Sinais que percebe (múltipla, max 3) - opções A-J
// - P7: Emoção que acompanha (antiga P5)
// ========================================

const MAPEAMENTO_ELEMENTOS = {
  // P2: Em quais regiões seu corpo costuma chamar mais sua atenção?
  P2: {
    A: 'RIM',      // Lombar e coluna
    B: 'RIM',      // Joelhos e articulações
    C: 'FÍGADO',   // Pescoço e ombros
    D: 'BAÇO',     // Digestão ou intestino
    E: 'CORAÇÃO',  // Sono, coração ou ansiedade
    F: 'PULMÃO',   // Respiração
    G: 'RIM'       // Zumbido, tontura ou equilíbrio
  },
  // P4: Quais destes sinais você também percebe? (até 3)
  P4: {
    A: 'RIM',      // Muito cansaço
    B: 'RIM',      // Mãos e pés frios
    C: 'CORAÇÃO',  // Sono ruim
    D: 'CORAÇÃO',  // Ansiedade
    E: 'BAÇO',     // Digestão lenta
    F: 'BAÇO',     // Inchaço
    G: 'FÍGADO',   // Irritabilidade
    H: 'RIM',      // Zumbido
    I: 'RIM',      // Tontura
    J: null        // Nenhum
  },
  // P7: Qual emoção mais tem acompanhado você? (antiga P5)
  P7: {
    A: 'BAÇO',     // Preocupação constante
    B: 'FÍGADO',   // Irritação fácil
    C: 'PULMÃO',   // Tristeza
    D: 'RIM',      // Medo
    E: 'CORAÇÃO',  // Ansiedade
    F: null        // Nenhuma dessas
  }
};

// ========================================
// 2. TEXTOS DE DIAGNÓSTICO PERSONALIZADOS
// ========================================

const DIAGNOSTICOS_POR_ELEMENTO = {
  RIM: {
    nome: "Elemento ÁGUA (Rins)",
    descricao: "Seu diagnóstico indica um desequilíbrio no elemento ÁGUA, relacionado aos Rins na Medicina Tradicional Chinesa.",
    sintomas_comuns: [
      "Dores lombares e nas costas",
      "Fraqueza nas pernas e joelhos",
      "Sensação de medo ou insegurança",
      "Cansaço profundo e falta de vitalidade",
      "Problemas urinários ou reprodutivos"
    ],
    causa_emocional: "O elemento Água está relacionado ao medo, insegurança e esgotamento. Quando os Rins estão fracos, você pode se sentir sem 'base' ou suporte na vida.",
    recomendacao: "É fundamental fortalecer sua energia vital (Qi) através de práticas que nutram os Rins. O Qi Gong e a acupuntura são extremamente eficazes para restaurar essa energia essencial.",
    mensagem_acolhedora: "Você não está sozinha nessa jornada. Muitas mulheres enfrentam o enfraquecimento do elemento Água, especialmente após os 40 anos. A boa notícia é que com as práticas certas, você pode recuperar sua vitalidade e força interior."
  },
  
  FÍGADO: {
    nome: "Elemento MADEIRA (Fígado)",
    descricao: "Seu diagnóstico indica um desequilíbrio no elemento MADEIRA, relacionado ao Fígado na Medicina Tradicional Chinesa.",
    sintomas_comuns: [
      "Tensão nos ombros, pescoço e mandíbula",
      "Dores de cabeça frequentes",
      "Irritabilidade e impaciência",
      "Rigidez muscular",
      "Dificuldade para relaxar"
    ],
    causa_emocional: "O elemento Madeira está relacionado à raiva reprimida, frustração e estresse acumulado. Quando o Fígado está congestionado, você pode sentir 'pressão' constante e explosões emocionais.",
    recomendacao: "É essencial desbloquear a energia estagnada através de movimentos suaves e respiração consciente. O Qi Gong é especialmente poderoso para 'soltar' essa tensão acumulada.",
    mensagem_acolhedora: "Seu corpo está pedindo para você desacelerar e liberar as tensões guardadas. Com as técnicas certas de Qi Gong, você pode transformar essa rigidez em fluidez e reconquistar sua paz interior."
  },
  
  BAÇO: {
    nome: "Elemento TERRA (Baço/Pâncreas)",
    descricao: "Seu diagnóstico indica um desequilíbrio no elemento TERRA, relacionado ao Baço e Estômago na Medicina Tradicional Chinesa.",
    sintomas_comuns: [
      "Cansaço profundo e falta de energia",
      "Problemas digestivos",
      "Preocupação excessiva",
      "Pensamentos repetitivos",
      "Sensação de 'peso' no corpo"
    ],
    causa_emocional: "O elemento Terra está relacionado à preocupação excessiva e ao hábito de cuidar demais dos outros e pouco de si mesma. Quando o Baço está enfraquecido, você se sente esgotada.",
    recomendacao: "É hora de nutrir a si mesma! Práticas de Qi Gong que fortalecem o centro energético (Dan Tian) vão restaurar sua vitalidade e capacidade digestiva.",
    mensagem_acolhedora: "Você sempre cuida de todos ao seu redor, mas esqueceu de cuidar de si mesma. Está na hora de recuperar sua energia e aprender que você também merece ser cuidada. O Qi Gong vai te ensinar a se nutrir por dentro."
  },
  
  CORAÇÃO: {
    nome: "Elemento FOGO (Coração)",
    descricao: "Seu diagnóstico indica um desequilíbrio no elemento FOGO, relacionado ao Coração na Medicina Tradicional Chinesa.",
    sintomas_comuns: [
      "Insônia ou sono agitado",
      "Ansiedade e palpitações",
      "Agitação mental constante",
      "Dificuldade de concentração",
      "Sensação de 'coração acelerado'"
    ],
    causa_emocional: "O elemento Fogo está relacionado à ansiedade, agitação e excesso de estímulos mentais. Quando o Coração está desequilibrado, você sente que a 'chama' interna está descontrolada.",
    recomendacao: "É fundamental acalmar o Shen (espírito) através de práticas meditativas e respiração profunda. O Qi Gong vai ensinar seu corpo a encontrar o ritmo natural e a paz interior.",
    mensagem_acolhedora: "Sua mente está acelerada demais, e isso está afetando seu coração e seu sono. Com as práticas certas, você vai aprender a acalmar essa 'tempestade interna' e reconquistar sua serenidade."
  },
  
  PULMÃO: {
    nome: "Elemento METAL (Pulmões)",
    descricao: "Seu diagnóstico indica um desequilíbrio no elemento METAL, relacionado aos Pulmões na Medicina Tradicional Chinesa.",
    sintomas_comuns: [
      "Problemas respiratórios",
      "Resfriados frequentes",
      "Tristeza ou melancolia",
      "Dificuldade para 'soltar' e seguir em frente",
      "Sensação de aperto no peito"
    ],
    causa_emocional: "O elemento Metal está relacionado à tristeza, luto e dificuldade de deixar ir. Quando os Pulmões estão fracos, você pode sentir 'peso' no peito e respiração superficial.",
    recomendacao: "É essencial expandir a capacidade respiratória e liberar emoções guardadas. O Qi Gong respiratório é extremamente poderoso para fortalecer os Pulmões e renovar sua energia.",
    mensagem_acolhedora: "Você está guardando muita tristeza no peito. Está na hora de respirar fundo e deixar ir o que não serve mais. Com as técnicas de Qi Gong, você vai aprender a 'soltar' e se renovar."
  }
};

// ========================================
// 3. FUNÇÃO PRINCIPAL: CONTAR ELEMENTOS
// ========================================

function contarElementos(respostas) {
  const contagem = {
    RIM: 0,
    FÍGADO: 0,
    BAÇO: 0,
    CORAÇÃO: 0,
    PULMÃO: 0
  };
  
  // Contar P2 (localização da dor) - PESO 3
  if (respostas.P2 && Array.isArray(respostas.P2)) {
    respostas.P2.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P2[opcao];
      if (elemento) {
        contagem[elemento] += 3;
      }
    });
  }
  
  // Contar P4 (sintomas físicos) - PESO 2
  if (respostas.P4 && Array.isArray(respostas.P4)) {
    respostas.P4.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P4[opcao];
      if (elemento) {
        contagem[elemento] += 2;
      }
    });
  }
  
  // Contar P7 (emoção que acompanha - antiga P5) - PESO 1
  if (respostas.P7) {
    const elemento = MAPEAMENTO_ELEMENTOS.P7[respostas.P7];
    if (elemento) {
      contagem[elemento] += 1;
    }
  }

  return contagem;
}

// ========================================
// 4. DETERMINAR ELEMENTO PRINCIPAL
// ========================================

function determinarElementoPrincipal(contagem) {
  // Encontrar o maior valor
  let maxValor = 0;
  let elementosEmpatados = [];
  
  for (const [elemento, valor] of Object.entries(contagem)) {
    if (valor > maxValor) {
      maxValor = valor;
      elementosEmpatados = [elemento];
    } else if (valor === maxValor && valor > 0) {
      elementosEmpatados.push(elemento);
    }
  }
  
  // Se não houver nenhum elemento (todas respostas neutras)
  if (elementosEmpatados.length === 0 || maxValor === 0) {
    return 'BAÇO'; // Default para Terra (centro)
  }
  
  // Se houver empate, usar ordem de prioridade
  if (elementosEmpatados.length > 1) {
    const prioridade = ['RIM', 'FÍGADO', 'BAÇO', 'CORAÇÃO', 'PULMÃO'];
    for (const elemento of prioridade) {
      if (elementosEmpatados.includes(elemento)) {
        return elemento;
      }
    }
  }
  
  return elementosEmpatados[0];
}

// ========================================
// 5. CALCULAR INTENSIDADE (0-5)
// ========================================

function calcularIntensidade(respostas) {
  // P1: Intensidade das dores
  const pesoP1 = {
    'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1
  };
  
  return pesoP1[respostas.P1] || 3;
}

// ========================================
// 6. CALCULAR URGÊNCIA (0-5)
// ========================================
// NOTA: P8 (urgência direta) foi removida na nova estrutura.
// Agora inferimos urgência a partir de P10 (preocupação se nada mudar)
// e P1 (intensidade dos sintomas).

function calcularUrgencia(respostas) {
  // P10: Se nada mudar, qual situação mais preocupa você?
  const pesoP10 = {
    'A': 5, // Perder minha autonomia
    'B': 4, // Continuar convivendo com dor
    'C': 4, // Precisar depender da família
    'D': 3, // Ver minha saúde piorar aos poucos
    'E': 3  // Não conseguir aproveitar a aposentadoria
  };

  // Se tem P10, usa ela como base
  if (respostas.P10) {
    return pesoP10[respostas.P10] || 3;
  }

  // Fallback: inferir de P1 (intensidade)
  const pesoP1 = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
  return pesoP1[respostas.P1] || 3;
}

// ========================================
// 7. DETERMINAR QUADRANTE (1-4)
// ========================================

function determinarQuadrante(intensidade, urgencia) {
  // Q1: Alta intensidade (4-5) + Alta urgência (4-5) = HOT LEAD
  if (intensidade >= 4 && urgencia >= 4) return 1;
  
  // Q2: Alta intensidade (4-5) + Baixa urgência (1-3)
  if (intensidade >= 4 && urgencia <= 3) return 2;
  
  // Q3: Baixa intensidade (1-3) + Alta urgência (4-5)
  if (intensidade <= 3 && urgencia >= 4) return 3;
  
  // Q4: Baixa intensidade (1-3) + Baixa urgência (1-3)
  return 4;
}

// ========================================
// 8. GERAR CÓDIGO DE PERFIL
// ========================================

function gerarCodigoPerfil(elemento, intensidade) {
  const codigoElemento = {
    'RIM': 'RI',
    'FÍGADO': 'FI',
    'BAÇO': 'BA',
    'CORAÇÃO': 'CO',
    'PULMÃO': 'PU'
  };
  
  return `${codigoElemento[elemento]}-${intensidade}`;
}

// ========================================
// 9. GERAR DIAGNÓSTICO COMPLETO
// ========================================

function gerarDiagnosticoResumo(elemento, respostas) {
  const diagnostico = DIAGNOSTICOS_POR_ELEMENTO[elemento];
  
  if (!diagnostico) {
    return "Diagnóstico indisponível";
  }
  
  // Montar texto personalizado
  let texto = `${diagnostico.descricao}\n\n`;
  texto += `**Sintomas identificados:**\n`;
  texto += diagnostico.sintomas_comuns.slice(0, 3).join(', ') + '.\n\n';
  texto += `**Causa energética:** ${diagnostico.causa_emocional}\n\n`;
  texto += `**Recomendação:** ${diagnostico.recomendacao}\n\n`;
  texto += `💚 ${diagnostico.mensagem_acolhedora}`;
  
  return texto;
}

// ========================================
// 10. CALCULAR LEAD SCORE (0-100)
// ========================================
// NOVA ESTRUTURA (Julho 2026):
// - P1: Intensidade (0-25 pontos)
// - P3: Tempo de sintomas (0-20 pontos)
// - P10: Preocupação se nada mudar (0-25 pontos)
// - P12: Custo mensal atual (0-15 pontos)
// - P19: Renda mensal (0-10 pontos)
// - P16: Já é aluno (0-5 pontos)

function calcularLeadScore(respostas) {
  let score = 0;

  // P1: Intensidade das dores (0-25 pontos)
  const pesoP1 = { 'A': 25, 'B': 20, 'C': 15, 'D': 10, 'E': 5 };
  score += pesoP1[respostas.P1] || 0;

  // P3: Tempo de sintomas (0-20 pontos)
  const pesoP3 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP3[respostas.P3] || 0;

  // P10: Preocupação se nada mudar (0-25 pontos)
  const pesoP10 = { 'A': 25, 'B': 20, 'C': 20, 'D': 15, 'E': 15 };
  score += pesoP10[respostas.P10] || 0;

  // P12: Custo mensal atual (0-15 pontos) - quem gasta mais tem mais dor
  const pesoP12 = {
    'A': 5,  // Menos de R$ 100
    'B': 8,  // R$ 100-300
    'C': 10, // R$ 300-500
    'D': 13, // R$ 500-1000
    'E': 15, // Mais de R$ 1000
    'F': 3   // Não gasta nada
  };
  score += pesoP12[respostas.P12] || 0;

  // P19: Renda mensal (0-10 pontos)
  const pesoP19 = {
    'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6,
    'F': 7, 'G': 8, 'H': 9, 'I': 10, 'J': 10
  };
  score += pesoP19[respostas.P19] || 0;

  // P16: Já é aluno do Mestre Ye (0-5 pontos)
  // B = Sim, já fiz curso = lead mais qualificado
  if (respostas.P16 === 'B') score += 5;

  return Math.min(score, 100); // Garantir máximo de 100
}

// ========================================
// 11. DETERMINAR PRIORIDADE
// ========================================

function determinarPrioridade(leadScore) {
  if (leadScore >= 70) return 'ALTA';
  if (leadScore >= 40) return 'MÉDIA';
  return 'BAIXA';
}

// ========================================
// 12. VERIFICAR SE É HOT LEAD VIP
// ========================================

function verificarHotLeadVIP(leadScore, quadrante, respostas) {
  // Critérios para HOT LEAD VIP
  if (leadScore >= 80) return true;
  if (quadrante === 1) return true;
  // P1 = A (dores limitam muito) + P10 = A (medo de perder autonomia)
  if (respostas.P1 === 'A' && respostas.P10 === 'A') return true;

  return false;
}

// ========================================
// 13. GERAR SCRIPT DE ABERTURA
// ========================================

function gerarScriptAbertura(elemento, nome, respostas) {
  const scripts = {
    RIM: `Olá ${nome}! 👋

Vi que você está sentindo dores lombares e fraqueza nas pernas. Isso é muito comum quando o elemento ÁGUA (Rins) está enfraquecido na Medicina Tradicional Chinesa.

A boa notícia é que o Mestre Ye tem ajudado centenas de mulheres a recuperarem sua vitalidade através de técnicas milenares de Qi Gong! 🌊

Você sabia que os Rins são considerados a "raiz da vida" na MTC? Quando eles estão fortes, você sente energia, confiança e segurança.`,

    FÍGADO: `Oi ${nome}! 👋

Notei que você mencionou tensão nos ombros e irritabilidade. Esses são sinais clássicos de que o elemento MADEIRA (Fígado) precisa de atenção na Medicina Tradicional Chinesa.

O Mestre Ye especializa-se em desbloquear essa energia estagnada através do Qi Gong! 🌳

Quando o Fígado está equilibrado, você sente leveza, flexibilidade e paz interior.`,

    BAÇO: `Olá ${nome}! 👋

Vi que você está com cansaço profundo e preocupações excessivas. Isso indica que o elemento TERRA (Baço) está precisando de cuidado na Medicina Tradicional Chinesa.

O Mestre Ye tem técnicas específicas de Qi Gong para fortalecer seu centro energético e recuperar sua vitalidade! 🌍

Quando o Baço está forte, você sente energia, clareza mental e capacidade de cuidar de si mesma.`,

    CORAÇÃO: `Oi ${nome}! 👋

Notei que você mencionou insônia e ansiedade. Esses são sinais de que o elemento FOGO (Coração) está desequilibrado na Medicina Tradicional Chinesa.

O Mestre Ye ensina técnicas de Qi Gong para acalmar o Shen (espírito) e trazer paz interior! 🔥

Quando o Coração está equilibrado, você dorme profundamente, pensa com clareza e sente alegria.`,

    PULMÃO: `Olá ${nome}! 👋

Vi que você tem problemas respiratórios e tristeza. Isso mostra que o elemento METAL (Pulmões) precisa ser fortalecido na Medicina Tradicional Chinesa.

O Mestre Ye tem práticas especiais de Qi Gong respiratório que vão renovar sua energia! 💨

Quando os Pulmões estão fortes, você respira profundamente, solta o que não serve e se renova.`
  };
  
  return scripts[elemento] || scripts['BAÇO'];
}

// ========================================
// 14. GERAR SCRIPT DE OFERTA
// ========================================

function gerarScriptOferta(quadrante, leadScore, respostas) {
  const renda = respostas.P19; // Nova estrutura: P19 = renda
  const intensidade = respostas.P1;

  // HOT LEAD VIP - Alta renda + Alta intensidade
  if (quadrante === 1 && leadScore >= 80 && ['F', 'G', 'H', 'I', 'J'].includes(renda)) {
    return {
      oferta: "Programa VIP Personalizado (12 meses)",
      valor: "R$ 12.000 - R$ 18.000",
      beneficios: [
        "Acompanhamento individualizado com Mestre Ye",
        "Sessões semanais de Qi Gong personalizado",
        "Acupuntura + Fitoterapia Chinesa",
        "Grupo VIP exclusivo no WhatsApp",
        "Retiros trimestrais presenciais"
      ],
      abordagem: "Apresentar como investimento em saúde vitalícia. Enfatizar exclusividade e resultados comprovados."
    };
  }
  
  // Lead qualificado - Programa intermediário
  if (leadScore >= 60 && ['D', 'E', 'F', 'G'].includes(renda)) {
    return {
      oferta: "Programa Semestral de Transformação (6 meses)",
      valor: "R$ 4.200 - R$ 7.200",
      beneficios: [
        "Aulas em grupo 2x por semana",
        "Protocolo personalizado de Qi Gong",
        "Consultoria inicial com Mestre Ye",
        "Material didático completo",
        "Suporte via grupo no WhatsApp"
      ],
      abordagem: "Focar nos resultados em médio prazo. Mostrar casos de sucesso similares."
    };
  }
  
  // Lead iniciante - Workshop introdutório
  return {
    oferta: "Workshop Intensivo Black November (3 dias)",
    valor: "R$ 497 - R$ 997",
    beneficios: [
      "3 dias de imersão com Mestre Ye",
      "Aprenda 5 exercícios essenciais de Qi Gong",
      "Diagnóstico personalizado",
      "Material de apoio digital",
      "Certificado de participação"
    ],
    abordagem: "Convite especial para o evento. Criar senso de urgência (vagas limitadas)."
  };
}

// ========================================
// 15. CALCULAR ÍNDICE DE HARMONIA (0-100)
// ========================================
// Mede o equilíbrio energético do lead
// Quanto MAIOR, mais equilibrado (harmônico)
// Quanto MENOR, mais desequilibrado (precisa de ajuda)

function calcularIndiceHarmonia(contagem, intensidade, urgencia) {
  // Base: 100 pontos (harmonia perfeita)
  let harmonia = 100;

  // 1. Concentração Elementar (desconta 0-40 pontos)
  // Se energia muito concentrada em um elemento = mais desequilíbrio
  const valores = Object.values(contagem);
  const total = valores.reduce((a, b) => a + b, 0);

  if (total > 0) {
    const max = Math.max(...valores);
    const concentracao = (max / total) * 40;
    harmonia -= concentracao;
  }

  // 2. Intensidade dos Sintomas (desconta 0-30 pontos)
  // Sintomas mais intensos = mais desequilíbrio
  const descontoIntensidade = (intensidade / 5) * 30;
  harmonia -= descontoIntensidade;

  // 3. Cronicidade/Urgência (desconta 0-30 pontos)
  // Mais urgência = mais desequilíbrio
  const descontoCronicidade = (urgencia / 5) * 30;
  harmonia -= descontoCronicidade;

  // Garantir que fique entre 0 e 100
  return Math.max(0, Math.min(100, Math.round(harmonia)));
}

// ========================================
// 16. FUNÇÃO PRINCIPAL EXPORTADA
// ========================================

function calcularDiagnostico(respostas) {
  // 1. Contar elementos
  const contagem = contarElementos(respostas);
  
  // 2. Determinar elemento principal
  const elementoPrincipal = determinarElementoPrincipal(contagem);
  
  // 3. Calcular intensidade e urgência
  const intensidade = calcularIntensidade(respostas);
  const urgencia = calcularUrgencia(respostas);
  
  // 4. Determinar quadrante
  const quadrante = determinarQuadrante(intensidade, urgencia);
  
  // 5. Gerar código de perfil
  const codigoPerfil = gerarCodigoPerfil(elementoPrincipal, intensidade);
  
  // 6. Buscar informações do elemento
  const infoElemento = DIAGNOSTICOS_POR_ELEMENTO[elementoPrincipal];
  
  // 7. Gerar diagnóstico resumido
  const diagnosticoResumo = gerarDiagnosticoResumo(elementoPrincipal, respostas);
  
  // 8. Calcular lead score
  const leadScore = calcularLeadScore(respostas);
  
  // 9. Determinar prioridade
  const prioridade = determinarPrioridade(leadScore);
  
  // 10. Verificar se é HOT LEAD VIP
  const isHotLeadVIP = verificarHotLeadVIP(leadScore, quadrante, respostas);
  
  // 11. Calcular arquétipo e dados comportamentais
  const dadosArquetipo = calcularArquetipo(respostas);

  // 12. Calcular índice de harmonia
  const indiceHarmonia = calcularIndiceHarmonia(contagem, intensidade, urgencia);

  // 13. Gerar scripts (nome será preenchido depois)
  const scriptAbertura = gerarScriptAbertura(elementoPrincipal, '[NOME]', respostas);
  const scriptOferta = gerarScriptOferta(quadrante, leadScore, respostas);
  
  // 13. Retornar objeto completo
  return {
    // Diagnóstico MTC
    elemento_principal: elementoPrincipal,
    codigo_perfil: codigoPerfil,
    nome_perfil: infoElemento.nome,
    quadrante: quadrante,
    diagnostico_resumo: diagnosticoResumo,
    
    // Scoring
    lead_score: leadScore,
    indice_harmonia: indiceHarmonia,
    prioridade: prioridade,
    is_hot_lead_vip: isHotLeadVIP,
    
    // Dados Comportamentais (NOVOS)
    arquetipo_principal: dadosArquetipo.arquetipo_principal,
    scores_arquetipos: dadosArquetipo.scores_arquetipos,
    confianca_arquetipo: dadosArquetipo.confianca,
    objecao_principal: dadosArquetipo.objecao_principal,
    autonomia_decisao: dadosArquetipo.autonomia_decisao,
    investimento_mensal_atual: dadosArquetipo.investimento_mensal_atual,
    
    // Scripts de vendas
    script_abertura: scriptAbertura,
    script_oferta_recomendada: JSON.stringify(scriptOferta),
    
    // Dados extras para análise
    contagem_elementos: contagem,
    intensidade_calculada: intensidade,
    urgencia_calculada: urgencia
  };
}

// ========================================
// 16. FUNÇÃO AUXILIAR PARA SUBSTITUIR NOME
// ========================================

function personalizarScript(script, nome) {
  return script.replace(/\[NOME\]/g, nome);
}

// ========================================
// EXPORTS
// ========================================
// Este arquivo e a FONTE UNICA da logica de diagnostico MTC.
// - lib/tcm.js reexporta daqui (consumido por api/submit.js em producao)
// - server.js (dev local) tambem consome daqui
// Nao duplicar nenhuma destas funcoes em outro arquivo.

module.exports = {
  // Dados
  MAPEAMENTO_ELEMENTOS,
  DIAGNOSTICOS_POR_ELEMENTO,

  // Etapas do calculo
  contarElementos,
  determinarElementoPrincipal,
  calcularIntensidade,
  calcularUrgencia,
  determinarQuadrante,
  gerarCodigoPerfil,
  gerarDiagnosticoResumo,
  calcularLeadScore,
  determinarPrioridade,
  verificarHotLeadVIP,
  calcularIndiceHarmonia,
  gerarScriptAbertura,
  gerarScriptOferta,

  // Entradas principais
  calcularDiagnostico,
  personalizarScript
};

// ========================================
// FIM DO ARQUIVO
// ========================================