const express = require('express');
const cors = require('cors');
const { normalizePhone, isValidBrazilianPhone } = require('./api/utils/phone');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// ========================================
// CONFIGURAÇÃO DE AMBIENTE
// ========================================

const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.local';

require('dotenv').config({ path: envFile });

const app = express();
app.use(cors());
app.use(express.json());

// Carregar credenciais do ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;

// Validar variáveis críticas
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_KEY são obrigatórias!');
  console.error('   Verifique seu arquivo:', envFile);
  process.exit(1);
}

if (!UNNICHAT_TOKEN) {
  console.error('⚠️  AVISO: UNNICHAT_ACCESS_TOKEN não configurado');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const diagnosticosData = JSON.parse(fs.readFileSync('./api/diagnosticos.json', 'utf8'));

console.log('\n🚀 ========================================');
console.log('   API Quiz MTC');
console.log('========================================');
console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 TESTE');
console.log('🔗 Supabase:', supabaseUrl);
console.log('🔑 Supabase KEY:', supabaseKey ? '✅ DEFINIDA' : '❌ NÃO DEFINIDA');
console.log('🔐 Unnichat TOKEN:', UNNICHAT_TOKEN ? '✅ DEFINIDA' : '❌ NÃO DEFINIDA');
console.log('📋 Tabela: quiz_leads');
console.log('📁 Arquivo .env:', envFile);
console.log('========================================\n');

// ========================================
// FUNÇÕES MTC
// ========================================

const MAPEAMENTO_ELEMENTOS = {
  P2: { A: 'RIM', B: 'RIM', C: 'FÍGADO', D: 'BAÇO', E: 'CORAÇÃO', F: 'PULMÃO' },
  P4: { A: 'RIM', B: 'RIM', C: 'CORAÇÃO', D: 'BAÇO', E: 'FÍGADO', F: null },
  P5: { A: 'FÍGADO', B: 'BAÇO', C: 'PULMÃO', D: 'RIM', E: 'CORAÇÃO', F: null }
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
  res.json({ 
    status: 'ok', 
    message: 'API funcionando!',
    environment: isProduction ? 'production' : 'development'
  });
});

// ===== ROTA: SUBMIT QUIZ =====
app.post('/api/submit', async (req, res) => {
  try {
    const { lead, respostas } = req.body;
    
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
    
    const contagem = contarElementos(respostas);
    const elementoPrincipal = determinarElementoPrincipal(contagem);
    const intensidade = calcularIntensidade(respostas);
    const urgencia = calcularUrgencia(respostas);
    const quadrante = determinarQuadrante(intensidade, urgencia);
    const leadScore = calcularLeadScore(respostas);
    const prioridade = leadScore >= 70 ? 'ALTA' : leadScore >= 40 ? 'MÉDIA' : 'BAIXA';
    const isHotLeadVIP = leadScore >= 80 || quadrante === 1 || respostas.P8 === 'A';
    
    console.log('🎯 Elemento:', elementoPrincipal, '| Score:', leadScore, '| VIP:', isHotLeadVIP ? 'SIM 🔥' : 'NÃO');
    
    const config = diagnosticosData[elementoPrincipal] || diagnosticosData['BAÇO'];
    const primeiroNome = lead.NOME.split(' ')[0];
    
    const diagnosticoCompleto = config.diagnostico.replace(/{NOME}/g, primeiroNome);
    const scriptAbertura = config.script_abertura.replace(/{NOME}/g, primeiroNome);
    
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
      await supabase
        .from('quiz_leads')
        .update({ ...dadosParaSalvar, updated_at: new Date().toISOString() })
        .eq('celular', celularNormalizado);
      console.log('✅ Lead ATUALIZADO\n');
    } else {
      await supabase
        .from('quiz_leads')
        .insert({
          ...dadosParaSalvar,
          celular: celularNormalizado,
          whatsapp_status: 'AGUARDANDO_CONTATO'
        });
      console.log('✅ Lead INSERIDO\n');
    }
    
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
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ===== WEBHOOK: VER RESULTADOS =====
app.post('/webhook/unnichat/ver-resultados', async (req, res) => {
  try {
    console.log('\n📥 WEBHOOK RECEBIDO');

    const { data: leads, error: leadError } = await supabase
      .from('quiz_leads')
      .select('*')
      .not('celular', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(5);

    if (leadError || !leads || leads.length === 0) {
      console.error('❌ Nenhum lead encontrado');
      return res.json({ success: false, message: 'Nenhum lead encontrado' });
    }

    const lead = leads.find(l => 
      l.whatsapp_status === 'template_enviado' || 
      l.whatsapp_status === 'sent'
    ) || leads[0];

    console.log('✅ Lead identificado:', lead.nome);

    const phoneForUnnichat = `55${normalizePhone(lead.celular)}`;

    // Criar/atualizar contato
    try {
      await fetch(`${UNNICHAT_API_URL}/contact`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: lead.nome,
          phone: phoneForUnnichat,
          email: lead.email || `${lead.celular}@placeholder.com`,
          tags: ['quiz_resultados_enviados']
        })
      });
      
      console.log('✅ Contato atualizado');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log('⚠️ Aviso:', error.message);
    }

    const primeiroNome = lead.nome.split(' ')[0];
    const diagnosticoCompleto = lead.diagnostico_completo || 
      'Seu diagnóstico está sendo processado. Em breve você receberá todas as informações!';

    // Adicionar formatação WhatsApp
    const diagnosticoFormatado = diagnosticoCompleto
      .replace(/🔥 DIAGNÓSTICO:/g, '*🔥 DIAGNÓSTICO:*')
      .replace(/O que seu corpo está dizendo:/g, '*O que seu corpo está dizendo:*')
      .replace(/Por que isso está acontecendo:/g, '*Por que isso está acontecendo:*')
      .replace(/A boa notícia:/g, '*A boa notícia:*')
      .replace(/O que você pode fazer:/g, '*O que você pode fazer:*')
      .replace(/🎯 PRÓXIMO PASSO ESSENCIAL:/g, '*🎯 PRÓXIMO PASSO ESSENCIAL:*');

    const mensagem = `
Olá ${primeiroNome}! 👋

${diagnosticoFormatado}

💬 Tem dúvidas sobre seu diagnóstico?
Responda esta mensagem que o Mestre Ye te ajuda! 🙏
    `.trim();

    console.log('📨 Enviando diagnóstico...');
    
    const msgResponse = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneForUnnichat,
        messageText: mensagem
      })
    });

    const msgResult = await msgResponse.json();

    if (msgResult.code && msgResult.code !== '200') {
      console.error('❌ Erro ao enviar:', msgResult);
      throw new Error(msgResult.message || 'Erro ao enviar mensagem');
    }

    console.log('✅ Diagnóstico enviado com sucesso!\n');

    // Atualizar status
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'resultados_enviados',
        whatsapp_sent_at: new Date().toISOString()
      })
      .eq('id', lead.id);

    // Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'resultados_enviados',
      metadata: { 
        action: 'ver_resultados',
        unnichat_response: msgResult,
        triggered_by_webhook: true
      },
      sent_at: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Resultados enviados',
      leadId: lead.id,
      leadName: lead.nome
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// INICIAR SERVIDOR
// ========================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('\n🚀 =========================================');
  console.log('   API Quiz MTC rodando!');
  console.log(`   http://localhost:${PORT}`);
  console.log('   ');
  console.log('   Rotas disponíveis:');
  console.log('   • POST /api/submit (Quiz)');
  console.log('   • POST /webhook/unnichat/ver-resultados (Webhook)');
  console.log('=========================================\n');
});