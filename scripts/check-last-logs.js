require('dotenv').config({ path: '.env.production' });
const supabase = require('../lib/supabase');

(async () => {
  const phone = process.argv[2] || '5511998457676';
  const { data: lead } = await supabase.from('quiz_leads').select('*').ilike('celular', `%${phone}%`).maybeSingle();
  if (!lead) {
    console.log('Lead not found');
    process.exit(0);
  }
  console.log('Lead:', { id: lead.id, nome: lead.nome, celular: lead.celular, whatsapp_status: lead.whatsapp_status, whatsapp_sent_at: lead.whatsapp_sent_at });
  const { data: logs } = await supabase
    .from('whatsapp_logs')
    .select('*')
    .eq('lead_id', lead.id)
    .order('sent_at', { ascending: false })
    .limit(5);
  console.log('\nÚltimos logs:');
  for (const l of logs || []) {
    console.log(`- ${l.sent_at} | ${l.status}`);
  }
})();