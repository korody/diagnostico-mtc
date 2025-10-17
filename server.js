const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

// Carregar diagnosticos do arquivo JSON
const diagnosticosData = JSON.parse(fs.readFileSync('./api/diagnosticos.json', 'utf8'));

// ========================================
// FUNÇÕES DE CÁLCULO MTC
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

// ========================================
// ROTAS
// ========================================

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando!' });
});

app.post('/api/submit', async (req, res) => {
  try {
    const { lead, respostas } = req.body;
    
    console.log('\n===========================================');
    console.log('📥 RECEBENDO NOVO QUIZ');
    console.log('===========================================');
    console.log('👤 Nome:', lead.NOME);
    console.log('📱 Celular:', lead.CELULAR);
    console.log('📧 Email:', lead.EMAIL);
    
    // Calcular diagnóstico completo
    const contagem = contarElementos(respostas);
    const elementoPrincipal = determinarElementoPrincipal(contagem);
    const intensidade = calcularIntensidade(respostas);
    const urgencia = calcularUrgencia(respostas);
    const quadrante = determinarQuadrante(intensidade, urgencia);
    const leadScore = calcularLeadScore(respostas);
    const prioridade = leadScore >= 70 ? 'ALTA' : leadScore >= 40 ? 'MÉDIA' : 'BAIXA';
    const isHotLeadVIP = leadScore >= 80 || quadrante === 1 || respostas.P8 === 'A';
    
    console.log('🔄 Cálculos:');
    console.log('  → Elemento:', elementoPrincipal);
    console.log('  → Lead Score:', leadScore);
    console.log('  → Quadrante:', quadrante);
    console.log('  → Prioridade:', prioridade);
    console.log('  → Hot Lead VIP:', isHotLeadVIP ? 'SIM 🔥' : 'NÃO');
    
    // Buscar configuração do elemento
    const config = diagnosticosData[elementoPrincipal] || diagnosticosData['BAÇO'];
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
    
    // Verificar se lead já existe
    const { data: existe } = await supabase
      .from('quiz_leads')
      .select('id')
      .eq('celular', lead.CELULAR)
      .maybeSingle();
    
    if (existe) {
      // Atualizar
      await supabase
        .from('quiz_leads')
        .update({
          ...dadosParaSalvar,
          updated_at: new Date().toISOString()
        })
        .eq('celular', lead.CELULAR);
      
      console.log('✅ Lead ATUALIZADO no Supabase!');
    } else {
      // Inserir novo
      await supabase
        .from('quiz_leads')
        .insert({
          ...dadosParaSalvar,
          celular: lead.CELULAR,
          whatsapp_status: 'AGUARDANDO_CONTATO'
        });
      
      console.log('✅ Lead INSERIDO no Supabase!');
    }
    
    console.log('===========================================\n');
    
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
    console.error('\n❌ ERRO AO PROCESSAR QUIZ:');
    console.error(error);
    console.error('\n');
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(3001, () => {
  console.log('\n🚀 =========================================');
  console.log('   API Quiz MTC rodando!');
  console.log('   http://localhost:3001');
  console.log('=========================================\n');
});