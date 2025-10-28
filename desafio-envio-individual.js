// desafio-envio-individual.js
// Envia o DESAFIO DA VITALIDADE para UM lead específico por telefone

const { createClient } = require('@supabase/supabase-js');
const { normalizePhone, formatPhoneForUnnichat } = require('./lib/phone');
const { addLeadTags } = require('./lib/tags');

// Forçar produção
const isProduction = true;
const envFile = '.env.production';
require('dotenv').config({ path: envFile });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;

// Validar
if (!SUPABASE_URL || !SUPABASE_KEY || !UNNICHAT_API_URL || !UNNICHAT_TOKEN) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('   Verifique: SUPABASE_URL, SUPABASE_KEY, UNNICHAT_API_URL, UNNICHAT_ACCESS_TOKEN');
  console.error('   Arquivo:', envFile);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========================================
// 🎯 CONFIGURE O TELEFONE AQUI
// ========================================
const TELEFONE = '11998457676'; // ← MUDE SEU NÚMERO AQUI

// ========================================
// FUNÇÃO PRINCIPAL
// ========================================
async function main() {
  console.log('\n📞 ========================================');
  console.log('   DESAFIO DA VITALIDADE (INDIVIDUAL)');
  console.log('========================================');
  console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 TESTE');
  console.log('🔗 Supabase:', SUPABASE_URL);
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
      
      // Tentar buscar similares
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
        console.log('\n❌ Nenhum lead encontrado!');
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
    
    // Verificar se já recebeu diagnóstico
    if (lead.whatsapp_status !== 'diagnostico_enviado' && lead.whatsapp_status !== 'resultados_enviados') {
      console.log('⚠️  ATENÇÃO: Este lead ainda NÃO recebeu o diagnóstico!');
      console.log('   Status atual:', lead.whatsapp_status || 'sem_status');
      console.log('   Recomendação: Enviar diagnóstico primeiro\n');
      console.log('   Deseja enviar o DESAFIO mesmo assim? (enviando em 5s...)\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Preparar dados
    const phoneForUnnichat = formatPhoneForUnnichat(lead.celular);
    const referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${lead.celular}&utm_content=msg-inicial-desafio`;
    
    // Mensagens (igual ao script de lotes)
    const message1 = `*Quer ganhar acesso ao SUPER COMBO Vitalício do Mestre Ye, sem pagar nada?*

Preparamos algo muito especial para você: o *Desafio da Vitalidade*.

Durante as próximas semanas, você vai receber *missões simples durante as Lives de Aquecimento da Black November da Saúde Vitalícia*.

Cada missão vai te aproximar mais do *equilíbrio, da leveza e da vitalidade que o seu corpo merece.* 🀄

*Veja como participar:*

1. Compartilhe suas missões no Instagram Stories e marque *@mestre_ye*;
2. Convide amigos e familiares para o evento através do seu link único`;

    const message2 = `Para aumentar suas chances de ganhar o *SUPER COMBO Vitalício do Mestre Ye*, compartilhe o link abaixo com o máximo de amigos e familiares.

Cada pessoa que se inscrever através do seu link único aumenta suas chances de ser o grande vencedor ou vencedora!

*Seu link de compartilhamento*:
${referralLink}

Compartilhe vitalidade. Inspire transformação`;
    
    console.log('📤 Enviando Desafio da Vitalidade via Unnichat...');
    console.log('🔗 URL:', UNNICHAT_API_URL);
    console.log('📋 Telefone:', phoneForUnnichat);
    console.log('');
    
    // Enviar MENSAGEM 1
    console.log('📤 Enviando mensagem 1/2...');
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
      throw new Error(`Mensagem 1: ${data1.message || 'Erro desconhecido'}`);
    }
    
    console.log('✅ Mensagem 1/2 enviada');
    
    // Delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enviar MENSAGEM 2
    console.log('📤 Enviando mensagem 2/2...');
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
      throw new Error(`Mensagem 2: ${data2.message || 'Erro desconhecido'}`);
    }
    
    console.log('✅ Mensagem 2/2 enviada');
    console.log('   Link:', referralLink);
    
    // Atualizar status no banco
    const { error: updateError } = await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'desafio_enviado',
        whatsapp_sent_at: new Date().toISOString(),
        whatsapp_attempts: (lead.whatsapp_attempts || 0) + 1
      })
      .eq('id', lead.id);
    try { await addLeadTags(supabase, lead.id, ['desafio_enviado']); } catch (e) {}
    
    if (updateError) {
      console.log('⚠️  Aviso: Não foi possível atualizar status:', updateError.message);
    } else {
      console.log('✅ Status atualizado no Supabase');
    }
    
    // Registrar logs
    const { error: logError } = await supabase.from('whatsapp_logs').insert([
      {
        lead_id: lead.id,
        phone: lead.celular,
        status: 'desafio_enviado',
        metadata: {
          referral_link: referralLink,
          message: 1,
          campaign: 'desafio_vitalidade',
          manual_send: true,
          script: 'desafio-envio-individual.js'
        },
        sent_at: new Date().toISOString()
      },
      {
        lead_id: lead.id,
        phone: lead.celular,
        status: 'desafio_enviado',
        metadata: {
          referral_link: referralLink,
          message: 2,
          campaign: 'desafio_vitalidade',
          manual_send: true,
          script: 'desafio-envio-individual.js'
        },
        sent_at: new Date().toISOString()
      }
    ]);
    
    if (!logError) {
      console.log('✅ Logs registrados');
    }
    
    console.log('\n🎯 DESAFIO ENVIADO COM SUCESSO!');
    console.log('📱 Verifique o WhatsApp:', phoneForUnnichat);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar
main();
