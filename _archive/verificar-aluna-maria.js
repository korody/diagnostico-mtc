// verificar-aluna-maria.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const EMAIL = 'mariaivetef05@gmail.com';

async function verificar() {
  console.log('\n🔍 Verificando lead: ' + EMAIL);
  console.log('========================================\n');
  
  // 1. Verificar no CSV
  console.log('📄 Verificando no CSV de alunos...');
  
  const csvResults = [];
  fs.createReadStream('alunos.csv')
    .pipe(csv())
    .on('data', (row) => {
      if (row.Email && row.Email.toLowerCase().includes('mariaivetef05')) {
        csvResults.push(row);
      }
    })
    .on('end', async () => {
      if (csvResults.length > 0) {
        console.log('   ✅ ENCONTRADO NO CSV:');
        csvResults.forEach(r => {
          console.log('      Nome:', r.Nome || 'N/A');
          console.log('      Email:', r.Email);
          console.log('      Telefone:', r.Telefone || 'N/A');
        });
      } else {
        console.log('   ❌ NÃO encontrado no CSV');
      }
      
      // 2. Verificar no Supabase
      console.log('\n💾 Verificando no Supabase...');
      
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('email', EMAIL)
        .single();
      
      if (error) {
        console.log('   ❌ NÃO encontrado no Supabase');
        console.log('      Erro:', error.message);
      } else {
        console.log('   ✅ ENCONTRADO NO SUPABASE:');
        console.log('      ID:', data.id);
        console.log('      Nome:', data.nome);
        console.log('      Email:', data.email);
        console.log('      Celular:', data.celular);
        console.log('      Elemento:', data.elemento_principal);
        console.log('      Score:', data.lead_score);
        console.log('      is_aluno:', data.is_aluno);
        console.log('      whatsapp_status:', data.whatsapp_status);
        console.log('      whatsapp_sent_at:', data.whatsapp_sent_at);
      }
      
      // 3. Verificar logs de envio
      console.log('\n📋 Verificando logs de envio...');
      
      if (data) {
        const { data: logs, error: logsError } = await supabase
          .from('whatsapp_logs')
          .select('*')
          .eq('lead_id', data.id)
          .order('sent_at', { ascending: false });
        
        if (logs && logs.length > 0) {
          console.log(`   📊 ${logs.length} envio(s) registrado(s):`);
          logs.forEach((log, i) => {
            console.log(`\n   ${i + 1}. Status: ${log.status}`);
            console.log(`      Data: ${log.sent_at}`);
            console.log(`      Campaign: ${log.metadata?.campaign || 'N/A'}`);
          });
        } else {
          console.log('   ⚠️  Nenhum log de envio encontrado');
        }
      }
      
      console.log('\n========================================\n');
    });
}

verificar().catch(console.error);
