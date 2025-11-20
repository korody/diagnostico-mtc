// scripts/migrar-whatsapp-status-para-tags.js
// Migra todos os whatsapp_status existentes para status_tags sem perder dados

require('dotenv').config({ path: '.env.production' });

const { createClient } = require('@supabase/supabase-js');
const { addLeadTags, TAGS } = require('../lib/tags');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');

// Mapeamento de whatsapp_status para tags
const STATUS_TO_TAGS = {
  'AGUARDANDO_CONTATO': [], // Não adiciona tag
  'template_enviado': [TAGS.TEMPLATE_ENVIADO],
  'diagnostico_enviado': [TAGS.DIAGNOSTICO_ENVIADO],
  'resultados_enviados': [TAGS.RESULTADOS_ENVIADOS, TAGS.DIAGNOSTICO_ENVIADO],
  'desafio_enviado': [TAGS.DESAFIO_ENVIADO],
  'audio_personalizado_enviado': [TAGS.AUDIO_ENVIADO],
  'automacao_audio_personalizado': [TAGS.AUDIO_AUTOMACAO, TAGS.AUDIO_ENVIADO],
  'failed': [TAGS.FAILED],
  'desafio_failed': [TAGS.DESAFIO_FAILED]
};

console.log('\n🔄 ========================================');
console.log('   MIGRAR WHATSAPP_STATUS → STATUS_TAGS');
console.log('========================================');
if (DRY_RUN) console.log('🧪 DRY_RUN: não vai atualizar o banco');
console.log('========================================\n');

async function main() {
  const PAGE_SIZE = 100;
  let offset = 0;
  let totalProcessados = 0;
  let totalAtualizados = 0;
  let totalErros = 0;
  
  const estatisticas = {};
  
  while (true) {
    // Buscar leads em lotes
    const { data: leads, error } = await supabase
      .from('quiz_leads')
      .select('id, whatsapp_status, status_tags')
      .not('whatsapp_status', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      break;
    }
    
    if (!leads || leads.length === 0) {
      break; // Fim dos dados
    }
    
    console.log(`\n📦 Processando lote: leads ${offset + 1} a ${offset + leads.length}`);
    
    for (const lead of leads) {
      totalProcessados++;
      
      const status = lead.whatsapp_status;
      const tagsParaAdicionar = STATUS_TO_TAGS[status] || [];
      
      // Contar estatísticas
      if (!estatisticas[status]) {
        estatisticas[status] = 0;
      }
      estatisticas[status]++;
      
      // Se não tem tags para adicionar, pular
      if (tagsParaAdicionar.length === 0) {
        continue;
      }
      
      // Verificar se já tem as tags
      const statusTagsArray = Array.isArray(lead.status_tags) ? lead.status_tags : [];
      const jaTemTodasAsTags = tagsParaAdicionar.every(tag => 
        statusTagsArray.some(t => t.toLowerCase() === tag.toLowerCase())
      );
      
      if (jaTemTodasAsTags) {
        continue; // Já migrado
      }
      
      if (DRY_RUN) {
        console.log(`   [DRY_RUN] Lead ${lead.id}: ${status} → [${tagsParaAdicionar.join(', ')}]`);
        totalAtualizados++;
        continue;
      }
      
      // Adicionar tags
      const result = await addLeadTags(supabase, lead.id, tagsParaAdicionar);
      
      if (result.success) {
        totalAtualizados++;
      } else {
        totalErros++;
        console.log(`   ❌ Erro ao atualizar lead ${lead.id}`);
      }
    }
    
    console.log(`   ✅ ${totalAtualizados} atualizados | ❌ ${totalErros} erros`);
    
    offset += PAGE_SIZE;
    
    // Delay para não sobrecarregar
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Resumo final
  console.log('\n\n🎉 ========================================');
  console.log('   MIGRAÇÃO CONCLUÍDA!');
  console.log('========================================');
  console.log(`📊 Total processados: ${totalProcessados}`);
  console.log(`✅ Atualizados: ${totalAtualizados}`);
  console.log(`❌ Erros: ${totalErros}`);
  console.log('========================================\n');
  
  console.log('📊 Estatísticas por status:\n');
  Object.entries(estatisticas)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      const tags = STATUS_TO_TAGS[status] || [];
      const tagsStr = tags.length > 0 ? `→ [${tags.join(', ')}]` : '(sem tags)';
      console.log(`   ${status}: ${count} ${tagsStr}`);
    });
  
  if (DRY_RUN) {
    console.log('\n🧪 DRY_RUN ativo - não atualizou o banco\n');
    console.log('💡 Para aplicar as mudanças, rode sem --dry-run:\n');
    console.log('   node scripts/migrar-whatsapp-status-para-tags.js\n');
  }
}

main().catch(console.error);
