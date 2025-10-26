// ========================================
// FUNÇÕES TCM - Medicina Tradicional Chinesa
// Cálculos de elementos, scoring e diagnóstico
// ========================================

const MAPEAMENTO_ELEMENTOS = {
  P2: {
    A: 'RIM', B: 'RIM', C: 'FÍGADO', D: 'BAÇO', E: 'CORAÇÃO', F: 'PULMÃO'
  },
  P4: {
    A: 'RIM', B: 'RIM', C: 'CORAÇÃO', D: 'BAÇO', E: 'FÍGADO', F: null
  },
  P5: {
    A: 'FÍGADO', B: 'BAÇO', C: 'PULMÃO', D: 'RIM', E: 'CORAÇÃO', F: null
  }
};

/**
 * Conta pontos de cada elemento TCM baseado nas respostas
 */
function contarElementos(respostas) {
  const contagem = { RIM: 0, FÍGADO: 0, BAÇO: 0, CORAÇÃO: 0, PULMÃO: 0 };
  
  // P2: Sintomas físicos (peso 3)
  if (respostas.P2 && Array.isArray(respostas.P2)) {
    respostas.P2.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P2[opcao];
      if (elemento) contagem[elemento] += 3;
    });
  }
  
  // P4: Sintomas adicionais (peso 2)
  if (respostas.P4 && Array.isArray(respostas.P4)) {
    respostas.P4.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P4[opcao];
      if (elemento) contagem[elemento] += 2;
    });
  }
  
  // P5: Estado emocional (peso 1)
  if (respostas.P5) {
    const elemento = MAPEAMENTO_ELEMENTOS.P5[respostas.P5];
    if (elemento) contagem[elemento] += 1;
  }
  
  return contagem;
}

/**
 * Determina elemento principal com maior pontuação
 */
function determinarElementoPrincipal(contagem) {
  let maxValor = 0;
  let elementoEscolhido = 'BAÇO'; // Fallback padrão
  
  for (const [elemento, valor] of Object.entries(contagem)) {
    if (valor > maxValor) {
      maxValor = valor;
      elementoEscolhido = elemento;
    }
  }
  
  return elementoEscolhido;
}

/**
 * Calcula intensidade da dor (P1)
 */
function calcularIntensidade(respostas) {
  const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
  return pesos[respostas.P1] || 3;
}

/**
 * Calcula urgência (P8)
 */
function calcularUrgencia(respostas) {
  const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
  return pesos[respostas.P8] || 3;
}

/**
 * Determina quadrante baseado em intensidade e urgência
 */
function determinarQuadrante(intensidade, urgencia) {
  if (intensidade >= 4 && urgencia >= 4) return 1; // Alta dor, alta urgência
  if (intensidade >= 4 && urgencia <= 3) return 2; // Alta dor, baixa urgência
  if (intensidade <= 3 && urgencia >= 4) return 3; // Baixa dor, alta urgência
  return 4; // Baixa dor, baixa urgência
}

/**
 * Calcula score do lead (0-100 pontos)
 */
function calcularLeadScore(respostas) {
  let score = 0;
  
  // P1: Intensidade da dor (20 pontos)
  const pesoP1 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP1[respostas.P1] || 0;
  
  // P3: Duração do problema (15 pontos)
  const pesoP3 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP3[respostas.P3] || 0;
  
  // P6: Tratamentos tentados (15 pontos)
  const pesoP6 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP6[respostas.P6] || 0;
  
  // P8: Urgência (20 pontos)
  const pesoP8 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP8[respostas.P8] || 0;
  
  // P9: Compromisso com evento (15 pontos)
  const pesoP9 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP9[respostas.P9] || 0;
  
  // P11: Faixa de renda (10 pontos)
  const pesoP11 = { 
    'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6, 
    'F': 7, 'G': 8, 'H': 9, 'I': 10, 'J': 10 
  };
  score += pesoP11[respostas.P11] || 0;
  
  // P12: Relacionamento com Mestre Ye (5 pontos)
  if (respostas.P12 === 'A') score += 5;
  
  return Math.min(score, 100);
}

module.exports = {
  MAPEAMENTO_ELEMENTOS,
  contarElementos,
  determinarElementoPrincipal,
  calcularIntensidade,
  calcularUrgencia,
  determinarQuadrante,
  calcularLeadScore
};
