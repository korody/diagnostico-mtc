/**
 * Teste rápido de notificação Slack
 * 
 * Uso:
 * 1. Configure SLACK_WEBHOOK_URL no .env.local
 * 2. node test-slack.js
 */

require('dotenv').config({ path: '.env.local' });
const { enviarSlack, enviarResumoDiario, enviarAlertaVIP } = require('./api/utils/notifications');

async function testar() {
  console.log('🧪 Testando notificações Slack...\n');

  // Teste 1: Mensagem simples
  console.log('1️⃣ Enviando mensagem simples...');
  await enviarSlack('✅ Teste de integração Slack - Dashboard MTC');
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 2: Resumo diário
  console.log('\n2️⃣ Enviando resumo diário...');
  const resumoTeste = {
    data: new Date().toISOString().split('T')[0],
    total_leads: 45,
    leads_vip: 8,
    total_envios: 120,
    taxa_sucesso_envios: 94.5
  };
  await enviarResumoDiario(resumoTeste);

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 3: Alerta VIP
  console.log('\n3️⃣ Enviando alerta VIP...');
  const leadTeste = {
    nome: 'João Silva (TESTE)',
    email: 'joao.teste@example.com',
    celular: '(11) 98765-4321',
    lead_score: 95
  };
  await enviarAlertaVIP(leadTeste);

  console.log('\n✅ Testes concluídos! Verifique o canal no Slack.');
}

testar().catch(console.error);
