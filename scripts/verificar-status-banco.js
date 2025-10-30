/**
 * VERIFICAR STATUS DO BANCO DE DADOS
 * Mostra estatísticas após a migração E.164
 */

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function verificarStatus() {
  console.log('\n📊 STATUS DO BANCO DE DADOS\n');
  console.log('========================================\n');

  try {
    // Total de leads
    const { count: total } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true });

    console.log(`Total de leads: ${total}`);

    // Leads em formato E.164 (começam com +)
    const { count: e164Count } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })
      .like('celular', '+%');

    console.log(`Em formato E.164: ${e164Count}`);
    console.log(`Porcentagem: ${((e164Count / total) * 100).toFixed(1)}%`);

    // Leads não E.164
    const naoE164 = total - e164Count;
    console.log(`Não E.164: ${naoE164}`);

    console.log('\n========================================\n');

    // Amostra de leads não E.164 (primeiros 10)
    if (naoE164 > 0) {
      console.log('🔍 AMOSTRA DE LEADS NÃO E.164:\n');
      
      const { data: exemplos } = await supabase
        .from('quiz_leads')
        .select('nome, celular, created_at')
        .not('celular', 'like', '+%')
        .order('created_at', { ascending: false })
        .limit(10);

      exemplos.forEach(lead => {
        const date = new Date(lead.created_at).toLocaleDateString('pt-BR');
        console.log(`   ${lead.nome} | ${lead.celular} | ${date}`);
      });

      console.log('\n========================================\n');
    }

    // Verificar integridade (leads com logs de WhatsApp)
    const { count: leadsComLogs } = await supabase
      .from('whatsapp_logs')
      .select('lead_id', { count: 'exact', head: true });

    console.log(`📧 Leads com histórico de WhatsApp: ${leadsComLogs}\n`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarStatus();
