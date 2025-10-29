const { createClient } = require('./lib/supabase');
const supabase = createClient();

async function findLead(phone) {
  const norm = phone.replace(/^55/, '');
  const queries = [norm, phone, norm.slice(-10), norm.slice(-9), norm.slice(-8), norm.slice(-6)];
  for (const val of queries) {
    const pattern = `%${val}%`;
    const { data } = await supabase.from('quiz_leads').select('id, nome, celular, email').ilike('celular', pattern).limit(5);
    if (data && data.length) {
      console.log('Match:', data);
      return;
    }
  }
  console.log('Nenhum lead encontrado para', phone);
}

findLead(process.argv[2] || '5511998955103');
