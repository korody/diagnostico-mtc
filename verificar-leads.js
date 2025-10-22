// verificar-leads.js
const { createClient } = require('@supabase/supabase-js');

const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.local';

require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('   Verifique:', envFile);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarLeads() {
  console.log('🔍 VERIFICANDO STATUS DOS LEADS');
  console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 TESTE');
  console.log('🔗 Supabase:', supabaseUrl);
  console.log('');
  
  const { data: leads, error } = await supabase
    .from('quiz_leads')
    .select('nome, celular, whatsapp_status, whatsapp_sent_at, lead_score')
    .not('celular', 'is', null)
    .order('lead_score', { ascending: false })
    .limit(20);
  
  if (error) {
    console.log('❌ Erro:', error);
    return;
  }
  
  if (!leads || leads.length === 0) {
    console.log('❌ Nenhum lead com celular no banco!');
    return;
  }
  
  console.log(`✅ ${leads.length} leads encontrados:\n`);
  
  const porStatus = {};
  
  leads.forEach((lead, i) => {
    const status = lead.whatsapp_status || 'AGUARDANDO_CONTATO';
    
    if (!porStatus[status]) {
      porStatus[status] = [];
    }
    
    porStatus[status].push(lead);
    
    console.log(`${i+1}. ${lead.nome}`);
    console.log(`   📱 ${lead.celular}`);
    console.log(`   📊 Status: ${status}`);
    console.log(`   📈 Score: ${lead.lead_score || 0}`);
    console.log(`   📅 Enviado: ${lead.whatsapp_sent_at || 'Nunca'}\n`);
  });
  
  console.log('\n📊 RESUMO POR STATUS:');
  Object.entries(porStatus).forEach(([status, leads]) => {
    console.log(`   ${status}: ${leads.length} leads`);
  });
}

verificarLeads();