// verificar-aluna-maria-supabase.js
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const EMAIL = 'mariaivetef05@gmail.com';

async function verificar() {
  console.log('\n🔍 Verificando lead: ' + EMAIL);
  console.log('========================================\n');
  
  // 1. Verificar no Supabase
  console.log('💾 Buscando no Supabase...\n');
  
  const { data, error } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('email', EMAIL)
    .single();
  
  if (error) {
    console.log('❌ NÃO encontrado no Supabase');
    console.log('   Erro:', error.message);
    return;
  }
  
  console.log('✅ ENCONTRADO NO SUPABASE:\n');
  console.log('   ID:', data.id);
  console.log('   Nome:', data.nome);
  console.log('   Email:', data.email);
  console.log('   Celular:', data.celular);
  console.log('   Elemento:', data.elemento_principal);
  console.log('   Score:', data.lead_score);
  console.log('   🎓 is_aluno:', data.is_aluno, data.is_aluno ? '← ESTÁ MARCADA COMO ALUNA!' : '← NÃO é aluna');
  console.log('   Status WhatsApp:', data.whatsapp_status);
  console.log('   Enviado em:', data.whatsapp_sent_at);
  
  // 2. Verificar logs de envio
  console.log('\n📋 Logs de envio:\n');
  
  const { data: logs, error: logsError } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .eq('lead_id', data.id)
    .order('sent_at', { ascending: false });
  
  if (logs && logs.length > 0) {
    console.log(`   ${logs.length} envio(s) registrado(s):\n`);
    logs.forEach((log, i) => {
      console.log(`   ${i + 1}. Status: ${log.status}`);
      console.log(`      Data: ${new Date(log.sent_at).toLocaleString('pt-BR')}`);
      console.log(`      Campaign: ${log.metadata?.campaign || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('   ⚠️  Nenhum log de envio encontrado\n');
  }
  
  // 3. Conclusão
  console.log('========================================');
  console.log('📊 CONCLUSÃO:\n');
  
  if (data.is_aluno === true) {
    console.log('   ⚠️  PROBLEMA: Lead ESTÁ marcada como aluna!');
    console.log('   ❌ Ela NÃO deveria ter recebido a campanha.');
    console.log('   🔧 O filtro is_aluno = false falhou ou não foi aplicado.\n');
  } else {
    console.log('   ✅ Lead NÃO está marcada como aluna.');
    console.log('   ✅ Envio estava correto conforme regras da campanha.\n');
  }
  
  console.log('========================================\n');
}

verificar().catch(console.error);
