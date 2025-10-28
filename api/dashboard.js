/**
 * Unified Dashboard API
 * Endpoint: /api/dashboard?action=metrics|alerts|health|diagnose
 */

const { createClient } = require('@supabase/supabase-js');
const supabase = require('../lib/supabase');

function maskKeyInfo(key) {
  if (!key) return { present: false };
  const type = key.startsWith('sb_secret_')
    ? 'sb_secret'
    : key.startsWith('sb_publishable_')
      ? 'sb_publishable'
      : key.startsWith('eyJ')
        ? 'legacy_jwt'
        : 'unknown';
  return { present: true, type };
}

// Metrics helpers (adapted from former api/dashboard/metrics.js)
async function calcularTotaisPorPeriodo(client) {
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const tres_dias = new Date(agora.getTime() - 3 * 24 * 60 * 60 * 1000);
  const semana = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
  const mes = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { count: totalCount, error: countError } = await client
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true });
  if (countError) throw countError;

  const { data: todos, error } = await client
    .from('quiz_leads')
    .select('created_at')
    .limit(10000);
  if (error) throw error;

  return {
    hoje: todos.filter(l => new Date(l.created_at) >= hoje).length,
    tres_dias: todos.filter(l => new Date(l.created_at) >= tres_dias).length,
    semana: todos.filter(l => new Date(l.created_at) >= semana).length,
    mes: todos.filter(l => new Date(l.created_at) >= mes).length,
    total: totalCount || todos.length
  };
}

async function calcularDistribuicaoStatus(client) {
  const { data, error } = await client
    .from('quiz_leads')
    .select('whatsapp_status')
    .limit(10000);
  if (error) throw error;
  const dist = {};
  data.forEach(l => { const k = l.whatsapp_status || 'sem_status'; dist[k] = (dist[k] || 0) + 1; });
  return dist;
}

async function calcularDistribuicaoElemento(client) {
  const { data, error } = await client
    .from('quiz_leads')
    .select('elemento_principal')
    .limit(10000);
  if (error) throw error;
  const dist = {}; let total = 0;
  data.forEach(l => { if (l.elemento_principal) { const e = l.elemento_principal; dist[e] = (dist[e] || 0) + 1; total++; } });
  const out = {}; Object.keys(dist).forEach(e => { out[e] = { count: dist[e], percentage: total>0 ? ((dist[e]/total)*100).toFixed(1) : 0 }; });
  return out;
}

async function calcularLeadScore(client) {
  const { data, error } = await client
    .from('quiz_leads')
    .select('lead_score, is_hot_lead_vip')
    .limit(10000);
  if (error) throw error;
  const scores = data.filter(l => l.lead_score !== null && l.lead_score !== undefined).map(l => l.lead_score);
  const vips = data.filter(l => l.is_hot_lead_vip === true).length;
  const media = scores.length>0 ? (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1) : 0;
  const distribuicao = { baixo: scores.filter(s=>s<50).length, medio: scores.filter(s=>s>=50 && s<80).length, alto: scores.filter(s=>s>=80).length };
  return { media: parseFloat(media), vips, total_com_score: scores.length, distribuicao };
}

async function calcularTaxaSucessoEnvios(client) {
  const { data: logs, error } = await client
    .from('whatsapp_logs')
    .select('status, created_at')
    .limit(10000);
  if (error) throw error;
  const total = logs.length;
  const sucessos = logs.filter(l => l.status === 'sent' || l.status === 'success').length;
  const falhas = logs.filter(l => l.status === 'error' || l.status === 'failed').length;
  const taxa_sucesso = total>0 ? ((sucessos/total)*100).toFixed(1) : 0;
  const taxa_falha = total>0 ? ((falhas/total)*100).toFixed(1) : 0;
  return { total_envios: total, sucessos, falhas, taxa_sucesso: parseFloat(taxa_sucesso), taxa_falha: parseFloat(taxa_falha) };
}

async function calcularDistribuicaoPrioridade(client){
  const { data, error } = await client.from('quiz_leads').select('prioridade').limit(10000);
  if (error) throw error;
  const dist = { alta:0, media:0, baixa:0, sem_prioridade:0 };
  data.forEach(l => { const p = l.prioridade || 'sem_prioridade'; dist[p] = (dist[p]||0)+1; });
  return dist;
}

// Novas métricas de marcos (timeline) baseadas em whatsapp_logs
// Conta leads distintos que passaram por cada marco
async function calcularMarcosReais(client){
  const { data: logs, error } = await client
    .from('whatsapp_logs')
    .select('lead_id, status')
    .in('status', ['diagnostico_solicitado','resultados_enviados','diagnostico_enviado','desafio_enviado'])
    .limit(100000);
  if (error) throw error;
  const distinct = (statuses) => {
    const set = new Set();
    (logs||[]).forEach(l => { if (statuses.includes(l.status)) set.add(l.lead_id); });
    return set.size;
  };
  return {
    diagnostico_solicitado: distinct(['diagnostico_solicitado']),
    diagnostico_enviado: distinct(['diagnostico_enviado','resultados_enviados']), // agrega legado
    desafio_enviado: distinct(['desafio_enviado'])
  };
}

async function calcularEvolucaoTemporal(client){
  const { data, error } = await client
    .from('quiz_leads')
    .select('created_at')
    .gte('created_at', new Date(Date.now()-30*24*60*60*1000).toISOString());
  if (error) throw error;
  const porDia = {};
  data.forEach(l => { const dia = new Date(l.created_at).toISOString().split('T')[0]; porDia[dia] = (porDia[dia]||0)+1; });
  const resultado = [];
  for(let i=29;i>=0;i--){ const d = new Date(Date.now()-i*24*60*60*1000); const dia = d.toISOString().split('T')[0]; resultado.push({ data: dia, leads: porDia[dia]||0 }); }
  return resultado;
}

async function calcularFunil(client){
  const { data: todos, error } = await client.from('quiz_leads').select('whatsapp_status, whatsapp_sent_at').limit(10000);
  if (error) throw error;
  const total_leads = todos.length;
  const com_diagnostico = todos.filter(l=>l.whatsapp_status).length;
  const diagnostico_enviado = todos.filter(l=> l.whatsapp_status==='diagnostico_enviado' || l.whatsapp_status==='desafio_enviado' || l.whatsapp_status==='resultados_enviados').length; // inclui legado
  const desafio_enviado = todos.filter(l=> l.whatsapp_status==='desafio_enviado').length;
  return {
    total_quiz_completado: total_leads,
    com_diagnostico,
    diagnostico_enviado,
    desafio_enviado,
    conversao_quiz_diagnostico: total_leads>0 ? ((com_diagnostico/total_leads)*100).toFixed(1) : 0,
    conversao_diagnostico_whatsapp: com_diagnostico>0 ? ((diagnostico_enviado/com_diagnostico)*100).toFixed(1) : 0,
    conversao_whatsapp_desafio: diagnostico_enviado>0 ? ((desafio_enviado/diagnostico_enviado)*100).toFixed(1) : 0
  };
}

async function verificarLeadsVIP(client){
  const ontem = new Date(Date.now()-24*60*60*1000).toISOString();
  const { data, error } = await client
    .from('quiz_leads')
    .select('id, nome, email, celular, lead_score, created_at')
    .eq('is_hot_lead_vip', true)
    .gte('created_at', ontem)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}

async function verificarTaxaFalha(client){
  const ultimos_30_dias = new Date(Date.now()-30*24*60*60*1000).toISOString();
  const { data: logs, error } = await client
    .from('whatsapp_logs')
    .select('status')
    .gte('created_at', ultimos_30_dias)
    .limit(10000);
  if (error) throw error;
  const total = logs.length;
  const falhas = logs.filter(l => l.status==='error' || l.status==='failed').length;
  const taxa_falha = total>0 ? ((falhas/total)*100) : 0;
  return { taxa_falha: parseFloat(taxa_falha.toFixed(1)), total_envios: total, total_falhas: falhas, acima_limite: taxa_falha>10 };
}

async function gerarResumoDiario(client){
  const hoje = new Date(); hoje.setHours(0,0,0,0); const hoje_iso = hoje.toISOString();
  const { data: leads_hoje, error: e1 } = await client.from('quiz_leads').select('*').gte('created_at', hoje_iso).limit(1000);
  if (e1) throw e1;
  const { data: envios_hoje, error: e2 } = await client.from('whatsapp_logs').select('status').gte('created_at', hoje_iso).limit(1000);
  if (e2) throw e2;
  const vips_hoje = leads_hoje?.filter(l=>l.is_hot_lead_vip===true).length || 0;
  const total_envios = envios_hoje?.length || 0;
  const sucessos = envios_hoje?.filter(l=>l.status==='sent' || l.status==='success').length || 0;
  const taxa_sucesso = total_envios>0 ? ((sucessos/total_envios)*100).toFixed(1) : 0;
  return { data: hoje.toISOString().split('T')[0], total_leads: leads_hoje?.length || 0, leads_vip: vips_hoje, total_envios, envios_sucesso: sucessos, taxa_sucesso_envios: parseFloat(taxa_sucesso) };
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = (req.query.action || req.body?.action || '').toLowerCase();

  // Optional bearer auth for dashboard APIs
  const expected = process.env.DASHBOARD_API_SECRET;
  if (expected) {
    const auth = req.headers['authorization'] || '';
    if (!auth.startsWith('Bearer ') || auth.slice(7) !== expected) {
      return res.status(401).json({ success: false, error: 'Não autorizado' });
    }
  }

  try {
    if (!supabase) throw new Error('Supabase não configurado');

    if (action === 'metrics') {
      const [
        totais,
        statusDistrib,
        elementoDistrib,
        leadScoreData,
        sucessoEnvios,
        prioridadeDistrib,
        evolucao,
        funil
      ] = await Promise.all([
        calcularTotaisPorPeriodo(supabase),
        calcularDistribuicaoStatus(supabase),
        calcularDistribuicaoElemento(supabase),
        calcularLeadScore(supabase),
        calcularTaxaSucessoEnvios(supabase),
        calcularDistribuicaoPrioridade(supabase),
        calcularEvolucaoTemporal(supabase),
        calcularFunil(supabase)
      ]);

      // Marcos reais a partir dos logs (diagnostico_solicitado, resultados_enviados, desafio_enviado)
      const marcos = await calcularMarcosReais(supabase);
      const totalBase = Math.max(totais.total || 0, 1); // evitar divisão por zero
      const marcos_percent = {
        diagnostico_solicitado: parseFloat(((marcos.diagnostico_solicitado/totalBase)*100).toFixed(1)),
        diagnostico_enviado: parseFloat(((marcos.diagnostico_enviado/totalBase)*100).toFixed(1)),
        desafio_enviado: parseFloat(((marcos.desafio_enviado/totalBase)*100).toFixed(1))
      };

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
        milestones: { counts: marcos, percent: marcos_percent },
        conversoes_principais: {
          total_inscritos_pagina: 0,
          total_cadastrados_quiz: totais.total,
          finalizaram_diagnostico: marcos.diagnostico_solicitado || totais.total,
          iniciaram_contato_whatsapp: marcos.diagnostico_enviado,
          conversao_cadastro_diagnostico: totais.total>0 ? (((marcos.diagnostico_solicitado||totais.total)/totais.total)*100).toFixed(1) : 100,
          conversao_diagnostico_whatsapp: (marcos.diagnostico_solicitado||totais.total)>0 ? ((marcos.diagnostico_enviado/(marcos.diagnostico_solicitado||totais.total))*100).toFixed(1) : 0,
          conversao_grupos: 0,
          conversao_final: 0
        }
      };
      return res.status(200).json({ success: true, metricas });
    }

    if (action === 'alerts') {
      const [vips, falhas, resumo] = await Promise.all([
        verificarLeadsVIP(supabase),
        verificarTaxaFalha(supabase),
        gerarResumoDiario(supabase)
      ]);
      const alertas = {
        timestamp: new Date().toISOString(),
        vips_recentes: { count: vips.length, leads: vips },
        taxa_falha: falhas,
        resumo_diario: resumo,
        alertas_ativos: []
      };
      if (vips.length>0) alertas.alertas_ativos.push({ tipo: 'VIP', severidade: 'alta', mensagem: `${vips.length} lead(s) VIP nas últimas 24h`, dados: vips });
      if (falhas.acima_limite) alertas.alertas_ativos.push({ tipo: 'FALHA_ENVIO', severidade: 'critica', mensagem: `Taxa de falha em ${falhas.taxa_falha}% (limite: 10%)`, dados: falhas });
      return res.status(200).json({ success: true, alertas });
    }

    if (action === 'health') {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;
      return res.status(200).json({ ok: true, env: { SUPABASE_URL_present: !!supabaseUrl, SUPABASE_KEY_present: !!supabaseKey, DASHBOARD_API_SECRET_present: !!process.env.DASHBOARD_API_SECRET, DASHBOARD_PASSWORD_present: !!process.env.DASHBOARD_PASSWORD } });
    }

    if (action === 'diagnose') {
      const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
      const key = process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY;
      const resolved = {
        url_present: !!url,
        key_present: !!key,
        url_source: process.env.SUPABASE_URL ? 'SUPABASE_URL' : (process.env.REACT_APP_SUPABASE_URL ? 'REACT_APP_SUPABASE_URL (fallback)' : 'unset'),
        key_source: process.env.SUPABASE_KEY ? 'SUPABASE_KEY' : (process.env.REACT_APP_SUPABASE_KEY ? 'REACT_APP_SUPABASE_KEY (fallback)' : 'unset'),
        key_info: maskKeyInfo(key)
      };
      let connectivity = { ok: false };
      if (url && key) {
        const client = supabase || createClient(url, key);
        const { count, error } = await client.from('quiz_leads').select('*', { head: true, count: 'exact' });
        connectivity = error ? { ok: false, error: error.message, code: error.code } : { ok: true, count };
      }
      return res.status(200).json({ success: true, resolved, connectivity });
    }

    return res.status(400).json({ success: false, error: 'Ação inválida. Use ?action=metrics|alerts|health|diagnose' });
  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
