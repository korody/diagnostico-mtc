/**
 * Script para Remover Leads Duplicados
 * 
 * Remove leads com telefones duplicados, mantendo apenas o mais recente
 * 
 * Uso:
 *   node scripts/remover-duplicados.js --dry-run    # Simula sem deletar
 *   node scripts/remover-duplicados.js --apply      # Remove duplicados
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuração Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

if (!DRY_RUN && !APPLY) {
  console.log('❌ Uso: node scripts/remover-duplicados.js [--dry-run|--apply]');
  console.log('   --dry-run: Simula remoção sem deletar');
  console.log('   --apply:   Remove duplicados do banco (CUIDADO!)');
  process.exit(1);
}

// Estatísticas
const stats = {
  totalLeads: 0,
  telefonesUnicos: 0,
  duplicadosEncontrados: 0,
  duplicadosRemovidos: 0,
  erros: 0
};

const duplicados = [];

/**
 * Busca todos os leads e agrupa por telefone
 */
async function buscarDuplicados() {
  console.log('\n🔄 ========================================');
  console.log(`   REMOÇÃO DE LEADS DUPLICADOS`);
  console.log(`   Modo: ${DRY_RUN ? '🔍 DRY-RUN (simulação)' : '⚠️  APLICAR (produção)'}`);
  console.log('========================================\n');

  // Buscar todos os leads com paginação
  console.log('📊 Buscando todos os leads...');
  
  let allLeads = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data: leads, error } = await supabase
      .from('quiz_leads')
      .select('id, nome, email, celular, created_at')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      process.exit(1);
    }

    allLeads = allLeads.concat(leads);
    hasMore = leads.length === pageSize;
    page++;
    
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  stats.totalLeads = allLeads.length;
  console.log(`✅ ${allLeads.length} leads encontrados\n`);

  // Agrupar leads por telefone
  console.log('🔍 Identificando duplicados...\n');
  
  const telefoneMap = new Map();
  
  for (const lead of allLeads) {
    if (!lead.celular) continue; // Pula leads sem telefone
    
    if (!telefoneMap.has(lead.celular)) {
      telefoneMap.set(lead.celular, []);
    }
    telefoneMap.get(lead.celular).push(lead);
  }

  stats.telefonesUnicos = telefoneMap.size;

  // Identificar duplicados (telefones com mais de 1 lead)
  for (const [telefone, leads] of telefoneMap.entries()) {
    if (leads.length > 1) {
      // Ordenar por data de criação (mais recente primeiro)
      leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      const maisRecente = leads[0];
      const paraRemover = leads.slice(1);
      
      stats.duplicadosEncontrados += paraRemover.length;
      
      duplicados.push({
        telefone,
        totalLeads: leads.length,
        manter: maisRecente,
        remover: paraRemover
      });

      console.log(`📞 ${telefone} (${leads.length} leads)`);
      console.log(`   ✅ MANTER: ${maisRecente.nome} (criado em ${new Date(maisRecente.created_at).toLocaleString('pt-BR')})`);
      for (const lead of paraRemover) {
        console.log(`   ❌ REMOVER: ${lead.nome} (criado em ${new Date(lead.created_at).toLocaleString('pt-BR')})`);
      }
      console.log('');
    }
  }

  // Relatório
  console.log('\n========================================');
  console.log('📊 RELATÓRIO DE DUPLICADOS');
  console.log('========================================\n');
  console.log(`Total de leads no banco:    ${stats.totalLeads}`);
  console.log(`Telefones únicos:           ${stats.telefonesUnicos}`);
  console.log(`Leads duplicados:           ${stats.duplicadosEncontrados} ❌`);
  console.log(`Telefones com duplicatas:   ${duplicados.length}`);
  console.log('');

  if (duplicados.length === 0) {
    console.log('✅ Nenhum duplicado encontrado!\n');
    return;
  }

  // Se for --apply, remover os duplicados
  if (APPLY) {
    console.log('⚠️  REMOVENDO DUPLICADOS...\n');
    
    for (const dup of duplicados) {
      for (const lead of dup.remover) {
        try {
          const { error } = await supabase
            .from('quiz_leads')
            .delete()
            .eq('id', lead.id);
          
          if (error) {
            console.error(`   ❌ Erro ao remover ${lead.nome}:`, error);
            stats.erros++;
          } else {
            stats.duplicadosRemovidos++;
            console.log(`   ✅ Removido: ${lead.nome} (${lead.celular})`);
          }
        } catch (err) {
          console.error(`   ❌ Erro ao remover ${lead.nome}:`, err.message);
          stats.erros++;
        }
      }
    }
    
    console.log('\n========================================');
    console.log('✅ REMOÇÃO CONCLUÍDA!');
    console.log('========================================\n');
    console.log(`Leads removidos:  ${stats.duplicadosRemovidos} ❌`);
    console.log(`Erros:            ${stats.erros} ⚠️`);
    console.log(`Leads restantes:  ${stats.totalLeads - stats.duplicadosRemovidos}`);
    console.log('');
  } else {
    console.log('🔍 MODO DRY-RUN: Nenhuma alteração foi feita no banco.');
    console.log(`   Execute com --apply para remover ${stats.duplicadosEncontrados} leads duplicados.`);
    console.log('');
  }
  
  console.log('========================================\n');
}

// Executar
buscarDuplicados().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
