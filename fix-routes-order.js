// Script para mover rotas do dashboard para antes do app.listen()
const fs = require('fs');

const content = fs.readFileSync('server.js', 'utf-8');
const lines = content.split('\n');

// Encontrar índices
const listenIndex = lines.findIndex(l => l.includes('app.listen(PORT'));
const dashboardRoutesStart = lines.findIndex((l, i) => i > listenIndex && l.includes('// ===== ROTA (SERVER-LOCAL): GERAR LINK'));
const dashboardRoutesEnd = lines.length;

// Extrair rotas do dashboard
const dashboardRoutes = lines.slice(dashboardRoutesStart, dashboardRoutesEnd);

// Remover rotas de onde estão
const withoutDashRoutes = lines.slice(0, dashboardRoutesStart);

// Encontrar onde inserir (antes do // INICIAR SERVIDOR)
const insertIndex = withoutDashRoutes.findIndex(l => l.includes('// INICIAR SERVIDOR'));

// Montar novo arquivo
const newLines = [
  ...withoutDashRoutes.slice(0, insertIndex),
  ...dashboardRoutes,
  '',
  ...withoutDashRoutes.slice(insertIndex)
];

fs.writeFileSync('server.js', newLines.join('\n'));
console.log('✅ Rotas movidas com sucesso!');
console.log(`   Rotas do dashboard agora estão na linha ~${insertIndex}`);
console.log(`   app.listen() permanece na linha ~${listenIndex}`);
