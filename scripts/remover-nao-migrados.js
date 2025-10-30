/**
 * Script para Remover Leads que Não Foram Migrados (Duplicados Potenciais)
 * 
 * Remove leads cujo telefone NÃO está em formato E.164, exceto os 59 que são inválidos
 * Esses são os leads que não foram migrados porque seu telefone já existia convertido
 * 
 * Uso:
 *   node scripts/remover-nao-migrados.js --dry-run    # Simula sem deletar
 *   node scripts/remover-nao-migrados.js --apply      # Remove leads
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { isValidE164 } = require('../lib/phone-simple');

// Configuração Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

if (!DRY_RUN && !APPLY) {
  console.log('❌ Uso: node scripts/remover-nao-migrados.js [--dry-run|--apply]');
  console.log('   --dry-run: Simula remoção sem deletar');
  console.log('   --apply:   Remove leads não migrados (CUIDADO!)');
  process.exit(1);
}

// Estatísticas
const stats = {
  totalLeads: 0,
  emE164: 0,
  naoMigrados: 0,
  removidos: 0,
  erros: 0
};

const paraRemover = [];

/**
 * Lista de telefones inválidos conhecidos (não devem ser removidos, são casos especiais)
 */
const TELEFONES_INVALIDOS = [
  '818041133863', '449998339227', '244923715580', '222988228107',
  '50151984006603', '539911112323', '221971457972', '258876525971',
  '4447999790733', '98729018', '99999999', '4915750999498',
  '447490619091', '(16) 0996161632', '818043244040', '818036403666',
  '17572002', '594694405909', '393662481620', '258862886017',
  '447307919196', '199997550828', '447867337179', '818056323600',
  '393445288866', '393400618108', '959981018322', '393701247416',
  '491778352442', '319000236657', '818036334177', '331992935454',
  '3911966032323', '669981272996', '393513994980', '972533036383',
  '819072509186', '819078327407', '661982359087', '4921966313993',
  '111992930233', '393479434594', '491741809303', '447766144635',
  '4915209694688', '4917677402815', '818050081309', '819080851970',
  '393476363802', '447393897866', '819028401487', '819019671983',
  '353833430267', '5151997188682', '111974956353', '11111111111111111111',
  '4916095843654', '817091510307', '393662757756'
];

/**
 * Busca leads não migrados
 */
async function removerNaoMigrados() {
  console.log('\n🔄 ========================================');
  console.log(`   REMOÇÃO DE LEADS NÃO MIGRADOS`);
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

  // Identificar leads não migrados (não estão em E.164)
  console.log('🔍 Identificando leads não migrados...\n');
  
  for (const lead of allLeads) {
    if (!lead.celular) continue;
    
    const emE164 = isValidE164(lead.celular);
    
    if (emE164) {
      stats.emE164++;
    } else {
      // Verificar se é um telefone inválido conhecido (não remover esses)
      const ehInvalido = TELEFONES_INVALIDOS.includes(lead.celular.trim());
      
      if (!ehInvalido) {
        stats.naoMigrados++;
        paraRemover.push(lead);
        
        console.log(`❌ ${lead.nome.padEnd(35)} | ${lead.celular} | ${new Date(lead.created_at).toLocaleDateString('pt-BR')}`);
      }
    }
  }

  // Relatório
  console.log('\n========================================');
  console.log('📊 RELATÓRIO');
  console.log('========================================\n');
  console.log(`Total de leads:              ${stats.totalLeads}`);
  console.log(`Em formato E.164:            ${stats.emE164} ✅`);
  console.log(`Não migrados (duplicados):   ${stats.naoMigrados} ❌`);
  console.log(`Inválidos (mantidos):        ${TELEFONES_INVALIDOS.length} ⚠️`);
  console.log('');

  if (paraRemover.length === 0) {
    console.log('✅ Nenhum lead não migrado para remover!\n');
    return;
  }

  // Se for --apply, remover os leads
  if (APPLY) {
    console.log('⚠️  REMOVENDO LEADS NÃO MIGRADOS...\n');
    
    for (const lead of paraRemover) {
      try {
        const { error } = await supabase
          .from('quiz_leads')
          .delete()
          .eq('id', lead.id);
        
        if (error) {
          console.error(`   ❌ Erro ao remover ${lead.nome}:`, error);
          stats.erros++;
        } else {
          stats.removidos++;
          console.log(`   ✅ Removido: ${lead.nome} (${lead.celular})`);
        }
      } catch (err) {
        console.error(`   ❌ Erro ao remover ${lead.nome}:`, err.message);
        stats.erros++;
      }
    }
    
    console.log('\n========================================');
    console.log('✅ REMOÇÃO CONCLUÍDA!');
    console.log('========================================\n');
    console.log(`Leads removidos:  ${stats.removidos} ❌`);
    console.log(`Erros:            ${stats.erros} ⚠️`);
    console.log(`Leads restantes:  ${stats.totalLeads - stats.removidos}`);
    console.log('');
  } else {
    console.log('🔍 MODO DRY-RUN: Nenhuma alteração foi feita no banco.');
    console.log(`   Execute com --apply para remover ${stats.naoMigrados} leads não migrados.`);
    console.log('');
  }
  
  console.log('========================================\n');
}

// Executar
removerNaoMigrados().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
