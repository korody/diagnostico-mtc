// Script para buscar lead diretamente no Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function main() {
  const phone = process.argv[2] || '11998457676';
  
  console.log('🔍 Buscando telefone:', phone);
  
  // Busca exata
  const { data: exact } = await supabase
    .from('quiz_leads')
    .select('id, nome, celular, email')
    .eq('celular', phone)
    .limit(1);
  
  console.log('\n1️⃣ Busca exata:', exact?.length || 0, 'resultados');
  if (exact?.length) console.log(exact);
  
  // Busca pelos últimos 9
  if (phone.length >= 9) {
    const last9 = phone.slice(-9);
    const { data: partial9 } = await supabase
      .from('quiz_leads')
      .select('id, nome, celular, email')
      .ilike('celular', `%${last9}%`)
      .limit(5);
    
    console.log('\n2️⃣ Busca últimos 9 dígitos:', partial9?.length || 0, 'resultados');
    if (partial9?.length) console.log(partial9);
  }
  
  // Busca pelos últimos 8
  if (phone.length >= 8) {
    const last8 = phone.slice(-8);
    const { data: partial8 } = await supabase
      .from('quiz_leads')
      .select('id, nome, celular, email')
      .ilike('celular', `%${last8}%`)
      .limit(5);
    
    console.log('\n3️⃣ Busca últimos 8 dígitos:', partial8?.length || 0, 'resultados');
    if (partial8?.length) console.log(partial8);
  }
  
  // Busca qualquer coisa parecida
  const { data: fuzzy } = await supabase
    .from('quiz_leads')
    .select('id, nome, celular, email')
    .ilike('celular', `%98457676%`)
    .limit(5);
  
  console.log('\n4️⃣ Busca fuzzy (últimos dígitos):', fuzzy?.length || 0, 'resultados');
  if (fuzzy?.length) console.log(fuzzy);
}

main().catch(console.error);
