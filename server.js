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

// Funcao para gerar diagnostico completo
function gerarDiagnostico(nome, elemento) {
  const primeiroNome = nome.split(' ')[0];
  const config = diagnosticosData[elemento] || diagnosticosData['BAÇO'];
  return config.diagnostico.replace(/{NOME}/g, primeiroNome);
}

// Funcao para gerar script de abertura para WhatsApp
function gerarScriptAbertura(nome, elemento) {
  const primeiroNome = nome.split(' ')[0];
  const config = diagnosticosData[elemento] || diagnosticosData['BAÇO'];
  return config.script_abertura.replace(/{NOME}/g, primeiroNome);
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API funcionando!' });
});

app.post('/api/quiz/submit', async (req, res) => {
  try {
    const { lead, respostas } = req.body;
    
    console.log('Recebendo quiz de:', lead.NOME);
    
    // Determinar elemento baseado nas respostas
    let elemento = 'BAÇO'; // ✅ COM ACENTO
    if (respostas.P2 && respostas.P2.includes('A')) elemento = 'RIM';
    if (respostas.P2 && respostas.P2.includes('C')) elemento = 'FÍGADO'; // ✅ COM ACENTO
    if (respostas.P2 && respostas.P2.includes('E')) elemento = 'CORAÇÃO'; // ✅ COM ACENTO
    if (respostas.P2 && respostas.P2.includes('F')) elemento = 'PULMÃO'; // ✅ COM ACENTO
    
    const primeiroNome = lead.NOME.split(' ')[0];
    const diagnostico = gerarDiagnostico(primeiroNome, elemento);
    const script = gerarScriptAbertura(primeiroNome, elemento); // ✅ NOME CORRETO
    
    // Calcular scores basicos
    const intensidade = respostas.P1 === 'A' ? 5 : respostas.P1 === 'B' ? 4 : 3;
    const leadScore = intensidade * 15;
    const quadrante = intensidade >= 4 ? 1 : 4;
    
    console.log('Elemento:', elemento, '| Score:', leadScore);
    
    // Salvar no Supabase
    const { data: existe } = await supabase
      .from('quiz_leads')
      .select('id')
      .eq('celular', lead.CELULAR)
      .maybeSingle();
    
    if (existe) {
      await supabase
        .from('quiz_leads')
        .update({
          nome: lead.NOME,
          email: lead.EMAIL,
          respostas: respostas,
          elemento_principal: elemento,
          codigo_perfil: elemento.substring(0,2) + '-' + intensidade,
          diagnostico_resumo: diagnostico,
          lead_score: leadScore,
          quadrante: quadrante,
          script_abertura: script,
          updated_at: new Date().toISOString()
        })
        .eq('celular', lead.CELULAR);
      
      console.log('✅ Lead atualizado!');
    } else {
      await supabase
        .from('quiz_leads')
        .insert({
          nome: lead.NOME,
          email: lead.EMAIL,
          celular: lead.CELULAR,
          respostas: respostas,
          elemento_principal: elemento,
          codigo_perfil: elemento.substring(0,2) + '-' + intensidade,
          diagnostico_resumo: diagnostico,
          lead_score: leadScore,
          quadrante: quadrante,
          script_abertura: script,
          whatsapp_status: 'AGUARDANDO_CONTATO'
        });
      
      console.log('✅ Novo lead inserido!');
    }
    
    return res.json({ 
      success: true,
      message: 'Quiz salvo!',
      diagnostico: { elemento, leadScore, quadrante }
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () => {
  console.log('\n🚀 API rodando em http://localhost:3001\n');
});