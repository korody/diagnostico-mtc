// ========================================
// SERVER.JS - LOCAL DEVELOPMENT EXPRESS SERVER
// ========================================
// 📌 IMPORTANTE:
// - Este arquivo é usado APENAS para desenvolvimento local
// - Em produção (Vercel), os arquivos em /api/* são usados como serverless functions
// - As rotas aqui duplicam a lógica dos handlers serverless para permitir testes locais
// - Para rodar localmente: npm run api:test ou npm run api:prod
// ========================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const { formatToE164, isValidE164, formatForUnnichat, formatForDisplay, findLeadByPhone } = require('./lib/phone-simple');
const { addLeadTags, TAGS } = require('./lib/tags');
const { calcularArquetipo } = require('./lib/calcularArquetipo');
const fs = require('fs');

// Importante: Não importe handlers que criam clients ANTES de carregar .env
// O dashboard será requerido após configurar o ambiente para evitar supabase nulo

// ========================================
// CONFIGURAÇÃO DE AMBIENTE
// ========================================

const isProduction = process.env.NODE_ENV === 'production';
const DEBUG = process.env.WHATSAPP_DEBUG === 'true' || !isProduction;
const envFile = isProduction ? '.env.production' : '.env.local';

require('dotenv').config({ path: envFile });

const app = express();
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'build')));

// Carregar credenciais do ambiente
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const UNNICHAT_API_URL = process.env.UNNICHAT_API_URL || 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = process.env.UNNICHAT_ACCESS_TOKEN;

// Validar variáveis críticas
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_KEY não encontradas.');
  console.error('   Verifique seu arquivo:', envFile);
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Continuando em modo limitado para testes locais de rotas estáticas (ex.: /dashboard).');
  } else {
    process.exit(1);
  }
}

if (!UNNICHAT_TOKEN) {
  console.error('⚠️  AVISO: UNNICHAT_ACCESS_TOKEN não configurado');
}

// Obter cliente Supabase centralizado
const supabase = require('./lib/supabase');
const diagnosticos = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'api', 'diagnosticos.json'), 'utf-8')
);

if (DEBUG) {
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
}

// ========================================
// FUNÇÕES MTC
// ========================================

const MAPEAMENTO_ELEMENTOS = {
  P2: { A: 'RIM', B: 'RIM', C: 'FÍGADO', D: 'BAÇO', E: 'CORAÇÃO', F: 'PULMÃO', G: 'RIM' },
  P4: { A: 'RIM', B: 'RIM', C: 'CORAÇÃO', D: 'BAÇO', E: 'FÍGADO', F: 'RIM', G: null },
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
  
  const pesoP7 = { 'A': 15, 'B': 12, 'C': 9, 'D': 6, 'E': 3 };
  score += pesoP7[respostas.P7] || 0;
  
  const pesoP8 = { 'A': 20, 'B': 16, 'C': 12, 'D': 8, 'E': 4 };
  score += pesoP8[respostas.P8] || 0;
  
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

// ===== ROTA: STATUS/AMBIENTE =====
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString()
  });
});

// ===== ROTAS: PÁGINAS HTML (sem extensão) =====
app.get('/search-send', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search-send.html'));
});

// Alias compatível com produção: algumas infra geram esta URL com o prefixo /api
app.get('/api/search-send', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search-send.html'));
});

// ===== ROTA: PLAYBOOK COMERCIAL DE UM LEAD =====
app.get('/api/lead/playbook', async (req, res) => {
  try {
    const { gerarRelatorioCall } = require('./lib/playbook-comercial');
    const { leadId, email, phone } = req.query;

    if (!leadId && !email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Informe leadId, email ou phone para buscar o playbook'
      });
    }

    // Buscar lead
    let query = supabase.from('quiz_leads').select('*');

    if (leadId) {
      query = query.eq('id', leadId);
    } else if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      const phoneNormalized = phone.replace(/\D/g, '');
      query = query.eq('celular', phoneNormalized);
    }

    const { data: lead, error } = await query.single();

    if (error || !lead) {
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
    }

    // Verificar se tem perfil comercial
    if (!lead.perfil_comercial) {
      return res.status(400).json({
        success: false,
        error: 'Lead não possui perfil comercial calculado',
        lead: {
          id: lead.id,
          nome: lead.nome,
          email: lead.email
        }
      });
    }

    // Gerar relatório
    const relatorio = gerarRelatorioCall(lead);

    return res.status(200).json({
      success: true,
      lead: {
        id: lead.id,
        nome: lead.nome,
        email: lead.email,
        celular: lead.celular,
        perfil_comercial: lead.perfil_comercial,
        elemento_principal: lead.elemento_principal,
        lead_score: lead.lead_score,
        prioridade: lead.prioridade,
        created_at: lead.created_at
      },
      relatorio
    });

  } catch (error) {
    console.error('❌ Erro ao gerar playbook:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ROTA: BUSCAR LEAD POR TELEFONE OU EMAIL =====
app.get('/api/lead/find', async (req, res) => {
  try {
    const { phone, email } = req.query;
    
    if (!phone && !email) {
      return res.status(400).json({
        success: false,
        error: 'Telefone ou email é obrigatório'
      });
    }
    
    let lead = null;
    
    // Busca por telefone usando função simplificada
    if (phone) {
      lead = await findLeadByPhone(supabase, phone, email);
    }
    
    // Busca por email
    if (!lead && email) {
      const emailNorm = email.toString().trim().toLowerCase();
      // Tentativa 1: igualdade (para registros limpos)
      const { data: emailExact } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('email', emailNorm)
        .maybeSingle();
      if (emailExact) {
        lead = emailExact;
      } else {
        // Tentativa 2: ilike contendo (tolerante a espaços/quebras de linha salvos indevidamente)
        const { data: emailLike } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('email', `%${emailNorm}%`)
          .limit(1)
          .maybeSingle();
        if (emailLike) lead = emailLike;
      }
    }
    
    if (!lead) {
      return res.json({
        success: false,
        message: 'Lead não encontrado'
      });
    }
    
    res.json({
      success: true,
      lead: lead
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ROTA: ENVIO WHATSAPP MANUAL =====
async function sendWhatsAppInternal({ phone, customMessage, leadId, sendDiagnostico, sendChallenge }) {
  let phoneToUse = phone;
  let messageToSend = customMessage;
  let messagesToSend = []; // Suporte a múltiplas mensagens (Desafio)
  let contactName = 'Contato Quiz';
  let contactEmail;

  if (leadId) {
    const { data: lead, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('id', leadId)
      .single();
    if (error || !lead) throw new Error('Lead não encontrado');
    phoneToUse = lead.celular;
    contactName = lead.nome || contactName;
    contactEmail = lead.email;
    
    // DESAFIO DA VITALIDADE (2 mensagens)
    if (sendChallenge) {
      const referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${lead.celular}&utm_content=msg-inicial-desafio`;
      
      messagesToSend = [
        {
          text: `*Quer ganhar acesso ao SUPER COMBO Vitalício do Mestre Ye, sem pagar nada?*

Preparamos algo muito especial para você: o *Desafio da Vitalidade*.

Durante as próximas semanas, você vai receber *missões simples durante as Lives de Aquecimento da Black November da Saúde Vitalícia*.

Cada missão vai te aproximar mais do *equilíbrio, da leveza e da vitalidade que o seu corpo merece.* 🀄

*Veja como participar:*

1. Compartilhe suas missões no Instagram Stories e marque *@mestre_ye*;
2. Convide amigos e familiares para o evento através do seu link único!`
        },
        {
          text: `Cada pessoa que se inscrever através do seu link único aumenta suas chances de ser o grande vencedor ou vencedrora do SUPER COMBO Vitalício do Mestre Ye!

*Seu link de compartilhamento*:
${referralLink}

Compartilhe vitalidade. Inspire transformação`
        }
      ];
    } else {
      // Diagnóstico ou mensagem customizada (1 mensagem)
      messageToSend = customMessage || (sendDiagnostico ? lead.diagnostico_completo : lead.script_abertura);
      
      // Adicionar pergunta de feedback no final do diagnóstico
      if (sendDiagnostico && messageToSend) {
        messageToSend = messageToSend.trim() + '\n\nFez sentido esse Diagnóstico para você? 🙏';
      }
    }
  }

  // Validar telefone
  if (!phoneToUse) throw new Error('Telefone é obrigatório');
  
  // Validar mensagem (única ou múltipla)
  const hasMultipleMessages = messagesToSend && messagesToSend.length > 0;
  if (!hasMultipleMessages && !messageToSend) throw new Error('Mensagem é obrigatória');

  const phoneE164 = phoneToUse.startsWith('+') ? phoneToUse : formatToE164(phoneToUse);
  const phoneForUnnichat = formatForUnnichat(phoneE164);

  console.log('\n� ======== ENVIO:', sendChallenge ? 'DESAFIO' : (sendDiagnostico ? 'DIAGNOSTICO' : 'CUSTOM'));
  console.log('�📱 Enviando para:', phoneForUnnichat);
  
  if (hasMultipleMessages) {
    console.log(`📝 ${messagesToSend.length} mensagens preparadas`);
    messagesToSend.forEach((msg, i) => {
      console.log(`   ${i+1}. ${msg.text.substring(0, 60)}...`);
    });
  } else {
    console.log('📝 Mensagem:', messageToSend.substring(0, 100) + '...');
  }

  if (process.env.WHATSAPP_SIMULATION_MODE === 'true') {
    console.log('🧪 SIMULAÇÃO ATIVA - não enviando');
    console.log('========================================\n');
    return { 
      success: true, 
      phone: phoneE164, 
      message: `${hasMultipleMessages ? messagesToSend.length : 1} mensagem(ns) simulada(s)`,
      simulation: true 
    };
  }

  console.log('🔗 API URL:', `${UNNICHAT_API_URL}/meta/messages`);

  // Criar/atualizar contato previamente
  if (leadId) {
    try {
      await fetch(`${UNNICHAT_API_URL}/contact`, {
        method: 'POST', 
        headers: { 
          'Authorization': `Bearer ${UNNICHAT_TOKEN}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          name: contactName, 
          phone: phoneForUnnichat, 
          email: contactEmail || `${phoneE164.replace('+', '')}@placeholder.com`, 
          tags: ['manual_send', sendChallenge ? 'desafio_enviado' : 'diagnostico_enviado'] 
        })
      });
      await new Promise(r=>setTimeout(r, 1200));
    } catch (e) { console.log('⚠️ Contato (pré-envio):', e.message); }
  }

  // Função para enviar uma mensagem
  async function sendOnce(msgText) {
    const resp = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
      method: 'POST', 
      headers: { 
        'Authorization': `Bearer ${UNNICHAT_TOKEN}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ phone: phoneForUnnichat, messageText: msgText })
    });
    return { status: resp.status, statusText: resp.statusText, json: await resp.json() };
  }

  // Enviar mensagem(ns)
  const messagesToProcess = hasMultipleMessages ? messagesToSend : [{ text: messageToSend }];
  
  for (let i = 0; i < messagesToProcess.length; i++) {
    const msg = messagesToProcess[i];
    console.log(`\n📤 Enviando mensagem ${i+1}/${messagesToProcess.length}...`);
    
    let result = await sendOnce(msg.text);
    console.log('📊 Status HTTP:', result.status, result.statusText);
    console.log('📦 Resposta Unnichat:', JSON.stringify(result.json, null, 2));

    // Retry se contato não encontrado (apenas na primeira mensagem)
    if (i === 0 && ((result.json && result.json.message && /Contact not found/i.test(result.json.message)) || (result.status === 400 && /contact/i.test(JSON.stringify(result.json||{}))))) {
      console.log('🔁 Criando/atualizando contato...');
      try {
        await fetch(`${UNNICHAT_API_URL}/contact`, {
          method: 'POST', 
          headers: { 
            'Authorization': `Bearer ${UNNICHAT_TOKEN}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            name: contactName, 
            phone: phoneForUnnichat, 
            email: contactEmail || `${phoneNormalized}@placeholder.com`, 
            tags: ['manual_send', 'api_whatsapp_send'] 
          })
        });
        await new Promise(r=>setTimeout(r, 800));
      } catch (e) { console.log('⚠️ Contato:', e.message); }

      result = await sendOnce(msg.text);
      console.log('📊 Retry Status HTTP:', result.status, result.statusText);
      console.log('📦 Retry Resposta Unnichat:', JSON.stringify(result.json, null, 2));
    }

    // Verificar se deu erro
    if (result.json && result.json.code && result.json.code !== '200') {
      throw new Error(result.json.message || 'Erro ao enviar mensagem');
    }

    // Delay entre mensagens múltiplas
    if (i < messagesToProcess.length - 1) {
      console.log('⏱️  Aguardando 3s antes da próxima mensagem...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  console.log('\n✅ Todas as mensagens enviadas com sucesso!');
  console.log('========================================\n');
  
  return { 
    success: true, 
    phone: phoneNormalized, 
    message: `${messagesToProcess.length} mensagem(ns) enviada(s) com sucesso`,
    messageCount: messagesToProcess.length
  };
}

// ROTA LOCAL: POST /api/whatsapp/send (suporta sendDiagnostico, sendChallenge, customMessage)
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const result = await sendWhatsAppInternal(req.body || {});
    res.json(result);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ROTA: TRIGGER / GATILHO DE AUTOMAÇÃO (insere lead na automação Unnichat)
const triggerAutomationHandler = require('./api/whatsapp/trigger-automation');
app.post('/api/whatsapp/trigger-automation', triggerAutomationHandler);

// ===== ROTA: ENVIO DIAGNÓSTICO (GET) - DEBUG/ADMIN =====
app.get('/api/whatsapp/send/diagnostico/:leadId', async (req, res) => {
  try {
    const secret = req.query.secret;
    const expected = process.env.ADMIN_SECRET || process.env.CRON_SECRET;
    if (!expected || secret !== expected) return res.status(401).json({ success: false, error: 'Não autorizado' });
    const leadId = req.params.leadId;
    const result = await sendWhatsAppInternal({ leadId, sendDiagnostico: true });
    res.json(result);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ===== ROTA: BUSCA FLEXÍVEL (nome/email/telefone parcial) =====
app.get('/api/leads/search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) return res.status(400).json({ success: false, error: 'Parâmetro q é obrigatório' });

    let query = supabase.from('quiz_leads').select('*').limit(10);

    // Se há arroba, prioriza email
    if (q.includes('@')) {
      query = query.ilike('email', `%${q}%`);
    } else {
      // Monta busca OR em nome/email/celular
      const digits = q.replace(/\D/g, '');
      // Supabase não suporta OR com funções no client oficial v2 de forma simples via builder,
      // então encadeamos filtros de forma ampla usando .or
      const filters = [
        `nome.ilike.%${q}%`,
        `email.ilike.%${q}%`
      ];
      if (digits.length >= 6) {
        filters.push(`celular.ilike.%${digits}%`);
      }
      query = query.or(filters.join(','));
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, results: data || [] });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== ROTA: SUBMIT QUIZ =====
app.post('/api/submit', async (req, res) => {
  try {
    const { lead, respostas } = req.body;
    
    console.log('\n📥 NOVO QUIZ:', lead.NOME);
    
    // Telefone já vem em formato E.164 do frontend, apenas validar
    const celularE164 = lead.CELULAR;
    
    if (!celularE164 || !isValidE164(celularE164)) {
      console.log('❌ Telefone inválido:', lead.CELULAR);
      return res.status(400).json({
        success: false,
        error: 'Telefone inválido. Use formato internacional com código do país.'
      });
    }

    console.log('✅ Telefone validado:', celularE164);
    
  // Normalizar email
  const emailNormalizado = (lead.EMAIL || '').toString().trim().toLowerCase();

  const contagem = contarElementos(respostas);
    const elementoPrincipal = determinarElementoPrincipal(contagem);
    const intensidade = calcularIntensidade(respostas);
    const urgencia = calcularUrgencia(respostas);
    const quadrante = determinarQuadrante(intensidade, urgencia);
    const leadScore = calcularLeadScore(respostas);
    const prioridade = leadScore >= 70 ? 'ALTA' : leadScore >= 40 ? 'MÉDIA' : 'BAIXA';
    const isHotLeadVIP = leadScore >= 80 || quadrante === 1 || respostas.P8 === 'A';
    
    // Calcular arquétipo comportamental
    const dadosArquetipo = calcularArquetipo(respostas);
    
    console.log('🎯 Elemento:', elementoPrincipal, '| Score:', leadScore, '| VIP:', isHotLeadVIP ? 'SIM 🔥' : 'NÃO');
    
    const config = diagnosticos[elementoPrincipal] || diagnosticos['BAÇO'];
    const primeiroNome = lead.NOME.split(' ')[0];
    
    const diagnosticoCompleto = config.diagnostico.replace(/{NOME}/g, primeiroNome);
    const scriptAbertura = config.script_abertura.replace(/{NOME}/g, primeiroNome);
    
    const dadosParaSalvar = {
      nome: (lead.NOME || '').toString().trim(),
      email: emailNormalizado,
      respostas: respostas,
      elemento_principal: elementoPrincipal,
      codigo_perfil: `${elementoPrincipal.substring(0, 2)}-${intensidade}`,
      nome_perfil: config.nome,
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
      urgencia_calculada: urgencia,
      // Novos campos de arquétipos comportamentais
      perfil_comercial: dadosArquetipo.arquetipo_principal,
      scores_arquetipos: dadosArquetipo.scores_arquetipos,
      confianca_arquetipo: dadosArquetipo.confianca,
      objecao_principal: dadosArquetipo.objecao_principal,
      autonomia_decisao: dadosArquetipo.autonomia_decisao,
      investimento_mensal_atual: dadosArquetipo.investimento_mensal_atual,
      // Novos campos de segmentação e qualificação
      estado: respostas.P17 || null,
      custo_mensal_problema: respostas.P21 ? (
        respostas.P21 === 'A' ? 50 :
        respostas.P21 === 'B' ? 200 :
        respostas.P21 === 'C' ? 400 :
        respostas.P21 === 'D' ? 750 :
        respostas.P21 === 'E' ? 1200 :
        0
      ) : null
    };
    
    // ============================================
    // AUTENTICAÇÃO INTEGRADA: Chamar endpoint que cria usuário + autenticação + salva dados
    // ============================================
    
    let userId = null;
    let redirectUrl = 'https://black.qigongbrasil.com/diagnostico'; // Fallback
    const personaAiUrl = process.env.PERSONA_AI_URL || 'https://digital.mestreye.com';
    
    try {
      console.log('🔗 Chamando endpoint de autenticação integrada para:', emailNormalizado);
      
      // Montar payload com todos os dados do quiz
      const quizData = {
        nome: lead.NOME,
        email: emailNormalizado,
        celular: celularE164,
        respostas: respostas,
        diagnostico_completo: dadosParaSalvar.diagnostico_completo,
        elemento_principal: dadosParaSalvar.elemento_principal,
        quadrante: dadosParaSalvar.quadrante,
        lead_score: dadosParaSalvar.lead_score
      };
      
      const payload = {
        email: emailNormalizado,
        fullName: lead.NOME,
        phone: celularE164,
        quizData
      };
      
      const response = await fetch(`${personaAiUrl}/api/quiz/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Parse JSON com tratamento de erro
      let result;
      const responseText = await response.text();
      
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('❌ Resposta não é JSON válido:', responseText.substring(0, 200));
        throw new Error(`Endpoint retornou resposta inválida (status ${response.status})`);
      }
      
      if (result.success && result.redirectUrl) {
        userId = result.userId;
        redirectUrl = `${personaAiUrl}${result.redirectUrl}`;
        console.log('✅ Usuário autenticado com sucesso via endpoint integrado', { userId });
      } else {
        console.error('❌ Erro na autenticação integrada:', result.message || 'Resposta inválida');
      }
    } catch (e) {
      console.error('⚠️ Erro ao chamar endpoint de autenticação integrada:', e.message);
    }
    
    // ============================================
    // Salvar quiz_leads
    // ============================================
    
    // Verificar se lead já existe (usando telefone E.164)
    const { data: existe } = await supabase
      .from('quiz_leads')
      .select('id')
      .eq('celular', celularE164)
      .maybeSingle();
    
    if (existe) {
      await supabase
        .from('quiz_leads')
        .update({ ...dadosParaSalvar, updated_at: new Date().toISOString() })
        .eq('celular', celularE164);
      console.log('✅ Lead ATUALIZADO\n');
      // Log de linha do tempo (diagnóstico solicitado)
      try {
        await supabase.from('whatsapp_logs').insert({
          lead_id: existe.id,
          phone: celularE164,
          status: 'diagnostico_solicitado',
          metadata: { source: 'quiz_submit_local', updated: true },
          sent_at: new Date().toISOString()
        });
        await addLeadTags(supabase, existe.id, [TAGS.DIAGNOSTICO_FINALIZADO]);
      } catch (e) { console.log('⚠️ Log submit local (update) falhou:', e.message); }
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('quiz_leads')
        .insert({
          ...dadosParaSalvar,
          celular: celularE164
        })
        .select('id')
        .maybeSingle();
      if (insertErr) throw insertErr;
      console.log('✅ Lead INSERIDO\n');
      // Log de linha do tempo (diagnóstico solicitado)
      try {
        await supabase.from('whatsapp_logs').insert({
          lead_id: inserted?.id,
          phone: celularE164,
          status: 'diagnostico_solicitado',
          metadata: { source: 'quiz_submit_local', created: true },
          sent_at: new Date().toISOString()
        });
        await addLeadTags(supabase, inserted?.id, [TAGS.DIAGNOSTICO_FINALIZADO]);
      } catch (e) { console.log('⚠️ Log submit local (insert) falhou:', e.message); }
    }
    
    // redirectUrl já tem o fallback definido no bloco try/catch acima
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
        lead_score: leadScore,
        quadrante: quadrante,
        is_vip: isHotLeadVIP,
        intensidade_calculada: intensidade,
        urgencia_calculada: urgencia,
        contagem_elementos: contagem,
        perfil_comercial: dadosArquetipo.arquetipo_principal
      }
    });
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ===== WEBHOOK: VER RESULTADOS (MELHORADO) =====
app.post('/webhook/unnichat/send-diagnostic', async (req, res) => {
  try {
    if (DEBUG) {
      console.log('\n📥 WEBHOOK RECEBIDO');
      // Evitar logar PII sensível em produção
      const safePreview = { ...req.body };
      if (safePreview.phone) safePreview.phone = '[REDACTED]';
      if (safePreview.from) safePreview.from = '[REDACTED]';
      if (safePreview.contact?.phone) safePreview.contact.phone = '[REDACTED]';
      if (safePreview.contact?.email) safePreview.contact.email = '[REDACTED]';
      console.log('📋 Payload (resumo):', JSON.stringify(safePreview, null, 2));
    }
    
    const webhookData = req.body;
    
    // Extrair dados do webhook
    let phoneFromWebhook = 
      webhookData.phone || 
      webhookData.from || 
      webhookData.contact?.phone ||
      webhookData.number ||
      webhookData.phoneNumber;
    
    const emailFromWebhook = webhookData.email || webhookData.contact?.email;
    const nameFromWebhook = webhookData.name || webhookData.contact?.name;
    
    if (DEBUG) {
      console.log('📱 Telefone recebido:', phoneFromWebhook ? '[OK]' : 'N/D');
      console.log('📧 Email recebido:', emailFromWebhook ? '[OK]' : 'N/D');
      console.log('👤 Nome recebido:', nameFromWebhook || 'N/D');
    }
    
    let lead = null;
    
    // ========================================
    // MÉTODO 1: BUSCAR POR TELEFONE (MÚLTIPLAS TENTATIVAS)
    // ========================================
    if (phoneFromWebhook) {
  const phoneClean = phoneFromWebhook.replace(/\D/g, '').replace(/^55/, '');
  if (DEBUG) console.log('🔍 Telefone normalizado:', phoneClean);
      
      // TENTATIVA 1: Buscar exato
  if (DEBUG) console.log('🔍 Tentativa 1: Busca exata por telefone...');
      const { data: leadExato } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('celular', phoneClean)
        .maybeSingle();
      
      if (leadExato) {
        lead = leadExato;
        console.log('✅ Lead encontrado (busca exata):', lead.nome);
      }
      
      // TENTATIVA 2: Buscar pelos últimos 10 dígitos (cobre casos com dígito 9 a mais)
      if (!lead && phoneClean.length >= 10) {
        const ultimos10 = phoneClean.slice(-10);
        if (DEBUG) console.log('🔍 Tentativa 2: Busca pelos últimos 10 dígitos:', ultimos10);
        const { data: leads10 } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('celular', `%${ultimos10}%`)
          .limit(5);
        if (leads10 && leads10.length > 0) {
          lead = leads10[0];
          if (DEBUG) {
            console.log('✅ Lead encontrado (últimos 10 dígitos):', lead.nome);
            console.log('   Telefone no banco:', lead.celular);
          }
        }
      }

      // TENTATIVA 3: Buscar pelos últimos 9 dígitos (ignora DDD variações)
      if (!lead && phoneClean.length >= 9) {
        const ultimos9 = phoneClean.slice(-9);
  if (DEBUG) console.log('🔍 Tentativa 3: Busca pelos últimos 9 dígitos:', ultimos9);
        
        const { data: leadsParecidos } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('celular', `%${ultimos9}%`)
          .limit(5);
        
        if (leadsParecidos && leadsParecidos.length > 0) {
          lead = leadsParecidos[0];
          if (DEBUG) {
            console.log('✅ Lead encontrado (últimos 9 dígitos):', lead.nome);
            console.log('   Telefone no banco:', lead.celular);
          }
        }
      }
      
      // TENTATIVA 4: Buscar com LIKE parcial (últimos 8 dígitos)
      if (!lead && phoneClean.length >= 8) {
        const ultimos8 = phoneClean.slice(-8);
        if (DEBUG) console.log('🔍 Tentativa 4: Busca pelos últimos 8 dígitos:', ultimos8);
        
        const { data: leadsParecidos } = await supabase
          .from('quiz_leads')
          .select('*')
          .ilike('celular', `%${ultimos8}%`)
          .limit(5);
        
        if (leadsParecidos && leadsParecidos.length > 0) {
          lead = leadsParecidos[0];
          if (DEBUG) {
            console.log('✅ Lead encontrado (últimos 8 dígitos):', lead.nome);
            console.log('   Telefone no banco:', lead.celular);
          }
        }
      }
    }
    
    // ========================================
    // MÉTODO 2: FALLBACK POR EMAIL
    // ========================================
    if (!lead && emailFromWebhook) {
  if (DEBUG) console.log('🔍 Fallback: Buscando por email');
      
      const { data: leadByEmail } = await supabase
        .from('quiz_leads')
        .select('*')
        .eq('email', emailFromWebhook)
        .maybeSingle();
      
      if (leadByEmail) {
        lead = leadByEmail;
        console.log('✅ Lead encontrado por EMAIL:', lead.nome);
      }
    }
    
    // ========================================
    // MÉTODO 3: FALLBACK POR NOME (último recurso - apenas como informação)
    // ========================================
    if (!lead && nameFromWebhook) {
  if (DEBUG) console.log('🔍 Fallback: Buscando por nome');
      
      const { data: leadsByName } = await supabase
        .from('quiz_leads')
        .select('*')
        .ilike('nome', `%${nameFromWebhook}%`)
        .limit(5);
      
      if (leadsByName && leadsByName.length > 0) {
        lead = leadsByName[0];
        console.log('⚠️ Lead encontrado por NOME:', lead.nome);
        console.log('   (Múltiplos resultados possíveis)');
      }
    }

    // ❌ Se ainda não encontrou
    if (!lead) {
      if (DEBUG) {
        console.error('❌ ERRO: Nenhum lead identificado!');
        console.error('   Telefone buscado:', phoneFromWebhook);
        console.error('   Email buscado:', emailFromWebhook);
        console.error('   Nome buscado:', nameFromWebhook);
      }
      
      return res.status(404).json({ 
        success: false, 
        message: 'Lead não identificado' 
      });
    }

    if (DEBUG) {
      console.log('\n✅ LEAD FINAL IDENTIFICADO:');
      console.log('   Nome:', lead.nome);
      console.log('   Telefone:', lead.celular);
      console.log('   Email:', lead.email);
      console.log('   Elemento:', lead.elemento_principal);
    }

    // Normalizar telefone salvo e formatar para Unnichat (evita 55 duplicado e espaços)
    const phoneE164 = lead.celular.startsWith('+') ? lead.celular : formatToE164(lead.celular);
    const phoneForUnnichat = formatForUnnichat(phoneE164);

    // Atualizar/criar contato
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
      
  if (DEBUG) console.log('✅ Contato atualizado');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log('⚠️ Aviso contato:', error.message);
    }

    // Preparar diagnóstico
    const primeiroNome = lead.nome.split(' ')[0];
    const diagnosticoCompleto = lead.diagnostico_completo || 
      'Seu diagnóstico está sendo processado. Em breve você receberá todas as informações!';

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

  if (DEBUG) console.log('📨 Enviando diagnóstico...');
    
    // Enviar diagnóstico com 1 retry em caso de "Contact not found"
    async function sendOnce() {
      const resp = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phoneForUnnichat, messageText: mensagem })
      });
      return await resp.json();
    }

    let msgResult = await sendOnce();
    if (msgResult && msgResult.message && /Contact not found/i.test(msgResult.message)) {
      if (DEBUG) console.log('🔁 Retry após "Contact not found" (forçando atualização de contato)');
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
            tags: ['quiz_resultados_enviados','auto_retry']
          })
        });
        await new Promise(r => setTimeout(r, 800));
      } catch (e) {
        console.log('⚠️ Falha ao atualizar contato no retry:', e.message);
      }
      msgResult = await sendOnce();
    }

    if (msgResult.code && msgResult.code !== '200') {
      console.error('❌ Erro ao enviar:', msgResult);
      throw new Error(msgResult.message || 'Erro ao enviar mensagem');
    }

  if (DEBUG) console.log('✅ Diagnóstico enviado com sucesso!\n');

    // Atualizar status e tags
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'diagnostico_enviado',
        whatsapp_sent_at: new Date().toISOString()
      })
      .eq('id', lead.id);

    try { await addLeadTags(supabase, lead.id, [TAGS.DIAGNOSTICO_ENVIADO]); } catch (e) { /* noop */ }

    // Registrar log
    await supabase.from('whatsapp_logs').insert({
      lead_id: lead.id,
      phone: lead.celular,
      status: 'diagnostico_enviado',
      metadata: { 
        action: 'ver_resultados',
        unnichat_response: msgResult,
        triggered_by_webhook: true,
        webhook_payload: webhookData,
        search_method: phoneFromWebhook ? 'phone' : emailFromWebhook ? 'email' : 'fallback'
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

// ===== ROTA: ENVIO EM MASSA - CONVITE AMIGOS =====
app.post('/api/send-bulk-referral', async (req, res) => {
  try {
    const { mode = 'test', limit = 10, offset = 0, specific_phone = null } = req.body;

    console.log('\n📨 ========================================');
    console.log('   ENVIO EM MASSA - CONVITE AMIGOS');
    console.log('========================================');
    console.log('🎯 Modo:', mode);
    console.log('📱 Telefone específico:', specific_phone || 'Não');
    console.log('========================================\n');
    
    // Buscar leads da tabela quiz_leads
    let query = supabase
      .from('quiz_leads')
      .select('id, nome, celular, email, created_at')
      .not('celular', 'is', null);

    if (specific_phone) {
      const phoneNormalized = normalizePhone(specific_phone);
      query = query.eq('celular', phoneNormalized);
      console.log(`🔍 Buscando: ${phoneNormalized}`);
    } else {
      query = query.order('created_at', { ascending: false });
      
      if (mode === 'test') {
        query = query.limit(limit);
      } else {
        query = query.range(offset, offset + limit - 1);
      }
    }

    const { data: leads, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Erro ao buscar leads: ${fetchError.message}`);
    }

    console.log(`📋 ${leads.length} leads encontrados\n`);

    const results = {
      total: leads.length,
      success: 0,
      failed: 0,
      errors: [],
      messages_sent: 0
    };

    const DELAY_BETWEEN_MESSAGES = 2000;
    const DELAY_BETWEEN_LEADS = 3000;

    for (const lead of leads) {
      try {
        const phoneForUnnichat = formatForUnnichat(lead.celular);
        const referralLink = `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${lead.celular}&utm_content=msg-inicial-desafio`;
        
        console.log(`\n👤 ${lead.nome}`);
        console.log(`📱 ${phoneForUnnichat}`);
        
        const message1 = `*Quer ganhar acesso ao SUPER COMBO Vitalício do Mestre Ye, sem pagar nada?*

Preparamos algo muito especial para você: o *Desafio da Vitalidade*.

Durante as próximas semanas, você vai receber *missões simples durante as Lives de Aquecimento da Black November da Saúde Vitalícia*.

Cada missão vai te aproximar mais do *equilíbrio, da leveza e da vitalidade que o seu corpo merece.* 🀄

*Veja como participar:*

1. Compartilhe suas missões no Instagram Stories e marque *@mestre_ye*;
2. Convide amigos e familiares para o evento através do seu link único`;

        const message2 = `Para aumentar suas chances de ganhar o *SUPER COMBO Vitalício do Mestre Ye*, compartilhe o link abaixo com o máximo de amigos e familiares.

Cada pessoa que se inscrever através do seu link único aumenta suas chances de ser o grande vencedor ou vencedrora!

*Seu link de compartilhamento*:
${referralLink}

Compartilhe vitalidade. Inspire transformação`;

        // Mensagem 1
        console.log(`📤 Enviando 1/2...`);
        const response1 = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: phoneForUnnichat,
            messageText: message1
          })
        });

        const data1 = await response1.json();
        if (data1.code && data1.code !== '200') {
          throw new Error(`Msg 1: ${data1.message || 'Erro'}`);
        }

        results.messages_sent++;
        console.log(`✅ 1/2 enviada`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_MESSAGES));

        // Mensagem 2
        console.log(`📤 Enviando 2/2...`);
        const response2 = await fetch(`${UNNICHAT_API_URL}/meta/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${UNNICHAT_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone: phoneForUnnichat,
            messageText: message2
          })
        });

        const data2 = await response2.json();
        if (data2.code && data2.code !== '200') {
          throw new Error(`Msg 2: ${data2.message || 'Erro'}`);
        }

        results.messages_sent++;
        console.log(`✅ 2/2 enviada`);

        // Log no banco
        await supabase.from('whatsapp_logs').insert([
          {
            lead_id: lead.id,
            phone: lead.celular,
            status: 'bulk_referral_sent',
            metadata: { referral_link: referralLink, message: 1 },
            sent_at: new Date().toISOString()
          },
          {
            lead_id: lead.id,
            phone: lead.celular,
            status: 'bulk_referral_sent',
            metadata: { referral_link: referralLink, message: 2 },
            sent_at: new Date().toISOString()
          }
        ]);

        results.success++;
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_LEADS));

      } catch (error) {
        results.failed++;
        results.errors.push({
          lead_id: lead.id,
          nome: lead.nome,
          telefone: lead.celular,
          error: error.message
        });
        console.error(`❌ Erro:`, error.message);
      }
    }

    console.log('\n========================================');
    console.log(`✅ Sucesso: ${results.success} | ❌ Falhas: ${results.failed}`);
    console.log('========================================\n');

    res.json(results);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    res.status(500).json({ 
      error: 'Erro ao processar',
      details: error.message 
    });
  }
});

// ========================================
// ===== ROTA (SERVER-LOCAL): GERAR LINK COMPARTILHAMENTO =====
// Reusa o handler serverless localmente para facilitar testes (mesma assinatura)
app.options('/api/referral-link', (req, res) => require('./api/referral-link')(req, res));
app.post('/api/referral-link', (req, res) => require('./api/referral-link')(req, res));

// ===== ROTAS DO DASHBOARD =====
// Dashboard foi movido para projeto separado
// const dashboardHandler = require('./api/dashboard');
// app.get('/dashboard', (req, res) => dashboardHandler(req, res));
// app.get('/api/dashboard', (req, res) => dashboardHandler(req, res));
// app.get('/api/dashboard/metrics', (req, res) => { req.query.action = 'metrics'; dashboardHandler(req, res); });
// app.post('/api/dashboard/metrics', (req, res) => { req.query.action = 'metrics'; dashboardHandler(req, res); });
// app.get('/api/dashboard/alerts', (req, res) => { req.query.action = 'alerts'; dashboardHandler(req, res); });
// app.post('/api/dashboard/alerts', (req, res) => { req.query.action = 'alerts'; dashboardHandler(req, res); });

// ========================================
// INICIAR SERVIDOR LOCAL
// ========================================
// 📊 ESTATÍSTICAS:
// - ~1030 linhas de código
// - 13 rotas principais duplicadas dos handlers serverless
// - Usado por: npm run api:test, npm run api:prod
// - Scripts de automação (desafio-envio-lotes.js, etc) usam esta API local
//
// 💡 OTIMIZAÇÃO FUTURA:
// - Considerar refatorar para usar require('./api/rota') onde possível
// - Isso reduziria duplicação mas manteria flexibilidade local
// ========================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('\n🚀 =========================================');
  console.log('   API Quiz MTC rodando LOCAL!');
  console.log(`   http://localhost:${PORT}`);
  console.log('   ');
  console.log('   ⚠️  Modo: DESENVOLVIMENTO (não usado em produção)');
  console.log('   ');
  console.log('   Rotas disponíveis:');
  console.log('   • POST /api/submit (Quiz)');
  console.log('   • POST /api/referral-link (Link de compartilhamento)');
  console.log('   • POST /webhook/unnichat/send-diagnostic (Webhook)');
  console.log('   • POST /api/send-bulk-referral (Envio em massa)');
  console.log('   • GET  /api/lead/find (Buscar lead)');
  console.log('   • GET  /api/leads/search (Buscar múltiplos)');
  console.log('   • POST /api/whatsapp/send (Enviar WhatsApp)');
  console.log('=========================================\n');
});

