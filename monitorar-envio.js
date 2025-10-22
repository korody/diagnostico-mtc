// monitorar-envio.js - Monitoramento em tempo real dos envios
require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function monitorar() {
  try {
    const { data: stats, error } = await supabase
      .from('quiz_leads')
      .select('whatsapp_status, whatsapp_sent_at')
      .not('celular', 'is', null);
    
    if (error) {
      console.error('Erro ao buscar dados:', error.message);
      return;
    }
    
    const resumo = {};
    let ultimoEnvio = null;
    
    stats?.forEach(lead => {
      const status = lead.whatsapp_status || 'AGUARDANDO_CONTATO';
      resumo[status] = (resumo[status] || 0) + 1;
      
      if (lead.whatsapp_sent_at && (!ultimoEnvio || lead.whatsapp_sent_at > ultimoEnvio)) {
        ultimoEnvio = lead.whatsapp_sent_at;
      }
    });
    
    console.clear();
    console.log('📊 ========================================');
    console.log('   MONITORAMENTO EM TEMPO REAL');
    console.log('   Quiz MTC - Envios WhatsApp');
    console.log('========================================\n');
    
    console.log('📈 STATUS DOS LEADS:\n');
    
    const statusEmoji = {
      'AGUARDANDO_CONTATO': '⏳',
      'template_enviado': '✅',
      'resultados_enviados': '🎯',
      'failed': '❌',
      'sent': '📤'
    };
    
    const total = stats.length;
    
    Object.entries(resumo)
      .sort((a, b) => b[1] - a[1])
      .forEach(([status, count]) => {
        const emoji = statusEmoji[status] || '❓';
        const percentual = ((count / total) * 100).toFixed(1);
        const barra = '█'.repeat(Math.round(count / total * 30));
        
        console.log(`${emoji} ${status.padEnd(25)} ${count.toString().padStart(5)} (${percentual}%)`);
        console.log(`   ${barra}\n`);
      });
    
    console.log('========================================');
    console.log('📊 Total de leads:', total);
    
    if (ultimoEnvio) {
      const dataEnvio = new Date(ultimoEnvio);
      console.log('🕐 Último envio:', dataEnvio.toLocaleString('pt-BR'));
    }
    
    console.log('🔄 Atualização:', new Date().toLocaleTimeString('pt-BR'));
    console.log('========================================\n');
    
    console.log('💡 Pressione Ctrl+C para sair');
    
  } catch (error) {
    console.error('Erro no monitoramento:', error.message);
  }
}

// Monitorar a cada 30 segundos
console.log('🚀 Iniciando monitoramento...\n');
monitorar();
setInterval(monitorar, 30000);