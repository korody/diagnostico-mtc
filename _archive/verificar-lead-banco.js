// verificar-lead-banco.js
// Verifica se o lead de teste existe no Supabase

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const LEAD_ID_TESTE = '08c35652-9b19-4524-a3c2-35c0f22f26ce';
const PHONE_TESTE = '5511998457676';

async function verificarLead() {
  console.log('\n🔍 Verificando lead no banco...\n');
  
  // Buscar por ID
  console.log(`📋 Buscando por ID: ${LEAD_ID_TESTE}`);
  const { data: porId, error: erroId } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('id', LEAD_ID_TESTE)
    .maybeSingle();
  
  if (erroId) {
    console.error('❌ Erro ao buscar por ID:', erroId);
  } else if (porId) {
    console.log('✅ Lead encontrado por ID!');
    console.log(`   Nome: ${porId.nome}`);
    console.log(`   Email: ${porId.email}`);
    console.log(`   Celular: ${porId.celular}`);
    console.log(`   Elemento: ${porId.elemento_principal}`);
    console.log(`   Lead Score: ${porId.lead_score}`);
  } else {
    console.log('⚠️  Lead NÃO encontrado por ID');
  }
  
  console.log();
  
  // Buscar por telefone
  console.log(`📱 Buscando por telefone: ${PHONE_TESTE}`);
  const { data: porTelefone, error: erroTel } = await supabase
    .from('quiz_leads')
    .select('*')
    .or(`celular.eq.${PHONE_TESTE},celular.eq.+${PHONE_TESTE}`)
    .limit(5);
  
  if (erroTel) {
    console.error('❌ Erro ao buscar por telefone:', erroTel);
  } else if (porTelefone && porTelefone.length > 0) {
    console.log(`✅ ${porTelefone.length} lead(s) encontrado(s) por telefone:`);
    porTelefone.forEach((lead, i) => {
      console.log(`\n   Lead ${i + 1}:`);
      console.log(`   ID: ${lead.id}`);
      console.log(`   Nome: ${lead.nome}`);
      console.log(`   Celular: ${lead.celular}`);
      console.log(`   Elemento: ${lead.elemento_principal}`);
    });
  } else {
    console.log('⚠️  Nenhum lead encontrado por telefone');
  }
  
  console.log();
  
  // Listar alguns leads para referência
  console.log('📊 Listando últimos 5 leads criados:');
  const { data: ultimos, error: erroUltimos } = await supabase
    .from('quiz_leads')
    .select('id, nome, celular, email, elemento_principal, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (erroUltimos) {
    console.error('❌ Erro ao listar leads:', erroUltimos);
  } else if (ultimos && ultimos.length > 0) {
    ultimos.forEach((lead, i) => {
      console.log(`\n   ${i + 1}. ${lead.nome}`);
      console.log(`      ID: ${lead.id}`);
      console.log(`      Celular: ${lead.celular}`);
      console.log(`      Email: ${lead.email}`);
      console.log(`      Criado: ${new Date(lead.created_at).toLocaleString('pt-BR')}`);
    });
  }
  
  console.log('\n');
}

verificarLead().catch(console.error);
