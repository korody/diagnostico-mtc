const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Criar cliente Supabase
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

// Rota de teste (para ver se API está funcionando)
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API do Quiz está funcionando! Use POST /api/quiz/submit' 
  });
});

// Rota principal da API
app.post('/api/quiz/submit', async (req, res) => {
  try {
    console.log('📩 Recebendo dados do quiz...');
    
    const { lead, respostas } = req.body;

    if (!lead || !respostas) {
      console.log('❌ Dados incompletos');
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos' 
      });
    }

    console.log('💾 Salvando no Supabase...');
    
    const { data, error } = await supabase
      .from('quiz_leads')
      .insert({
        nome: lead.NOME,
        email: lead.EMAIL,
        celular: lead.CELULAR,
        respostas: respostas,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Erro Supabase:', error);
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }

    console.log('✅ Dados salvos com sucesso!');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Lead salvo com sucesso!',
      data: data 
    });
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`
  ✅ API rodando em http://localhost:${PORT}
  📡 Endpoints disponíveis:
     - GET  / (teste)
     - POST /api/quiz/submit (salvar quiz)
  `);
});