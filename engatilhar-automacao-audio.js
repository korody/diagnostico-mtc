// ========================================
// 🚀 SCRIPT PARA ENGATILHAR AUTOMAÇÃO DE ÁUDIO
// ========================================
// Este script dispara a automação do Unnichat que:
// 1. Envia template inicial
// 2. Faz POST request para nosso sistema gerar o áudio
// 3. Nosso sistema retorna e envia o áudio via WhatsApp

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Configuração
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// ========================================
// ⚙️ CONFIGURAÇÕES
// ========================================
const UNNICHAT_AUTOMACAO_URL = process.env.AUDIO_DIAGNOSTICO_AUTOMACAO_UNNICHAT || 'https://unnichat.com.br/a/start/ujzdbrjxV1lpg9X2uM65';

// Configurações de envio
const MODO_TESTE = true; // Mude para false para enviar para todos
const FILTRAR_POR_TELEFONE = '5511998457676'; // Telefone do Marcos para teste
const LIMITE_ENVIOS = 1; // Quantos envios fazer
const DELAY_BETWEEN_LEADS = 5000; // 5 segundos entre cada disparo

// ========================================
// 🎯 DISPARAR AUTOMAÇÃO PARA UM LEAD
// ========================================
async function dispararAutomacao(lead, index, total) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📱 Lead ${index + 1}/${total}: ${lead.nome}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`   📧 Email: ${lead.email}`);
  console.log(`   📱 Celular: ${lead.celular}`);
  console.log(`   🎯 Elemento: ${lead.elemento_principal}`);
  
  try {
    const primeiroNome = lead.nome.split(' ')[0];
    const phone = lead.celular.replace(/\D/g, ''); // Apenas números
    
    const payload = {
      primeiro_nome: primeiroNome,
      phone: phone,
      email: lead.email || `${phone}@placeholder.com`,
      lead_id: lead.id // Importante para o webhook saber qual lead processar
    };
    
    console.log(`   📤 Disparando automação...`);
    console.log(`   📋 Payload:`, JSON.stringify(payload, null, 2));
    
    if (MODO_TESTE) {
      console.log('   ⚠️  MODO TESTE - Automação será disparada mas com delay de segurança');
    }
    
    const response = await axios.post(UNNICHAT_AUTOMACAO_URL, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = response.data;
    
    if (!result.response) {
      throw new Error(`Automação falhou: ${JSON.stringify(result)}`);
    }
    
    console.log('   ✅ Automação disparada com sucesso!');
    console.log(`   📊 Resposta:`, result);
    
    // Atualizar status no banco
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'automacao_audio_disparada',
        whatsapp_sent_at: new Date().toISOString()
      })
      .eq('id', lead.id);
    
    // Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'automacao_audio_disparada',
      metadata: {
        payload: payload,
        unnichat_response: result,
        campaign: 'black_vitalicia_audio_webhook'
      },
      sent_at: new Date().toISOString()
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('   ❌ Erro ao disparar automação:', error.message);
    
    // Registrar erro
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'erro_automacao_audio',
      metadata: { 
        error: error.message, 
        campaign: 'black_vitalicia_audio_webhook' 
      },
      sent_at: new Date().toISOString()
    });
    
    return { success: false, error: error.message };
  }
}

// ========================================
// 🚀 FUNÇÃO PRINCIPAL
// ========================================
async function main() {
  console.log('\n🎙️ ========================================');
  console.log('   ENGATILHAR AUTOMAÇÃO DE ÁUDIO');
  console.log('   Black Vitalícia - Mestre Ye');
  console.log('========================================');
  console.log(`⚠️  Modo: ${MODO_TESTE ? '🧪 TESTE (1 lead)' : '🚀 PRODUÇÃO'}`);
  console.log(`📊 Limite: ${LIMITE_ENVIOS} leads`);
  console.log(`⏱️  Delay: ${DELAY_BETWEEN_LEADS / 1000}s entre disparos`);
  console.log(`🔗 Automação: ${UNNICHAT_AUTOMACAO_URL}`);
  console.log('========================================\n');
  
  // Buscar leads
  console.log('🔍 Buscando leads...\n');
  
  let query = supabase
    .from('quiz_leads')
    .select('*')
    .not('celular', 'is', null)
    .not('elemento_principal', 'is', null);
  
  if (FILTRAR_POR_TELEFONE) {
    console.log(`🎯 Filtrando por: ${FILTRAR_POR_TELEFONE}\n`);
    query = query.or(`celular.ilike.%${FILTRAR_POR_TELEFONE}%`);
  }
  
  const { data: leads, error } = await query
    .order('lead_score', { ascending: false })
    .limit(LIMITE_ENVIOS);
  
  if (error) {
    console.error('❌ Erro ao buscar leads:', error);
    process.exit(1);
  }
  
  if (!leads || leads.length === 0) {
    console.log('⚠️  Nenhum lead encontrado!');
    return;
  }
  
  console.log(`✅ ${leads.length} lead(s) encontrado(s)!\n`);
  
  // Estatísticas
  const stats = {
    total: leads.length,
    sucesso: 0,
    erro: 0
  };
  
  // Processar cada lead
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const result = await dispararAutomacao(lead, i, leads.length);
    
    if (result.success) {
      stats.sucesso++;
    } else {
      stats.erro++;
    }
    
    // Delay entre leads (exceto no último)
    if (i < leads.length - 1) {
      console.log(`\n⏳ Aguardando ${DELAY_BETWEEN_LEADS / 1000}s...\n`);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_LEADS));
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`✅ Sucesso: ${stats.sucesso}`);
  console.log(`❌ Erro: ${stats.erro}`);
  console.log(`📊 Total: ${stats.total}`);
  console.log('='.repeat(60) + '\n');
  
  console.log('🎉 Engatilhamento finalizado!');
  console.log('⏳ Aguarde a automação do Unnichat chamar nosso webhook...\n');
}

// Executar
main().catch(console.error);
