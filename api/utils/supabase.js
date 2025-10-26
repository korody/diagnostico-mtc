// ========================================
// SUPABASE CLIENT - Singleton
// Reutilizar em todos os handlers serverless
// ========================================

const { createClient } = require('@supabase/supabase-js');

// Suporta tanto REACT_APP_ prefix (frontend) quanto variáveis diretas (backend)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL e SUPABASE_KEY são obrigatórias!');
  throw new Error('Missing Supabase credentials');
}

// Cliente singleton - reutilizado entre invocações (warm starts)
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
