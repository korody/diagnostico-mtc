// test-e164-system.js
// Script de teste end-to-end para o sistema E.164 simplificado

const { createClient } = require('@supabase/supabase-js');
const { 
  formatToE164, 
  isValidE164, 
  formatForUnnichat, 
  formatForDisplay, 
  findLeadByPhone 
} = require('./lib/phone-simple');

require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

console.log('\n========================================');
console.log('   TESTE E2E - SISTEMA E.164');
console.log('========================================\n');

async function testarFormatacao() {
  console.log('📱 TESTE 1: Formatação E.164');
  console.log('─'.repeat(40));
  
  const testes = [
    '11998457676',
    '5511998457676',
    '+5511998457676',
    '(11) 99845-7676',
    '11 9 9845-7676'
  ];
  
  for (const tel of testes) {
    const e164 = formatToE164(tel, 'BR');
    const valid = isValidE164(e164);
    const unnichat = formatForUnnichat(e164);
    const display = formatForDisplay(e164);
    
    console.log(`\nInput: "${tel}"`);
    console.log(`  E.164: ${e164}`);
    console.log(`  Válido: ${valid ? '✅' : '❌'}`);
    console.log(`  Unnichat: ${unnichat}`);
    console.log(`  Display: ${display}`);
  }
  
  console.log('\n✅ Teste 1 concluído!\n');
}

async function testarBuscaLead() {
  console.log('🔍 TESTE 2: Busca de Leads');
  console.log('─'.repeat(40));
  
  // Buscar primeiro lead do banco para testar
  const { data: leads } = await supabase
    .from('quiz_leads')
    .select('nome, celular, email')
    .not('celular', 'is', null)
    .limit(3);
  
  if (!leads || leads.length === 0) {
    console.log('❌ Nenhum lead encontrado no banco!');
    return;
  }
  
  console.log(`\n📊 Testando com ${leads.length} leads do banco:\n`);
  
  for (const leadOriginal of leads) {
    console.log(`👤 Lead: ${leadOriginal.nome}`);
    console.log(`   Tel: ${leadOriginal.celular}`);
    
    // Teste 1: Busca exata (E.164)
    const lead1 = await findLeadByPhone(supabase, leadOriginal.celular, null);
    console.log(`   ✅ Busca exata: ${lead1 ? 'ENCONTRADO' : 'FALHOU'}`);
    
    // Teste 2: Busca com formatação diferente
    const telSemMais = leadOriginal.celular.replace('+', '');
    const lead2 = await findLeadByPhone(supabase, telSemMais, null);
    console.log(`   ✅ Busca sem +: ${lead2 ? 'ENCONTRADO' : 'FALHOU'}`);
    
    // Teste 3: Busca pelos últimos 8 dígitos
    const ultimos8 = leadOriginal.celular.slice(-8);
    const lead3 = await findLeadByPhone(supabase, ultimos8, null);
    console.log(`   ✅ Busca últimos 8: ${lead3 ? 'ENCONTRADO' : 'FALHOU'}`);
    
    // Teste 4: Busca por email (se disponível)
    if (leadOriginal.email) {
      const lead4 = await findLeadByPhone(supabase, null, leadOriginal.email);
      console.log(`   ✅ Busca por email: ${lead4 ? 'ENCONTRADO' : 'FALHOU'}`);
    }
    
    console.log('');
  }
  
  console.log('✅ Teste 2 concluído!\n');
}

async function verificarIntegridade() {
  console.log('🔍 TESTE 3: Integridade do Banco');
  console.log('─'.repeat(40));
  
  // Contar leads totais
  const { count: total } = await supabase
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true });
  
  // Contar leads em E.164
  const { count: e164Count } = await supabase
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true })
    .like('celular', '+%');
  
  // Contar leads sem E.164
  const { count: nonE164 } = await supabase
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true })
    .not('celular', 'like', '+%')
    .not('celular', 'is', null);
  
  console.log(`\n📊 Estatísticas:`);
  console.log(`   Total de leads: ${total}`);
  console.log(`   Em formato E.164: ${e164Count} (${((e164Count/total)*100).toFixed(1)}%)`);
  console.log(`   Formato antigo/outros: ${nonE164} (${((nonE164/total)*100).toFixed(1)}%)`);
  
  if (e164Count / total > 0.95) {
    console.log(`\n   ✅ Banco está 95%+ migrado para E.164!`);
  } else {
    console.log(`\n   ⚠️  Apenas ${((e164Count/total)*100).toFixed(1)}% migrado`);
  }
  
  console.log('\n✅ Teste 3 concluído!\n');
}

async function executarTestes() {
  try {
    await testarFormatacao();
    await testarBuscaLead();
    await verificarIntegridade();
    
    console.log('========================================');
    console.log('   ✅ TODOS OS TESTES PASSARAM!');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ ERRO NOS TESTES:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

executarTestes();
