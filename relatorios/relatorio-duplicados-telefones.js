// Gera um CSV com agrupamento de duplicados por telefone normalizado
// Saída: relatorios/duplicados-telefones.csv

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { normalizePhone } = require('../lib/phone');

const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.local';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.REACT_APP_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL/SUPABASE_KEY não configurados');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

(async () => {
  console.log('\n🔎 Buscando leads para relatório de duplicados...');

  const PAGE_SIZE = 1000;
  let leads = [];
  let offset = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from('quiz_leads')
      .select('id, nome, email, celular, created_at, updated_at, whatsapp_status')
      .not('celular', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      console.error('❌ Erro ao buscar leads:', error.message);
      process.exit(1);
    }
    if (!page || page.length === 0) break;
    leads.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  console.log(`📊 Leads carregados: ${leads.length}`);

  const map = new Map();
  for (const lead of leads) {
    const norm = normalizePhone(lead.celular || '');
    if (!norm) continue;
    if (!map.has(norm)) map.set(norm, []);
    map.get(norm).push(lead);
  }

  const duplicados = [...map.entries()].filter(([, arr]) => arr.length > 1);
  console.log(`📦 Telefones com duplicidade: ${duplicados.length}`);

  const lines = [];
  lines.push(['normalized_phone','id','nome','email','celular_original','created_at','updated_at','whatsapp_status'].join(','));
  for (const [norm, arr] of duplicados) {
    for (const l of arr) {
      const row = [
        norm,
        l.id,
        (l.nome || '').replaceAll(',', ' ').replaceAll('\n',' '),
        (l.email || '').replaceAll(',', ' ').replaceAll('\n',' '),
        (l.celular || '').replaceAll(',', ' ').replaceAll('\n',' '),
        l.created_at || '',
        l.updated_at || '',
        l.whatsapp_status || ''
      ];
      lines.push(row.join(','));
    }
  }

  const outPath = path.join(__dirname, 'duplicados-telefones.csv');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
  console.log('✅ Relatório gerado em:', outPath);
})();
