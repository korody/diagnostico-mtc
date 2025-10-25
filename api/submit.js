// ========================================
// API ENDPOINT: /api/submit
// Vercel Serverless Function
// ========================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ========================================
// CONFIGURAÇÃO
// ========================================

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

// Carregar diagnósticos do JSON
const diagnosticosPath = path.join(process.cwd(), 'api', 'diagnosticos.json');
const diagnosticosData = JSON.parse(fs.readFileSync(diagnosticosPath, 'utf8'));

// ========================================
// MAPEAMENTO DE ELEMENTOS TCM
// ========================================

const MAPEAMENTO_ELEMENTOS = {
  P2: {
    A: 'RIM', B: 'RIM', C: 'FÍGADO', D: 'BAÇO', E: 'CORAÇÃO', F: 'PULMÃO'
  },
  P4: {
    A: 'RIM', B: 'RIM', C: 'CORAÇÃO', D: 'BAÇO', E: 'FÍGADO', F: null
  },
  P5: {
    A: 'FÍGADO', B: 'BAÇO', C: 'PULMÃO', D: 'RIM', E: 'CORAÇÃO', F: null
  }
};

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

/**
 * Normaliza telefone brasileiro para formato +5511999999999
 */
function normalizePhone(phone) {
  if (!phone) return null;
  
  let cleaned = phone.replace(/\D/g, '');
  
  // Se começar com 55, remove
  if (cleaned.startsWith('55')) {
    cleaned = cleaned.substring(2);
  }
  
  // Se tem 11 dígitos (DDD + 9 dígitos), retorna direto
  if (cleaned.length === 11) {
    return cleaned;
  }
  
  // Se tem 10 dígitos (DDD + 8 dígitos), retorna direto
  if (cleaned.length === 10) {
    return cleaned;
  }
  
  // Se tem menos de 10, retorna como está
  return cleaned;
}

/**
 * Valida se é telefone brasileiro válido
 */
function isValidBrazilianPhone(phone) {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Deve ter 10 ou 11 dígitos (DDD + número)
  if (cleaned.length < 10 || cleaned.length > 11) {
    return false;
  }
  
  // DDD deve começar com 1-9
  const ddd = cleaned.substring(0, 2);
  if (parseInt(ddd) < 11 || parseInt(ddd) > 99) {
    return false;
  }
  
  return true;
}

/**
 * Conta pontos de cada elemento TCM baseado nas respostas
 */
function contarElementos(respostas) {
  const contagem = { RIM: 0, FÍGADO: 0, BAÇO: 0, CORAÇÃO: 0, PULMÃO: 0 };
  
  // P2: Sintomas físicos (peso 3)
  if (respostas.P2 && Array.isArray(respostas.P2)) {
    respostas.P2.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P2[opcao];
      if (elemento) contagem[elemento] += 3;
    });
  }
  
  // P4: Sintomas adicionais (peso 2)
  if (respostas.P4 && Array.isArray(respostas.P4)) {
    respostas.P4.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P4[opcao];
      if (elemento) contagem[elemento] += 2;
    });
  }
  
  // P5: Estado emocional (peso 1)
  if (respostas.P5) {
    const elemento = MAPEAMENTO_ELEMENTOS.P5[respostas.P5];
    if (elemento) contagem[elemento] += 1;
  }
  
  return contagem;
}

/**
 * Determina elemento principal com maior pontuação
 */
function determinarElementoPrincipal(contagem) {
  let maxValor = 0;
  let elementoEscolhido = 'BAÇO'; // Fallback padrão
  
  for (const [elemento, valor] of Object.entries(contagem)) {
    if (valor > maxValor) {
      maxValor = valor;
      elementoEscolhido = elemento;
    }
  }
  
  return elementoEscolhido;
}

/**
 * Calcula intensidade da dor (P1)
 */
function calcularIntensidade(respostas) {
  const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
  return pesos[respostas.P1] || 3;
}

/**
 * Calcula urgência (P8)
 */
function calcularUrgencia(respostas) {
  const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
  return pesos[respostas.P8] || 3;
}

/**
 * Determina quadrante baseado em intensidade e urgência
 */
function determinarQuadrante(intensidade, urgencia) {
  if (intensidade >= 4 && urgencia >= 4) return 1; // Alta dor, alta urgência
  if (intensidade >= 4 && urgencia <= 3) return 2; // Alta dor, baixa urgência
  if (intensidade <= 3 && urgencia >= 4) return 3; // Baixa dor, alta urgência
  return 4; // Baixa dor, baixa urgência
}

/**
 * Calcula score do lead (0-100 pontos)
 */
function calcularLeadScore(respostas) {
  let score = 0;
  
  // P1: Intensidade da dor (20 pontos)
  const pesoP1 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP1[respostas.P1] || 0;
  
  // P3: Duração do problema (15 pontos)
  const pesoP3 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP3[respostas.P3] || 0;
  
  // P6: Tratamentos tentados (15 pontos)
  const pesoP6 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP6[respostas.P6] || 0;
  
  // P8: Urgência (20 pontos)
  const pesoP8 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP8[respostas.P8] || 0;
  
  // P9: Compromisso com evento (15 pontos)
  const pesoP9 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP9[respostas.P9] || 0;
  
  // P11: Faixa de renda (10 pontos)
  const pesoP11 = { 
    'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6, 
    'F': 7, 'G': 8, 'H': 9, 'I': 10, 'J': 10 
  };
  score += pesoP11[respostas.P11] || 0;
  
  // P12: Relacionamento com Mestre Ye (5 pontos)
  if (respostas.P12 === 'A') score += 5;
  
  return Math.min(score, 100);
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

  // Aceitar apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    const celularNormalizado = normalizePhone(lead.CELULAR);
    
    // Validar telefone brasileiro
    if (!isValidBrazilianPhone(celularNormalizado)) {
      console.log('❌ Telefone inválido:', lead.CELULAR, '→', celularNormalizado);
      return res.status(400).json({
        success: false,
        error: 'Telefone inválido. Use formato brasileiro válido.'
      });
    }
    
    console.log('📱 Telefone original:', lead.CELULAR);
    console.log('📱 Telefone normalizado:', celularNormalizado);
    
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};