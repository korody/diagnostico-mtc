// API: Retorna Playbook Comercial para um Lead
const { gerarRelatorioCall } = require('../../lib/playbook-comercial');

module.exports = async (req, res) => {
  try {
    const { leadId, email, phone } = req.query;

    if (!leadId && !email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Informe leadId, email ou phone para buscar o playbook'
      });
    }

    // Importar supabase aqui para evitar problema de inicialização
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Configuração do Supabase não encontrada'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar lead
    let query = supabase
      .from('quiz_leads')
      .select('*');

    if (leadId) {
      query = query.eq('id', leadId);
    } else if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      // Normalizar telefone para busca
      const phoneNormalized = phone.replace(/\D/g, '');
      query = query.eq('celular', phoneNormalized);
    }

    const { data: leads, error } = await query.single();

    if (error || !leads) {
      return res.status(404).json({
        success: false,
        error: 'Lead não encontrado'
      });
    }

    // Verificar se tem perfil comercial
    if (!leads.perfil_comercial) {
      return res.status(400).json({
        success: false,
        error: 'Lead não possui perfil comercial calculado',
        lead: {
          id: leads.id,
          nome: leads.nome,
          email: leads.email
        }
      });
    }

    // Gerar relatório
    const relatorio = gerarRelatorioCall(leads);

    return res.status(200).json({
      success: true,
      lead: {
        id: leads.id,
        nome: leads.nome,
        email: leads.email,
        celular: leads.celular,
        perfil_comercial: leads.perfil_comercial,
        elemento_principal: leads.elemento_principal,
        lead_score: leads.lead_score,
        prioridade: leads.prioridade,
        created_at: leads.created_at
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
};
