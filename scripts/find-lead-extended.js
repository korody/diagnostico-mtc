#!/usr/bin/env node
// scripts/find-lead-extended.js
// Usage: node scripts/find-lead-extended.js [phone] [name]

require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const phoneArg = process.argv[2] || '351917068586';
const nameArg = process.argv[3] || null;
const raw = phoneArg.toString().replace(/\D/g, '');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Extended search for phone:', phoneArg, 'raw:', raw, 'name:', nameArg);

  const results = {};

  // Broader quiz_leads search by name or email
  if (nameArg) {
    const { data: byName } = await supabase
      .from('quiz_leads')
      .select('id, nome, email, celular, whatsapp_status, status_tags, prioridade, created_at, updated_at')
      .ilike('nome', `%${nameArg}%`)
      .limit(200);
    results.byName = byName || [];

    const { data: byEmailLike } = await supabase
      .from('quiz_leads')
      .select('id, nome, email, celular, whatsapp_status, status_tags, prioridade, created_at, updated_at')
      .ilike('email', `%${nameArg}%`)
      .limit(200);
    results.byEmailLike = byEmailLike || [];
  }

  // Broad cellphone LIKE search (anywhere)
  const { data: anyLike } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, whatsapp_status, status_tags, prioridade, created_at, updated_at')
    .ilike('celular', `%${raw}%`)
    .limit(200);
  results.anyLike = anyLike || [];

  // Search whatsapp_logs for phone in phone column OR inside metadata as text
  const { data: logsByPhone } = await supabase
    .from('whatsapp_logs')
    .select('id, lead_id, phone, event, status, message, metadata, created_at')
    .ilike('phone', `%${raw}%`)
    .order('created_at', { ascending: false })
    .limit(200);
  results.logsByPhone = logsByPhone || [];

  // Search metadata text for phone
  const { data: logsByMeta } = await supabase
    .from('whatsapp_logs')
    .select('id, lead_id, phone, event, status, message, metadata, created_at')
    .filter('metadata', 'ilike', `%${raw}%`)
    .order('created_at', { ascending: false })
    .limit(200);
  results.logsByMeta = logsByMeta || [];

  // Search for webhook entries specifically (if metadata contains webhook_payload)
  const { data: logsByWebhookPayload } = await supabase
    .from('whatsapp_logs')
    .select('id, lead_id, phone, event, status, message, metadata, created_at')
    .filter('metadata->webhook_payload->>phone', 'eq', raw)
    .order('created_at', { ascending: false })
    .limit(200);
  results.logsByWebhookPayload = logsByWebhookPayload || [];

  console.log(JSON.stringify(results, null, 2));
}

run().catch(err => { console.error(err); process.exit(1); });
