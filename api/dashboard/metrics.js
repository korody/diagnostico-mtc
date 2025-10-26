/**
 * API Dashboard - Métricas Completas
 * Endpoint: POST /api/dashboard/metrics
 * 
 * Retorna todas as métricas para o dashboard:
 * - Totais de leads (hoje, 3 dias, semana, mês, all-time)
 * - Taxa de conversão do quiz (cadastrados vs completaram)
 * - Distribuição por status WhatsApp
 * - Distribuição por elemento MTC
 * - Lead score médio e VIPs
 * - Taxa de sucesso de envios
 * - Leads por prioridade
 * - Evolução temporal (leads/dia últimos 30 dias)
 * - Funil completo (quiz → diagnóstico → desafio)
 */

const { createClient } = require('@supabase/supabase-js');

// Inicializar Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY || process.env.SUPABASE_KEY
);

/**
 * Calcula totais de leads por período
 */
async function calcularTotaisPorPeriodo() {
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const tres_dias = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000);
  const semana = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const mes = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: todos, error } = await supabase
    .from('quiz_leads')
    .select('created_at');

  if (error) throw error;

  return {
    hoje: todos.filter(l => new Date(l.created_at) >= hoje).length,
    tres_dias: todos.filter(l => new Date(l.created_at) >= tres_dias).length,
    semana: todos.filter(l => new Date(l.created_at) >= semana).length,
    mes: todos.filter(l => new Date(l.created_at) >= mes).length,
    total: todos.length
  };
}

/**
 * Calcula distribuição por status WhatsApp
 */
async function calcularDistribuicaoStatus() {
  const { data, error } = await supabase
    .from('quiz_leads')
    .select('whatsapp_status');

  if (error) throw error;

  const distribuicao = {};
  data.forEach(lead => {
    const status = lead.whatsapp_status || 'sem_status';
    distribuicao[status] = (distribuicao[status] || 0) + 1;
  });

  return distribuicao;
}

/**
 * Calcula distribuição por elemento MTC
 */
async function calcularDistribuicaoElemento() {
  const { data, error } = await supabase
    .from('quiz_leads')
    .select('elemento_principal');

  if (error) throw error;

  const distribuicao = {};
  let total = 0;
  
  data.forEach(lead => {
    if (lead.elemento_principal) {
      const elem = lead.elemento_principal;
      distribuicao[elem] = (distribuicao[elem] || 0) + 1;
      total++;
    }
  });

  // Adicionar percentuais
  const resultado = {};
  Object.keys(distribuicao).forEach(elem => {
    resultado[elem] = {
      count: distribuicao[elem],
      percentage: total > 0 ? ((distribuicao[elem] / total) * 100).toFixed(1) : 0
    };
  });

  return resultado;
}

/**
 * Calcula lead score médio e VIPs
 */
async function calcularLeadScore() {
  const { data, error } = await supabase
    .from('quiz_leads')
    .select('lead_score, is_hot_lead_vip');

  if (error) throw error;

  const scores = data
    .filter(l => l.lead_score !== null && l.lead_score !== undefined)
    .map(l => l.lead_score);

  const vips = data.filter(l => l.is_hot_lead_vip === true).length;

  const media = scores.length > 0 
    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
    : 0;

  // Distribuição por faixa
  const distribuicao = {
    baixo: scores.filter(s => s < 50).length,
    medio: scores.filter(s => s >= 50 && s < 80).length,
    alto: scores.filter(s => s >= 80).length
  };

  return {
    media: parseFloat(media),
    vips,
    total_com_score: scores.length,
    distribuicao
  };
}

/**
 * Calcula taxa de sucesso de envios
 */
async function calcularTaxaSucessoEnvios() {
  const { data: logs, error } = await supabase
    .from('whatsapp_logs')
    .select('status, created_at');

  if (error) throw error;

  const total = logs.length;
  const sucessos = logs.filter(l => l.status === 'sent' || l.status === 'success').length;
  const falhas = logs.filter(l => l.status === 'error' || l.status === 'failed').length;

  const taxa_sucesso = total > 0 ? ((sucessos / total) * 100).toFixed(1) : 0;
  const taxa_falha = total > 0 ? ((falhas / total) * 100).toFixed(1) : 0;

  return {
    total_envios: total,
    sucessos,
    falhas,
    taxa_sucesso: parseFloat(taxa_sucesso),
    taxa_falha: parseFloat(taxa_falha)
  };
}

/**
 * Calcula distribuição por prioridade
 */
async function calcularDistribuicaoPrioridade() {
  const { data, error } = await supabase
    .from('quiz_leads')
    .select('prioridade');

  if (error) throw error;

  const distribuicao = {
    alta: 0,
    media: 0,
    baixa: 0,
    sem_prioridade: 0
  };

  data.forEach(lead => {
    const p = lead.prioridade || 'sem_prioridade';
    distribuicao[p] = (distribuicao[p] || 0) + 1;
  });

  return distribuicao;
}

/**
 * Calcula evolução temporal (últimos 30 dias)
 */
async function calcularEvolucaoTemporal() {
  const { data, error } = await supabase
    .from('quiz_leads')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (error) throw error;

  // Agrupar por dia
  const porDia = {};
  data.forEach(lead => {
    const dia = new Date(lead.created_at).toISOString().split('T')[0];
    porDia[dia] = (porDia[dia] || 0) + 1;
  });

  // Preencher dias vazios
  const resultado = [];
  for (let i = 29; i >= 0; i--) {
    const data_ref = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dia = data_ref.toISOString().split('T')[0];
    resultado.push({
      data: dia,
      leads: porDia[dia] || 0
    });
  }

  return resultado;
}

/**
 * Calcula funil completo
 */
async function calcularFunil() {
  const { data: todos, error } = await supabase
    .from('quiz_leads')
    .select('whatsapp_status, whatsapp_sent_at');

  if (error) throw error;

  const total_leads = todos.length;
  const com_diagnostico = todos.filter(l => l.whatsapp_status).length;
  const diagnostico_enviado = todos.filter(l => 
    l.whatsapp_status === 'resultados_enviados' || 
    l.whatsapp_status === 'desafio_enviado'
  ).length;
  const desafio_enviado = todos.filter(l => 
    l.whatsapp_status === 'desafio_enviado'
  ).length;

  return {
    total_quiz_completado: total_leads,
    com_diagnostico,
    diagnostico_enviado,
    desafio_enviado,
    conversao_quiz_diagnostico: total_leads > 0 ? ((com_diagnostico / total_leads) * 100).toFixed(1) : 0,
    conversao_diagnostico_whatsapp: com_diagnostico > 0 ? ((diagnostico_enviado / com_diagnostico) * 100).toFixed(1) : 0,
    conversao_whatsapp_desafio: diagnostico_enviado > 0 ? ((desafio_enviado / diagnostico_enviado) * 100).toFixed(1) : 0
  };
}

/**
 * Calcula conversões principais (para ActiveCampaign no futuro)
 */
async function calcularConversoesGerais() {
  const { data: todos, error } = await supabase
    .from('quiz_leads')
    .select('whatsapp_status, created_at');

  if (error) throw error;

  const total_cadastrados = todos.length; // Do Supabase (depois virá do ActiveCampaign)
  const finalizaram_diagnostico = todos.length; // Todos no Supabase finalizaram
  const iniciaram_whatsapp = todos.filter(l => 
    l.whatsapp_status === 'resultados_enviados' || 
    l.whatsapp_status === 'desafio_enviado'
  ).length;

  return {
    // Placeholder para ActiveCampaign (será implementado depois)
    total_inscritos_pagina: 0, // Virá do ActiveCampaign
    total_cadastrados_quiz: total_cadastrados,
    finalizaram_diagnostico,
    iniciaram_contato_whatsapp: iniciaram_whatsapp,
    
    // Conversões calculáveis agora
    conversao_cadastro_diagnostico: total_cadastrados > 0 
      ? ((finalizaram_diagnostico / total_cadastrados) * 100).toFixed(1) 
      : 100, // 100% porque todos no Supabase finalizaram
    conversao_diagnostico_whatsapp: finalizaram_diagnostico > 0 
      ? ((iniciaram_whatsapp / finalizaram_diagnostico) * 100).toFixed(1) 
      : 0,
    
    // Placeholders para futuras implementações
    conversao_grupos: 0, // Virá do Unnichat
    conversao_final: 0 // Será calculado depois
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

  try {
    console.log('🔍 Calculando métricas do dashboard...');

    // Executar todas as consultas em paralelo
    const [
      totais,
      statusDistrib,
      elementoDistrib,
      leadScoreData,
      sucessoEnvios,
      prioridadeDistrib,
      evolucao,
      funil,
      conversoes
    ] = await Promise.all([
      calcularTotaisPorPeriodo(),
      calcularDistribuicaoStatus(),
      calcularDistribuicaoElemento(),
      calcularLeadScore(),
      calcularTaxaSucessoEnvios(),
      calcularDistribuicaoPrioridade(),
      calcularEvolucaoTemporal(),
      calcularFunil(),
      calcularConversoesGerais()
    ]);

    const metricas = {
      timestamp: new Date().toISOString(),
      totais_leads: totais,
      distribuicao_status_whatsapp: statusDistrib,
      distribuicao_elemento_mtc: elementoDistrib,
      lead_score: leadScoreData,
      sucesso_envios: sucessoEnvios,
      distribuicao_prioridade: prioridadeDistrib,
      evolucao_temporal: evolucao,
      funil: funil,
      conversoes_principais: conversoes
    };

    console.log('✅ Métricas calculadas com sucesso');

    return res.status(200).json({
      success: true,
      metricas
    });

  } catch (error) {
    console.error('❌ Erro ao calcular métricas:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao calcular métricas',
      message: error.message
    });
  }
};
