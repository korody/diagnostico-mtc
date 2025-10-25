// enviar-campanhas-lotes.js - COM PAGINAÇÃO COMPLETA
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

// 🔒 LIMITE PARA TESTE (mude para null para enviar todos)
const LIMITE_TESTE = 500;

// Validar variáveis críticas
if (!supabaseUrl || !supabaseKey || !GATILHO_URL) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('   Verifique: SUPABASE_URL, SUPABASE_KEY, UNNICHAT_GATILHO_URL');
  console.error('   Arquivo:', envFile);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// FUNÇÃO: BUSCAR TODOS OS LEADS (COM PAGINAÇÃO)
// ========================================
async function buscarTodosLeads() {
  console.log('🔍 Buscando total de leads...');
  
  // Primeiro, contar quantos existem
  const { count } = await supabase
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true })
    .not('celular', 'is', null);
  
  console.log(`📊 Total de leads com telefone: ${count}`);
  
  // Buscar todos em lotes de 1000
  let allLeads = [];
  let offset = 0;
  const BATCH_SIZE = 1000;
  
  while (offset < count) {
    console.log(`   Carregando leads ${offset + 1} a ${Math.min(offset + BATCH_SIZE, count)}...`);
    
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .not('celular', 'is', null)
      .order('lead_score', { ascending: true }) // Menor score primeiro
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (error) {
      console.error('❌ Erro ao buscar leads:', error.message);
      throw error;
    }
    
    allLeads = allLeads.concat(data);
    offset += BATCH_SIZE;
  }
  
  console.log(`✅ Total carregado: ${allLeads.length} leads\n`);
  return allLeads;
}

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
  
  if (LIMITE_TESTE) {
    console.log('🔒 MODO TESTE: Limite de', LIMITE_TESTE, 'leads');
  }
  
  console.log('========================================\n');
  
  // BUSCAR TODOS OS LEADS (COM PAGINAÇÃO)
  const allLeads = await buscarTodosLeads();
  
  // Filtrar apenas os que não receberam ainda
  const leadsElegiveis = allLeads.filter(lead => 
    !lead.whatsapp_status || 
    lead.whatsapp_status === 'AGUARDANDO_CONTATO' ||
    lead.whatsapp_status === 'failed'
  );
  
  console.log(`📋 Leads elegíveis (não enviados): ${leadsElegiveis.length}\n`);
  
  if (!leadsElegiveis || leadsElegiveis.length === 0) {
    console.log('✅ Nenhum lead elegível encontrado!');
    console.log('💡 Todos os leads já receberam o template.\n');
    return;
  }
  
  // 🔒 APLICAR LIMITE DE TESTE
  const leadsParaEnviar = LIMITE_TESTE 
    ? leadsElegiveis.slice(0, LIMITE_TESTE) 
    : leadsElegiveis;
  
  console.log(`✅ ${leadsParaEnviar.length} leads selecionados para envio!\n`);
  
  if (LIMITE_TESTE && leadsElegiveis.length > LIMITE_TESTE) {
    console.log(`⚠️  ATENÇÃO: Modo teste ativo!`);
    console.log(`   Enviando para ${LIMITE_TESTE} de ${leadsElegiveis.length} leads elegíveis\n`);
  }
  
  console.log('📋 Primeiros 10 leads que receberão template:');
  leadsParaEnviar.slice(0, 10).forEach((lead, i) => {
    console.log(`   ${i+1}. ${lead.nome} - ${lead.celular} - Score: ${lead.lead_score} - ${lead.elemento_principal || 'N/A'}`);
  });
  
  if (leadsParaEnviar.length > 10) {
    console.log(`   ... e mais ${leadsParaEnviar.length - 10} leads`);
  }
  console.log('');
  
  // ========================================
  // CONFIRMAÇÃO DE SEGURANÇA
  // ========================================
  const totalLotes = Math.ceil(leadsParaEnviar.length / LOTE_SIZE);
  const tempoEstimadoMinutos = Math.ceil(
    (leadsParaEnviar.length * DELAY_ENTRE_ENVIOS + totalLotes * DELAY_ENTRE_LOTES) / 60000
  );
  
  console.log('\n⚠️  ========================================');
  console.log('   CONFIRMAÇÃO DE ENVIO');
  console.log('========================================');
  console.log('📊 Total de leads:', leadsParaEnviar.length);
  console.log('📦 Total de lotes:', totalLotes);
  console.log('⏱️  Tempo estimado:', tempoEstimadoMinutos, 'minutos');
  console.log('🔥 Ambiente:', isProduction ? 'PRODUÇÃO (REAL)' : 'TESTE');
  
  if (LIMITE_TESTE) {
    console.log('🔒 Modo:', 'TESTE - Limite de', LIMITE_TESTE, 'leads');
  } else {
    console.log('🚨 Modo:', 'ENVIO TOTAL');
  }
  
  console.log('========================================\n');
  
  if (leadsParaEnviar.length > 5 && !LIMITE_TESTE) {
    console.log('💡 DICAS IMPORTANTES:');
    console.log('   • Mantenha este terminal aberto');
    console.log('   • Mantenha internet estável');
    console.log('   • Pode pausar com Ctrl+C e retomar depois');
    console.log('   • Os leads já enviados não serão enviados novamente\n');
    
    console.log('⏳ Iniciando em 10 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));
  } else {
    console.log('⏳ Iniciando em 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
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
    
    if (totalEnviados + totalErros > 0) {
      console.log(`   📊 Taxa: ${((totalEnviados / (totalEnviados + totalErros)) * 100).toFixed(1)}%`);
    }
    
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
  const duracaoSegundos = Math.round((fimCampanha - inicioCampanha) / 1000);
  
  console.log('\n\n🎉 ========================================');
  console.log('   CAMPANHA FINALIZADA!');
  console.log('========================================');
  console.log('✅ Total enviados:', totalEnviados);
  console.log('❌ Total erros:', totalErros);
  console.log('📊 Taxa de sucesso:', ((totalEnviados / leadsParaEnviar.length) * 100).toFixed(1) + '%');
  console.log('⏱️  Duração:', duracaoMinutos > 0 ? duracaoMinutos + ' minutos' : duracaoSegundos + ' segundos');
  console.log('🕐 Início:', inicioCampanha.toLocaleTimeString('pt-BR'));
  console.log('🕐 Fim:', fimCampanha.toLocaleTimeString('pt-BR'));
  console.log('========================================\n');
  
  console.log('📱 PRÓXIMOS PASSOS:');
  console.log('1. Os leads receberão o template no WhatsApp');
  console.log('2. Quando clicarem em "VER RESULTADOS", o webhook é acionado');
  console.log('3. O diagnóstico completo é enviado automaticamente');
  console.log('4. Monitore os resultados: npm run verify:prod\n');
  
  if (totalErros > 0) {
    console.log('⚠️  ATENÇÃO:');
    console.log(`   ${totalErros} leads falharam no envio`);
    console.log('   Reenviar: npm run send:prod (só reenvia os que falharam)\n');
  }
  
  if (LIMITE_TESTE) {
    console.log('💡 PARA ENVIAR PARA TODOS:');
    console.log('   Edite: const LIMITE_TESTE = null;\n');
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