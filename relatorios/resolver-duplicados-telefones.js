// Resolve duplicados por telefone normalizado em quiz_leads
// Regras:
// - Agrupa por normalizePhone(celular)
// - Escolhe 1 titular por grupo (prioridade por status e updated_at)
// - Faz merge de campos não nulos no titular
// - Reatribui logs (whatsapp_logs, whatsapp_messages) dos duplicados ao titular
// - Remove os duplicados
// Variáveis de ambiente:
//   DRY_RUN=1 (padrão) -> só simula
//   NODE_ENV=production para usar .env.production
//   LIMITE_GRUPOS (opcional) -> processa apenas N grupos de duplicados

const { createClient } = require('@supabase/supabase-js');
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
const DRY_RUN = process.env.DRY_RUN !== '0';
const LIMITE_GRUPOS = process.env.LIMITE_GRUPOS ? parseInt(process.env.LIMITE_GRUPOS, 10) : null;

function statusWeight(s) {
  if (s === 'resultados_enviados') return 3;
  if (s === 'template_enviado') return 2;
  if (!s || s === 'AGUARDANDO_CONTATO') return 1;
  return 1;
}

function scoreLead(lead) {
  const wStatus = statusWeight(lead.whatsapp_status);
  const t = new Date(lead.updated_at || lead.created_at || 0).getTime();
  const hasDiag = lead.diagnostico_completo ? 1 : 0;
  return wStatus * 1000000000 + hasDiag * 1000000 + t; // status > diag > recência
}

function isEmpty(v) {
  return v === null || v === undefined || v === '';
}

function mergeLeadData(primary, others) {
  const merged = { ...primary };
  const pickIfEmpty = (field) => {
    if (!isEmpty(merged[field])) return;
    for (const o of others) {
      if (!isEmpty(o[field])) { merged[field] = o[field]; break; }
    }
  };

  const fieldsToMerge = [
    'nome','email','respostas','elemento_principal','codigo_perfil','nome_perfil','arquetipo','emoji',
    'quadrante','diagnostico_resumo','diagnostico_completo','script_abertura','lead_score','prioridade','is_hot_lead_vip'
  ];
  for (const f of fieldsToMerge) pickIfEmpty(f);

  // WhatsApp: pegar o melhor status e a data mais recente
  const all = [primary, ...others];
  merged.whatsapp_status = all.reduce((best, cur) => statusWeight(cur.whatsapp_status) > statusWeight(best) ? cur.whatsapp_status : best, merged.whatsapp_status || null);
  merged.whatsapp_sent_at = all.map(a => a.whatsapp_sent_at).filter(Boolean).sort().slice(-1)[0] || merged.whatsapp_sent_at || null;

  // celular já está normalizado de antemão; não alterar
  return merged;
}

(async () => {
  console.log('\n🧩 ========================================');
  console.log('   RESOLVER DUPLICADOS (telefone normalizado)');
  console.log('========================================');
  console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 TESTE');
  console.log('🧪 DRY_RUN:', DRY_RUN ? 'ATIVO (simulação)' : 'DESATIVADO (aplica)');
  if (LIMITE_GRUPOS) console.log('🔒 LIMITE_GRUPOS:', LIMITE_GRUPOS);
  console.log('========================================\n');

  // Carregar todos os leads
  const PAGE_SIZE = 1000;
  let leads = [];
  let offset = 0;
  while (true) {
    const { data: page, error } = await supabase
      .from('quiz_leads')
      .select('*')
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

  // Agrupar por telefone normalizado
  const map = new Map();
  for (const lead of leads) {
    const norm = normalizePhone(lead.celular || '');
    if (!norm) continue;
    if (!map.has(norm)) map.set(norm, []);
    map.get(norm).push(lead);
  }

  const grupos = [...map.entries()].filter(([, arr]) => arr.length > 1);
  console.log(`📦 Grupos de duplicados: ${grupos.length}`);

  let processed = 0, kept = 0, deleted = 0, updated = 0;

  for (const [norm, arr] of grupos) {
    if (LIMITE_GRUPOS && processed >= LIMITE_GRUPOS) break;
    processed++;
    // escolher titular
    const sorted = [...arr].sort((a,b) => scoreLead(b) - scoreLead(a));
    const titular = sorted[0];
    const duplicados = sorted.slice(1);

    const mergedData = mergeLeadData(titular, duplicados);

    console.log(`\n📱 ${norm}  → manter: ${titular.id} (${titular.nome}) | remover: ${duplicados.map(d=>d.id).join(', ')}`);

    if (!DRY_RUN) {
      // update titular
      const updateObj = {
        nome: mergedData.nome,
        email: mergedData.email,
        respostas: mergedData.respostas,
        elemento_principal: mergedData.elemento_principal,
        codigo_perfil: mergedData.codigo_perfil,
        nome_perfil: mergedData.nome_perfil,
        arquetipo: mergedData.arquetipo,
        emoji: mergedData.emoji,
        quadrante: mergedData.quadrante,
        diagnostico_resumo: mergedData.diagnostico_resumo,
        diagnostico_completo: mergedData.diagnostico_completo,
        script_abertura: mergedData.script_abertura,
        lead_score: mergedData.lead_score,
        prioridade: mergedData.prioridade,
        is_hot_lead_vip: mergedData.is_hot_lead_vip,
        whatsapp_status: mergedData.whatsapp_status,
        whatsapp_sent_at: mergedData.whatsapp_sent_at,
        updated_at: new Date().toISOString()
      };
      const { error: upErr } = await supabase.from('quiz_leads').update(updateObj).eq('id', titular.id);
      if (upErr) {
        console.error('❌ Erro ao atualizar titular', titular.id, upErr.message);
      } else {
        updated++;
      }

      // reatribuir logs e deletar duplicados
      for (const d of duplicados) {
        try {
          await supabase.from('whatsapp_logs').update({ lead_id: titular.id }).eq('lead_id', d.id);
        } catch (e) {
          console.log('⚠️ whatsapp_logs update:', e.message);
        }
        try {
          await supabase.from('whatsapp_messages').update({ lead_id: titular.id }).eq('lead_id', d.id);
        } catch (e) {
          console.log('⚠️ whatsapp_messages update:', e.message);
        }
        const { error: delErr } = await supabase.from('quiz_leads').delete().eq('id', d.id);
        if (delErr) {
          console.error('❌ Erro ao apagar', d.id, delErr.message);
        } else {
          deleted++;
        }
      }
    } else {
      console.log('🧪 DRY_RUN: merge e delete simulados.');
    }
    kept++;
  }

  console.log('\n========================================');
  console.log(`📊 Grupos processados: ${processed}`);
  console.log(`✅ Atualizados (titulares): ${updated}`);
  console.log(`🗑️  Removidos: ${deleted}`);
  console.log(`📌 Mantidos: ${kept}`);
  console.log('========================================\n');
})();
