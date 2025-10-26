// send-all-challenge.js - DESAFIO PARA QUEM JÁ RECEBEU DIAGNÓSTICO
const { createClient } = require('@supabase/supabase-js');

// ========================================
// CONFIGURAÇÃO DE AMBIENTE
// ========================================
const isProduction = true; // ⚠️ FORÇADO PARA PRODUÇÃO
const envFile = isProduction ? '.env.production' : '.env.local';

require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;

// Configurações
const BATCH_SIZE = 20;
const DELAY_BETWEEN_MESSAGES = 2000;
const DELAY_BETWEEN_LEADS = 3000;
const DELAY_BETWEEN_BATCHES = 30000;
const PAUSE_EVERY_N_LEADS = 50;

// 🔒 LIMITE PARA TESTE
const TEST_LIMIT = null; // null = todos

// Validar
if (!supabaseUrl || !supabaseKey || !UNNICHAT_TOKEN) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// BUSCAR LEADS QUE JÁ RECEBERAM DIAGNÓSTICO MAS NÃO O DESAFIO
// ========================================
async function buscarLeadsComDiagnostico() {
  console.log('🔍 Buscando leads que receberam diagnóstico MAS ainda não receberam desafio...\n');
  
  // Contar quantos já receberam diagnóstico
  const { count } = await supabase
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true })
    .not('celular', 'is', null)
    .eq('whatsapp_status', 'resultados_enviados') // APENAS QUEM RECEBEU RESULTADOS E NÃO TEM DESAFIO
  
  console.log(`📊 Total com diagnóstico e sem desafio: ${count}`);
  
  // Buscar todos em páginas de 1000
  let allLeads = [];
  let offset = 0;
  const PAGE_SIZE = 1000;
  
  while (offset < count) {
    console.log(`   Carregando leads ${offset + 1} a ${Math.min(offset + PAGE_SIZE, count)}...`);
    
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('id, nome, celular, email, lead_score, elemento_principal, created_at, whatsapp_status, whatsapp_sent_at, whatsapp_attempts')
      .not('celular', 'is', null)
      .eq('whatsapp_status', 'resultados_enviados') // APENAS QUEM TEM RESULTADOS E NÃO TEM DESAFIO
      .order('lead_score', { ascending: false }) // Maior score primeiro (mais engajados)
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (error) {
      console.error('❌ Erro ao buscar leads:', error.message);
      throw error;
    }
    
    allLeads = allLeads.concat(data);
    offset += PAGE_SIZE;
  }
  
  console.log(`✅ Total carregado: ${allLeads.length} leads\n`);
  return allLeads;
}

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================
async function enviarDesafioVitalidade() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  🚀 DESAFIO DA VITALIDADE - ENVIO EM MASSA       ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 DESENVOLVIMENTO');
  console.log('🎯 Público: Quem recebeu diagnóstico MAS não recebeu desafio');
  console.log('📦 Tamanho do lote:', BATCH_SIZE, 'leads');
  
  if (TEST_LIMIT) {
    console.log('🔒 MODO TESTE: Limite de', TEST_LIMIT, 'leads');
  }
  
  console.log('═══════════════════════════════════════════════════\n');
  
  // BUSCAR APENAS QUEM JÁ RECEBEU DIAGNÓSTICO
  const leadsWithDiagnosis = await buscarLeadsComDiagnostico();
  
  if (!leadsWithDiagnosis || leadsWithDiagnosis.length === 0) {
    console.log('❌ Nenhum lead encontrado com diagnóstico!');
    console.log('💡 Certifique-se que já enviou a primeira campanha.\n');
    return;
  }
  
  // Aplicar limite de teste
  const leadsToSend = TEST_LIMIT 
    ? leadsWithDiagnosis.slice(0, TEST_LIMIT) 
    : leadsWithDiagnosis;
  
  console.log(`✅ ${leadsToSend.length} leads selecionados!\n`);
  
  if (TEST_LIMIT && leadsWithDiagnosis.length > TEST_LIMIT) {
    console.log(`⚠️  MODO TESTE: Enviando para ${TEST_LIMIT} de ${leadsWithDiagnosis.length}\n`);
  }
  
  console.log('📋 Primeiros 10 leads que receberão Desafio:');
  leadsToSend.slice(0, 10).forEach((lead, i) => {
    console.log(`   ${i+1}. ${lead.nome} - ${lead.celular} - Score: ${lead.lead_score || 0} - Status: ${lead.whatsapp_status}`);
  });
  
  if (leadsToSend.length > 10) {
    console.log(`   ... e mais ${leadsToSend.length - 10} leads`);
  }
  console.log('');
  
  // CONFIRMAÇÃO
  const totalBatches = Math.ceil(leadsToSend.length / BATCH_SIZE);
  const estimatedMinutes = Math.ceil(
    (leadsToSend.length * (DELAY_BETWEEN_LEADS / 1000) + totalBatches * (DELAY_BETWEEN_BATCHES / 1000)) / 60
  );
  
  console.log('\n⚠️  ═══════════════════════════════════════════════');
  console.log('   CONFIRMAÇÃO DE ENVIO');
  console.log('═══════════════════════════════════════════════════');
  console.log('📊 Total de leads:', leadsToSend.length);
  console.log('📨 Total de mensagens:', leadsToSend.length * 2, '(2 por lead)');
  console.log('📦 Total de lotes:', totalBatches);
  console.log('⏱️  Tempo estimado:', estimatedMinutes, 'minutos (~' + Math.round(estimatedMinutes / 60) + 'h)');
  console.log('🎯 Público: Tem diagnóstico, sem desafio');
  
  if (TEST_LIMIT) {
    console.log('🔒 Modo: TESTE');
  } else {
    console.log('🚨 Modo: ENVIO TOTAL');
  }
  
  console.log('═══════════════════════════════════════════════════\n');
  
  if (leadsToSend.length > 5 && !TEST_LIMIT) {
    console.log('💡 DICAS:');
    console.log('   • Mantenha terminal aberto');
    console.log('   • Pode pausar com Ctrl+C\n');
    console.log('⏳ Iniciando em 10 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 10000));
  } else {
    console.log('⏳ Iniciando em 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // PROCESSAR ENVIOS
  let totalSent = 0;
  let totalFailed = 0;
  let totalMessages = 0;
  const startTime = new Date();
  
  console.log('🚀 INICIANDO ENVIOS...\n');
  
  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    const currentBatch = batchNum + 1;
    const start = batchNum * BATCH_SIZE;
    const end = Math.min((batchNum + 1) * BATCH_SIZE, leadsToSend.length);
    const batchLeads = leadsToSend.slice(start, end);
    
    console.log(`\n📦 ═══════════════════════════════════════════════`);
    console.log(`   LOTE ${currentBatch}/${totalBatches} (${batchLeads.length} leads)`);
    console.log(`═══════════════════════════════════════════════`);
    
    for (const lead of batchLeads) {
      console.log(`\n👤 ${lead.nome}`);
      console.log(`   📱 55${lead.celular}`);
      console.log(`   📊 Score: ${lead.lead_score || 0} | Status: ${lead.whatsapp_status}`);
      
      try {
        const phoneForUnnichat = `55${lead.celular}`;
        const referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${lead.celular}&utm_content=msg-inicial-desafio`;
        
        // COPY DO SERVER.JS
        const message1 = `*Quer ganhar acesso ao SUPER COMBO Vitalício do Mestre Ye, sem pagar nada?*

Preparamos algo muito especial para você: o *Desafio da Vitalidade*.

Durante as próximas semanas, você vai receber *missões simples durante as Lives de Aquecimento da Black November da Saúde Vitalícia*.

Cada missão vai te aproximar mais do *equilíbrio, da leveza e da vitalidade que o seu corpo merece.* 🀄

*Veja como participar:*

1. Compartilhe suas missões no Instagram Stories e marque *@mestre_ye*;
2. Convide amigos e familiares para o evento através do seu link único`;

        const message2 = `Para aumentar suas chances de ganhar o *SUPER COMBO Vitalício do Mestre Ye*, compartilhe o link abaixo com o máximo de amigos e familiares.

Cada pessoa que se inscrever através do seu link único aumenta suas chances de ser o grande vencedor ou vencedrora!

*Seu link de compartilhamento*:
${referralLink}

Compartilhe vitalidade. Inspire transformação`;
        
        // ENVIAR MENSAGEM 1
        console.log(`   📤 Enviando 1/2...`);
        const response1 = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: phoneForUnnichat,
            messageText: message1
          })
        });
        
        const data1 = await response1.json();
        if (data1.code && data1.code !== '200') {
          throw new Error(`Msg 1: ${data1.message || 'Erro'}`);
        }
        
        totalMessages++;
        console.log(`   ✅ 1/2 enviada`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));
        
        // ENVIAR MENSAGEM 2
        console.log(`   📤 Enviando 2/2...`);
        const response2 = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: phoneForUnnichat,
            messageText: message2
          })
        });
        
        const data2 = await response2.json();
        if (data2.code && data2.code !== '200') {
          throw new Error(`Msg 2: ${data2.message || 'Erro'}`);
        }
        
        totalMessages++;
        console.log(`   ✅ 2/2 enviada`);
        totalSent++;
        
        // Atualizar status
        await supabase
          .from('quiz_leads')
          .update({
            whatsapp_status: 'desafio_enviado',
            whatsapp_sent_at: new Date().toISOString(),
            whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
          })
          .eq('id', lead.id);
        
        // Registrar logs
        await supabase.from('whatsapp_logs').insert([
          {
            lead_id: lead.id,
            phone: lead.celular,
            status: 'desafio_enviado',
            metadata: { referral_link: referralLink, message: 1, campaign: 'desafio_vitalidade' },
            sent_at: new Date().toISOString()
          },
          {
            lead_id: lead.id,
            phone: lead.celular,
            status: 'desafio_enviado',
            metadata: { referral_link: referralLink, message: 2, campaign: 'desafio_vitalidade' },
            sent_at: new Date().toISOString()
          }
        ]);
        
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
        totalFailed++;
        
        await supabase
          .from('quiz_leads')
          .update({
            whatsapp_status: 'desafio_failed',
            whatsapp_error: error.message,
            whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
          })
          .eq('id', lead.id);
      }
      
      if (batchLeads.indexOf(lead) < batchLeads.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_LEADS));
      }
    }
    
    // CHECKPOINT
    console.log(`\n💾 Checkpoint: ${totalSent}/${leadsToSend.length} enviados`);
    console.log(`   ✅ Sucesso: ${totalSent} | ❌ Falhas: ${totalFailed}`);
    console.log(`   📨 Mensagens: ${totalMessages}`);
    
    if (totalSent + totalFailed > 0) {
      console.log(`   📊 Taxa: ${((totalSent / (totalSent + totalFailed)) * 100).toFixed(1)}%`);
    }
    
    // PAUSA EXTRA
    if (totalSent % PAUSE_EVERY_N_LEADS === 0 && totalSent > 0 && currentBatch < totalBatches) {
      console.log(`\n🔄 Checkpoint de ${PAUSE_EVERY_N_LEADS}! Pausa extra 60s...`);
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
    
    // PAUSA ENTRE LOTES
    if (currentBatch < totalBatches) {
      console.log(`\n⏸️  Pausa entre lotes: ${DELAY_BETWEEN_BATCHES / 1000}s`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  // RELATÓRIO FINAL
  const endTime = new Date();
  const durationMinutes = Math.round((endTime - startTime) / 60000);
  
  console.log('\n\n🎉 ═══════════════════════════════════════════════');
  console.log('   DESAFIO DA VITALIDADE - FINALIZADO!');
  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Total enviados:', totalSent, 'leads');
  console.log('📨 Total mensagens:', totalMessages);
  console.log('❌ Total erros:', totalFailed);
  console.log('📊 Taxa de sucesso:', ((totalSent / leadsToSend.length) * 100).toFixed(1) + '%');
  console.log('⏱️  Duração:', durationMinutes, 'minutos');
  console.log('═══════════════════════════════════════════════════\n');
  
  if (TEST_LIMIT) {
    console.log('💡 PARA ENVIAR PARA TODOS: const TEST_LIMIT = null;\n');
  }
}

// EXECUTAR
enviarDesafioVitalidade().catch(error => {
  console.error('\n❌ ERRO CRÍTICO:', error.message);
  process.exit(1);
});