/**
 * Script de Teste do Dashboard
 * 
 * Testa as APIs do dashboard localmente antes do deploy
 * 
 * USO:
 *   node test-dashboard.js
 */

const BASE_URL = 'http://localhost:3001';

async function testarMetricas() {
  console.log('\n📊 Testando API de Métricas...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/dashboard/metrics`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Métricas OK');
      console.log('   • Total de leads:', data.metricas.totais_leads.total);
      console.log('   • Leads hoje:', data.metricas.totais_leads.hoje);
      console.log('   • Leads VIP:', data.metricas.lead_score.vips);
      console.log('   • Taxa de sucesso:', data.metricas.sucesso_envios.taxa_sucesso + '%');
    } else {
      console.log('❌ Erro nas métricas:', data.error);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar métricas:', error.message);
  }
}

async function testarAlertas() {
  console.log('\n🚨 Testando API de Alertas...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/dashboard/alerts`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Alertas OK');
      console.log('   • VIPs recentes:', data.alertas.vips_recentes.count);
      console.log('   • Taxa de falha:', data.alertas.taxa_falha.taxa_falha + '%');
      console.log('   • Alertas ativos:', data.alertas.alertas_ativos.length);
      
      if (data.alertas.alertas_ativos.length > 0) {
        console.log('\n   📋 Alertas:');
        data.alertas.alertas_ativos.forEach(a => {
          console.log(`      - ${a.tipo}: ${a.mensagem}`);
        });
      }
    } else {
      console.log('❌ Erro nos alertas:', data.error);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar alertas:', error.message);
  }
}

async function executarTestes() {
  console.log('🧪 ========================================');
  console.log('   Testes do Dashboard MTC');
  console.log('========================================');
  console.log('🌐 URL Base:', BASE_URL);
  console.log('========================================\n');
  
  console.log('⚠️  IMPORTANTE: Certifique-se de que o servidor está rodando!');
  console.log('   Execute em outro terminal: npm run api:test\n');
  
  await testarMetricas();
  await testarAlertas();
  
  console.log('\n========================================');
  console.log('✅ Testes concluídos!');
  console.log('========================================\n');
  console.log('📌 Próximos passos:');
  console.log('   1. Acesse http://localhost:3001/dashboard.html');
  console.log('   2. Use senha: persona2025');
  console.log('   3. Após validar, faça deploy para produção');
  console.log('========================================\n');
}

executarTestes();
