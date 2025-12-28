// FUNÇÕES TCM (migrado de api/utils/tcm)
const MAPEAMENTO_ELEMENTOS = {
  P2: { A: 'RIM', B: 'RIM', C: 'FÍGADO', D: 'BAÇO', E: 'CORAÇÃO', F: 'PULMÃO' },
  P4: { A: 'RIM', B: 'RIM', C: 'CORAÇÃO', D: 'BAÇO', E: 'FÍGADO', F: null },
  P5: { A: 'FÍGADO', B: 'BAÇO', C: 'PULMÃO', D: 'RIM', E: 'CORAÇÃO', F: null }
};

function contarElementos(respostas) {
  const contagem = { RIM: 0, FÍGADO: 0, BAÇO: 0, CORAÇÃO: 0, PULMÃO: 0 };
  if (respostas.P2 && Array.isArray(respostas.P2)) {
    respostas.P2.forEach(opcao => { const elemento = MAPEAMENTO_ELEMENTOS.P2[opcao]; if (elemento) contagem[elemento] += 3; });
  }
  if (respostas.P4 && Array.isArray(respostas.P4)) {
    respostas.P4.forEach(opcao => { const elemento = MAPEAMENTO_ELEMENTOS.P4[opcao]; if (elemento) contagem[elemento] += 2; });
  }
  if (respostas.P5) { const elemento = MAPEAMENTO_ELEMENTOS.P5[respostas.P5]; if (elemento) contagem[elemento] += 1; }
  return contagem;
}

function determinarElementoPrincipal(contagem) {
  let maxValor = 0; let elementoEscolhido = 'BAÇO';
  for (const [elemento, valor] of Object.entries(contagem)) { if (valor > maxValor) { maxValor = valor; elementoEscolhido = elemento; } }
  return elementoEscolhido;
}

function calcularIntensidade(respostas) { const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 }; return pesos[respostas.P1] || 3; }
function calcularUrgencia(respostas) { const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 }; return pesos[respostas.P8] || 3; }
function determinarQuadrante(intensidade, urgencia) { if (intensidade >= 4 && urgencia >= 4) return 1; if (intensidade >= 4 && urgencia <= 3) return 2; if (intensidade <= 3 && urgencia >= 4) return 3; return 4; }

function calcularLeadScore(respostas) {
  let score = 0;
  const pesoP1 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 }; score += pesoP1[respostas.P1] || 0;
  const pesoP3 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 }; score += pesoP3[respostas.P3] || 0;
  const pesoP7 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 }; score += pesoP7[respostas.P7] || 0;
  const pesoP8 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 }; score += pesoP8[respostas.P8] || 0;
  const pesoP11 = { 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6, 'F': 7, 'G': 8, 'H': 9, 'I': 10, 'J': 10 }; score += pesoP11[respostas.P11] || 0;
  if (respostas.P12 === 'A') score += 5;
  return Math.min(score, 100);
}

module.exports = { MAPEAMENTO_ELEMENTOS, contarElementos, determinarElementoPrincipal, calcularIntensidade, calcularUrgencia, determinarQuadrante, calcularLeadScore };
