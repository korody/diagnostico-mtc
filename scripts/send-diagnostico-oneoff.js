// scripts/send-diagnostico-oneoff.js
// Busca lead por telefone e tenta enviar diagnóstico direto; se falhar, aciona gatilho.

const sup = require('../lib/supabase');
const phoneLib = require('../lib/phone');
const unni = require('../lib/unnichat');

(async function main(){
  try{
    const target = process.argv[2] || '5511999178629';
    console.log('\n🔎 Iniciando busca e envio para:', target);

    const norm = phoneLib.normalizePhone(target);
    console.log('🔎 Normalized:', norm);

    // 1) Buscar por celular exato
    let { data, error } = await sup.from('quiz_leads').select('*').eq('celular', norm).limit(1);
    let lead = data && data.length ? data[0] : null;

    // 2) fallback last 9 digits
    if (!lead) {
      const last9 = norm.slice(-9);
      const { data: rows } = await sup.from('quiz_leads').select('*').ilike('celular', `%${last9}`).limit(1);
      lead = rows && rows.length ? rows[0] : null;
    }

    // 3) fallback name search (Elenice)
    if (!lead) {
      const { data: rows } = await sup.from('quiz_leads').select('*').ilike('nome','%Elenice%').limit(1);
      lead = rows && rows.length ? rows[0] : null;
    }

    if (!lead) {
      console.error('❌ Lead não encontrado para o telefone/nome fornecido. Saindo.');
      process.exit(0);
    }

    console.log('✅ Lead encontrado:');
    console.log(JSON.stringify({ id: lead.id, nome: lead.nome, celular: lead.celular, email: lead.email, whatsapp_status: lead.whatsapp_status }, null, 2));

    const phoneForUnni = phoneLib.formatPhoneForUnnichat(lead.celular || norm);
    console.log('📲 phoneForUnnichat:', phoneForUnni);

    // Tentar atualizar contato
    try{
      console.log('\n🔁 Atualizando contato no Unnichat...');
      const up = await unni.updateContact(lead.nome, phoneForUnni, lead.email || null, ['SIM-DIAGNOSTICO']);
      console.log('updateContact response:', JSON.stringify(up, null, 2));
    }catch(e){
      console.warn('⚠️ updateContact erro:', e.message);
    }

    // Preparar mensagem
    const message = (lead.diagnostico_completo || lead.diagnostico || (`Olá ${lead.nome}, seu diagnóstico está pronto. Posso enviar os resultados agora?`));

    try{
      console.log('\n✉️ Tentando enviar diagnóstico direto via Unnichat...');
      const res = await unni.sendMessage(phoneForUnni, message);
      console.log('✅ sendMessage result:', JSON.stringify(res, null, 2));

      // Atualizar DB e logs
      await sup.from('quiz_leads').update({ whatsapp_status:'resultados_enviados', whatsapp_sent_at:new Date().toISOString(), whatsapp_attempts:(lead.whatsapp_attempts||0)+1 }).eq('id',lead.id);
  await sup.from('whatsapp_logs').insert({ lead_id:lead.id, phone:lead.celular, status:'resultados_enviados', metadata:{ method:'direct_send', unnichat_response: res, logged_at_iso: new Date().toISOString(), logged_at_epoch: Date.now() }, sent_at:new Date().toISOString() });

      console.log('\n🎯 Diagnóstico enviado direto e logs atualizados.');
      process.exit(0);

    }catch(err){
      console.error('\n❌ Erro ao enviar direto:', err.message );
      const text = (err.message||'').toLowerCase();
      if (text.includes('window is closed') || text.includes('contact not found')){
        console.log('\n➡️ Fallback: acionando gatilho de automação...');
        const GATILHO = process.env.UNNICHAT_GATILHO_URL;
        if (!GATILHO){
          console.error('❌ UNNICHAT_GATILHO_URL não está configurado no .env.local');
          process.exit(1);
        }
        const leadData = { name: lead.nome, email: lead.email || `${lead.celular}@placeholder.com`, phone: phoneForUnni };
        const r = await fetch(GATILHO, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(leadData) });
        let jr; try{ jr = await r.json(); }catch(_){ jr = { raw: await r.text() }; }
        console.log('📥 Resposta do gatilho:', JSON.stringify(jr, null, 2));

        await sup.from('quiz_leads').update({ whatsapp_status:'template_enviado', whatsapp_sent_at:new Date().toISOString(), whatsapp_attempts:(lead.whatsapp_attempts||0)+1 }).eq('id',lead.id);
  await sup.from('whatsapp_logs').insert({ lead_id:lead.id, phone:lead.celular, status:'gatilho_enviado', metadata:{ gatilho_response: jr, logged_at_iso: new Date().toISOString(), logged_at_epoch: Date.now() }, sent_at:new Date().toISOString() });

        console.log('\n✅ Gatilho acionado e logs atualizados.');
        process.exit(0);
      } else {
        console.error('❌ Erro inesperado ao enviar:', err.message);
        process.exit(1);
      }
    }

  }catch(e){
    console.error('Erro fatal:', e.message, e.stack);
    process.exit(1);
  }
})();
