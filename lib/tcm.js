// ========================================
// FUNÇÕES TCM
// ========================================
// ⚠️ Este arquivo NÃO contém lógica própria.
//
// Historicamente ele carregava uma cópia do cálculo MTC, que ficou defasada
// da estrutura nova de perguntas (lia P5 como emoção e P8 como urgência,
// que não existem mais). Agora ele apenas reexporta lib/calculos.js, a
// fonte única, para não quebrar os imports existentes em api/submit.js.
//
// Em código novo, importe direto de lib/calculos.js.
// ========================================

const {
  MAPEAMENTO_ELEMENTOS,
  contarElementos,
  determinarElementoPrincipal,
  calcularIntensidade,
  calcularUrgencia,
  determinarQuadrante,
  calcularLeadScore,
  determinarPrioridade,
  verificarHotLeadVIP,
  calcularIndiceHarmonia
} = require('./calculos');

module.exports = {
  MAPEAMENTO_ELEMENTOS,
  contarElementos,
  determinarElementoPrincipal,
  calcularIntensidade,
  calcularUrgencia,
  determinarQuadrante,
  calcularLeadScore,
  determinarPrioridade,
  verificarHotLeadVIP,
  calcularIndiceHarmonia
};
