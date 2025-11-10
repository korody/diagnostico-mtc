// verificar-maria-ivete.js
const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');
const fs = require('fs');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const EMAIL_BUSCAR = 'mariaivetef05@gmail.com';
const CSV_PATH = 'G:\\.shortcut-targets-by-id\\1lrBL-vb42dxivhpbt5jLCzq1hQIjmiLN\\mestre ye\\listas gerais\\ALUNOS YE até 2025.csv';

async function verificarCSV() {
  console.log('\n📄 Verificando CSV de alunos...\n');
  
  return new Promise((resolve) => {
    let encontrado = false;
    let totalLinhas = 0;
    
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        totalLinhas++;
        
        // Verificar em todos os campos se contém o email
        const rowString = JSON.stringify(row).toLowerCase();
        if (rowString.includes(EMAIL_BUSCAR.toLowerCase())) {
          console.log('✅ ENCONTRADO NO CSV!');
          console.log('Linha:', row);
          encontrado = true;
        }
      })
      .on('end', () => {
        console.log(`\n📊 Total de linhas no CSV: ${totalLinhas}`);
        if (!encontrado) {
          console.log('❌ Email NÃO encontrado no CSV de alunos');
        }
        resolve(encontrado);
      });
  });
}

async function verificarSupabase() {
  console.log('\n🗄️  Verificando Supabase...\n');
  
  const { data, error } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('email', EMAIL_BUSCAR)
    .single();
  
  if (error || !data) {
    console.log('❌ Lead NÃO encontrado no Supabase');
    return null;
  }
  
  console.log('✅ Lead encontrado no Supabase:');
  console.log(`   Nome: ${data.nome}`);
  console.log(`   Email: ${data.email}`);
  console.log(`   Celular: ${data.celular}`);
  console.log(`   Elemento: ${data.elemento_principal}`);
  console.log(`   Score: ${data.lead_score}`);
  console.log(`   is_aluno: ${data.is_aluno}`);
  console.log(`   whatsapp_status: ${data.whatsapp_status}`);
  
  return data;
}

async function main() {
  console.log('\n🔍 ========================================');
  console.log('   VERIFICAÇÃO: mariaivetef05@gmail.com');
  console.log('========================================');
  
  const noCSV = await verificarCSV();
  const noSupabase = await verificarSupabase();
  
  console.log('\n========================================');
  console.log('📊 RESULTADO');
  console.log('========================================');
  console.log(`CSV de Alunos: ${noCSV ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Supabase: ${noSupabase ? '✅ SIM' : '❌ NÃO'}`);
  
  if (noSupabase) {
    console.log(`Campo is_aluno: ${noSupabase.is_aluno ? '✅ TRUE (É ALUNA)' : '❌ FALSE (NÃO É ALUNA)'}`);
    
    if (noCSV && !noSupabase.is_aluno) {
      console.log('\n⚠️  PROBLEMA IDENTIFICADO:');
      console.log('   - Consta no CSV de alunos');
      console.log('   - MAS o campo is_aluno está FALSE no Supabase');
      console.log('   - Precisa rodar marcar-alunos.js novamente!');
    } else if (!noCSV && noSupabase.is_aluno) {
      console.log('\n⚠️  INCONSISTÊNCIA:');
      console.log('   - NÃO consta no CSV de alunos');
      console.log('   - MAS o campo is_aluno está TRUE no Supabase');
    } else if (noCSV && noSupabase.is_aluno) {
      console.log('\n✅ TUDO CORRETO:');
      console.log('   - Consta no CSV de alunos');
      console.log('   - Campo is_aluno está TRUE no Supabase');
      console.log('   - ESSA LEAD NÃO DEVERIA TER RECEBIDO A MENSAGEM!');
    }
  }
  
  console.log('========================================\n');
}

main().catch(console.error);
