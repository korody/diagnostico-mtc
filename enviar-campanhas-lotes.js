// enviar-campanhas-lotes.js - VERSÃO SEGURA PARA ENVIO EM MASSA
const { createClient } = require('@supabase/supabase-js');

// ========================================
// CONFIGURAÇÃO DE AMBIENTE
// ========================================
const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.local';

require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const GATILHO_URL = process.env.UNNICHAT_GATILHO_URL;

// Configurações de lote
const LOTE_SIZE = parseInt(process.env.LOTE_SIZE) || 10;
const DELAY_ENTRE_ENVIOS = parseInt(process.env.DELAY_ENTRE_ENVIOS) || 4000;
const DELAY_ENTRE_LOTES = parseInt(process.env.DELAY_ENTRE_LOTES) || 30000;

// Validar variáveis críticas
if (!supabaseUrl || !supabaseKey || !GATILHO_URL) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('   Verifique: SUPABASE_URL, SUPABASE_KEY, UNNICHAT_GATILHO_URL');
  console.error('   Arquivo:', envFile);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================
async function enviarEmLotes() {
  console.log('\n🚀 ========================================');
  console.log('   CAMPANHA DE ENVIO EM MASSA - Quiz MTC');
  console.log('========================================');
  console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 TESTE');
  console.log('📦 Tamanho do lote:', LOTE_SIZE, 'leads');
  console.log('⏱️  Delay entre envios:', DELAY_ENTRE_ENVIOS/1000 + 's');
  console.log('⏸️  Delay entre lotes:', DELAY_ENTRE_LOTES/1000 + 's');
  console.log('🔗 Gatilho:', GATILHO_URL.substring(0, 50) + '...');
  console.log('========================================\n');
  
  console.log('🔍 Buscando leads no Supabase...\n');
  
  const { data: allLeads, error } = await supabase
    .from('quiz_leads')
    .select('*')
    .not('celular', 'is', null)
    .order('lead_score', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao buscar leads:', error.message);
    return;
  }
  
  console.log(`📊 Total de leads no banco: ${allLeads?.length || 0}\n`);
  
  // Filtrar apenas os que não receberam ainda
  const leads = allLeads.filter(lead => 
    !lead.whatsapp_status || 
    lead.whatsapp_status === 'AGUARDANDO_CONTATO' ||
    lead.whatsapp_status === 'failed'
  );
  
  if (!leads || leads.length === 0) {
    console.log('✅ Nenhum lead elegível encontrado!');
    console.log('💡 Todos os leads já receberam o template.\n');
    return;
  }
  
  const leadsParaEnviar = leads; // ENVIAR TODOS OS ELEGÍVEIS
  
  console.log(`✅ ${leadsParaEnviar.length} leads elegíveis encontrados!\n`);
  console.log('📋 Primeiros 10 leads que receberão template:');
  leadsParaEnviar.slice(0, 10).forEach((lead, i) => {
    console.log(`   ${i+1}. ${lead.nome} - ${lead.celular} - Score: ${lead.lead_score} - ${lead.elemento_principal || 'N/A'}`);
  });
  
  if (leadsParaEnviar.length > 10) {
    console.log(`   ... e mais ${leadsParaEnviar.length - 10} leads\n`);
  }
  
  // ========================================
  // CONFIRMAÇÃO DE SEGURANÇA
  // ========================================
  const totalLotes = Math.ceil(leadsParaEnviar.length / LOTE_SIZE);
  const tempoEstimadoMinutos = Math.ceil(
    (leadsParaEnviar.length * DELAY_ENTRE_ENVIOS + totalLotes * DELAY_ENTRE_LOTES) / 60000
  );
  
  console.log('\n⚠️  ========================================');
  console.log('   CONFIRMAÇÃO DE ENVIO EM MASSA');
  console.log('========================================');
  console.log('📊 Total de leads:', leadsParaEnviar.length);
  console.log('📦 Total de lotes:', totalLotes);
  console.log('⏱️  Tempo estimado:', tempoEstimadoMinutos, 'minutos');
  console.log('🔥 Ambiente:', isProduction ? 'PRODUÇÃO (REAL)' : 'TESTE');
  console.log('========================================\n');
  
  if (leadsParaEnviar.length > 50) {
    console.log('💡 DICAS IMPORTANTES:');
    console.log('   • Mantenha este terminal aberto');
    console.log('   • Mantenha internet estável');
    console.log('   • Pode pausar com Ctrl+C e retomar depois');
    console.log('   • Os leads já enviados não serão enviados novamente\n');
    
    console.log('⏳ Iniciando em 10 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  // ========================================
  // PROCESSAR ENVIOS
  // ========================================
  let totalEnviados = 0;
  let totalErros = 0;
  const inicioCampanha = new Date();
  
  console.log('🚀 INICIANDO ENVIOS...\n');
  
  for (let i = 0; i < totalLotes; i++) {
    const loteAtual = i + 1;
    const inicio = i * LOTE_SIZE;
    const fim = Math.min((i + 1) * LOTE_SIZE, leadsParaEnviar.length);
    const leadsLote = leadsParaEnviar.slice(inicio, fim);
    
    console.log(`\n📦 ========================================`);
    console.log(`   LOTE ${loteAtual}/${totalLotes} (${leadsLote.length} leads)`);
    console.log(`========================================\n`);
    
    // Enviar cada lead do lote
    for (const lead of leadsLote) {
      console.log(`👤 ${lead.nome}`);
      console.log(`   📱 ${lead.celular}`);
      console.log(`   📊 Score: ${lead.lead_score} | 🎯 ${lead.elemento_principal || 'N/A'}`);
      
      try {
        const phoneForUnnichat = `55${lead.celular}`;
        
        const response = await fetch(GATILHO_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: lead.nome,
            email: lead.email || `${lead.celular}@placeholder.com`,
            phone: phoneForUnnichat
          })
        });
        
        const result = await response.json();
        
        if (response.ok || result.success) {
          console.log(`   ✅ Template enviado!\n`);
          totalEnviados++;
          
          // Atualizar status no Supabase
          await supabase
            .from('quiz_leads')
            .update({
              whatsapp_status: 'template_enviado',
              whatsapp_sent_at: new Date().toISOString(),
              whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
            })
            .eq('id', lead.id);
          
          // Registrar log
          await supabase.from('whatsapp_logs').insert({
            lead_id: lead.id,
            phone: lead.celular,
            status: 'template_enviado',
            metadata: { gatilho_response: result },
            sent_at: new Date().toISOString()
          });
            
        } else {
          throw new Error(result.message || 'Erro desconhecido');
        }
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        totalErros++;
        
        // 🔄 RETRY: Tentar novamente se for erro de rede
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('ECONNREFUSED')) {
          console.log('   🔄 Tentando novamente em 10s...');
          await new Promise(resolve => setTimeout(resolve, 10000));
          
          try {
            const retryResponse = await fetch(GATILHO_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: lead.nome,
                email: lead.email || `${lead.celular}@placeholder.com`,
                phone: `55${lead.celular}`
              })
            });
            
            if (retryResponse.ok) {
              console.log('   ✅ Sucesso na 2ª tentativa!\n');
              totalEnviados++;
              totalErros--;
              
              await supabase
                .from('quiz_leads')
                .update({
                  whatsapp_status: 'template_enviado',
                  whatsapp_sent_at: new Date().toISOString(),
                  whatsapp_attempts: 1
                })
                .eq('id', lead.id);
              
              continue;
            }
          } catch (retryError) {
            console.log('   ❌ Falhou na 2ª tentativa\n');
          }
        }
        
        // Salvar erro no banco
        await supabase
          .from('quiz_leads')
          .update({
            whatsapp_status: 'failed',
            whatsapp_error: error.message,
            whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
          })
          .eq('id', lead.id);
      }
      
      // Aguardar antes do próximo envio (exceto último do lote)
      if (leadsLote.indexOf(lead) < leadsLote.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_ENVIOS));
      }
    }
    
    // Checkpoint após cada lote
    console.log(`\n💾 Checkpoint: ${totalEnviados}/${leadsParaEnviar.length} enviados`);
    console.log(`   ✅ Sucesso: ${totalEnviados} | ❌ Erros: ${totalErros}`);
    console.log(`   📊 Taxa: ${((totalEnviados / (totalEnviados + totalErros)) * 100).toFixed(1)}%`);
    
    // Pausa extra a cada 50 leads
    if (totalEnviados % 50 === 0 && totalEnviados > 0 && loteAtual < totalLotes) {
      console.log('\n🔄 Checkpoint de 50 leads! Pausa extra de 60s...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
    
    // Aguardar entre lotes (exceto último)
    if (loteAtual < totalLotes) {
      console.log(`\n⏸️  Pausa entre lotes: ${DELAY_ENTRE_LOTES/1000}s`);
      await new Promise(resolve => setTimeout(resolve, DELAY_ENTRE_LOTES));
    }
  }
  
  // ========================================
  // RELATÓRIO FINAL
  // ========================================
  const fimCampanha = new Date();
  const duracaoMinutos = Math.round((fimCampanha - inicioCampanha) / 60000);
  
  console.log('\n\n🎉 ========================================');
  console.log('   CAMPANHA FINALIZADA!');
  console.log('========================================');
  console.log('✅ Total enviados:', totalEnviados);
  console.log('❌ Total erros:', totalErros);
  console.log('📊 Taxa de sucesso:', ((totalEnviados / leadsParaEnviar.length) * 100).toFixed(1) + '%');
  console.log('⏱️  Duração:', duracaoMinutos, 'minutos');
  console.log('🕐 Início:', inicioCampanha.toLocaleTimeString());
  console.log('🕐 Fim:', fimCampanha.toLocaleTimeString());
  console.log('========================================\n');
  
  console.log('📱 PRÓXIMOS PASSOS:');
  console.log('1. Os leads receberão o template no WhatsApp');
  console.log('2. Quando clicarem em "VER RESULTADOS", o webhook é acionado');
  console.log('3. O diagnóstico completo é enviado automaticamente');
  console.log('4. Monitore os resultados no Supabase ou rode: npm run verify:prod\n');
  
  if (totalErros > 0) {
    console.log('⚠️  ATENÇÃO:');
    console.log(`   ${totalErros} leads falharam no envio`);
    console.log('   Você pode reenviar apenas para os que falharam rodando este script novamente');
    console.log('   (ele envia apenas para status AGUARDANDO_CONTATO ou failed)\n');
  }
}

// ========================================
// EXECUTAR
// ========================================
enviarEmLotes().catch(error => {
  console.error('\n❌ ERRO CRÍTICO:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});