// ========================================
// SUPABASE CLIENT - Singleton
// Reutilizar em todos os handlers serverless
// ========================================

const { createClient } = require('@supabase/supabase-js');

// Este módulo só roda no servidor (handlers em api/). Usa a chave secreta: as tabelas do quiz
// (quiz_leads, whatsapp_logs) ficam com RLS e não aceitam mais a chave pública.
// Sem a secreta, cai na pública só para não derrubar o handler — e avisa no log.
let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SECRET_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseKey) {
  console.warn('⚠️  SUPABASE_SECRET_API_KEY ausente: usando a chave pública, que o RLS bloqueia em quiz_leads/whatsapp_logs.');
  supabaseKey = process.env.SUPABASE_PUBLIC_KEY || process.env.SUPABASE_KEY;
}

if ((!supabaseUrl || !supabaseKey) && (process.env.REACT_APP_SUPABASE_URL || process.env.REACT_APP_SUPABASE_KEY)) {
  console.warn('⚠️  Aviso: usando fallback REACT_APP_SUPABASE_* (migre para SUPABASE_URL/SUPABASE_PUBLIC_KEY).');
  supabaseUrl = supabaseUrl || process.env.REACT_APP_SUPABASE_URL;
  supabaseKey = supabaseKey || process.env.REACT_APP_SUPABASE_KEY;
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_PUBLIC_KEY (ou SUPABASE_KEY) são obrigatórias!');
  console.error('   SUPABASE_URL presente:', !!supabaseUrl);
  console.error('   SUPABASE_PUBLIC_KEY presente:', !!supabaseKey);
  
  // Não fazer throw aqui para evitar crash do módulo
  // Em vez disso, retornar null e deixar cada handler decidir
  module.exports = null;
} else {
  // Cliente singleton anon - reutilizado entre invocações (warm starts)
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Cliente admin (para criar usuários, operações privilegiadas)
  // Requer SUPABASE_SECRET_API_KEY (preferido) ou SUPABASE_SERVICE_ROLE_KEY (legacy)
  let supabaseAdmin = null;
  const supabaseServiceKey = process.env.SUPABASE_SECRET_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const keyType = process.env.SUPABASE_SECRET_API_KEY ? 'SUPABASE_SECRET_API_KEY (✅ recomendado)' : 'SUPABASE_SERVICE_ROLE_KEY (⚠️ migrar para Secret API Key)';
    console.log(`✅ Admin client criado com ${keyType}`);
  } else {
    console.warn('⚠️  SUPABASE_SECRET_API_KEY ou SUPABASE_SERVICE_ROLE_KEY não definida - auto-signup desabilitado');
  }
  
  module.exports = supabase;
  module.exports.admin = supabaseAdmin;
}
