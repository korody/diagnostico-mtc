// test-template-all.js - VERSÃO FINAL COM CRIAÇÃO DE CONTATOS
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Importa fetch
let fetch;
if (typeof globalThis.fetch === 'function') {
  fetch = globalThis.fetch;
} else {
  fetch = require('node-fetch');
}

// Configuração Supabase (ambiente de TESTE)
const supabaseUrl = 'https://etbodugymxmrmbqfjigz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0Ym9kdWd5bXhtcm1icWZqaWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTI4NzMsImV4cCI6MjA3NjU2ODg3M30.rXHsTPfZ8BwM_jEt_ERp7QVfBlYWgU8sFSbMvhWURAY';

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuração Unnichat
const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = '68aaf071-82e8-4771-aaab-2963ec81add5';
const TEMPLATE_ID = '1984901562364518';

// Configurações de envio
const DELAY_BETWEEN_MESSAGES = 3000; // 3 segundos
const DRY_RUN = false; // ⚠️ MUDE PARA false PARA ENVIAR DE VERDADE!

// Função para aguardar
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ✅ FUNÇÃO PARA BUSCAR CONTATO
async function buscarContato(phoneNumber) {
  try {
    const response = await fetch(`${UNNICHAT_API_URL}/contact/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneNumber
      })
    });

    if (!response.ok) {
      return null; // Contato não encontrado
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.log('⚠️  Erro ao buscar contato:', error.message);
    return null;
  }
}

// ✅ FUNÇÃO PARA CRIAR CONTATO
async function criarContato(phoneNumber, nome) {
  try {
    console.log('📝 Criando contato no Unnichat...');

    const response = await fetch(`${UNNICHAT_API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nome,
        phone: phoneNumber,
        email: `${phoneNumber}@placeholder.com`, // email opcional
        tags: ['quiz_mtc', 'lead']
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Erro ao criar contato');
    }

    console.log('✅ Contato criado com sucesso!');
    return result;

  } catch (error) {
    throw new Error(`Erro ao criar contato: ${error.message}`);
  }
}

// ✅ FUNÇÃO PARA GERENCIAR CONTATO (busca ou cria)
async function gerenciarContato(phoneNumber, nome) {
  try {
    console.log('🔍 Buscando contato no Unnichat...');

    // 1. Tentar buscar contato
    const contatoExistente = await buscarContato(phoneNumber);

    if (contatoExistente) {
      console.log('✅ Contato já existe!');
      return contatoExistente;
    }

    // 2. Se não existe, criar
    console.log('⚠️  Contato não encontrado. Criando...');
    const novoContato = await criarContato(phoneNumber, nome);
    
    // Aguardar 2 segundos após criar
    console.log('⏳ Aguardando 2s após criar contato...');
    await sleep(2000);

    return novoContato;

  } catch (error) {
    throw new Error(`Erro ao gerenciar contato: ${error.message}`);
  }
}

// Função para enviar template para um lead
async function enviarTemplateParaLead(lead, index, total) {
  try {
    console.log(`\n📤 [${index + 1}/${total}] ==========================================`);
    console.log('Nome:', lead.nome);
    console.log('Telefone:', lead.celular);

    const primeiroNome = lead.nome.split(' ')[0];
    const phoneNumber = lead.celular.replace(/\D/g, '');

    if (DRY_RUN) {
      console.log('🔄 [DRY RUN] Simulando envio...');
      return { success: true, simulated: true };
    }

    // ✅ PASSO 1: GERENCIAR CONTATO (buscar ou criar)
    await gerenciarContato(phoneNumber, lead.nome);

    // ✅ PASSO 2: ENVIAR TEMPLATE
    console.log('📨 Enviando template...');

    const payload = {
      phone: phoneNumber,
      templateId: TEMPLATE_ID,
      bodyParameters: [
        {
          type: 'text',
          text: primeiroNome
        }
      ],
      urlButtonParameters: [],
      headerParameters: []
    };

    const response = await fetch(`${UNNICHAT_API_URL}/meta/templates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || result.error || response.statusText);
    }

    console.log('✅ Template enviado! Message ID:', result.messageId || result.id);

    // Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: phoneNumber,
      message_id: result.messageId || result.id,
      status: 'template_sent',
      metadata: {
        template_id: TEMPLATE_ID,
        template_name: 'diagnostico_completo',
        variables: { nome: primeiroNome },
        response: result
      },
      sent_at: new Date().toISOString()
    });

    // Atualizar lead
    await supabase.from('quiz_leads').update({
      whatsapp_status: 'template_sent',
      whatsapp_sent_at: new Date().toISOString(),
      whatsapp_message_id: result.messageId || result.id
    }).eq('id', lead.id);

    return { success: true, messageId: result.messageId || result.id };

  } catch (error) {
    console.error('❌ Erro:', error.message);

    // Registrar falha
    try {
      await supabase.from('whatsapp_logs').insert({
        lead_id: lead.id,
        phone: lead.celular,
        status: 'failed',
        metadata: { error: error.message },
        sent_at: new Date().toISOString()
      });

      await supabase.from('quiz_leads').update({
        whatsapp_status: 'failed',
        whatsapp_error: error.message
      }).eq('id', lead.id);
    } catch (logError) {
      console.error('⚠️ Erro ao registrar falha:', logError.message);
    }

    return { success: false, error: error.message };
  }
}

async function enviarParaTodosLeads() {
  try {
    console.log('\n🚀 ========================================');
    console.log('   ⚠️  ISSO É UM TESTE ⚠️');
    console.log('   ENVIO EM MASSA - TEMPLATE WHATSAPP');
    console.log('========================================\n');

    console.log('🧪 AMBIENTE DE TESTE');
    console.log('📊 Banco: etbodugymxmrmbqfjigz.supabase.co');
    console.log('');

    if (DRY_RUN) {
      console.log('⚠️  MODO DRY RUN ATIVO - Apenas simulação!');
      console.log('   Nenhuma mensagem será enviada de verdade.\n');
    } else {
      console.log('🚀 MODO ENVIO REAL - As mensagens serão enviadas!');
      console.log('⚠️  CONFIRMAÇÃO NECESSÁRIA EM 5 SEGUNDOS...\n');
      
      // Countdown de 5 segundos
      for (let i = 5; i > 0; i--) {
        console.log(`   Iniciando em ${i}...`);
        await sleep(1000);
      }
      console.log('   🚀 INICIANDO ENVIO!\n');
    }

    // 1. Buscar todos os leads
    console.log('🔍 Buscando leads do banco de TESTE...');

    const { data: leads, error: leadsError } = await supabase
      .from('quiz_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsError) {
      throw new Error(`Erro ao buscar leads: ${leadsError.message}`);
    }

    if (!leads || leads.length === 0) {
      console.log('⚠️  Nenhum lead encontrado no banco!');
      return;
    }

    console.log(`✅ ${leads.length} leads encontrados!\n`);

    // Confirmação
    console.log('📋 RESUMO DO ENVIO:');
    console.log(`Template ID: ${TEMPLATE_ID}`);
    console.log(`Template Name: diagnostico_completo`);
    console.log(`Total de leads: ${leads.length}`);
    console.log(`Delay entre envios: ${DELAY_BETWEEN_MESSAGES}ms`);
    console.log(`Tempo estimado: ~${Math.ceil(leads.length * (DELAY_BETWEEN_MESSAGES + 2000) / 1000 / 60)} minutos`);
    console.log(`Modo: ${DRY_RUN ? '🔄 DRY RUN (simulação)' : '🚀 ENVIO REAL'}`);
    console.log('');

    // 2. Processar cada lead
    const resultados = {
      total: leads.length,
      sucesso: 0,
      falha: 0,
      erros: []
    };

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      const resultado = await enviarTemplateParaLead(lead, i, leads.length);

      if (resultado.success) {
        resultados.sucesso++;
      } else {
        resultados.falha++;
        resultados.erros.push({
          nome: lead.nome,
          telefone: lead.celular,
          erro: resultado.error
        });
      }

      // Aguardar antes do próximo envio
      if (i < leads.length - 1) {
        console.log(`\n⏳ Aguardando ${DELAY_BETWEEN_MESSAGES}ms antes do próximo...\n`);
        await sleep(DELAY_BETWEEN_MESSAGES);
      }
    }

    // 3. Relatório final
    console.log('\n========================================');
    console.log('📊 RELATÓRIO FINAL');
    console.log('========================================');
    console.log(`Total de leads: ${resultados.total}`);
    console.log(`✅ Enviados com sucesso: ${resultados.sucesso}`);
    console.log(`❌ Falhas: ${resultados.falha}`);
    console.log('');

    if (resultados.erros.length > 0) {
      console.log('❌ ERROS DETALHADOS:');
      resultados.erros.forEach((erro, idx) => {
        console.log(`\n${idx + 1}. ${erro.nome} (${erro.telefone})`);
        console.log(`   Erro: ${erro.erro}`);
      });
      console.log('');
    }

    console.log('========================================');
    console.log(DRY_RUN ? '✅ SIMULAÇÃO CONCLUÍDA!' : '🎉 ENVIO CONCLUÍDO!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ ========================================');
    console.error('   ERRO CRÍTICO');
    console.error('========================================');
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
    console.error('========================================\n');
    process.exit(1);
  }
}

// Executar
enviarParaTodosLeads();