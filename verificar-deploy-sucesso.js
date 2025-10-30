/**
 * Verificar se deploy do hotfix foi bem-sucedido
 * Deve buscar logs recentes de WhatsApp para confirmar que erros pararam
 */

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

async function verificarDeploySucesso() {
  console.log('\n🔍 VERIFICANDO STATUS PÓS-DEPLOY\n');
  console.log('='.repeat(60));

  try {
    // 1. Buscar últimas mensagens WhatsApp (últimos 30 minutos)
    const agora = new Date();
    const trintaMinutosAtras = new Date(agora.getTime() - 30 * 60 * 1000);
    
    console.log('\n📋 Buscando atividade WhatsApp nos últimos 30 minutos...');
    console.log(`   Desde: ${trintaMinutosAtras.toLocaleString('pt-BR')}`);
    
    const { data: mensagens, error: msgError } = await supabase
      .from('whatsapp_logs')
      .select('created_at, phone, status, error')
      .gte('created_at', trintaMinutosAtras.toISOString())
      .order('created_at', { ascending: false });

    if (msgError) {
      console.error('❌ Erro ao buscar mensagens:', msgError);
      return;
    }

    console.log(`\n📊 Total de mensagens: ${mensagens.length}`);

    const comErro = mensagens.filter(m => m.error);
    const errosCalculo = comErro.filter(e => 
      e.error && e.error.includes('calcularDiagnosticoCompleto')
    );
    const outrosErros = comErro.filter(e => 
      e.error && !e.error.includes('calcularDiagnosticoCompleto')
    );

    console.log(`✅ Enviadas com sucesso: ${mensagens.length - comErro.length}`);
    console.log(`❌ Com erro: ${comErro.length}`);

    if (errosCalculo.length > 0) {
      console.log(`\n❌ ERROS DE calcularDiagnosticoCompleto: ${errosCalculo.length}`);
      errosCalculo.slice(0, 3).forEach(e => {
        const hora = new Date(e.created_at).toLocaleTimeString('pt-BR');
        console.log(`   - ${hora} | ${e.phone}`);
        console.log(`     ${e.error.substring(0, 80)}...`);
      });
      console.log('\n⚠️ CÓDIGO ANTIGO AINDA ATIVO! Deploy não propagou!');
    } else {
      console.log('\n✅ NENHUM ERRO de calcularDiagnosticoCompleto!');
    }

    if (outrosErros.length > 0) {
      console.log(`\nℹ️ Outros erros (não relacionados ao hotfix): ${outrosErros.length}`);
      outrosErros.slice(0, 2).forEach(e => {
        const hora = new Date(e.created_at).toLocaleTimeString('pt-BR');
        console.log(`   - ${hora} | ${e.phone}`);
        console.log(`     ${(e.error || '').substring(0, 60)}...`);
      });
    }

    // 2. Verificar leads que tiveram erro antes do deploy
    console.log('\n\n👥 VERIFICANDO LEADS COM ERRO ANTERIOR\n');
    console.log('='.repeat(60));

    const leadsComErro = [
      { nome: 'Edna Martins', phone: '+5511975129828' },
      { nome: 'José Aiko Marinho', email: 'AIKOMARINHO@GMAIL.COM' }
    ];

    for (const lead of leadsComErro) {
      console.log(`\n🔍 ${lead.nome}:`);
      
      let { data: leadData, error: leadError } = await supabase
        .from('quiz_leads')
        .select('id, nome, telefone, email, diagnostico_completo, script_abertura')
        .or(lead.phone ? `telefone.eq.${lead.phone}` : `email.ilike.${lead.email}`)
        .single();

      if (leadError || !leadData) {
        console.log('   ❌ Lead não encontrado');
        continue;
      }

      console.log(`   ID: ${leadData.id}`);
      console.log(`   Tel: ${leadData.telefone}`);
      console.log(`   Email: ${leadData.email}`);
      console.log(`   Diagnóstico: ${leadData.diagnostico_completo ? '✅ TEM' : '❌ NÃO TEM'}`);
      console.log(`   Script: ${leadData.script_abertura ? '✅ TEM' : '❌ NÃO TEM'}`);
      
      // Status atual
      if (leadData.diagnostico_completo || leadData.script_abertura) {
        console.log('   ✅ Lead tem diagnóstico disponível - webhook deve funcionar agora');
      } else {
        console.log('   ⚠️ Lead sem diagnóstico - precisa completar quiz');
      }
    }

    // 3. Últimos 5 webhooks recebidos
    console.log('\n\n📡 ÚLTIMAS ATIVIDADES DE WEBHOOK\n');
    console.log('='.repeat(60));

    const { data: ultimas, error: ultimasError } = await supabase
      .from('whatsapp_logs')
      .select('created_at, phone, status, error')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!ultimasError && ultimas) {
      ultimas.forEach(m => {
        const hora = new Date(m.created_at).toLocaleString('pt-BR');
        const statusIcon = m.error ? '❌' : '✅';
        const statusText = m.error ? `ERRO: ${m.error.substring(0, 50)}...` : m.status;
        console.log(`${statusIcon} ${hora} | ${m.phone}`);
        console.log(`   ${statusText}`);
      });
    }

    // 4. Resumo final
    console.log('\n\n📊 RESUMO DO STATUS\n');
    console.log('='.repeat(60));
    console.log('Deploy ID: 336fdf6 (CURRENT)');
    console.log('Commit: DEPLOY: Forçar redeploy Vercel');
    console.log(`Mensagens últimos 30min: ${mensagens.length}`);
    console.log(`Erros calcularDiagnosticoCompleto: ${errosCalculo.length}`);
    console.log(`Outros erros: ${outrosErros.length}`);
    
    if (errosCalculo.length === 0) {
      console.log('\n🎉 STATUS: HOTFIX APLICADO COM SUCESSO! 🎉');
      console.log('✅ Erros de calcularDiagnosticoCompleto pararam!');
      console.log('✅ Webhook funcionando normalmente.');
      console.log('\n💡 Próximos passos:');
      console.log('   1. Monitorar logs por mais 15-30 minutos');
      console.log('   2. Verificar se novos leads conseguem receber diagnóstico');
      console.log('   3. Documentar incidente para postmortem');
    } else {
      console.log('\n⚠️ STATUS: AGUARDAR PROPAGAÇÃO');
      console.log('⏳ Deploy pode levar alguns minutos para propagar.');
      console.log('📋 Executar este script novamente em 5 minutos.');
    }

  } catch (error) {
    console.error('\n❌ Erro ao verificar status:', error);
  }
}

verificarDeploySucesso();
