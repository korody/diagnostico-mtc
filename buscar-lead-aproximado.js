const supabase = require('./lib/supabase');
const { normalizePhone } = require('./lib/phone');

(async () => {
  const phone = '5511998955103';
  const email = 'rc.shadows@gmail.com';
  const nome = 'Roberto Carlos Alves';
  let lead = null;
  const phoneNorm = normalizePhone(phone);

  // Busca exata
  const { data: exact } = await supabase.from('quiz_leads').select('*').eq('celular', phoneNorm).maybeSingle();
  if (exact) lead = exact;

  // Busca por aproximação (últimos 8 dígitos)
  if (!lead) {
    const { data: partial } = await supabase.from('quiz_leads').select('*').ilike('celular', `%${phoneNorm.slice(-8)}%`).limit(1).maybeSingle();
    if (partial) lead = partial;
  }

  // Busca por email
  if (!lead) {
    const { data: byEmail } = await supabase.from('quiz_leads').select('*').eq('email', email).maybeSingle();
    if (byEmail) lead = byEmail;
  }

  // Busca por nome
  if (!lead) {
    const { data: byName } = await supabase.from('quiz_leads').select('*').ilike('nome', '%Roberto%').limit(1).maybeSingle();
    if (byName) lead = byName;
  }

  console.log(lead ? lead : 'Lead não encontrado');
})();
