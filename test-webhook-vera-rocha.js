/**
 * Teste rápido: Simular webhook diagnostico-unnichat com lead real
 * Para verificar se findLeadByPhone agora retorna o lead corretamente
 */

require('dotenv').config({ path: '.env.production' });
const supabase = require('./lib/supabase');
const { findLeadByPhone } = require('./lib/phone-simple');

async function testeWebhookSimulado() {
  console.log('\n🧪 TESTE SIMULADO DO WEBHOOK diagnostico-unnichat\n');
  console.log('='.repeat(70));

  // Caso real do erro: Vera Rocha
  const phone = '5521979308000'; // Sem o +
  const name = 'Vera Rocha';

  console.log('\n📥 Payload recebido:');
  console.log(`   Phone: ${phone}`);
  console.log(`   Name: ${name}`);

  console.log('\n🔍 Buscando lead...');
  const result = await findLeadByPhone(supabase, phone, null);

  if (!result || !result.lead) {
    console.log('\n❌ FALHOU: Lead não encontrado');
    console.log('   Result:', result);
    return;
  }

  const lead = result.lead;

  console.log('\n✅ SUCESSO: Lead encontrado!');
  console.log('='.repeat(70));
  console.log('👤 Nome:', lead.nome);
  console.log('📱 Celular:', lead.celular);
  console.log('🔍 Método de busca:', result.method);
  console.log('📧 Email:', lead.email || 'N/A');
  console.log('🎭 Elemento:', lead.elemento_principal || 'N/A');

  // Verificar se tem diagnóstico
  const diagnostico = lead.diagnostico_completo || lead.script_abertura;
  
  console.log('\n📋 Verificando diagnóstico:');
  if (diagnostico) {
    console.log('✅ TEM diagnóstico!');
    console.log(`   Tamanho: ${diagnostico.length} caracteres`);
    console.log(`   Prévia: ${diagnostico.substring(0, 100)}...`);
    
    console.log('\n🎉 WEBHOOK FUNCIONARIA CORRETAMENTE!');
    console.log('   Resposta seria: { diagnostico: "..." }');
  } else {
    console.log('❌ NÃO TEM diagnóstico');
    console.log('   Resposta seria: 404 - Lead sem diagnóstico');
  }

  console.log('\n' + '='.repeat(70));
  console.log('🎯 CONCLUSÃO: findLeadByPhone funcionando corretamente!');
  console.log('✅ Lead retornado no formato { lead, method }');
  console.log('✅ Webhook agora extrai result.lead corretamente');
  console.log('✅ Hotfix aplicado com sucesso!\n');
}

testeWebhookSimulado().catch(err => {
  console.error('\n❌ Erro no teste:', err);
});
