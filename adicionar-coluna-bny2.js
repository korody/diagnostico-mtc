// adicionar-coluna-bny2.js
// Adiciona coluna is_aluno_bny2 no Supabase

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function adicionarColuna() {
  console.log('\n🔧 Adicionando coluna is_aluno_bny2...\n');
  
  try {
    // Verificar se a coluna já existe
    const { data: colunas } = await supabase
      .from('quiz_leads')
      .select('is_aluno_bny2')
      .limit(1);
    
    if (colunas) {
      console.log('✅ Coluna is_aluno_bny2 já existe!\n');
    }
  } catch (error) {
    if (error.message.includes('column') && error.message.includes('does not exist')) {
      console.log('⚠️  Coluna não existe. Precisa executar o SQL manualmente no Supabase Dashboard.\n');
      console.log('SQL a executar:');
      console.log('----------------------------------------');
      console.log('ALTER TABLE quiz_leads ADD COLUMN IF NOT EXISTS is_aluno_bny2 BOOLEAN DEFAULT false;');
      console.log('CREATE INDEX IF NOT EXISTS idx_quiz_leads_is_aluno_bny2 ON quiz_leads(is_aluno_bny2);');
      console.log('----------------------------------------\n');
    } else {
      console.error('❌ Erro:', error.message);
    }
  }
  
  // Tentar criar índice via atualização em massa (workaround)
  console.log('🔄 Inicializando coluna para todos os leads...');
  
  const { error: updateError } = await supabase
    .from('quiz_leads')
    .update({ is_aluno_bny2: false })
    .is('is_aluno_bny2', null);
  
  if (updateError) {
    console.log('⚠️  Não foi possível inicializar via update:', updateError.message);
    console.log('   Execute o SQL manualmente no Supabase Dashboard.\n');
  } else {
    console.log('✅ Coluna inicializada com sucesso!\n');
  }
}

adicionarColuna().catch(console.error);
