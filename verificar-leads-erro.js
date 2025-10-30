// verificar-leads-erro.js
// Verifica se os leads que deram erro têm diagnóstico no banco

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function verificarLeads() {
  const nomes = ['Edna Martins', 'Zéza'];
  
  console.log('\n========================================');
  console.log('   VERIFICANDO LEADS COM ERRO');
  console.log('========================================\n');
  
  for (const nome of nomes) {
    const { data } = await supabase
      .from('quiz_leads')
      .select('id, nome, celular, diagnostico_completo, script_abertura, elemento_principal, respostas')
      .ilike('nome', `%${nome}%`)
      .limit(1)
      .single();
    
    if (data) {
      console.log(`👤 ${data.nome}`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Tel: ${data.celular}`);
      console.log(`   Elemento: ${data.elemento_principal || 'N/A'}`);
      console.log(`   diagnostico_completo: ${data.diagnostico_completo ? `SIM ✅ (${data.diagnostico_completo.length} chars)` : 'NÃO ❌'}`);
      console.log(`   script_abertura: ${data.script_abertura ? `SIM ✅ (${data.script_abertura.length} chars)` : 'NÃO ❌'}`);
      console.log(`   respostas: ${data.respostas ? 'SIM ✅' : 'NÃO ❌'}`);
      
      // Verificar se precisa gerar diagnóstico
      if (!data.diagnostico_completo && !data.script_abertura) {
        console.log(`   ⚠️  AÇÃO NECESSÁRIA: Lead sem diagnóstico!`);
        
        if (data.respostas) {
          console.log(`   💡 SOLUÇÃO: Re-processar respostas para gerar diagnóstico`);
        } else {
          console.log(`   💡 SOLUÇÃO: Lead precisa completar o quiz`);
        }
      }
      
      console.log('');
    } else {
      console.log(`❌ ${nome} não encontrado no banco\n`);
    }
  }
  
  console.log('========================================\n');
}

verificarLeads().catch(console.error);
