import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // ✅ CONFIGURAR CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Só aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lead, respostas, diagnostico } = req.body;

    // Salvar no Supabase
    const { data, error } = await supabase
      .from('quiz_leads')
      .insert({
        nome: lead.nome,
        email: lead.email,
        celular: lead.celular,
        respostas: respostas,
        codigo_perfil: diagnostico.codigoPerfil,
        elemento_principal: diagnostico.elementoPrincipal,
        diagnostico_resumo: diagnostico.resumo,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      message: 'Lead salvo com sucesso!',
      data 
    });

  } catch (error) {
    console.error('Erro ao salvar lead:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}