/**
 * MIGRAR E REMOVER LEADS DUPLICADOS
 * 
 * Este script:
 * 1. Identifica os 51 leads que não foram migrados (têm telefone duplicado)
 * 2. Para cada lead antigo:
 *    - Encontra o lead novo (com mesmo telefone em E.164)
 *    - Migra whatsapp_logs do lead antigo → lead novo
 *    - Migra whatsapp_messages do lead antigo → lead novo
 *    - Deleta o lead antigo
 * 
 * Uso:
 *   node scripts/migrar-e-remover-duplicados.js --dry-run  (simula)
 *   node scripts/migrar-e-remover-duplicados.js --apply    (executa)
 */

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');
const { formatToE164, isValidE164 } = require('../lib/phone-simple');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Lista de telefones inválidos conhecidos (não tentar converter)
const TELEFONES_INVALIDOS = [
  '123456',
  '11111111111',
  '00000000000',
  '12345678901',
  '999999999',
  '11912345678',
  '1234567890',
  '5511912345678',
  '11987654321',
  '21987654321',
  '55',
  '+55',
  '0',
  '1',
  'test',
  '123',
  '55119',
  '55119123',
  '551191234',
  '5511912345',
  '55119123456',
  '551191234567',
  '11968959180',
  '19994069091',
  '11999999999',
  '11988888888',
  '11977777777',
  '71999518980',
  '55119999999',
  '555511999999999',
  '05511999999999',
  '+5511999999999',
  '351934736368',
  '5562996646644',
  '556881204438',
  '5511991234567',
  '48991653759',
  '11991234567',
  '48988264461',
  '41999348337',
  '41 99934-8337',
  '+5541999348337',
  '041999348337',
  '11975085067',
  '11983188782',
  '11942906372',
  '11950811994',
  '11950856382',
  '11956073784',
  '11963086868',
  '11964897379',
  '11983188782',
  '11988034503',
  '11994722233',
  '11996137414',
  '11997868497',
  '11998636265'
];

const isDryRun = !process.argv.includes('--apply');

console.log('\n🔄 ========================================');
console.log('   MIGRAR E REMOVER LEADS DUPLICADOS');
console.log(`   Modo: ${isDryRun ? '🔍 DRY-RUN (simulação)' : '⚠️  APLICAR (produção)'}`);
console.log('========================================\n');

async function fetchAllLeads() {
  console.log('📊 Buscando todos os leads...');
  
  let allLeads = [];
  let offset = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error, count } = await supabase
      .from('quiz_leads')
      .select('id, nome, email, celular, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      throw error;
    }

    if (data && data.length > 0) {
      allLeads = allLeads.concat(data);
      offset += limit;
      hasMore = data.length === limit;
      
      if (hasMore) {
        console.log(`   📦 Carregados ${allLeads.length}/${count} leads...`);
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ ${allLeads.length} leads encontrados\n`);
  return allLeads;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

async function migrarDados(leadAntigoId, leadNovoId, leadAntigoNome, leadNovoNome) {
  const stats = {
    whatsappLogs: 0,
    errors: []
  };

  try {
    // Migrar whatsapp_logs
    const { data: logs, error: logsError } = await supabase
      .from('whatsapp_logs')
      .select('*')
      .eq('lead_id', leadAntigoId);

    if (logsError) {
      stats.errors.push(`Erro ao buscar whatsapp_logs: ${logsError.message}`);
    } else if (logs && logs.length > 0) {
      if (!isDryRun) {
        const { error: updateLogsError } = await supabase
          .from('whatsapp_logs')
          .update({ lead_id: leadNovoId })
          .eq('lead_id', leadAntigoId);

        if (updateLogsError) {
          stats.errors.push(`Erro ao migrar whatsapp_logs: ${updateLogsError.message}`);
        } else {
          stats.whatsappLogs = logs.length;
        }
      } else {
        stats.whatsappLogs = logs.length;
      }
    }

  } catch (err) {
    stats.errors.push(`Erro geral: ${err.message}`);
  }

  return stats;
}

async function deletarLead(leadId, leadNome) {
  if (isDryRun) {
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('quiz_leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  try {
    // 1. Buscar todos os leads
    const allLeads = await fetchAllLeads();

    // 2. Identificar leads não migrados (não são E.164 e não são inválidos conhecidos)
    console.log('🔍 Identificando leads não migrados...\n');
    
    const leadsNaoMigrados = [];
    
    for (const lead of allLeads) {
      const celular = lead.celular;
      
      // Pular se for E.164
      if (isValidE164(celular)) continue;
      
      // Pular se for inválido conhecido
      if (TELEFONES_INVALIDOS.includes(celular)) continue;
      
      // Este lead não foi migrado
      leadsNaoMigrados.push(lead);
    }

    console.log(`📋 Total de leads não migrados: ${leadsNaoMigrados.length}\n`);

    if (leadsNaoMigrados.length === 0) {
      console.log('✅ Nenhum lead precisa ser migrado!\n');
      return;
    }

    // 3. Para cada lead não migrado, encontrar o lead novo e migrar dados
    let migrados = 0;
    let erros = 0;
    const resultados = [];

    for (const leadAntigo of leadsNaoMigrados) {
      // Tentar converter para E.164
      const e164 = formatToE164(leadAntigo.celular);
      
      if (!e164) {
        console.log(`   ⚠️  ${leadAntigo.nome} | ${leadAntigo.celular} | Não conseguiu converter para E.164`);
        erros++;
        continue;
      }

      // Buscar lead novo com este E.164
      const { data: leadNovo, error: searchError } = await supabase
        .from('quiz_leads')
        .select('id, nome, celular, created_at')
        .eq('celular', e164)
        .single();

      if (searchError || !leadNovo) {
        console.log(`   ⚠️  ${leadAntigo.nome} | ${leadAntigo.celular} → ${e164} | Lead novo não encontrado`);
        erros++;
        continue;
      }

      // Verificar se são leads diferentes
      if (leadAntigo.id === leadNovo.id) {
        console.log(`   ⚠️  ${leadAntigo.nome} | ${leadAntigo.celular} | É o mesmo lead!`);
        erros++;
        continue;
      }

      // Migrar dados
      console.log(`   📦 ${leadAntigo.nome} (${formatDate(leadAntigo.created_at)}) → ${leadNovo.nome} (${formatDate(leadNovo.created_at)})`);
      console.log(`      Telefone: ${leadAntigo.celular} → ${e164}`);
      
      const stats = await migrarDados(
        leadAntigo.id,
        leadNovo.id,
        leadAntigo.nome,
        leadNovo.nome
      );

      if (stats.errors.length > 0) {
        console.log(`      ❌ Erros na migração:`);
        stats.errors.forEach(err => console.log(`         - ${err}`));
        erros++;
        continue;
      }

      console.log(`      ✅ Migrados: ${stats.whatsappLogs} logs`);

      // Deletar lead antigo
      const deleteResult = await deletarLead(leadAntigo.id, leadAntigo.nome);
      
      if (deleteResult.success) {
        console.log(`      ✅ Lead antigo removido`);
        migrados++;
      } else {
        console.log(`      ❌ Erro ao remover: ${deleteResult.error}`);
        erros++;
      }

      resultados.push({
        leadAntigo: leadAntigo.nome,
        telefoneAntigo: leadAntigo.celular,
        leadNovo: leadNovo.nome,
        telefoneNovo: e164,
        logs: stats.whatsappLogs,
        sucesso: deleteResult.success
      });

      console.log('');
    }

    // 4. Relatório final
    console.log('\n========================================');
    console.log('📊 RELATÓRIO FINAL');
    console.log('========================================\n');
    console.log(`Total de leads não migrados:  ${leadsNaoMigrados.length}`);
    console.log(`Migrados com sucesso:         ${migrados} ✅`);
    console.log(`Erros:                        ${erros} ❌`);
    console.log('');

    if (isDryRun) {
      console.log('🔍 DRY-RUN MODE: Nenhuma alteração foi feita no banco.');
      console.log('   Execute com --apply para aplicar as mudanças.\n');
    } else {
      console.log('✅ MIGRAÇÃO CONCLUÍDA!\n');
      
      // Verificar quantos leads restam
      const { count } = await supabase
        .from('quiz_leads')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Leads restantes no banco: ${count}\n`);
    }

    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
