// enviar-campanhas-lotes.js
const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.local';

require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const GATILHO_URL = process.env.UNNICHAT_GATILHO_URL;

// Configurações de lote (pegam do .env ou usam padrão)
const LOTE_SIZE = parseInt(process.env.LOTE_SIZE) || 5;
const DELAY_ENTRE_ENVIOS = parseInt(process.env.DELAY_ENTRE_ENVIOS) || 3000;
const DELAY_ENTRE_LOTES = parseInt(process.env.DELAY_ENTRE_LOTES) || 10000;

// Validar variáveis críticas
if (!supabaseUrl || !supabaseKey || !GATILHO_URL) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('   Verifique: SUPABASE_URL, SUPABASE_KEY, UNNICHAT_GATILHO_URL');
  console.error('   Arquivo:', envFile);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enviarEmLotes() {
  console.log('🚀 INICIANDO CAMPANHA DE ENVIO EM MASSA');
  console.log('========================================');
  console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 TESTE');
  console.log('📦 Tamanho do lote:', LOTE_SIZE);
  console.log('⏱️  Delay entre envios:', DELAY_ENTRE_ENVIOS/1000 + 's');
  console.log('⏸️  Delay entre lotes:', DELAY_ENTRE_LOTES/1000 + 's');
  console.log('========================================\n');
  
  console.log('🔍 Buscando leads no Supabase...');
  
  const { data: allLeads, error } = await supabase
    .from('quiz_leads')
    .select('*')
    .not('celular', 'is', null)
    .order('lead_score', { ascending: false });
  
  if (error) {
    console.log('❌ Erro ao buscar leads:', error);
    return;
  }
  
  // Filtrar os que não receberam ainda
  const leads = allLeads.filter(lead => 
    !lead.whatsapp_status || 
    lead.whatsapp_status === 'AGUARDANDO_CONTATO' ||
    lead.whatsapp_status === 'failed'
  );
  
  if (!leads || leads.length === 0) {
    console.log('❌ Nenhum lead elegível encontrado');
    console.log('💡 Todos os leads já receberam o template!');
    return;
  }
  
  console.log(`✅ ${leads.length} leads encontrados!\n`);
  console.log('📋 Leads que receberão template:');
  leads.forEach((lead, i) => {
    console.log(`   ${i+1}. ${lead.nome} - ${lead.celular} - Score: ${lead.lead_score}`);
  });
  console.log('');
  
  // Dividir em lotes
  const totalLotes = Math.ceil(leads.length / LOTE_SIZE);
  console.log(`📦 Dividindo em ${totalLotes} lotes de até ${LOTE_SIZE} leads\n`);
  
  let totalEnviados = 0;
  let totalErros = 0;
  
  // Processar cada lote
  for (let i = 0; i < totalLotes; i++) {
    const loteAtual = i + 1;
    const inicio = i * LOTE_SIZE;
    const fim = Math.min((i + 1) * LOTE_SIZE, leads.length);
    const leadsLote = leads.slice(inicio, fim);
    
    console.log(`\n📦 ========================================`);
    console.log(`   LOTE ${loteAtual}/${totalLotes} (${leadsLote.length} leads)`);
    console.log(`========================================\n`);
    
    // Enviar cada lead do lote
    for (const lead of leadsLote) {
      console.log(`👤 Enviando para: ${lead.nome}`);
      console.log(`   📱 Telefone: ${lead.celular}`);
      console.log(`   📊 Lead Score: ${lead.lead_score}`);
      console.log(`   🎯 Elemento: ${lead.elemento_principal}`);
      
      try {
        const response = await fetch(GATILHO_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: lead.nome,
            email: lead.email || `${lead.celular}@placeholder.com`,
            phone: `55${lead.celular}`
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log(`   ✅ Template enviado com sucesso!\n`);
          totalEnviados++;
          
          await supabase
            .from('quiz_leads')
            .update({
              whatsapp_status: 'template_enviado',
              whatsapp_sent_at: new Date().toISOString(),
              whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
            })
            .eq('id', lead.id);
            
        } else {
          console.log(`   ❌ Erro: ${result.message || 'Desconhecido'}\n`);
          totalErros++;
          
          await supabase
            .from('quiz_leads')
            .update({
              whatsapp_status: 'failed',
              whatsapp_error: result.message || 'Erro desconhecido',
              whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
            })
            .eq('id', lead.id);
        }
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}\n`);
        totalErros++;
      }
      
      // Aguardar antes do próximo envio
      if (leadsLote.indexOf(lead) < leadsLote.length - 1) {
        console.log(`   ⏳ Aguardando ${DELAY_ENTRE_ENVIOS/1000}s...\n`);
        await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_ENVIOS));
      }
    }
    
    // Aguardar entre lotes
    if (loteAtual < totalLotes) {
      console.log(`\n⏸️  Pausa entre lotes: ${DELAY_ENTRE_LOTES/1000}s`);
      console.log(`   (${totalEnviados} enviados, ${totalErros} erros até agora)\n`);
      await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_LOTES));
    }
  }
  
  // Relatório final
  console.log('\n🎉 ========================================');
  console.log('   CAMPANHA FINALIZADA');
  console.log('========================================');
  console.log(`✅ Total enviados: ${totalEnviados}`);
  console.log(`❌ Total erros: ${totalErros}`);
  console.log(`📊 Taxa de sucesso: ${((totalEnviados / leads.length) * 100).toFixed(1)}%`);
  console.log('========================================\n');
  
  console.log('📱 Próximos passos:');
  console.log('1. Verifique seu WhatsApp');
  console.log('2. Os leads vão receber o template');
  console.log('3. Quando clicarem em "VER RESULTADOS", o webhook envia o diagnóstico!');
  console.log('');
}

enviarEmLotes();