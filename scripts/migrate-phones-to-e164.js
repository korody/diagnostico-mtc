/**
 * Script de Migração de Telefones para E.164
 * 
 * Converte todos os telefones do banco de dados para o formato internacional E.164
 * 
 * Uso:
 *   node scripts/migrate-phones-to-e164.js --dry-run    # Simula sem modificar
 *   node scripts/migrate-phones-to-e164.js --apply      # Aplica as mudanças
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { formatToE164, isValidE164 } = require('../lib/phone-simple');

// Configuração Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

if (!DRY_RUN && !APPLY) {
  console.log('❌ Uso: node scripts/migrate-phones-to-e164.js [--dry-run|--apply]');
  console.log('   --dry-run: Simula conversão sem modificar banco');
  console.log('   --apply:   Aplica conversões no banco (CUIDADO!)');
  process.exit(1);
}

// Estatísticas
const stats = {
  total: 0,
  sucesso: 0,
  jaE164: 0,
  invalidos: 0,
  erros: 0
};

const resultados = {
  sucesso: [],
  jaE164: [],
  invalidos: [],
  erros: []
};

/**
 * Tenta converter telefone para E.164
 */
function tentarConverterParaE164(telefone) {
  if (!telefone || typeof telefone !== 'string') {
    return { sucesso: false, motivo: 'Telefone vazio ou inválido' };
  }

  const telefoneOriginal = telefone;
  
  // Remove espaços e caracteres especiais
  telefone = telefone.trim();
  
  // Já está em E.164?
  if (isValidE164(telefone)) {
    return { sucesso: true, e164: telefone, jaEra: true };
  }

  // Tenta formatar para E.164 assumindo Brasil (padrão)
  let e164 = formatToE164(telefone, 'BR');
  if (e164) {
    return { sucesso: true, e164, jaEra: false };
  }

  // Tenta outros países comuns
  const paisesComuns = ['US', 'PT', 'ES', 'AR', 'MX'];
  for (const pais of paisesComuns) {
    e164 = formatToE164(telefone, pais);
    if (e164) {
      return { sucesso: true, e164, jaEra: false, paisDetectado: pais };
    }
  }

  // Não conseguiu converter
  return { 
    sucesso: false, 
    motivo: 'Não foi possível detectar país/formato válido',
    telefoneOriginal
  };
}

/**
 * Migra telefones de todos os leads
 */
async function migrarTelefones() {
  console.log('\n🔄 ========================================');
  console.log(`   MIGRAÇÃO DE TELEFONES PARA E.164`);
  console.log(`   Modo: ${DRY_RUN ? '🔍 DRY-RUN (simulação)' : '⚠️  APLICAR (produção)'}`);
  console.log('========================================\n');

  // 1. Buscar TODOS os leads com paginação
  console.log('📊 Buscando leads no banco (com paginação)...');
  
  let allLeads = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    console.log(`   Buscando página ${page + 1} (registros ${from}-${to})...`);
    
    const { data: leads, error, count } = await supabase
      .from('quiz_leads')
      .select('id, nome, email, celular', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      process.exit(1);
    }

    if (page === 0 && count) {
      console.log(`   Total de registros no banco: ${count}`);
    }

    allLeads = allLeads.concat(leads);
    hasMore = leads.length === pageSize;
    page++;
    
    // Pausa pequena entre páginas para não sobrecarregar
    if (hasMore) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`✅ ${allLeads.length} leads encontrados no total\n`);
  stats.total = allLeads.length;
  
  const leads = allLeads;

  // 2. Processar cada lead
  console.log('🔄 Processando telefones...\n');
  
  for (const lead of leads) {
    const resultado = tentarConverterParaE164(lead.celular);
    
    if (resultado.jaEra) {
      // Já está em E.164
      stats.jaE164++;
      resultados.jaE164.push({
        id: lead.id,
        nome: lead.nome,
        telefone: lead.celular
      });
      console.log(`✅ ${lead.nome.padEnd(30)} | ${lead.celular} (já E.164)`);
      
    } else if (resultado.sucesso) {
      // Convertido com sucesso
      stats.sucesso++;
      resultados.sucesso.push({
        id: lead.id,
        nome: lead.nome,
        de: lead.celular,
        para: resultado.e164,
        pais: resultado.paisDetectado || 'BR'
      });
      console.log(`🔄 ${lead.nome.padEnd(30)} | ${lead.celular} → ${resultado.e164}`);
      
      // Aplicar mudança no banco (se não for dry-run)
      if (APPLY) {
        const { error: updateError } = await supabase
          .from('quiz_leads')
          .update({ celular: resultado.e164 })
          .eq('id', lead.id);
        
        if (updateError) {
          console.error(`   ❌ Erro ao atualizar lead ${lead.id}:`, updateError);
          stats.erros++;
          resultados.erros.push({
            id: lead.id,
            nome: lead.nome,
            telefone: lead.celular,
            erro: updateError.message
          });
        }
      }
      
    } else {
      // Não conseguiu converter
      stats.invalidos++;
      resultados.invalidos.push({
        id: lead.id,
        nome: lead.nome,
        telefone: lead.celular,
        motivo: resultado.motivo
      });
      console.log(`❌ ${lead.nome.padEnd(30)} | ${lead.celular} (${resultado.motivo})`);
    }
  }

  // 3. Relatório Final
  console.log('\n========================================');
  console.log('📊 RELATÓRIO FINAL');
  console.log('========================================\n');
  console.log(`Total de leads:           ${stats.total}`);
  console.log(`Já em E.164:              ${stats.jaE164} ✅`);
  console.log(`Convertidos com sucesso:  ${stats.sucesso} 🔄`);
  console.log(`Inválidos/Problemáticos:  ${stats.invalidos} ❌`);
  console.log(`Erros ao atualizar:       ${stats.erros} ⚠️`);
  console.log('');

  // 4. Detalhes de telefones problemáticos
  if (resultados.invalidos.length > 0) {
    console.log('\n⚠️  TELEFONES PROBLEMÁTICOS (precisam revisão manual):\n');
    resultados.invalidos.forEach(item => {
      console.log(`   ID: ${item.id}`);
      console.log(`   Nome: ${item.nome}`);
      console.log(`   Telefone: ${item.telefone}`);
      console.log(`   Motivo: ${item.motivo}`);
      console.log('');
    });
  }

  // 5. Avisos finais
  if (DRY_RUN) {
    console.log('\n🔍 MODO DRY-RUN: Nenhuma alteração foi feita no banco.');
    console.log('   Execute com --apply para aplicar as conversões.');
  } else {
    console.log('\n✅ MIGRAÇÃO CONCLUÍDA!');
    console.log(`   ${stats.sucesso} telefones foram convertidos para E.164`);
    if (stats.invalidos > 0) {
      console.log(`   ⚠️  ${stats.invalidos} telefones precisam revisão manual`);
    }
  }
  
  console.log('\n========================================\n');
}

// Executar migração
migrarTelefones().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
