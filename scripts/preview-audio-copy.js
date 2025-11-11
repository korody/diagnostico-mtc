// scripts/preview-audio-copy.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });
const { gerarScriptParaLead } = require('../lib/audio-copies');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const arg = process.argv[2];
  let lead;

  if (!arg) {
    // fetch one aluno and one nao-aluno
    const { data: aluno } = await supabase.from('quiz_leads').select('*').eq('is_aluno', true).not('elemento_principal','is',null).limit(1).maybeSingle();
    const { data: nao } = await supabase.from('quiz_leads').select('*').eq('is_aluno', false).not('elemento_principal','is',null).limit(1).maybeSingle();
    console.log('\n=== Aluno (preview) ===');
    console.log(gerarScriptParaLead(aluno));
    console.log('\n=== Não-aluno (preview) ===');
    console.log(gerarScriptParaLead(nao));
    return;
  }

  // If arg provided, try by email or id
  if (/^\d+$/.test(arg)) {
    const { data } = await supabase.from('quiz_leads').select('*').eq('id', Number(arg)).maybeSingle();
    lead = data;
  } else {
    const { data } = await supabase.from('quiz_leads').select('*').ilike('email', arg).maybeSingle();
    lead = data;
  }

  if (!lead) {
    console.error('Lead não encontrado');
    process.exit(1);
  }

  console.log(`\n=== Preview para: ${lead.nome} | is_aluno=${lead.is_aluno} | elemento=${lead.elemento_principal} ===`);
  console.log(gerarScriptParaLead(lead));
}

run().catch(err => { console.error(err); process.exit(1); });
