// ========================================
// API ENDPOINT: /api/quiz/submit
// ========================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

// Carregar diagnósticos do JSON
const diagnosticosPath = path.join(process.cwd(), 'api', 'diagnosticos.json');
const DIAGNOSTICOS_COMPLETOS = JSON.parse(fs.readFileSync(diagnosticosPath, 'utf8'));

// ========================================
// MAPEAMENTO E FUNÇÕES
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

function contarElementos(respostas) {
  const contagem = { RIM: 0, FÍGADO: 0, BAÇO: 0, CORAÇÃO: 0, PULMÃO: 0 };
  
  if (respostas.P2 && Array.isArray(respostas.P2)) {
    respostas.P2.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P2[opcao];
      if (elemento) contagem[elemento] += 3;
    });
  }
  
  if (respostas.P4 && Array.isArray(respostas.P4)) {
    respostas.P4.forEach(opcao => {
      const elemento = MAPEAMENTO_ELEMENTOS.P4[opcao];
      if (elemento) contagem[elemento] += 2;
    });
  }
  
  if (respostas.P5) {
    const elemento = MAPEAMENTO_ELEMENTOS.P5[respostas.P5];
    if (elemento) contagem[elemento] += 1;
  }
  
  return contagem;
}

function determinarElementoPrincipal(contagem) {
  let maxValor = 0;
  let elementoEscolhido = 'BAÇO';
  
  for (const [elemento, valor] of Object.entries(contagem)) {
    if (valor > maxValor) {
      maxValor = valor;
      elementoEscolhido = elemento;
    }
  }
  
  return elementoEscolhido;
}

function calcularIntensidade(respostas) {
  const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
  return pesos[respostas.P1] || 3;
}

function calcularUrgencia(respostas) {
  const pesos = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1 };
  return pesos[respostas.P8] || 3;
}

function determinarQuadrante(intensidade, urgencia) {
  if (intensidade >= 4 && urgencia >= 4) return 1;
  if (intensidade >= 4 && urgencia <= 3) return 2;
  if (intensidade <= 3 && urgencia >= 4) return 3;
  return 4;
}

function calcularLeadScore(respostas) {
  let score = 0;
  
  const pesoP1 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP1[respostas.P1] || 0;
  
  const pesoP3 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP3[respostas.P3] || 0;
  
  const pesoP6 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP6[respostas.P6] || 0;
  
  const pesoP8 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP8[respostas.P8] || 0;
  
  const pesoP9 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP9[respostas.P9] || 0;
  
  const pesoP11 = { 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'E': 6, 'F': 7, 'G': 8, 'H': 9, 'I': 10, 'J': 10 };
  score += pesoP11[respostas.P11] || 0;
  
  if (respostas.P12 === 'A') score += 5;
  
  return Math.min(score, 100);
}

function gerarScript(elemento, nome) {
  const info = DIAGNOSTICOS_COMPLETOS[elemento];
  if (!info) return null;
  
  return {
    script_abertura: info.script_abertura.replace('{NOME}', nome),
    diagnostico_completo: info.diagnostico.replace('{NOME}', nome),
    emoji: info.emoji
  };
}

function calcularDiagnostico(respostas, nomeLead) {
  const contagem = contarElementos(respostas);
  const elementoPrincipal = determinarElementoPrincipal(contagem);
  const intensidade = calcularIntensidade(respostas);
  const urgencia = calcularUrgencia(respostas);
  const quadrante = determinarQuadrante(intensidade, urgencia);
  const leadScore = calcularLeadScore(respostas);
  const prioridade = leadScore >= 70 ? 'ALTA' : leadScore >= 40 ? 'MÉDIA' : 'BAIXA';
  const isHotLeadVIP = leadScore >= 80 || quadrante === 1 || respostas.P8 === 'A';
  
  // ✅ BUSCAR INFO COM FALLBACK SEGURO
  const info = DIAGNOSTICOS_COMPLETOS[elementoPrincipal] || DIAGNOSTICOS_COMPLETOS['BAÇO'];
  
  // ✅ VALIDAR SE INFO EXISTE
  if (!info) {
    console.error('❌ ERRO: Nenhum diagnóstico encontrado para', elementoPrincipal);
    throw new Error('Diagnóstico não encontrado');
  }
  
  // ✅ GERAR TEXTOS PERSONALIZADOS
  const diagnosticoCompleto = info.diagnostico ? info.diagnostico.replace(/{NOME}/g, nomeLead) : 'Diagnóstico não disponível';
  const scriptAbertura = info.script_abertura ? info.script_abertura.replace(/{NOME}/g, nomeLead) : '';
  
  return {
    elemento_principal: elementoPrincipal,
    codigo_perfil: `${elementoPrincipal.substring(0, 2)}-${intensidade}`,
    nome_perfil: info.nome || 'Perfil não identificado',
    arquetipo: info.arquetipo || '',
    emoji: info.emoji || '🌟',
    quadrante: quadrante,
    diagnostico_resumo: diagnosticoCompleto.substring(0, 200) + '...',
    diagnostico_completo: diagnosticoCompleto,
    script_abertura: scriptAbertura,
    lead_score: leadScore,
    prioridade: prioridade,
    is_hot_lead_vip: isHotLeadVIP
  };
}

// ========================================
// HANDLER PRINCIPAL
// ========================================

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lead, respostas } = req.body;

    // Validações
    if (!lead || !lead.NOME || !lead.EMAIL || !lead.CELULAR) {
      return res.status(400).json({ 
        success: false,
        error: 'Dados incompletos'
      });
    }

    if (!respostas || Object.keys(respostas).length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Respostas não enviadas' 
      });
    }

    console.log('📥 Quiz recebido de:', lead.NOME);
    
    // Calcular diagnóstico COM scripts personalizados
    const diagnostico = calcularDiagnostico(respostas, lead.NOME);
    console.log('✅ Diagnóstico calculado:', diagnostico.elemento_principal);

    // Verificar se lead já existe
    const { data: leadExistente } = await supabase
      .from('quiz_leads')
      .select('id')
      .eq('celular', lead.CELULAR)
      .maybeSingle();

    let resultado;

    const dadosParaSalvar = {
      nome: lead.NOME,
      email: lead.EMAIL,
      respostas: respostas,
      elemento_principal: diagnostico.elemento_principal,
      codigo_perfil: diagnostico.codigo_perfil,
      nome_perfil: diagnostico.nome_perfil,
      arquetipo: diagnostico.arquetipo,
      emoji: diagnostico.emoji,
      quadrante: diagnostico.quadrante,
      diagnostico_resumo: diagnostico.diagnostico_resumo,
      diagnostico_completo: diagnostico.diagnostico_completo,
      script_abertura: diagnostico.script_abertura,
      lead_score: diagnostico.lead_score,
      prioridade: diagnostico.prioridade,
      is_hot_lead_vip: diagnostico.is_hot_lead_vip
    };

    if (leadExistente) {
      // Atualizar
      const { data, error } = await supabase
        .from('quiz_leads')
        .update({
          ...dadosParaSalvar,
          updated_at: new Date().toISOString()
        })
        .eq('celular', lead.CELULAR)
        .select();

      if (error) throw error;
      resultado = data;
      console.log('📝 Lead atualizado:', resultado[0].id);
    } else {
      // Inserir novo
      const { data, error } = await supabase
        .from('quiz_leads')
        .insert([{
          ...dadosParaSalvar,
          celular: lead.CELULAR,
          whatsapp_status: 'AGUARDANDO_CONTATO'
        }])
        .select();

      if (error) throw error;
      resultado = data;
      console.log('✅ Lead inserido:', resultado[0].id);
    }

    if (diagnostico.is_hot_lead_vip) {
      console.log('🔥 HOT LEAD VIP detectado!');
    }

    return res.status(200).json({
      success: true,
      message: 'Quiz finalizado com sucesso!',
      lead_id: resultado[0].id,
      diagnostico: {
        elemento: diagnostico.elemento_principal,
        perfil: diagnostico.nome_perfil,
        codigo: diagnostico.codigo_perfil,
        emoji: diagnostico.emoji,
        lead_score: diagnostico.lead_score,
        is_vip: diagnostico.is_hot_lead_vip
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};