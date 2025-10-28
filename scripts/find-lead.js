#!/usr/bin/env node
// scripts/find-lead.js
// Usage: node scripts/find-lead.js [phone]

require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const phoneArg = process.argv[2] || '351917068586';
const raw = phoneArg.toString().replace(/\D/g, '');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Searching for phone:', phoneArg, 'raw:', raw);

  const results = {};

  // Exact without 55
  const { data: exactNo55, error: e1 } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, whatsapp_status, status_tags, prioridade, created_at, updated_at')
    .eq('celular', raw);
  if (e1) console.error('Error exactNo55', e1.message);
  results.exactNo55 = exactNo55 || [];

  // Exact with 55 prefix
  const with55 = raw.startsWith('55') ? raw : '55' + raw;
  const { data: exact55, error: e2 } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, whatsapp_status, status_tags, prioridade, created_at, updated_at')
    .eq('celular', with55);
  if (e2) console.error('Error exact55', e2.message);
  results.exact55 = exact55 || [];

  // Last 10/9/8 digits
  const last10 = raw.slice(-10);
  const last9 = raw.slice(-9);
  const last8 = raw.slice(-8);

  const { data: by10 } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, whatsapp_status, status_tags, prioridade, created_at, updated_at')
    .ilike('celular', `%${last10}%`)
    .limit(50);
  results.by10 = by10 || [];

  const { data: by9 } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, whatsapp_status, status_tags, prioridade, created_at, updated_at')
    .ilike('celular', `%${last9}%`)
    .limit(50);
  results.by9 = by9 || [];

  const { data: by8 } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, whatsapp_status, status_tags, prioridade, created_at, updated_at')
    .ilike('celular', `%${last8}%`)
    .limit(50);
  results.by8 = by8 || [];

  // Regexp replace exact
  const { data: byRegexp } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, whatsapp_status, status_tags, prioridade, created_at, updated_at')
    .filter('celular', 'eq', raw); // as fallback - simpler

  results.byRegexp = byRegexp || [];

  // whatsapp_logs by phone
  const { data: logs } = await supabase
    .from('whatsapp_logs')
    .select('id, lead_id, phone, event, status, message, metadata, created_at')
    .or(`phone.eq.${raw},phone.eq.${with55}`)
    .order('created_at', { ascending: false })
    .limit(200);
  results.logs = logs || [];

  console.log(JSON.stringify(results, null, 2));
}

run().catch(err => { console.error(err); process.exit(1); });
