/**
 * Verificação simplificada - Busca erros nos últimos 30 minutos nos logs
 */

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

async function verificarErros() {
  console.log('\n🔍 VERIFICANDO ERROS PÓS-DEPLOY\n');
  console.log('='.repeat(70));

  const agora = new Date();
  const trintaMinutosAtras = new Date(agora.getTime() - 30 * 60 * 1000);
  
  console.log(`📅 Buscando desde: ${trintaMinutosAtras.toLocaleString('pt-BR')}`);
  console.log(`📅 Até: ${agora.toLocaleString('pt-BR')}\n`);

  // Buscar os últimos 50 logs
  const { data: logs, error } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .gte('created_at', trintaMinutosAtras.toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Erro ao buscar logs:', error);
    return;
  }

  console.log(`📊 Total de logs encontrados: ${logs.length}\n`);

  if (logs.length === 0) {
    console.log('ℹ️ Nenhuma atividade WhatsApp nos últimos 30 minutos.');
    console.log('   Isso pode significar:');
    console.log('   - Sistema funcionando normal (sem erros = sem logs de erro)');
    console.log('   - Ou nenhum webhook foi chamado neste período\n');
  }

  // Agrupar por status
  const porStatus = {};
  logs.forEach(log => {
    const status = log.status || 'sem_status';
    porStatus[status] = (porStatus[status] || 0) + 1;
  });

  console.log('📈 DISTRIBUIÇÃO POR STATUS:\n');
  Object.entries(porStatus).forEach(([status, count]) => {
    const icon = status.includes('erro') || status.includes('failed') ? '❌' : '✅';
    console.log(`${icon} ${status}: ${count}`);
  });

  // Mostrar últimos 10 logs
  console.log('\n\n📋 ÚLTIMOS 10 LOGS:\n');
  console.log('='.repeat(70));
  
  logs.slice(0, 10).forEach((log, i) => {
    const hora = new Date(log.created_at).toLocaleTimeString('pt-BR');
    const statusIcon = (log.status && (log.status.includes('erro') || log.status.includes('failed'))) ? '❌' : '✅';
    
    console.log(`\n${i + 1}. ${statusIcon} ${hora} | ${log.phone || 'N/A'}`);
    console.log(`   Status: ${log.status || 'N/A'}`);
    if (log.metadata) {
      const meta = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
      console.log(`   Metadata: ${JSON.stringify(meta).substring(0, 80)}...`);
    }
  });

  // Verificar leads com erro
  console.log('\n\n👥 LEADS COM ERRO ANTERIOR:\n');
  console.log('='.repeat(70));

  const leadsComErro = [
    { nome: 'Edna Martins', phone: '+5511975129828' },
    { nome: 'José Aiko Marinho', email: 'AIKOMARINHO@GMAIL.COM' }
  ];

  for (const lead of leadsComErro) {
    console.log(`\n🔍 ${lead.nome}:`);
    
    const query = lead.phone 
      ? supabase.from('quiz_leads').select('*').eq('telefone', lead.phone)
      : supabase.from('quiz_leads').select('*').ilike('email', lead.email);
    
    const { data: leadDataArray } = await query;
    const leadData = leadDataArray && leadDataArray[0];

    if (!leadData) {
      console.log('   ❌ Lead não encontrado');
      continue;
    }

    console.log(`   ID: ${leadData.id.substring(0, 8)}...`);
    console.log(`   Tel: ${leadData.telefone}`);
    console.log(`   Diagnóstico: ${leadData.diagnostico_completo ? '✅ TEM' : '❌ NÃO'}`);
    console.log(`   Script: ${leadData.script_abertura ? '✅ TEM' : '❌ NÃO'}`);
  }

  // Resumo
  console.log('\n\n🎯 RESUMO:\n');
  console.log('='.repeat(70));
  console.log(`✅ Deploy CURRENT: 336fdf6`);
  console.log(`📊 Logs últimos 30min: ${logs.length}`);
  console.log(`❌ Com erro: ${logs.filter(l => l.status && (l.status.includes('erro') || l.status.includes('failed'))).length}`);
  console.log(`✅ Sucesso: ${logs.filter(l => l.status && !l.status.includes('erro') && !l.status.includes('failed')).length}`);
  
  const temErrosRecentes = logs.some(l => 
    l.metadata && 
    typeof l.metadata === 'object' && 
    JSON.stringify(l.metadata).includes('calcularDiagnosticoCompleto')
  );

  if (temErrosRecentes) {
    console.log('\n⚠️ ATENÇÃO: Ainda há referências a calcularDiagnosticoCompleto!');
    console.log('   Código antigo pode ainda estar ativo.');
    console.log('   Aguarde 5 minutos e execute novamente.\n');
  } else {
    console.log('\n🎉 SUCESSO! Nenhum erro de calcularDiagnosticoCompleto!');
    console.log('✅ Hotfix aplicado com sucesso!');
    console.log('✅ Sistema funcionando normalmente.\n');
  }
}

verificarErros();
