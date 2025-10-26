// ========================================
// DIAGNÓSTICOS LOADER
// Carrega diagnosticos.json uma vez por cold start
// ========================================

const fs = require('fs');
const path = require('path');

let diagnosticosData = null;

function getDiagnosticos() {
  if (!diagnosticosData) {
    const diagnosticosPath = path.join(process.cwd(), 'api', 'diagnosticos.json');
    diagnosticosData = JSON.parse(fs.readFileSync(diagnosticosPath, 'utf8'));
  }
  return diagnosticosData;
}

module.exports = { getDiagnosticos };
