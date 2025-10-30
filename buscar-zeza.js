// buscar-zeza.js
require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

(async () => {
  const { data } = await supabase
    .from('quiz_leads')
    .select('nome, celular, diagnostico_completo, script_abertura, elemento_principal')
    .or('nome.ilike.%zeza%,nome.ilike.%zéza%,nome.ilike.%josé%,nome.ilike.%jose%')
    .limit(10);
  
  console.log('\n🔍 Leads encontrados com nome similar a Zéza:');
  console.log('─'.repeat(60));
  
  if (data && data.length > 0) {
    data.forEach(l => {
      console.log(`\n👤 ${l.nome}`);
      console.log(`   Tel: ${l.celular}`);
      console.log(`   Elemento: ${l.elemento_principal || 'N/A'}`);
      console.log(`   Diagnóstico: ${l.diagnostico_completo ? '✅ TEM' : '❌ NÃO TEM'}`);
    });
  } else {
    console.log('\n❌ Nenhum lead encontrado com esse nome');
  }
  
  console.log('\n');
})();
