// corrigir-maria-ivete.js
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function corrigir() {
  console.log('\n🔧 Corrigindo registro de Maria Ivete...\n');
  
  // Atualizar todos os registros com esse email
  const { data, error } = await supabase
    .from('quiz_leads')
    .update({ is_aluno: true })
    .eq('email', 'mariaivetef05@gmail.com')
    .select();
  
  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }
  
  console.log(`✅ ${data.length} registro(s) atualizado(s):\n`);
  data.forEach(lead => {
    console.log(`   - ${lead.nome} (${lead.celular})`);
    console.log(`     is_aluno: ${lead.is_aluno}`);
  });
  
  console.log('\n✅ Correção concluída!\n');
}

corrigir().catch(console.error);
