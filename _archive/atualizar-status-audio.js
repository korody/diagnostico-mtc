// atualizar-status-audio.js
// Atualiza status dos 2 leads individuais para unificar com os lotes

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function atualizar() {
  console.log('\n🔄 Unificando status de áudio...\n');
  
  // Atualizar todos que têm audio_automacao_enviado para audio_personalizado_enviado
  const { data: updated, error } = await supabase
    .from('quiz_leads')
    .update({ whatsapp_status: 'audio_personalizado_enviado' })
    .eq('whatsapp_status', 'audio_automacao_enviado')
    .select('nome, celular');
  
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`✅ ${updated.length} registro(s) atualizado(s):\n`);
  
  updated.forEach((lead, i) => {
    console.log(`${i + 1}. ${lead.nome} - ${lead.celular}`);
  });
  
  // Também atualizar os logs
  console.log('\n🔄 Atualizando logs...\n');
  
  const { data: logsUpdated, error: logsError } = await supabase
    .from('whatsapp_logs')
    .update({ status: 'audio_personalizado_enviado' })
    .eq('status', 'audio_automacao_enviado')
    .select('phone');
  
  if (logsError) {
    console.error('❌ Erro nos logs:', logsError);
  } else {
    console.log(`✅ ${logsUpdated.length} log(s) atualizado(s)\n`);
  }
  
  console.log('─'.repeat(60));
  console.log('\n✅ Status unificado! Agora todos usam: audio_personalizado_enviado\n');
}

atualizar().catch(console.error);
