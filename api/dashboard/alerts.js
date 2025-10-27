/**
 * API Dashboard - Sistema de Alertas
 * Endpoint: POST /api/dashboard/alerts
 * 
 * Verifica e retorna alertas importantes:
 * - Novos leads VIP
 * - Taxa de falha acima de 10%
 * - Resumo para envio diário (email/Slack)
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY || process.env.SUPABASE_KEY
);

/**
 * Verifica leads VIP das últimas 24h
 */
async function verificarLeadsVIP() {
  const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, lead_score, created_at')
    .eq('is_hot_lead_vip', true)
    .gte('created_at', ontem)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  return data || [];
}

/**
 * Verifica taxa de falha nos últimos 30 dias
 */
async function verificarTaxaFalha() {
  const ultimos_30_dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: logs, error } = await supabase
    .from('whatsapp_logs')
    .select('status')
    .gte('created_at', ultimos_30_dias)
    .limit(10000);

  if (error) throw error;

  const total = logs.length;
  const falhas = logs.filter(l => l.status === 'error' || l.status === 'failed').length;
  const taxa_falha = total > 0 ? ((falhas / total) * 100) : 0;

  return {
    taxa_falha: parseFloat(taxa_falha.toFixed(1)),
    total_envios: total,
    total_falhas: falhas,
    acima_limite: taxa_falha > 10
  };
}

/**
 * Gera resumo diário para email/Slack
 */
async function gerarResumoDiario() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hoje_iso = hoje.toISOString();

  // Leads de hoje
  const { data: leads_hoje, error: error1 } = await supabase
    .from('quiz_leads')
    .select('*')
    .gte('created_at', hoje_iso)
    .limit(1000);

  if (error1) throw error1;

  // Envios de hoje
  const { data: envios_hoje, error: error2 } = await supabase
    .from('whatsapp_logs')
    .select('status')
    .gte('created_at', hoje_iso)
    .limit(1000);

  if (error2) throw error2;

  // VIPs de hoje
  const vips_hoje = leads_hoje.filter(l => l.is_hot_lead_vip === true).length;
  
  // Taxa de sucesso de hoje
  const total_envios = envios_hoje.length;
  const sucessos = envios_hoje.filter(l => l.status === 'sent' || l.status === 'success').length;
  const taxa_sucesso = total_envios > 0 ? ((sucessos / total_envios) * 100).toFixed(1) : 0;

  return {
    data: hoje.toISOString().split('T')[0],
    total_leads: leads_hoje.length,
    leads_vip: vips_hoje,
    total_envios,
    envios_sucesso: sucessos,
    taxa_sucesso_envios: parseFloat(taxa_sucesso)
  };
}

/**
 * Handler principal
 */
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Método não permitido. Use GET ou POST.' 
    });
  }

  // Auth opcional via bearer
  const expected = process.env.DASHBOARD_API_SECRET;
  if (expected) {
    const auth = req.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ') || auth.slice(7) !== expected) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }
  }

  try {
    console.log('🚨 Verificando alertas...');

    const [vips, falhas, resumo] = await Promise.all([
      verificarLeadsVIP(),
      verificarTaxaFalha(),
      gerarResumoDiario()
    ]);

    const alertas = {
      timestamp: new Date().toISOString(),
      vips_recentes: {
        count: vips.length,
        leads: vips
      },
      taxa_falha: falhas,
      resumo_diario: resumo,
      alertas_ativos: []
    };

    // Adicionar alertas ativos
    if (vips.length > 0) {
      alertas.alertas_ativos.push({
        tipo: 'VIP',
        severidade: 'alta',
        mensagem: `${vips.length} lead(s) VIP nas últimas 24h`,
        dados: vips
      });
    }

    if (falhas.acima_limite) {
      alertas.alertas_ativos.push({
        tipo: 'FALHA_ENVIO',
        severidade: 'critica',
        mensagem: `Taxa de falha em ${falhas.taxa_falha}% (limite: 10%)`,
        dados: falhas
      });
    }

    console.log(`✅ Alertas verificados: ${alertas.alertas_ativos.length} ativos`);

    return res.status(200).json({
      success: true,
      alertas
    });

  } catch (error) {
    console.error('❌ Erro ao verificar alertas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar alertas',
      message: error.message
    });
  }
};
