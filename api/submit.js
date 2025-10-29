// ========================================
// API ENDPOINT: /api/submit
// Vercel Serverless Function
// ========================================

let supabase, normalizePhone, isValidBrazilianPhone, isValidPhoneUniversal, getDiagnosticos;
let addLeadTags;
let contarElementos, determinarElementoPrincipal, calcularIntensidade;
let calcularUrgencia, determinarQuadrante, calcularLeadScore;
let diagnosticosData;

try {
  supabase = require('../lib/supabase');
  ({ normalizePhone, isValidBrazilianPhone, isValidPhoneUniversal, isValidInternationalPhone } = require('../lib/phone'));
  ({ getDiagnosticos } = require('../lib/diagnosticos'));
  ({ addLeadTags } = require('../lib/tags'));
  ({
    contarElementos,
    determinarElementoPrincipal,
    calcularIntensidade,
    calcularUrgencia,
    determinarQuadrante,
    calcularLeadScore
  } = require('../lib/tcm'));

  // Carregar diagnósticos uma vez por cold start
  diagnosticosData = getDiagnosticos();
  logger = require('../lib/logger');
  console.log('✅ Módulos carregados com sucesso');
} catch (error) {
  console.error('❌ Erro ao carregar módulos:', error.message);
  console.error('Stack:', error.stack);
}

// ========================================
// HANDLER PRINCIPAL
// ========================================

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Healthcheck simples via GET
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, endpoint: 'submit', method: 'GET' });
  }

  // Aceitar apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Correlation id for this request
    const reqId = (logger && typeof logger.mkid === 'function') ? logger.mkid() : `req-${Date.now()}`;
    logger && logger.info && logger.info(reqId, '📥 Requisição recebida em /api/submit', { env: { SUPABASE_URL: !!process.env.SUPABASE_URL, SUPABASE_KEY: !!process.env.SUPABASE_KEY } });
    
    const { lead, respostas } = req.body;

    // Validações básicas
    if (!lead || !lead.NOME || !lead.EMAIL || !lead.CELULAR) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados incompletos: nome, email e celular são obrigatórios'
      });
    }

    if (!respostas || Object.keys(respostas).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Respostas do quiz não foram enviadas' 
      });
    }

  logger && logger.info && logger.info(reqId, '📥 NOVO QUIZ', { nome: lead.NOME });
    
    // Normalizar telefone ANTES de salvar
    // IMPORTANTE: Salvar SEMPRE sem DDI 55 para facilitar buscas
    const celularNormalizado = normalizePhone(lead.CELULAR);

    // Heurística de validação: quando o input vier com DDI explícito (rawDigits >= 12
    // e não começa com 55), validar pelo rawDigits (E.164), caso contrário validar
    // pelo celularNormalizado (forma BR sem DDI).
    const rawDigits = (lead.CELULAR || '').toString().replace(/\D/g, '');
    const validationTarget = (rawDigits.length >= 12 && !rawDigits.startsWith('55')) ? rawDigits : celularNormalizado;

    logger && logger.info && logger.info(reqId, '📱 Telefone original e normalizado', { original: lead.CELULAR, normalizado: celularNormalizado, rawDigits, validationTarget, validationTargetLen: validationTarget.length });
    logger && logger.info && logger.info(reqId, '🔧 Phone utils types', { isValidPhoneUniversal: typeof isValidPhoneUniversal, isValidBrazilianPhone: typeof isValidBrazilianPhone, isValidInternationalPhone: typeof isValidInternationalPhone });

    // Validação: aceitar BR (10/11) ou internacional E.164 (12-15)
    let phoneValid = false;
    try {
      if (typeof isValidPhoneUniversal === 'function') {
        phoneValid = !!isValidPhoneUniversal(validationTarget);
      } else if (typeof isValidBrazilianPhone === 'function' && typeof isValidInternationalPhone === 'function') {
        phoneValid = !!(isValidBrazilianPhone(validationTarget) || isValidInternationalPhone(validationTarget));
      } else {
        // Fallback permissivo: aceitar apenas strings numéricas entre 8 e 15 dígitos
        const raw = (validationTarget || '').toString().replace(/\D/g, '');
        phoneValid = raw.length >= 8 && raw.length <= 15;
      }
    } catch (e) {
      console.error('⚠️ Erro ao validar telefone (fallback):', e.message);
      phoneValid = false;
    }

    if (!phoneValid) {
      logger && logger.error && logger.error(reqId, '❌ Telefone inválido (após heurística)', { validationTarget });
      return res.status(400).json({
        success: false,
        error: 'Telefone inválido. Use formato BR (11 99999-9999) ou internacional com DDI (ex.: 351...)'
      });
    }
    
    // Calcular diagnóstico
    const contagem = contarElementos(respostas);
    const elementoPrincipal = determinarElementoPrincipal(contagem);
    const intensidade = calcularIntensidade(respostas);
    const urgencia = calcularUrgencia(respostas);
    const quadrante = determinarQuadrante(intensidade, urgencia);
    const leadScore = calcularLeadScore(respostas);
    const prioridade = leadScore >= 70 ? 'ALTA' : leadScore >= 40 ? 'MÉDIA' : 'BAIXA';
    const isHotLeadVIP = leadScore >= 80 || quadrante === 1 || respostas.P8 === 'A';
    
  logger && logger.info && logger.info(reqId, '🎯 Diagnóstico calculado', { elemento: elementoPrincipal, leadScore, isHotLeadVIP });
    
    // Buscar configuração do elemento com fallback
    const config = diagnosticosData[elementoPrincipal] || diagnosticosData['BAÇO'];
    
    // Extrair primeiro nome
    const primeiroNome = lead.NOME.split(' ')[0];
    
    // Gerar textos personalizados
    const diagnosticoCompleto = config.diagnostico.replace(/{NOME}/g, primeiroNome);
    const scriptAbertura = config.script_abertura.replace(/{NOME}/g, primeiroNome);
    
    // Preparar dados para salvar
    const dadosParaSalvar = {
      nome: lead.NOME,
      email: lead.EMAIL,
      respostas: respostas,
      elemento_principal: elementoPrincipal,
      codigo_perfil: `${elementoPrincipal.substring(0, 2)}-${intensidade}`,
      nome_perfil: config.nome,
      arquetipo: config.arquetipo,
      emoji: config.emoji,
      quadrante: quadrante,
      diagnostico_resumo: diagnosticoCompleto.substring(0, 200) + '...',
      diagnostico_completo: diagnosticoCompleto,
      script_abertura: scriptAbertura,
      lead_score: leadScore,
      prioridade: prioridade,
      is_hot_lead_vip: isHotLeadVIP
    };
    
    // Verificar se lead já existe (usando telefone normalizado)
    const { data: existe } = await supabase
      .from('quiz_leads')
      .select('id')
      .eq('celular', celularNormalizado)
      .maybeSingle();
    
    if (existe) {
      // Atualizar lead existente
      await supabase
        .from('quiz_leads')
        .update({ 
          ...dadosParaSalvar, 
          updated_at: new Date().toISOString() 
        })
        .eq('celular', celularNormalizado);
        
  logger && logger.info && logger.info(reqId, '✅ Lead ATUALIZADO', { id: existe.id });
      // Registrar evento de linha do tempo (diagnóstico solicitado)
      try {
        await supabase.from('whatsapp_logs').insert({
          lead_id: existe.id,
          phone: celularNormalizado,
          status: 'diagnostico_solicitado',
          metadata: { source: 'quiz_submit', updated: true, logged_at_iso: new Date().toISOString(), logged_at_epoch: Date.now() },
          sent_at: new Date().toISOString()
        });
        // Adicionar tag de diagnóstico finalizado
        await addLeadTags(supabase, existe.id, ['diagnostico_finalizado']);
  } catch (e) { logger && logger.error && logger.error(reqId, '⚠️ Log submit (update) falhou', e.message); }
      
    } else {
      // Inserir novo lead
      const { data: inserted, error: insertErr } = await supabase
        .from('quiz_leads')
        .insert({
          ...dadosParaSalvar,
          celular: celularNormalizado,
          whatsapp_status: 'AGUARDANDO_CONTATO'
        })
        .select('id')
        .maybeSingle();
      if (insertErr) throw insertErr;
        
  logger && logger.info && logger.info(reqId, '✅ Lead INSERIDO', { id: inserted?.id });
      // Registrar evento de linha do tempo (diagnóstico solicitado)
      try {
        await supabase.from('whatsapp_logs').insert({
          lead_id: inserted?.id,
          phone: celularNormalizado,
          status: 'diagnostico_solicitado',
          metadata: { source: 'quiz_submit', created: true, logged_at_iso: new Date().toISOString(), logged_at_epoch: Date.now() },
          sent_at: new Date().toISOString()
        });
        // Adicionar tag de diagnóstico finalizado
        await addLeadTags(supabase, inserted?.id, ['diagnostico_finalizado']);
  } catch (e) { logger && logger.error && logger.error(reqId, '⚠️ Log submit (insert) falhou', e.message); }
    }
    
    // Resposta de sucesso
    return res.json({ 
      success: true,
      message: 'Quiz salvo com sucesso!',
      diagnostico: { 
        elemento: elementoPrincipal,
        perfil: config.nome,
        codigo: `${elementoPrincipal.substring(0, 2)}-${intensidade}`,
        emoji: config.emoji,
        leadScore: leadScore,
        quadrante: quadrante,
        is_vip: isHotLeadVIP
      }
    });

  } catch (error) {
    try {
      const errId = (typeof logger !== 'undefined' && logger.mkid) ? logger.mkid() : `err-${Date.now()}`;
      logger && logger.error && logger.error(errId, '❌ ERRO no /api/submit', { message: error.message, stack: error.stack });
    } catch (e) {
      console.error('Erro ao logar erro:', e.message);
    }

    return res.status(500).json({
      success: false,
      error: 'Erro ao processar quiz',
      details: error.message
    });
  }
};