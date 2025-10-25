// verificar-leads-completo.js
const { createClient } = require('@supabase/supabase-js');

const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.test';

require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarLeadsCompleto() {
  console.log('\n📊 RELATÓRIO COMPLETO DOS LEADS');
  console.log('═'.repeat(60));
  
  // BUSCAR TOTAL COM COUNT
  const { count: totalReal } = await supabase
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n🔍 Buscando ${totalReal} leads...`);
  
  // BUSCAR TODOS OS DADOS (com paginação)
  let todos = [];
  let offset = 0;
  const BATCH_SIZE = 1000;
  
  while (offset < totalReal) {
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('celular, whatsapp_status, elemento_principal, lead_score')
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (error) {
      console.log('❌ Erro:', error.message);
      return;
    }
    
    todos = todos.concat(data);
    offset += BATCH_SIZE;
    console.log(`   Carregados: ${todos.length}/${totalReal}`);
  }
  
  // COM TELEFONE
  const comTelefone = todos.filter(l => l.celular && l.celular.trim() !== '');
  const semTelefone = todos.length - comTelefone.length;
  
  console.log('\n📈 VISÃO GERAL:');
  console.log(`   Total no banco: ${todos.length} leads`);
  console.log(`   Com telefone: ${comTelefone.length} leads (${((comTelefone.length/todos.length)*100).toFixed(1)}%)`);
  console.log(`   Sem telefone: ${semTelefone} leads (${((semTelefone/todos.length)*100).toFixed(1)}%)`);
  
  // STATUS WHATSAPP
  const porStatus = {};
  comTelefone.forEach(lead => {
    const status = lead.whatsapp_status || 'AGUARDANDO_CONTATO';
    porStatus[status] = (porStatus[status] || 0) + 1;
  });
  
  console.log('\n📱 STATUS WHATSAPP (apenas com telefone):');
  Object.entries(porStatus)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const percent = ((count / comTelefone.length) * 100).toFixed(1);
      console.log(`   ${status}: ${count} (${percent}%)`);
    });
  
  // ELEMENTOS
  const porElemento = {};
  comTelefone.forEach(lead => {
    const elem = lead.elemento_principal || 'SEM_ELEMENTO';
    porElemento[elem] = (porElemento[elem] || 0) + 1;
  });
  
  console.log('\n🎯 DISTRIBUIÇÃO POR ELEMENTO:');
  Object.entries(porElemento)
    .sort((a, b) => b[1] - a[1])
    .forEach(([elem, count]) => {
      const percent = ((count / comTelefone.length) * 100).toFixed(1);
      console.log(`   ${elem}: ${count} (${percent}%)`);
    });
  
  // LEAD SCORE
  const scores = comTelefone
    .filter(l => l.lead_score && !isNaN(l.lead_score))
    .map(l => Number(l.lead_score));
  
  if (scores.length > 0) {
    const media = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    console.log('\n📊 LEAD SCORE:');
    console.log(`   Média: ${media}`);
    console.log(`   Mínimo: ${Math.min(...scores)}`);
    console.log(`   Máximo: ${Math.max(...scores)}`);
  }
  
  // RESUMO DE AÇÕES
  const aguardando = porStatus['AGUARDANDO_CONTATO'] || 0;
  const templateEnviado = porStatus['template_enviado'] || 0;
  const diagnosticos = porStatus['resultados_enviados'] || 0;
  const falharam = porStatus['failed'] || 0;
  const processados = templateEnviado + diagnosticos;
  
  console.log('\n🎯 RESUMO DE AÇÕES:');
  console.log(`   ✅ Já processados: ${processados} (${((processados/comTelefone.length)*100).toFixed(1)}%)`);
  console.log(`   📤 Aguardando envio: ${aguardando} (${((aguardando/comTelefone.length)*100).toFixed(1)}%)`);
  console.log(`   💬 Diagnósticos enviados: ${diagnosticos} (${((diagnosticos/comTelefone.length)*100).toFixed(1)}%)`);
  console.log(`   ❌ Falhas: ${falharam}`);
  
  console.log('\n💡 PRÓXIMA AÇÃO:');
  if (aguardando > 0) {
    console.log(`   Enviar template para ${aguardando} leads`);
    console.log(`   Comando: npm run send:prod`);
  } else {
    console.log(`   ✅ Todos os leads já foram processados!`);
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
}

verificarLeadsCompleto();