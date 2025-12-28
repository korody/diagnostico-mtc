// Script para deletar lead do banco de dados
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_API_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteLead() {
  const email = 'marko@persona.cx';

  console.log(`\n🔍 Procurando lead com email: ${email}`);

  // Buscar o lead primeiro (tentar ambos os formatos de coluna)
  let { data: leads, error: searchError } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('email', email);

  // Se não encontrou, tentar com EMAIL maiúsculo
  if (!leads || leads.length === 0) {
    const result = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('EMAIL', email);
    leads = result.data;
    searchError = result.error;
  }

  if (searchError) {
    console.error('❌ Erro ao buscar lead:', searchError);
    return;
  }

  if (!leads || leads.length === 0) {
    console.log('⚠️ Nenhum lead encontrado com esse email.');
    return;
  }

  console.log(`\n✅ Encontrado ${leads.length} registro(s):`);
  leads.forEach(lead => {
    console.log(`   - ID: ${lead.id || lead.ID}`);
    console.log(`   - Nome: ${lead.NOME}`);
    console.log(`   - Email: ${lead.EMAIL}`);
    console.log(`   - Criado em: ${lead.created_at}`);
  });

  // Deletar registros relacionados primeiro (whatsapp_logs)
  console.log(`\n🗑️ Deletando registros relacionados (whatsapp_logs)...`);

  const leadIds = leads.map(l => l.id);

  const { error: logsError } = await supabase
    .from('whatsapp_logs')
    .delete()
    .in('lead_id', leadIds);

  if (logsError) {
    console.log('⚠️ Aviso ao deletar whatsapp_logs:', logsError.message);
  } else {
    console.log('✅ Registros relacionados deletados');
  }

  // Deletar o lead usando o ID
  console.log(`\n🗑️ Deletando lead(s)...`);

  const { error: deleteError } = await supabase
    .from('quiz_leads')
    .delete()
    .in('id', leadIds);

  if (deleteError) {
    console.error('❌ Erro ao deletar lead:', deleteError);
    return;
  }

  console.log('✅ Lead deletado com sucesso!\n');
}

deleteLead().catch(console.error);
