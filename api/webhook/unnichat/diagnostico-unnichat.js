// api/webhook/unnichat/diagnostico-unnichat.js
// Endpoint para retornar diagnóstico do lead para Unnichat, sem envio direto ao lead

const { createClient } = require('@supabase/supabase-js');
const { normalizePhone } = require('../../../lib/phone');
const { calcularDiagnosticoCompleto } = require('../../../lib/diagnosticos');

// Carregar variáveis de ambiente
require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  const { phone, name, email } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Telefone é obrigatório' });
  }

  try {
    const phoneNormalized = normalizePhone(phone);
    // Buscar lead no Supabase
    const { data: lead, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('celular', phoneNormalized)
      .single();

    if (error || !lead) {
      return res.status(404).json({ success: false, error: 'Lead não encontrado' });
    }

    // Calcular/preparar diagnóstico
    let diagnostico = lead.diagnostico_completo;
    if (!diagnostico) {
      diagnostico = calcularDiagnosticoCompleto(lead);
    }

    // Retornar apenas o campo 'diagnostico' para Unnichat
    return res.status(200).json({ diagnostico });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
