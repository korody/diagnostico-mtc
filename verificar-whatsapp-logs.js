// verificar-whatsapp-logs.js
// Verifica se estamos realmente inserindo dados na tabela whatsapp_logs

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function verificarLogs() {
  console.log('\n📊 VERIFICANDO TABELA whatsapp_logs\n');
  console.log('=========================================\n');

  // 1. Contar total de registros
  const { count: total, error: countError } = await supabase
    .from('whatsapp_logs')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Erro ao contar registros:', countError.message);
    return;
  }

  console.log(`📋 Total de registros: ${total || 0}\n`);

  // 2. Últimos 20 registros
  const { data: ultimos, error: ultimosError } = await supabase
    .from('whatsapp_logs')
    .select('id, lead_id, phone, status, sent_at, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (ultimosError) {
    console.error('❌ Erro ao buscar últimos registros:', ultimosError.message);
    return;
  }

  console.log('🕐 Últimos 20 registros:');
  console.log('=========================================');
  ultimos?.forEach((log, i) => {
    const data = new Date(log.created_at || log.sent_at).toLocaleString('pt-BR');
    console.log(`${i+1}. ${data} | Lead: ${log.lead_id} | Status: ${log.status} | Phone: ${log.phone}`);
  });

  // 3. Distribuição por status
  console.log('\n📊 Distribuição por status:');
  console.log('=========================================');
  
  const { data: porStatus, error: statusError } = await supabase
    .from('whatsapp_logs')
    .select('status');

  if (!statusError && porStatus) {
    const counts = {};
    porStatus.forEach(log => {
      counts[log.status] = (counts[log.status] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
  }

  // 4. Registros das últimas 24h
  const ontem = new Date();
  ontem.setHours(ontem.getHours() - 24);

  const { count: ultimas24h, error: error24h } = await supabase
    .from('whatsapp_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', ontem.toISOString());

  console.log('\n🕐 Últimas 24 horas:');
  console.log('=========================================');
  console.log(`   Novos registros: ${ultimas24h || 0}`);

  // 5. Registros da última hora
  const umaHoraAtras = new Date();
  umaHoraAtras.setHours(umaHoraAtras.getHours() - 1);

  const { count: ultimaHora, error: errorHora } = await supabase
    .from('whatsapp_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', umaHoraAtras.toISOString());

  console.log(`   Última hora: ${ultimaHora || 0}`);

  // 6. Primeiro e último registro
  const { data: primeiro } = await supabase
    .from('whatsapp_logs')
    .select('created_at, sent_at, status')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  const { data: ultimo } = await supabase
    .from('whatsapp_logs')
    .select('created_at, sent_at, status')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('\n📅 Período:');
  console.log('=========================================');
  if (primeiro) {
    console.log(`   Primeiro registro: ${new Date(primeiro.created_at || primeiro.sent_at).toLocaleString('pt-BR')} (${primeiro.status})`);
  }
  if (ultimo) {
    console.log(`   Último registro: ${new Date(ultimo.created_at || ultimo.sent_at).toLocaleString('pt-BR')} (${ultimo.status})`);
  }

  console.log('\n=========================================\n');
}

verificarLogs().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
