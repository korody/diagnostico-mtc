// lista-nao-receberam.js
// Lista os leads que tiveram automação disparada mas não receberam

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function listarNaoReceberam() {
  console.log('\n📋 LISTA DE LEADS QUE NÃO RECEBERAM O ÁUDIO\n');
  console.log('Esses leads tiveram a automação disparada com sucesso,');
  console.log('mas não receberam porque não tinham janela aberta no WhatsApp.\n');
  console.log('─'.repeat(80));
  
  // Buscar os 10 últimos envios
  const { data: leads, error } = await supabase
    .from('quiz_leads')
    .select('id, nome, celular, email, elemento_principal, lead_score, whatsapp_sent_at')
    .eq('whatsapp_status', 'audio_personalizado_enviado')
    .order('whatsapp_sent_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  // Os 2 que receberam (segundo o usuário)
  const receberam = ['5549999251500', '552196461550'];
  
  const naoReceberam = leads.filter(lead => {
    const phone = lead.celular.replace(/\D/g, '');
    return !receberam.includes(phone);
  });
  
  console.log(`\n❌ NÃO RECEBERAM (${naoReceberam.length} leads):\n`);
  
  naoReceberam.forEach((lead, i) => {
    console.log(`${i + 1}. ${lead.nome}`);
    console.log(`   📱 Telefone: ${lead.celular}`);
    console.log(`   📧 Email: ${lead.email || 'sem email'}`);
    console.log(`   🎯 Elemento: ${lead.elemento_principal}`);
    console.log(`   📊 Score: ${lead.lead_score}`);
    console.log(`   ⏰ Tentativa: ${new Date(lead.whatsapp_sent_at).toLocaleString('pt-BR')}`);
    console.log('');
  });
  
  console.log('─'.repeat(80));
  console.log('\n✅ RECEBERAM (2 leads):\n');
  
  const receberamLeads = leads.filter(lead => {
    const phone = lead.celular.replace(/\D/g, '');
    return receberam.includes(phone);
  });
  
  receberamLeads.forEach((lead, i) => {
    console.log(`${i + 1}. ${lead.nome}`);
    console.log(`   📱 Telefone: ${lead.celular}`);
    console.log(`   📧 Email: ${lead.email || 'sem email'}`);
    console.log('');
  });
  
  console.log('─'.repeat(80));
  console.log('\n💡 PRÓXIMOS PASSOS:\n');
  console.log('Os leads que não receberam precisam primeiro receber um TEMPLATE aprovado');
  console.log('para abrir a janela de 24h do WhatsApp.\n');
  console.log('Opções:');
  console.log('1. Configurar a automação com TEMPLATE antes do áudio');
  console.log('2. Ou enviar template manualmente para esses contatos\n');
  
  // Exportar CSV
  console.log('📄 Exportando CSV...\n');
  
  const csv = [
    'Nome,Telefone,Email,Elemento,Score',
    ...naoReceberam.map(l => 
      `"${l.nome}","${l.celular}","${l.email || ''}","${l.elemento_principal}",${l.lead_score}`
    )
  ].join('\n');
  
  const fs = require('fs');
  const path = require('path');
  const csvPath = path.join(__dirname, 'leads-nao-receberam.csv');
  fs.writeFileSync(csvPath, csv, 'utf-8');
  
  console.log(`✅ CSV salvo em: ${csvPath}\n`);
}

listarNaoReceberam().catch(console.error);
