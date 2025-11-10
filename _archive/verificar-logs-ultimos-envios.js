// verificar-logs-ultimos-envios.js
// Verifica logs dos últimos envios de áudio

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verificarLogs() {
  console.log('\n🔍 Verificando últimos envios de áudio...\n');
  
  // 1. Buscar logs recentes
  const { data: logs, error } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .eq('status', 'audio_personalizado_enviado')
    .order('sent_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`📊 Total de logs encontrados: ${logs.length}\n`);
  
  for (const log of logs) {
    console.log('─'.repeat(60));
    console.log(`📱 Phone: ${log.phone}`);
    console.log(`⏰ Enviado em: ${new Date(log.sent_at).toLocaleString('pt-BR')}`);
    console.log(`📋 Lead ID: ${log.lead_id}`);
    
    if (log.metadata?.audio_url) {
      console.log(`🎵 Áudio: ${log.metadata.audio_url.substring(0, 80)}...`);
    }
    
    if (log.metadata?.unnichat_response) {
      console.log(`📤 Resposta Unnichat:`, JSON.stringify(log.metadata.unnichat_response, null, 2));
    }
    
    console.log('');
  }
  
  // 2. Buscar dados dos leads
  console.log('\n📋 Verificando dados dos leads...\n');
  
  const { data: leads } = await supabase
    .from('quiz_leads')
    .select('id, nome, celular, email, whatsapp_status, whatsapp_sent_at')
    .eq('whatsapp_status', 'audio_personalizado_enviado')
    .order('whatsapp_sent_at', { ascending: false })
    .limit(10);
  
  if (leads) {
    leads.forEach((lead, i) => {
      console.log(`${i + 1}. ${lead.nome}`);
      console.log(`   📱 ${lead.celular}`);
      console.log(`   📧 ${lead.email || 'sem email'}`);
      console.log(`   ⏰ ${new Date(lead.whatsapp_sent_at).toLocaleString('pt-BR')}`);
      console.log('');
    });
  }
  
  // 3. Verificar se todos têm email válido
  console.log('\n📧 Verificando emails...\n');
  
  const semEmail = leads?.filter(l => !l.email || l.email.includes('placeholder'));
  const comEmail = leads?.filter(l => l.email && !l.email.includes('placeholder'));
  
  console.log(`✅ Com email válido: ${comEmail?.length || 0}`);
  console.log(`⚠️  Sem email ou placeholder: ${semEmail?.length || 0}`);
  
  if (semEmail && semEmail.length > 0) {
    console.log('\n📋 Leads sem email válido:');
    semEmail.forEach(l => {
      console.log(`   • ${l.nome} - ${l.celular} - ${l.email}`);
    });
  }
}

verificarLogs().catch(console.error);
