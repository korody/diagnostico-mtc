#!/usr/bin/env node
/**
 * Script para ajudar a identificar funções que podem estar dessincronizadas
 * entre server.js (Express) e api/ (Serverless)
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VERIFICADOR DE SINCRONIZAÇÃO\n');
console.log('Este script ajuda a identificar rotas/funções que precisam estar sincronizadas.\n');

// Ler server.js
const serverJsPath = path.join(__dirname, 'server.js');
const serverJs = fs.readFileSync(serverJsPath, 'utf-8');

// Extrair rotas do Express
const expressRoutes = [];
const routeRegex = /app\.(get|post|put|delete|patch)\(['"]([^'"]+)['"]/g;
let match;

while ((match = routeRegex.exec(serverJs)) !== null) {
  const method = match[1].toUpperCase();
  const route = match[2];
  expressRoutes.push({ method, route });
}

console.log('📋 Rotas encontradas em server.js:');
console.log('=====================================\n');

// Agrupar por tipo
const apiRoutes = expressRoutes.filter(r => r.route.startsWith('/api/'));
const otherRoutes = expressRoutes.filter(r => !r.route.startsWith('/api/'));

console.log('🔗 Rotas API (devem ter equivalente em api/):');
apiRoutes.forEach(r => {
  const apiPath = r.route.replace('/api/', 'api/').replace(/\//g, path.sep) + '.js';
  const exists = fs.existsSync(apiPath) || fs.existsSync(apiPath.replace('.js', ''));
  const status = exists ? '✅' : '❌';
  console.log(`   ${status} ${r.method.padEnd(6)} ${r.route}`);
  if (!exists) {
    console.log(`      ⚠️  Não encontrado: ${apiPath}`);
  }
});

console.log('\n📄 Outras rotas (podem ser apenas locais):');
otherRoutes.forEach(r => {
  console.log(`   📌 ${r.method.padEnd(6)} ${r.route}`);
});

// Verificar funções em api/ que não têm rota no Express
console.log('\n\n🔍 Verificando funções serverless...\n');

const apiDir = path.join(__dirname, 'api');

function listFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && file !== 'utils' && file !== 'cron') {
      listFiles(filePath, fileList);
    } else if (file.endsWith('.js') && file !== 'diagnosticos.json') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const apiFunctions = listFiles(apiDir);

console.log('📦 Funções serverless em api/:');
console.log('=====================================\n');

apiFunctions.forEach(funcPath => {
  const relativePath = path.relative(__dirname, funcPath);
  const route = '/' + relativePath.replace(/\\/g, '/').replace('.js', '');
  
  // Verificar se existe rota correspondente no Express
  const hasExpressRoute = expressRoutes.some(r => r.route === route);
  const status = hasExpressRoute ? '✅' : '⚠️';
  
  console.log(`   ${status} ${relativePath}`);
  if (!hasExpressRoute) {
    console.log(`      💡 Sugestão: Adicionar em server.js → app.METHOD('${route}', handler)`);
  }
});

console.log('\n\n📝 RESUMO:');
console.log('=================================');
console.log(`✅ Rotas API em server.js: ${apiRoutes.length}`);
console.log(`📦 Funções serverless em api/: ${apiFunctions.length}`);
console.log('\n💡 DICA: Se você adicionar/modificar uma rota, atualize AMBOS:');
console.log('   1. server.js (para dev local)');
console.log('   2. api/[nome].js (para produção Vercel)\n');
