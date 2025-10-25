// api/lead/buscar.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

module.exports = async (req, res) => {
  const phone = req.query.phone || req.body?.phone;
  
  if (!phone) {
    return res.status(400).json({ 
      success: false, 
      error: 'Telefone não fornecido' 
    });
  }
  
  try {
    // Normalizar telefone (remover +55 e caracteres especiais)
    const phoneClean = phone.replace(/\D/g, '').replace(/^55/, '');
    
    console.log('🔍 Buscando lead com telefone:', phoneClean);
    
    const { data: lead, error } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('celular', phoneClean)
      .single();
    
    if (error || !lead) {
      console.log('❌ Lead não encontrado:', phoneClean);
      return res.status(404).json({ 
        success: false, 
        error: 'Lead não encontrado'
      });
    }
    
    console.log('✅ Lead encontrado:', lead.nome);
    
    res.json({ 
      success: true, 
      lead 
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};