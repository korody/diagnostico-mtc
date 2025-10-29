require('dotenv').config({ path: '.env.local' });
const sup = require('../lib/supabase');

(async function(){
  try{
    const leadId = '7e3b77e3-3eef-48cb-a445-7bcda6c1b318';
    const { data: lead, error } = await sup.from('quiz_leads').select('id,nome,email,celular,whatsapp_status').eq('id', leadId).single();
    if (error) {
      console.error('Erro ao buscar lead:', error.message);
      process.exit(1);
    }
    console.log(JSON.stringify({ id: lead.id, nome: lead.nome, email: lead.email, celular: lead.celular }, null, 2));
    process.exit(0);
  }catch(e){
    console.error('Erro fatal:', e.message);
    process.exit(1);
  }
})();
