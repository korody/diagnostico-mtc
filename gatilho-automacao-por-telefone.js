// gatilho-automacao-por-telefone.js
// Busca lead no Supabase por telefone e envia template via gatilho

const { createClient } = require('@supabase/supabase-js');
const { normalizePhone } = require('./api/utils/phone');

// const isProduction = process.env.NODE_ENV === 'production';
// const envFile = isProduction ? '.env.production' : '.env.staging';

const isProduction = true; // <- FORCE TRUE
const envFile = '.env.production'; // <- FORCE PRODUCTION

require('dotenv').config({ path: envFile });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const GATILHO_URL = process.env.UNNICHAT_GATILHO_URL;

// Validar variáveis
if (!supabaseUrl || !supabaseKey || !GATILHO_URL) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('   Verifique: SUPABASE_URL, SUPABASE_KEY, UNNICHAT_GATILHO_URL');
  console.error('   Arquivo:', envFile);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ========================================
// 🎯 CONFIGURE O TELEFONE AQUI
// ========================================
const TELEFONE = '11998457676'; // ← MUDE SEU NÚMERO AQUI

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================

async function gatilhoAutomacaoPorTelefone() {
  console.log('\n📞 ========================================');
  console.log('   GATILHO AUTOMAÇÃO POR TELEFONE');
  console.log('========================================');
  console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 STAGING');
  console.log('🔗 Supabase:', supabaseUrl);
  console.log('📱 Telefone buscado:', TELEFONE);
  console.log('========================================\n');
  
  try {
    // Normalizar telefone
    const phoneNormalized = normalizePhone(TELEFONE);
    console.log('🔍 Telefone normalizado:', phoneNormalized);
    console.log('🔍 Buscando lead no Supabase...\n');
    
    // Buscar lead no banco
    const { data: lead, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('celular', phoneNormalized)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar lead:', error.message);
      
      // Tentar buscar leads similares
      console.log('\n💡 Buscando leads similares...');
      const { data: similares } = await supabase
        .from('quiz_leads')
        .select('nome, celular, email, whatsapp_status')
        .ilike('celular', `%${phoneNormalized.slice(-8)}%`)
        .limit(5);
      
      if (similares && similares.length > 0) {
        console.log('\n📋 Leads encontrados com números similares:');
        similares.forEach((l, i) => {
          console.log(`   ${i+1}. ${l.nome} - ${l.celular} - ${l.whatsapp_status}`);
        });
      } else {
        console.log('\n❌ Nenhum lead encontrado com esse telefone!');
        console.log('\n💡 Primeiros 10 leads do banco:');
        
        const { data: allLeads } = await supabase
          .from('quiz_leads')
          .select('nome, celular, whatsapp_status')
          .order('created_at', { ascending: false })
          .limit(10);
        
        allLeads?.forEach((l, i) => {
          console.log(`   ${i+1}. ${l.nome} - ${l.celular} - ${l.whatsapp_status}`);
        });
      }
      
      return;
    }
    
    if (!lead) {
      console.log('❌ Lead não encontrado!\n');
      return;
    }
    
    // Lead encontrado!
    console.log('✅ Lead encontrado!');
    console.log('========================================');
    console.log('👤 Nome:', lead.nome);
    console.log('📱 Celular:', lead.celular);
    console.log('📧 Email:', lead.email);
    console.log('🎯 Elemento:', lead.elemento_principal || 'N/A');
    console.log('📊 Lead Score:', lead.lead_score || 0);
    console.log('📍 Status WhatsApp:', lead.whatsapp_status || 'AGUARDANDO_CONTATO');
    
    if (lead.whatsapp_sent_at) {
      console.log('📅 Último envio:', new Date(lead.whatsapp_sent_at).toLocaleString('pt-BR'));
    }
    
    if (lead.whatsapp_attempts) {
      console.log('🔄 Tentativas:', lead.whatsapp_attempts);
    }
    
    console.log('========================================\n');
    
    // Aviso se já recebeu
    if (lead.whatsapp_status === 'template_enviado' || lead.whatsapp_status === 'resultados_enviados') {
      console.log('⚠️  ATENÇÃO: Este lead já recebeu template!');
      console.log('   Status atual:', lead.whatsapp_status);
      console.log('   Enviando novamente em 3 segundos...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Preparar dados para o gatilho
    const phoneForUnnichat = `55${lead.celular}`;
    
    const leadData = {
      name: lead.nome,
      email: lead.email || `${lead.celular}@placeholder.com`,
      phone: phoneForUnnichat
    };
    
    console.log('📤 Enviando template via gatilho...');
    console.log('🔗 URL:', GATILHO_URL);
    console.log('📋 Dados:');
    console.log('   • Nome:', leadData.name);
    console.log('   • Email:', leadData.email);
    console.log('   • Phone:', leadData.phone);
    console.log('');
    
    // Enviar via gatilho
    const response = await fetch(GATILHO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadData)
    });
    
    const result = await response.json();
    
    console.log('📥 Resposta do gatilho:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    if (response.ok || result.success || result.response !== false) {
      console.log('✅ Template enviado com sucesso!\n');
      
      // Atualizar status no banco
      const { error: updateError } = await supabase
        .from('quiz_leads')
        .update({
          whatsapp_status: 'template_enviado',
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
        })
        .eq('id', lead.id);
      
      if (updateError) {
        console.log('⚠️  Aviso: Não foi possível atualizar status:', updateError.message);
      } else {
        console.log('✅ Status atualizado no Supabase');
      }
      
      // Registrar log
      const { error: logError } = await supabase.from('whatsapp_logs').insert({
        lead_id: lead.id,
        phone: lead.celular,
        status: 'template_enviado',
        metadata: { 
          gatilho_response: result,
          manual_send: true,
          script: 'gatilho-automacao-por-telefone.js'
        },
        sent_at: new Date().toISOString()
      });
      
      if (!logError) {
        console.log('✅ Log registrado');
      }
      
      console.log('\n🎯 PRÓXIMOS PASSOS:');
      console.log('1. 📱 Verifique o WhatsApp:', phoneForUnnichat);
      console.log('2. 🔘 O lead deve clicar em "VER RESULTADOS"');
      console.log('3. ⚡ O webhook enviará o diagnóstico automaticamente');
      console.log('4. 🔍 Monitore com: npm run verify:' + (isProduction ? 'prod' : 'test'));
      console.log('');
      
    } else {
      console.error('❌ Erro ao enviar template!');
      console.error('Detalhes:', result);
      
      // Salvar erro no banco
      await supabase
        .from('quiz_leads')
        .update({
          whatsapp_status: 'failed',
          whatsapp_error: JSON.stringify(result),
          whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
        })
        .eq('id', lead.id);
      
      console.log('\n⚠️  Status atualizado para "failed" no banco');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar
gatilhoAutomacaoPorTelefone();