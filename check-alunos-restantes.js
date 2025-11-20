require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');
const { TAGS } = require('./lib/tags');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

(async () => {
  try {
    // Buscar alunos não-BNY2 que ainda NÃO receberam áudio (verificando tags)
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('id, status_tags')
      .eq('is_aluno', true)
      .eq('is_aluno_bny2', false)
      .not('status_tags', 'cs', `{${TAGS.AUDIO_ENVIADO}}`)
      .not('status_tags', 'cs', `{${TAGS.AUDIO_AUTOMACAO}}`);

    if (error) {
      console.error('Erro:', error);
      return;
    }

    const total = data.length;
    const porTags = data.reduce((acc, lead) => {
      const tags = (lead.status_tags || []).join(', ') || 'sem_tags';
      acc[tags] = (acc[tags] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📊 ALUNOS NÃO-BNY2 RESTANTES (sem automação)\n');
    console.log(`✅ Total elegíveis: ${total}\n`);
    console.log('📋 Por tags:');
    Object.entries(porTags)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tags, count]) => {
        console.log(`   ${tags}: ${count}`);
      });
    
    console.log('\n');
  } catch (err) {
    console.error('Erro:', err);
  }
})();
