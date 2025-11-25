// ========================================
// SUPABASE CLIENT - Singleton
// Reutilizar em todos os handlers serverless
// ========================================

const { createClient } = require('@supabase/supabase-js');

// Fonte única canônica: SUPABASE_URL/SUPABASE_KEY.
// Mantemos fallback temporário para REACT_APP_* apenas para compatibilidade,
// mas logamos um aviso para incentivar a migração.
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_KEY;

if ((!supabaseUrl || !supabaseKey) && (process.env.REACT_APP_SUPABASE_URL || process.env.REACT_APP_SUPABASE_KEY)) {
  console.warn('⚠️  Aviso: usando fallback REACT_APP_SUPABASE_* (migre para SUPABASE_URL/SUPABASE_KEY).');
  supabaseUrl = supabaseUrl || process.env.REACT_APP_SUPABASE_URL;
  supabaseKey = supabaseKey || process.env.REACT_APP_SUPABASE_KEY;
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_KEY são obrigatórias!');
  console.error('   SUPABASE_URL presente:', !!supabaseUrl);
  console.error('   SUPABASE_KEY presente:', !!supabaseKey);
  
  // Não fazer throw aqui para evitar crash do módulo
  // Em vez disso, retornar null e deixar cada handler decidir
  module.exports = null;
} else {
  // Cliente singleton anon - reutilizado entre invocações (warm starts)
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Cliente admin (para criar usuários, operações privilegiadas)
  // Requer SUPABASE_SERVICE_ROLE_KEY
  let supabaseAdmin = null;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    console.log('✅ Admin client criado com SUPABASE_SERVICE_ROLE_KEY');
  } else {
    console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY não definida - auto-signup desabilitado');
  }
  
  module.exports = supabase;
  module.exports.admin = supabaseAdmin;
}
