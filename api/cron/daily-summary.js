/**
 * Cron Job - Resumo Diário
 * Endpoint: GET /api/cron/daily-summary
 * 
 * Envia resumo diário por Slack às 18h (horário de Brasília)
 * 
 * Para configurar no Vercel:
 * 1. Adicionar em vercel.json:
 *    {
 *      "crons": [{
 *        "path": "/api/cron/daily-summary",
 *        "schedule": "0 21 * * *"
 *      }]
 *    }
 * 
 * 2. Adicionar CRON_SECRET no .env e verificar no header
 */

const { enviarResumoDiario, enviarSlack } = require('../utils/notifications');
const supabase = require('../../lib/supabase');

module.exports = async (req, res) => {
  // Verificar autenticação do cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('❌ Cron não autorizado');
    return res.status(401).json({ success: false, error: 'Não autorizado' });
  }

  try {
    console.log('📧 Gerando resumo diário...');

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const hoje_iso = hoje.toISOString();

    // Leads de hoje
    const { data: leads_hoje } = await supabase
      .from('quiz_leads')
      .select('*')
      .gte('created_at', hoje_iso);

    // Envios de hoje
    const { data: envios_hoje } = await supabase
      .from('whatsapp_logs')
      .select('status')
      .gte('created_at', hoje_iso);

    const vips_hoje = leads_hoje?.filter(l => l.is_hot_lead_vip === true).length || 0;
    const total_envios = envios_hoje?.length || 0;
    const sucessos = envios_hoje?.filter(l => l.status === 'sent' || l.status === 'success').length || 0;
    const taxa_sucesso = total_envios > 0 ? ((sucessos / total_envios) * 100).toFixed(1) : 0;

    const resumo = {
      data: hoje.toISOString().split('T')[0],
      total_leads: leads_hoje?.length || 0,
      leads_vip: vips_hoje,
      total_envios,
      envios_sucesso: sucessos,
      taxa_sucesso_envios: parseFloat(taxa_sucesso)
    };

    // Enviar notificação
    await enviarResumoDiario(resumo);

    console.log('✅ Resumo diário enviado');
    return res.status(200).json({ success: true, resumo });

  } catch (error) {
    console.error('❌ Erro ao enviar resumo:', error);
    await enviarSlack(`❌ Erro ao gerar resumo diário: ${error.message}`, '#ff0000');
    return res.status(500).json({ success: false, error: error.message });
  }
};
