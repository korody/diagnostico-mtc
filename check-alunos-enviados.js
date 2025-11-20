// check-alunos-enviados.js
// Verifica quantos alunos já receberam áudio hoje

const { createClient } = require('@supabase/supabase-js');
const { TAGS } = require('./lib/tags');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
  console.log('\n📊 Verificando envios de áudio para alunos...\n');

  // Contar alunos com tag de áudio enviado
  const { data: alunosEnviados, error } = await supabase
    .from('quiz_leads')
    .select('id, nome, celular, elemento_principal, lead_score, whatsapp_status, status_tags, updated_at')
    .eq('is_aluno', true)
    .or(`status_tags.cs.{${TAGS.AUDIO_ENVIADO}},status_tags.cs.{${TAGS.AUDIO_AUTOMACAO}}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log(`✅ Total de alunos com áudio enviado: ${alunosEnviados.length}\n`);

  // Filtrar por hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const enviosHoje = alunosEnviados.filter(lead => {
    const updated = new Date(lead.updated_at);
    return updated >= hoje;
  });

  console.log(`📅 Enviados HOJE (${hoje.toLocaleDateString('pt-BR')}): ${enviosHoje.length}\n`);

  if (enviosHoje.length > 0) {
    console.log('Últimos 10 enviados hoje:');
    enviosHoje.slice(0, 10).forEach((lead, i) => {
      const hora = new Date(lead.updated_at).toLocaleTimeString('pt-BR');
      console.log(`   ${i + 1}. ${lead.nome} - ${lead.elemento_principal} (Score: ${lead.lead_score}) às ${hora}`);
    });
  }

  // Estatísticas por score
  if (enviosHoje.length > 0) {
    const scores = enviosHoje.map(l => l.lead_score || 0);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);

    console.log(`\n📈 Estatísticas dos envios de hoje:`);
    console.log(`   Score máximo: ${maxScore}`);
    console.log(`   Score mínimo: ${minScore}`);
    console.log(`   Score médio: ${avgScore}`);
  }

  // Total geral
  console.log(`\n📦 TOTAL GERAL: ${alunosEnviados.length} alunos com áudio enviado`);
  console.log(`🎯 Enviados hoje: ${enviosHoje.length}\n`);
}

main().catch(console.error);
