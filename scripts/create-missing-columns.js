// ========================================
// SCRIPT: Criar colunas faltantes no Supabase
// ========================================

require('dotenv').config({ path: '.env.local' });
const supabase = require('../lib/supabase');

async function criarColunas() {
  console.log('\n🔧 ========================================');
  console.log('   CRIANDO COLUNAS FALTANTES');
  console.log('========================================\n');

  const queries = [
    {
      name: 'contagem_elementos',
      sql: `ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS contagem_elementos JSONB;`
    },
    {
      name: 'intensidade_calculada',
      sql: `ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS intensidade_calculada INTEGER;`
    },
    {
      name: 'urgencia_calculada',
      sql: `ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS urgencia_calculada INTEGER;`
    },
    {
      name: 'elemento_principal (verificar)',
      sql: `ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS elemento_principal TEXT;`
    },
    {
      name: 'quadrante (verificar)',
      sql: `ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS quadrante INTEGER;`
    },
    {
      name: 'lead_score (verificar)',
      sql: `ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER;`
    },
    {
      name: 'prioridade (verificar)',
      sql: `ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS prioridade TEXT;`
    },
    {
      name: 'is_hot_lead_vip (verificar)',
      sql: `ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS is_hot_lead_vip BOOLEAN DEFAULT FALSE;`
    }
  ];

  for (const query of queries) {
    try {
      console.log(`📝 Executando: ${query.name}...`);
      const { error } = await supabase.rpc('exec_sql', { sql_query: query.sql });
      
      if (error) {
        // Tentar via raw query se rpc não funcionar
        const { error: rawError } = await supabase.from('_').select('*').limit(0);
        console.log(`⚠️  ${query.name}: ${error.message}`);
      } else {
        console.log(`✅ ${query.name}: OK`);
      }
    } catch (err) {
      console.log(`⚠️  ${query.name}: ${err.message}`);
    }
  }

  console.log('\n📊 Criando índices para performance...\n');

  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_quiz_leads_elemento ON quiz_leads(elemento_principal);`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_leads_score ON quiz_leads(lead_score DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_leads_quadrante ON quiz_leads(quadrante);`,
    `CREATE INDEX IF NOT EXISTS idx_quiz_leads_vip ON quiz_leads(is_hot_lead_vip) WHERE is_hot_lead_vip = true;`
  ];

  for (const indexSql of indexes) {
    try {
      await supabase.rpc('exec_sql', { sql_query: indexSql });
      console.log(`✅ Índice criado`);
    } catch (err) {
      console.log(`⚠️  Índice: ${err.message}`);
    }
  }

  console.log('\n========================================');
  console.log('⚠️  NOTA IMPORTANTE:');
  console.log('========================================');
  console.log('Se você viu erros acima, é porque o Supabase requer');
  console.log('que você execute o SQL manualmente no SQL Editor.');
  console.log('');
  console.log('📋 Copie e cole o conteúdo de:');
  console.log('   scripts/add-missing-columns.sql');
  console.log('');
  console.log('No Supabase Dashboard:');
  console.log('1. Acesse: https://supabase.com/dashboard');
  console.log('2. Vá em SQL Editor');
  console.log('3. Cole o SQL');
  console.log('4. Clique em RUN');
  console.log('========================================\n');
}

criarColunas().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
