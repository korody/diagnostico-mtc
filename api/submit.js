// ========================================
// API ENDPOINT: /api/submit
// Vercel Serverless Function
// ========================================

let supabase, formatToE164, isValidE164, getDiagnosticos;
let addLeadTags, TAGS;
let contarElementos, determinarElementoPrincipal, calcularIntensidade;
let calcularUrgencia, determinarQuadrante, calcularLeadScore;
let diagnosticosData;

try {
  supabase = require('../lib/supabase');
  ({ formatToE164, isValidE164 } = require('../lib/phone-simple'));
  ({ getDiagnosticos } = require('../lib/diagnosticos'));
  ({ addLeadTags, TAGS } = require('../lib/tags'));
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
    
    // Telefone já vem em formato E.164 do frontend
    const celularE164 = lead.CELULAR;
    
    // Validar se está em formato E.164 (mas NÃO BLOQUEAR se inválido)
    const telefoneValido = celularE164 && isValidE164(celularE164);
    
    if (!telefoneValido) {
      logger && logger.warn && logger.warn(reqId, '⚠️ Telefone com formato irregular (mas aceitando)', { 
        celular: lead.CELULAR, 
        pais: lead.PAIS 
      });
    } else {
      logger && logger.info && logger.info(reqId, '✅ Telefone validado', { e164: celularE164, pais: lead.PAIS || 'BR' });
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
      is_hot_lead_vip: isHotLeadVIP,
      // Campos calculados adicionais
      contagem_elementos: contagem,
      intensidade_calculada: intensidade,
      urgencia_calculada: urgencia
    };
    
    // ============================================
    // AUTENTICAÇÃO INTEGRADA: Enviar para Persona AI
    // ============================================
    
    let userId = null; // ID do usuário criado no endpoint integrado
    let redirectUrl = 'https://black.qigongbrasil.com/diagnostico'; // Fallback
    
    try {
      const personaAiUrl = process.env.PERSONA_AI_URL || 'https://digital.mestreye.com';
      
      logger && logger.info && logger.info(reqId, '🔗 Enviando para endpoint integrado:', lead.EMAIL);
      
      // Preparar payload para o novo endpoint
      const payload = {
        email: lead.EMAIL,
        fullName: lead.NOME,
        phone: celularE164,
        quizData: {
          ...dadosParaSalvar,
          celular: celularE164
        }
      };
      
      // Chamar endpoint integrado de autenticação
      const response = await fetch(`${personaAiUrl}/api/quiz/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      // Parse JSON com tratamento de erro
      let result;
      const responseText = await response.text();
      
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        logger && logger.error && logger.error(reqId, '❌ Resposta não é JSON válido:', { status: response.status, body: responseText.substring(0, 200) });
        throw new Error(`Endpoint retornou resposta inválida (status ${response.status})`);
      }
      
      if (response.ok && result.success) {
        userId = result.userId;
        redirectUrl = `${personaAiUrl}${result.redirectUrl || '/chat'}`;
        logger && logger.info && logger.info(reqId, '✅ Autenticação integrada concluída', { userId, redirectUrl });
      } else {
        logger && logger.error && logger.error(reqId, '❌ Erro na autenticação integrada:', result.message || 'Erro desconhecido');
        // Continua com fallback
      }
    } catch (e) {
      logger && logger.error && logger.error(reqId, '⚠️ Erro ao chamar endpoint integrado:', e.message);
      // Continua com fallback
    }
    
    // ============================================
    // 4️⃣ SALVAR QUIZ_LEADS (com user_id se criou)
    // ============================================
    
    // Verificar se lead já existe (usando telefone E.164)
    const { data: existe } = await supabase
      .from('quiz_leads')
      .select('id')
      .eq('celular', celularE164)
      .maybeSingle();
    
    if (existe) {
      // Atualizar lead existente
      const updateData = {
        ...dadosParaSalvar,
        updated_at: new Date().toISOString()
      };
      if (userId) updateData.user_id = userId;
      
      await supabase
        .from('quiz_leads')
        .update(updateData)
        .eq('celular', celularE164);
        
      logger && logger.info && logger.info(reqId, '✅ Lead ATUALIZADO', { id: existe.id, userId });
      // Registrar evento
      try {
        await supabase.from('whatsapp_logs').insert({
          lead_id: existe.id,
          phone: celularE164,
          status: 'diagnostico_solicitado',
          metadata: { source: 'quiz_submit', updated: true },
          sent_at: new Date().toISOString()
        });
        await addLeadTags(supabase, existe.id, [TAGS.DIAGNOSTICO_FINALIZADO]);
      } catch (e) { 
        logger && logger.error && logger.error(reqId, '⚠️ Log submit (update) falhou', e.message); 
      }
      
    } else {
      // Inserir novo lead
      const insertData = {
        ...dadosParaSalvar,
        celular: celularE164
      };
      if (userId) insertData.user_id = userId;
      
      const { data: inserted, error: insertErr } = await supabase
        .from('quiz_leads')
        .insert(insertData)
        .select('id')
        .maybeSingle();
      
      if (insertErr) throw insertErr;
        
      logger && logger.info && logger.info(reqId, '✅ DIAGNÓSTICO RECEBIDO | Lead INSERIDO', { id: inserted?.id, userId });
      // Registrar evento
      try {
        await supabase.from('whatsapp_logs').insert({
          lead_id: inserted?.id,
          phone: celularE164,
          status: 'diagnostico_solicitado',
          metadata: { source: 'quiz_submit', created: true, userId },
          sent_at: new Date().toISOString()
        });
        await addLeadTags(supabase, inserted?.id, [TAGS.DIAGNOSTICO_FINALIZADO]);
      } catch (e) { 
        logger && logger.error && logger.error(reqId, '⚠️ Log submit (insert) falhou', e.message); 
      }
    }
    
    // ============================================
    // RETORNAR RESPOSTA COM REDIRECT
    // ============================================
    
    return res.json({ 
      success: true,
      message: 'Quiz enviado com sucesso!',
      redirect_url: redirectUrl,
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