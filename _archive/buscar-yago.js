// buscar-yago.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function buscar() {
  const { data, error } = await supabase
    .from('quiz_leads')
    .select('*')
    .ilike('nome', '%Yago%Henrique%');
  
  if (error) console.error(error);
  else {
    console.log(`\nEncontrados: ${data.length}\n`);
    data.forEach(l => {
      console.log(`Nome: ${l.nome}`);
      console.log(`Tel: ${l.celular}`);
      console.log(`Email: ${l.email}`);
      console.log(`Elemento: ${l.elemento_principal}`);
      console.log('');
    });
  }
}

buscar();
