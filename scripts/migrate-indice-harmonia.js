/**
 * Script de migração: Calcula indice_harmonia para leads existentes
 *
 * Fórmula:
 * Harmonia = 100 - (Concentração + Intensidade + Cronicidade)
 * - Concentração: quanto mais concentrado em um elemento, mais desequilibrado (0-40)
 * - Intensidade: sintomas mais intensos = mais desequilíbrio (0-30)
 * - Cronicidade: mais urgência = mais desequilíbrio (0-30)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_API_KEY
);

function calcularIndiceHarmonia(contagem, intensidade, urgencia) {
  let harmonia = 100;

  // 1. Concentração Elementar (desconta 0-40 pontos)
  const valores = Object.values(contagem || {});
  const total = valores.reduce((a, b) => a + b, 0);

  if (total > 0) {
    const max = Math.max(...valores);
    const concentracao = (max / total) * 40;
    harmonia -= concentracao;
  }

  // 2. Intensidade dos Sintomas (desconta 0-30 pontos)
  const descontoIntensidade = ((intensidade || 3) / 5) * 30;
  harmonia -= descontoIntensidade;

  // 3. Cronicidade/Urgência (desconta 0-30 pontos)
  const descontoCronicidade = ((urgencia || 3) / 5) * 30;
  harmonia -= descontoCronicidade;

  return Math.max(0, Math.min(100, Math.round(harmonia)));
}

async function migrarIndiceHarmonia() {
  console.log('🔄 Iniciando migração do índice de harmonia...\n');

  // Buscar leads sem indice_harmonia ou com valor null
  const { data: leads, error } = await supabase
    .from('quiz_leads')
    .select('id, nome, contagem_elementos, intensidade_calculada, urgencia_calculada, indice_harmonia')
    .is('indice_harmonia', null)
    .limit(500);

  if (error) {
    console.error('❌ Erro ao buscar leads:', error.message);
    return;
  }

  console.log(`📊 Encontrados ${leads.length} leads para atualizar\n`);

  let atualizados = 0;
  let erros = 0;

  for (const lead of leads) {
    const indiceHarmonia = calcularIndiceHarmonia(
      lead.contagem_elementos,
      lead.intensidade_calculada,
      lead.urgencia_calculada
    );

    const { error: updateError } = await supabase
      .from('quiz_leads')
      .update({ indice_harmonia: indiceHarmonia })
      .eq('id', lead.id);

    if (updateError) {
      console.error(`   ❌ Erro em ${lead.nome}: ${updateError.message}`);
      erros++;
    } else {
      console.log(`   ✅ ${lead.nome}: harmonia = ${indiceHarmonia}`);
      atualizados++;
    }
  }

  console.log('\n========================================');
  console.log(`✅ Atualizados: ${atualizados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log('========================================');
}

migrarIndiceHarmonia();
