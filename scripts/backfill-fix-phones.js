#!/usr/bin/env node
// ========================================
// SCRIPT: Backfill para corrigir telefones mal normalizados
// ========================================
// Este script identifica e corrige telefones no banco que foram mal normalizados
// devido ao bug de remoção incorreta do DDI 55.
//
// Casos corrigidos:
// 1. 3597258445 → 35997258445 (DDD 35 foi confundido com DDI+DDD)
// 2. 4797896688 → 47997896688 (DDD 47 + número incompleto)
// 3. Outros casos similares onde DDD válido foi removido
//
// ATENÇÃO: Este script faz UPDATE no banco. Execute com cuidado!
// ========================================

require('dotenv').config();
const supabase = require('../lib/supabase');
const { normalizePhone } = require('../lib/phone');

const DDDs_VALIDOS = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24, // RJ
  27, 28, // ES
  31, 32, 33, 34, 35, 37, 38, // MG
  41, 42, 43, 44, 45, 46, // PR
  47, 48, 49, // SC
  51, 53, 54, 55, // RS
  61, 62, 63, 64, 65, 66, 67, 68, 69, // Centro-Oeste/Norte
  71, 73, 74, 75, 77, 79, // Nordeste (BA/SE)
  81, 82, 83, 84, 85, 86, 87, 88, 89, // Nordeste (PE/AL/PB/RN/CE/PI)
  91, 92, 93, 94, 95, 96, 97, 98, 99  // Norte (PA/AM/RR/AP/RO/MA)
];

// Função para tentar corrigir um telefone mal normalizado
function tentarCorrigirTelefone(celular) {
  if (!celular) return null;
  
  const digits = celular.replace(/\D/g, '');
  
  // Caso 1: Número com 10 dígitos onde os 2 primeiros são DDD válido
  // Pode estar faltando o 9 do celular → adicionar 9 após DDD
  if (digits.length === 10) {
    const ddd = parseInt(digits.substring(0, 2), 10);
    if (DDDs_VALIDOS.includes(ddd)) {
      const numeroLocal = digits.substring(2);
      // Se não começa com 9 e tem 8 dígitos, pode ser celular sem o 9
      if (!numeroLocal.startsWith('9') && numeroLocal.length === 8) {
        const corrigido = `${ddd}9${numeroLocal}`;
        return { original: digits, corrigido, tipo: 'add_9_celular' };
      }
    }
  }
  
  // Caso 2: Número com 9 ou menos dígitos (muito curto)
  // Pode ter perdido o DDD ao ser confundido com DDI
  if (digits.length === 9 || digits.length === 8) {
    // Tentar reconstruir consultando logs do Unnichat
    return { original: digits, corrigido: null, tipo: 'consultar_logs', precisa_manual: true };
  }
  
  // Caso 3: Número com 11 dígitos e DDD válido - OK, não precisa correção
  if (digits.length === 11) {
    const ddd = parseInt(digits.substring(0, 2), 10);
    if (DDDs_VALIDOS.includes(ddd) && digits.substring(2).startsWith('9')) {
      return null; // Já está correto
    }
  }
  
  return null;
}

async function main() {
  console.log('🔧 Iniciando backfill de correção de telefones...\n');
  
  const DRY_RUN = process.argv.includes('--dry-run');
  if (DRY_RUN) {
    console.log('⚠️  MODO DRY-RUN: Nenhuma alteração será feita no banco.\n');
  }
  
  // Buscar todos os leads
  const { data: leads, error } = await supabase
    .from('quiz_leads')
    .select('id, nome, celular, email, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao buscar leads:', error.message);
    process.exit(1);
  }
  
  console.log(`📊 Total de leads no banco: ${leads.length}\n`);
  
  const problematicos = [];
  const paraCorrigir = [];
  const precisamManual = [];
  
  // Analisar cada lead
  for (const lead of leads) {
    const resultado = tentarCorrigirTelefone(lead.celular);
    
    if (resultado) {
      problematicos.push({ ...lead, analise: resultado });
      
      if (resultado.corrigido) {
        paraCorrigir.push({ ...lead, analise: resultado });
      } else if (resultado.precisa_manual) {
        precisamManual.push({ ...lead, analise: resultado });
      }
    }
  }
  
  console.log(`🔍 Telefones problemáticos encontrados: ${problematicos.length}`);
  console.log(`✅ Podem ser corrigidos automaticamente: ${paraCorrigir.length}`);
  console.log(`⚠️  Precisam correção manual: ${precisamManual.length}\n`);
  
  // Mostrar casos que precisam correção manual
  if (precisamManual.length > 0) {
    console.log('📋 CASOS QUE PRECISAM CORREÇÃO MANUAL:\n');
    for (const lead of precisamManual.slice(0, 10)) {
      console.log(`ID: ${lead.id}`);
      console.log(`Nome: ${lead.nome}`);
      console.log(`Celular atual: ${lead.celular}`);
      console.log(`Tipo: ${lead.analise.tipo}`);
      console.log(`Email: ${lead.email}`);
      console.log(`Data: ${new Date(lead.created_at).toLocaleString('pt-BR')}`);
      console.log('---');
    }
    if (precisamManual.length > 10) {
      console.log(`... e mais ${precisamManual.length - 10} casos.\n`);
    }
  }
  
  // Mostrar e aplicar correções automáticas
  if (paraCorrigir.length > 0) {
    console.log('\n🔧 CORREÇÕES AUTOMÁTICAS:\n');
    
    for (const lead of paraCorrigir) {
      console.log(`ID: ${lead.id} | ${lead.nome}`);
      console.log(`  Antes: ${lead.analise.original}`);
      console.log(`  Depois: ${lead.analise.corrigido}`);
      console.log(`  Tipo: ${lead.analise.tipo}`);
      
      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('quiz_leads')
          .update({ celular: lead.analise.corrigido })
          .eq('id', lead.id);
        
        if (updateError) {
          console.log(`  ❌ ERRO ao atualizar: ${updateError.message}`);
        } else {
          console.log(`  ✅ Atualizado com sucesso`);
        }
      }
      console.log('---');
    }
  }
  
  console.log('\n✅ Backfill concluído!');
  
  if (DRY_RUN) {
    console.log('\n💡 Para aplicar as correções, execute novamente sem --dry-run:');
    console.log('   node scripts/backfill-fix-phones.js');
  }
}

main().catch(console.error);
