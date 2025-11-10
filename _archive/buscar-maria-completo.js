// buscar-maria-completo.js
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const EMAIL = 'mariaivetef05@gmail.com';
const NOME = 'Maria Ivete';
const TELEFONE = '53999617871';

async function buscarCompleto() {
  console.log('\n🔍 ========================================');
  console.log('   BUSCA COMPLETA NO SUPABASE');
  console.log('========================================\n');
  
  // 1. Buscar por email exato
  console.log('1️⃣  Buscando por email exato...');
  const { data: porEmail } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('email', EMAIL);
  
  console.log(`   Resultados: ${porEmail?.length || 0}`);
  if (porEmail && porEmail.length > 0) {
    porEmail.forEach(lead => {
      console.log(`   ✅ ${lead.nome} - ${lead.celular} - is_aluno: ${lead.is_aluno}`);
    });
  }
  
  // 2. Buscar por email com ILIKE
  console.log('\n2️⃣  Buscando por email (ILIKE)...');
  const { data: porEmailIlike } = await supabase
    .from('quiz_leads')
    .select('*')
    .ilike('email', `%${EMAIL}%`);
  
  console.log(`   Resultados: ${porEmailIlike?.length || 0}`);
  if (porEmailIlike && porEmailIlike.length > 0) {
    porEmailIlike.forEach(lead => {
      console.log(`   ✅ ${lead.nome} - ${lead.email} - is_aluno: ${lead.is_aluno}`);
    });
  }
  
  // 3. Buscar por nome
  console.log('\n3️⃣  Buscando por nome...');
  const { data: porNome } = await supabase
    .from('quiz_leads')
    .select('*')
    .ilike('nome', `%${NOME}%`);
  
  console.log(`   Resultados: ${porNome?.length || 0}`);
  if (porNome && porNome.length > 0) {
    porNome.forEach(lead => {
      console.log(`   ✅ ${lead.nome} - ${lead.email} - ${lead.celular} - is_aluno: ${lead.is_aluno}`);
    });
  }
  
  // 4. Buscar por telefone (com variações)
  console.log('\n4️⃣  Buscando por telefone...');
  const variacoesTelefone = [
    TELEFONE,
    `55${TELEFONE}`,
    `+55${TELEFONE}`,
    `5553999617871`,
    `+5553999617871`
  ];
  
  for (const tel of variacoesTelefone) {
    const { data: porTel } = await supabase
      .from('quiz_leads')
      .select('*')
      .ilike('celular', `%${tel}%`);
    
    if (porTel && porTel.length > 0) {
      console.log(`   ✅ Encontrado com: ${tel}`);
      porTel.forEach(lead => {
        console.log(`      ${lead.nome} - ${lead.email} - ${lead.celular} - is_aluno: ${lead.is_aluno}`);
      });
    }
  }
  
  // 5. Buscar todos com nome Maria Ivete
  console.log('\n5️⃣  Todos os leads com "Maria Ivete"...');
  const { data: todasMarias } = await supabase
    .from('quiz_leads')
    .select('*')
    .or('nome.ilike.%Maria Ivete%,nome.ilike.%Ivete%');
  
  console.log(`   Resultados: ${todasMarias?.length || 0}`);
  if (todasMarias && todasMarias.length > 0) {
    todasMarias.forEach(lead => {
      console.log(`   - ${lead.nome}`);
      console.log(`     Email: ${lead.email}`);
      console.log(`     Tel: ${lead.celular}`);
      console.log(`     is_aluno: ${lead.is_aluno}`);
      console.log(`     whatsapp_status: ${lead.whatsapp_status}`);
      console.log('');
    });
  }
  
  console.log('========================================\n');
}

buscarCompleto().catch(console.error);
