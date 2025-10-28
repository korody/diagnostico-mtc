// scripts/backfill-whatsapp-tags.js
// Backfills whatsapp_tags array with diagnostico_finalizado for all leads and
// maps legacy whatsapp_status to tags (diagnostico_enviado, desafio_enviado)

require('dotenv').config({ path: process.env.NODE_ENV==='production' ? '.env.production' : '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_KEY');
  process.exit(1);
}

const client = createClient(url, key);

function merge(a,b){ const s = new Set([...(a||[]), ...(b||[])]); return Array.from(s); }

async function run(){
  console.log('\n🔧 Backfill whatsapp_tags');
  const PAGE = 1000;
  let from = 0; let total = 0; let updated = 0; let failures = 0;

  // Try to detect column existence quickly (best-effort)
  try {
    await client.from('quiz_leads').select('id, whatsapp_tags').limit(1);
  } catch (e) {
    console.error('❌ Column whatsapp_tags may not exist. Create it first, e.g. ALTER TABLE quiz_leads ADD COLUMN whatsapp_tags text[];');
    process.exit(1);
  }

  // Count
  const { count } = await client.from('quiz_leads').select('*', { head: true, count: 'exact' });
  console.log('Total leads:', count);

  while (from < count) {
    const { data, error } = await client
      .from('quiz_leads')
      .select('id, whatsapp_status, whatsapp_tags')
      .range(from, Math.min(from+PAGE-1, count-1));
    if (error) throw error;

    for (const lead of data) {
      total++;
      const toAdd = ['diagnostico_finalizado'];
      if (lead.whatsapp_status === 'resultados_enviados' || lead.whatsapp_status === 'diagnostico_enviado') {
        toAdd.push('diagnostico_enviado');
      }
      if (lead.whatsapp_status === 'desafio_enviado') {
        toAdd.push('desafio_enviado');
      }
      const updatedTags = merge(lead.whatsapp_tags, toAdd);
      try {
        await client.from('quiz_leads').update({ whatsapp_tags: updatedTags }).eq('id', lead.id);
        updated++;
      } catch (e) {
        failures++;
        console.log('⚠️ Update failed for', lead.id, e.message);
      }
    }
    from += PAGE;
    console.log(`Progress: ${Math.min(from,count)}/${count}`);
  }

  console.log(`\n✅ Done. Updated: ${updated}/${total}, failures: ${failures}`);
}

run().catch(e=>{ console.error(e); process.exit(1); });
