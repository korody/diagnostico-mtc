// Script de higienização dos telefones na tabela quiz_leads
// - Normaliza celular removendo espaços, símbolos, DDI 55 duplicado, zero à esquerda
// - Atualiza somente se o valor mudar e for telefone BR válido (10 ou 11 dígitos)
// - DRY_RUN=1 (padrão) apenas mostra o que seria alterado
// - LIMITE opcional para processar apenas N registros

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { normalizePhone, isValidBrazilianPhone } = require('./lib/phone');

const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.local';
require('dotenv').config({ path: path.join(__dirname, envFile) });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL/SUPABASE_KEY não configurados no', envFile);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DRY_RUN = process.env.DRY_RUN !== '0';
const LIMITE = process.env.LIMITE ? parseInt(process.env.LIMITE, 10) : null;

(async () => {
  console.log('\n🧹 ========================================');
  console.log('   NORMALIZAR TELEFONES (quiz_leads)');
  console.log('========================================');
  console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 TESTE');
  console.log('🧪 DRY_RUN:', DRY_RUN ? 'ATIVO (sem atualizar DB)' : 'DESATIVADO (vai atualizar)');
  if (LIMITE) console.log('🔒 LIMITE:', LIMITE);
  console.log('========================================\n');

  // Buscar todos os leads com celular não nulo (paginações de 1000)
  const PAGE_SIZE = 1000;
  let leads = [];
  let offset = 0;
  while (true) {
    const { data: page, error: pageErr } = await supabase
      .from('quiz_leads')
      .select('id, nome, celular, email, updated_at')
      .not('celular', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1);

    if (pageErr) {
      console.error('❌ Erro ao buscar leads:', pageErr.message);
      process.exit(1);
    }

    if (!page || page.length === 0) break;
    leads.push(...page);
    if (LIMITE && leads.length >= LIMITE) {
      leads = leads.slice(0, LIMITE);
      break;
    }
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  let total = leads.length;
  let toUpdate = [];
  let invalid = [];

  for (const lead of leads) {
    const original = (lead.celular || '').toString();
    const normalized = normalizePhone(original);

    if (!normalized || !isValidBrazilianPhone(normalized)) {
      if (original && original !== normalized) {
        invalid.push({ id: lead.id, nome: lead.nome, from: original, to: normalized });
      }
      continue;
    }

    if (normalized !== original) {
      toUpdate.push({ id: lead.id, nome: lead.nome, from: original, to: normalized });
    }
  }

  console.log(`📊 Leads analisados: ${total}`);
  console.log(`🛠️ Telefones a corrigir: ${toUpdate.length}`);
  console.log(`⚠️ Telefones inválidos após normalizar: ${invalid.length}`);

  if (toUpdate.length > 0) {
    console.log('\n📋 Primeiros 10 a corrigir:');
    toUpdate.slice(0, 10).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.nome} | ${r.from} -> ${r.to}`);
    });
  }

  if (DRY_RUN) {
    console.log('\n🧪 DRY_RUN ativo: nenhuma atualização foi aplicada.');
    process.exit(0);
  }

  // Aplicar atualizações uma a uma (mais seguro com restrições NOT NULL)
  let success = 0, fail = 0;
  for (const item of toUpdate) {
    const { error: upErr } = await supabase
      .from('quiz_leads')
      .update({ celular: item.to, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (upErr) {
      fail++;
      console.error('❌ Erro ao atualizar id', item.id, upErr.message);
    } else {
      success++;
      if (success % 25 === 0) {
        console.log(`✅ Atualizado: ${success}/${toUpdate.length}`);
      }
    }
  }

  console.log('\n========================================');
  console.log(`✅ Corrigidos: ${success} | ❌ Falhas: ${fail}`);
  console.log('========================================\n');
  process.exit(0);
})();
