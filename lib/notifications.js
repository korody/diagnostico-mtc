/**
 * Serviço de Notificações
 * Envia alertas via Slack
 * 
 * Para integrar com Slack:
 * 1. Criar Incoming Webhook no Slack: https://api.slack.com/messaging/webhooks
 * 2. Adicionar SLACK_WEBHOOK_URL ao .env
 */

/**
 * Envia notificação para Slack
 */
async function enviarSlack(mensagem, cor = '#36a64f') {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('⚠️  SLACK_WEBHOOK_URL não configurado');
    return false;
  }

  try {
    const payload = {
      attachments: [{
        color: cor,
        text: mensagem,
        footer: 'Dashboard MTC',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('✅ Notificação Slack enviada');
      return true;
    } else {
      console.error('❌ Erro ao enviar Slack:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao enviar Slack:', error);
    return false;
  }
}

/**
 * Envia resumo diário
 */
async function enviarResumoDiario(resumo) {
  const mensagem = `
📊 *Resumo Diário - ${resumo.data}*

• Novos leads: ${resumo.total_leads}
• Leads VIP: ${resumo.leads_vip}
• Envios WhatsApp: ${resumo.total_envios}
• Taxa de sucesso: ${resumo.taxa_sucesso_envios}%
  `;

  await enviarSlack(mensagem, '#36a64f');
}

/**
 * Envia alerta de lead VIP
 */
async function enviarAlertaVIP(lead) {
  const mensagem = `
🔥 *NOVO LEAD VIP*

Nome: ${lead.nome}
Email: ${lead.email}
Telefone: ${lead.celular}
Score: ${lead.lead_score}
  `;

  await enviarSlack(mensagem, '#ff0000');
}

/**
 * Envia alerta de falha
 */
async function enviarAlertaFalha(dados) {
  const mensagem = `
⚠️  *ALERTA: Taxa de Falha Elevada*

Taxa de falha: ${dados.taxa_falha}% (limite: 10%)
Total de envios: ${dados.total_envios}
Total de falhas: ${dados.total_falhas}
  `;

  await enviarSlack(mensagem, '#ff9900');
}

module.exports = {
  enviarSlack,
  enviarResumoDiario,
  enviarAlertaVIP,
  enviarAlertaFalha
};
