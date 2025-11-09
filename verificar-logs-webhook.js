// verificar-logs-webhook.js
// Verifica logs do webhook generate-audio no Supabase

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verificarLogs() {
  console.log('\n🔍 Verificando logs do webhook generate-audio...\n');
  
  // Buscar logs recentes (últimos 30 minutos)
  const dataLimite = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  
  const { data: logs, error } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .or('status.eq.webhook_generate_audio_recebido,status.eq.webhook_generate_audio_erro,status.eq.audio_enviado')
    .gte('created_at', dataLimite)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Erro ao buscar logs:', error);
    return;
  }
  
  if (!logs || logs.length === 0) {
    console.log('⚠️  Nenhum log encontrado nos últimos 30 minutos.');
    console.log('\n📋 Isso indica que o webhook não foi chamado pelo Unnichat.');
    console.log('\n🔧 Verifique:');
    console.log('   1. A automação tem um bloco HTTP Request configurado?');
    console.log('   2. A URL está correta: https://api.qigongbrasil.com/api/webhook/unnichat/generate-audio');
    console.log('   3. O método é POST?');
    console.log('   4. O Content-Type é application/json?');
    console.log('   5. O body contém: {"phone": "{{phone}}", "email": "{{email}}", "lead_id": "{{lead_id}}", "primeiro_nome": "{{primeiro_nome}}"}');
    return;
  }
  
  console.log(`✅ ${logs.length} logs encontrados:\n`);
  
  logs.forEach((log, i) => {
    console.log(`${'='.repeat(60)}`);
    console.log(`Log ${i + 1}:`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📅 Data: ${new Date(log.created_at).toLocaleString('pt-BR')}`);
    console.log(`📱 Telefone: ${log.phone}`);
    console.log(`🔖 Status: ${log.status}`);
    console.log(`🆔 Lead ID: ${log.lead_id || 'N/A'}`);
    console.log(`📦 Metadata:`, JSON.stringify(log.metadata, null, 2));
    console.log();
  });
  
  // Verificar também logs de automação enviada
  console.log('\n🔍 Verificando logs de automação disparada...\n');
  
  const { data: automacaoLogs, error: automacaoError } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .eq('status', 'audio_automacao_enviado')
    .gte('created_at', dataLimite)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (automacaoError) {
    console.error('❌ Erro ao buscar logs de automação:', automacaoError);
    return;
  }
  
  if (automacaoLogs && automacaoLogs.length > 0) {
    console.log(`✅ ${automacaoLogs.length} automações disparadas:\n`);
    
    automacaoLogs.forEach((log, i) => {
      console.log(`Automação ${i + 1}:`);
      console.log(`   📅 ${new Date(log.created_at).toLocaleString('pt-BR')}`);
      console.log(`   📱 ${log.phone}`);
      console.log(`   🆔 Lead ID: ${log.lead_id}`);
      console.log();
    });
  }
}

verificarLogs().catch(console.error);
