// ========================================
// API ENDPOINT: /api/submit
// Vercel Serverless Function
// ========================================

let supabase, normalizePhone, isValidBrazilianPhone, getDiagnosticos;
let contarElementos, determinarElementoPrincipal, calcularIntensidade;
let calcularUrgencia, determinarQuadrante, calcularLeadScore;
let diagnosticosData;

try {
  supabase = require('../lib/supabase');
  ({ normalizePhone, isValidBrazilianPhone } = require('../lib/phone'));
  ({ getDiagnosticos } = require('../lib/diagnosticos'));
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
  console.log('📥 Requisição recebida em /api/submit');
  console.log('🔑 SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
  console.log('🔑 SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅' : '❌');
    
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

    console.log('\n📥 NOVO QUIZ:', lead.NOME);
    
    // Normalizar telefone ANTES de salvar
    let celularNormalizado = normalizePhone(lead.CELULAR);
    
    // Se não for telefone brasileiro válido, aceitar como internacional
    // (remove apenas caracteres não numéricos, sem validar formato específico)
    if (!isValidBrazilianPhone(celularNormalizado)) {
      console.log('⚠️ Telefone não-brasileiro detectado:', lead.CELULAR);
      // Para telefones internacionais, manter apenas dígitos (já com DDI)
      celularNormalizado = lead.CELULAR.replace(/\D/g, '');
      
      // Validação mínima: pelo menos 8 dígitos
      if (celularNormalizado.length < 8) {
        console.log('❌ Telefone inválido (muito curto):', celularNormalizado);
        return res.status(400).json({
          success: false,
          error: 'Telefone inválido: mínimo 8 dígitos'
        });
      }
      
      // Importante: salvar telefone internacional COM o DDI completo
      console.log('🌍 Telefone internacional será salvo com DDI:', celularNormalizado);
    } else {
      // Para telefones brasileiros, adicionar DDI 55
      celularNormalizado = `55${celularNormalizado}`;
      console.log('🇧🇷 Telefone brasileiro será salvo com DDI 55:', celularNormalizado);
    }
    
    console.log('📱 Telefone original:', lead.CELULAR);
    console.log('📱 Telefone normalizado (com DDI):', celularNormalizado);
    
    // Calcular diagnóstico
    const contagem = contarElementos(respostas);
    const elementoPrincipal = determinarElementoPrincipal(contagem);
    const intensidade = calcularIntensidade(respostas);
    const urgencia = calcularUrgencia(respostas);
    const quadrante = determinarQuadrante(intensidade, urgencia);
    const leadScore = calcularLeadScore(respostas);
    const prioridade = leadScore >= 70 ? 'ALTA' : leadScore >= 40 ? 'MÉDIA' : 'BAIXA';
    const isHotLeadVIP = leadScore >= 80 || quadrante === 1 || respostas.P8 === 'A';
    
    console.log('🎯 Elemento:', elementoPrincipal, '| Score:', leadScore, '| VIP:', isHotLeadVIP ? 'SIM 🔥' : 'NÃO');
    
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
        
      console.log('✅ Lead ATUALIZADO\n');
      
    } else {
      // Inserir novo lead
      await supabase
        .from('quiz_leads')
        .insert({
          ...dadosParaSalvar,
          celular: celularNormalizado,
          whatsapp_status: 'AGUARDANDO_CONTATO'
        });
        
      console.log('✅ Lead INSERIDO\n');
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
    console.error('❌ ERRO:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar quiz',
      details: error.message
    });
  }
};