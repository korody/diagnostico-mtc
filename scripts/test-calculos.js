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

  // Respostas de exemplo (estrutura nova: 20 perguntas em 6 etapas)
  const respostasExemplo = {
    P1: 'A',              // Dores limitam bastante o dia (intensidade máxima)
    P2: ['A', 'B'],       // Lombar/coluna + joelhos/articulações (RIM)
    P3: 'A',              // Há mais de 5 anos
    P4: ['A', 'C'],       // Muito cansaço (RIM) + sono ruim (CORAÇÃO)
    P5: 'C',              // Menos energia depois do almoço
    P6: 'A',              // O que mais incomoda: dor
    P7: 'D',              // Medo (RIM)
    P8: 'B',              // Acorda ainda cansada
    P9: 'A',              // Gostaria de voltar a caminhar
    P10: 'A',             // Medo de perder a autonomia (urgência máxima)
    P11: ['A', 'D'],      // Já tentou fisioterapia + acupuntura
    P12: 'D',             // Gasta R$ 500-1000/mês
    P13: 'F',             // 55-64 anos
    P14: 'SP',            // Mora em São Paulo
    P15: 'E',             // Conhece o Mestre Ye há mais de 1 ano
    P16: 'B',             // Já foi aluna de curso pago
    P17: 'D',             // Reflete sobre as causas (FÊNIX)
    P18: 'A',             // Decide por resultados comprovados (CIENTISTA/DESCRENÇA)
    P19: 'H',             // Renda até R$ 10.000
    P20: 'A'              // Decide sozinha (autonomia ALTA)
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
  console.log('Arquétipo:', resultado.arquetipo_principal);
  console.log('Índice Harmonia:', resultado.indice_harmonia);
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
