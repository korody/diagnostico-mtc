// ========================================
// SCRIPT DE TESTE: Verificar cálculos do quiz
// ========================================
// Testa se os campos calculados estão sendo salvos corretamente
// ========================================

require('dotenv').config({ path: '.env.local' });
const supabase = require('../lib/supabase');
const { calcularDiagnostico } = require('../lib/calculos');

async function testarCalculos() {
  console.log('\n🧪 ========================================');
  console.log('   TESTE DE CÁLCULOS DO QUIZ');
  console.log('========================================\n');

  // Respostas de exemplo
  const respostasExemplo = {
    P1: 'A',  // Intensidade máxima
    P2: ['A', 'B'],  // Dores lombar + pernas (RIM)
    P3: 'A',  // Mais de 1 ano
    P4: ['A', 'C'],  // Costas + insônia
    P5: 'D',  // Com medo (RIM)
    P6: 'B',  // Já tentou tudo
    P8: 'A',  // Urgência máxima
    P9: 'A',  // Muito comprometida
    P11: 'H', // Renda alta
    P12: 'A'  // Conhece Mestre Ye
  };

  console.log('📝 Respostas do quiz:');
  console.log(JSON.stringify(respostasExemplo, null, 2));

  // Calcular diagnóstico
  const resultado = calcularDiagnostico(respostasExemplo);

  console.log('\n🎯 Diagnóstico calculado:');
  console.log('─────────────────────────────────────────');
  console.log('Elemento Principal:', resultado.elemento_principal);
  console.log('Código Perfil:', resultado.codigo_perfil);
  console.log('Nome Perfil:', resultado.nome_perfil);
  console.log('Arquétipo:', resultado.arquetipo);
  console.log('Quadrante:', resultado.quadrante);
  console.log('Lead Score:', resultado.lead_score);
  console.log('Prioridade:', resultado.prioridade);
  console.log('Hot Lead VIP:', resultado.is_hot_lead_vip);
  console.log('\n📊 Contagem de Elementos:');
  console.log(JSON.stringify(resultado.contagem_elementos, null, 2));
  console.log('\n💪 Intensidade:', resultado.intensidade_calculada);
  console.log('⚡ Urgência:', resultado.urgencia_calculada);

  // Verificar últimos leads no banco
  console.log('\n\n🔍 Verificando últimos leads salvos no banco...\n');

  const { data: ultimosLeads, error } = await supabase
    .from('quiz_leads')
    .select('id, nome, elemento_principal, lead_score, quadrante, contagem_elementos, intensidade_calculada, urgencia_calculada, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Erro ao buscar leads:', error.message);
    return;
  }

  if (!ultimosLeads || ultimosLeads.length === 0) {
    console.log('⚠️  Nenhum lead encontrado no banco.');
    return;
  }

  console.log(`✅ ${ultimosLeads.length} leads mais recentes:\n`);

  ultimosLeads.forEach((lead, idx) => {
    console.log(`${idx + 1}. ${lead.nome}`);
    console.log(`   Elemento: ${lead.elemento_principal || 'NÃO CALCULADO'}`);
    console.log(`   Score: ${lead.lead_score ?? 'NÃO CALCULADO'}`);
    console.log(`   Quadrante: ${lead.quadrante ?? 'NÃO CALCULADO'}`);
    console.log(`   Intensidade: ${lead.intensidade_calculada ?? 'NÃO CALCULADO'}`);
    console.log(`   Urgência: ${lead.urgencia_calculada ?? 'NÃO CALCULADO'}`);
    console.log(`   Contagem: ${lead.contagem_elementos ? JSON.stringify(lead.contagem_elementos) : 'NÃO CALCULADO'}`);
    console.log(`   Criado: ${new Date(lead.created_at).toLocaleString('pt-BR')}`);
    console.log('');
  });

  // Verificar se há leads sem os novos campos
  const { data: leadsSemCampos, count } = await supabase
    .from('quiz_leads')
    .select('id', { count: 'exact', head: true })
    .is('contagem_elementos', null);

  if (count > 0) {
    console.log(`⚠️  ATENÇÃO: ${count} leads no banco NÃO possuem os campos calculados.`);
    console.log('   Isso é normal para leads antigos criados antes desta atualização.\n');
  } else {
    console.log('✅ Todos os leads no banco possuem os campos calculados!\n');
  }

  console.log('========================================');
  console.log('✅ Teste concluído!');
  console.log('========================================\n');
}

testarCalculos().catch(err => {
  console.error('❌ Erro no teste:', err);
  process.exit(1);
});
