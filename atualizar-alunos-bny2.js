// atualizar-alunos-bny2.js
// Atualiza todos os leads do CSV BNY2 como is_aluno = true e is_aluno_bny2 = true

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');

console.log('\n🔄 ========================================');
console.log('   ATUALIZAR ALUNOS BNY2');
console.log('========================================');
if (DRY_RUN) console.log('🧪 DRY_RUN: não vai atualizar o banco');
console.log('========================================\n');

// Normalizar telefone para comparação
function normalizarTelefone(phone) {
  if (!phone) return '';
  // Remove tudo exceto dígitos
  const digits = phone.replace(/\D/g, '');
  
  // Remove DDI 55 se existir
  if (digits.startsWith('55') && digits.length > 11) {
    return digits.substring(2);
  }
  
  return digits;
}

// Normalizar email
function normalizarEmail(email) {
  if (!email) return '';
  return email.toLowerCase().trim();
}

async function main() {
  const emails = [];
  const telefones = [];
  
  // 1. Ler CSV
  console.log('📂 Lendo arquivo CSV...\n');
  
  await new Promise((resolve, reject) => {
    fs.createReadStream('BNY2-turma.csv')
      .pipe(csv())
      .on('data', (row) => {
        const email = row.Email || row.email;
        const telefone = row['Número de telefone'] || row.telefone || row.phone;
        
        if (email) {
          emails.push(normalizarEmail(email));
        }
        if (telefone) {
          const telNormalizado = normalizarTelefone(telefone);
          if (telNormalizado) {
            telefones.push(telNormalizado);
          }
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`✅ ${emails.length} emails lidos`);
  console.log(`✅ ${telefones.length} telefones lidos\n`);
  
  // 2. Buscar leads no Supabase por email
  console.log('🔍 Buscando leads por email...\n');
  
  const { data: leadsPorEmail, error: errorEmail } = await supabase
    .from('quiz_leads')
    .select('*')
    .in('email', emails);
  
  if (errorEmail) {
    console.error('❌ Erro ao buscar por email:', errorEmail);
    return;
  }
  
  console.log(`📧 ${leadsPorEmail.length} leads encontrados por email\n`);
  
  // 3. Buscar leads por telefone (últimos 9 dígitos)
  console.log('🔍 Buscando leads por telefone...\n');
  
  const { data: todosLeads, error: errorTodos } = await supabase
    .from('quiz_leads')
    .select('*')
    .not('celular', 'is', null);
  
  if (errorTodos) {
    console.error('❌ Erro ao buscar todos os leads:', errorTodos);
    return;
  }
  
  const leadsPorTelefone = todosLeads.filter(lead => {
    if (!lead.celular) return false;
    const telLead = normalizarTelefone(lead.celular);
    
    // Comparar últimos 9 dígitos (DDD + 9 dígitos)
    const ultimos9Lead = telLead.slice(-9);
    
    return telefones.some(tel => {
      const ultimos9CSV = tel.slice(-9);
      return ultimos9Lead === ultimos9CSV;
    });
  });
  
  console.log(`📱 ${leadsPorTelefone.length} leads encontrados por telefone\n`);
  
  // 4. Combinar e deduplificar
  const leadsMap = new Map();
  
  leadsPorEmail.forEach(lead => {
    leadsMap.set(lead.id, lead);
  });
  
  leadsPorTelefone.forEach(lead => {
    leadsMap.set(lead.id, lead);
  });
  
  const leadsParaAtualizar = Array.from(leadsMap.values());
  
  console.log(`\n✅ Total de leads únicos encontrados: ${leadsParaAtualizar.length}\n`);
  
  // 5. Mostrar preview
  console.log('📋 Preview (primeiros 10):\n');
  leadsParaAtualizar.slice(0, 10).forEach((lead, i) => {
    const jaAluno = lead.is_aluno ? '✅' : '❌';
    const jaBNY2 = lead.is_aluno_bny2 ? '✅' : '❌';
    console.log(`   ${i + 1}. ${lead.nome}`);
    console.log(`      Email: ${lead.email || 'N/A'}`);
    console.log(`      Tel: ${lead.celular || 'N/A'}`);
    console.log(`      is_aluno: ${jaAluno} | is_aluno_bny2: ${jaBNY2}`);
    console.log('');
  });
  
  // 6. Estatísticas
  const jaAlunos = leadsParaAtualizar.filter(l => l.is_aluno).length;
  const jaBNY2 = leadsParaAtualizar.filter(l => l.is_aluno_bny2).length;
  const precisamAtualizar = leadsParaAtualizar.filter(l => !l.is_aluno || !l.is_aluno_bny2).length;
  
  console.log(`📊 Estatísticas:`);
  console.log(`   Total: ${leadsParaAtualizar.length}`);
  console.log(`   Já marcados como alunos: ${jaAlunos}`);
  console.log(`   Já marcados como BNY2: ${jaBNY2}`);
  console.log(`   Precisam atualizar: ${precisamAtualizar}\n`);
  
  if (DRY_RUN) {
    console.log('🧪 DRY_RUN ativo - não atualizando banco\n');
    console.log('💡 Para aplicar as mudanças, rode sem --dry-run:\n');
    console.log('   node atualizar-alunos-bny2.js\n');
    return;
  }
  
  // 7. Confirmar
  console.log('⚠️  ========================================');
  console.log(`   Vai atualizar ${leadsParaAtualizar.length} leads`);
  console.log('   is_aluno = true');
  console.log('   is_aluno_bny2 = true');
  console.log('========================================\n');
  console.log('⏳ Iniciando em 5 segundos...\n');
  await new Promise(r => setTimeout(r, 5000));
  
  // 8. Atualizar em lotes
  const LOTE_SIZE = 50;
  let atualizados = 0;
  let erros = 0;
  
  for (let i = 0; i < leadsParaAtualizar.length; i += LOTE_SIZE) {
    const lote = leadsParaAtualizar.slice(i, i + LOTE_SIZE);
    const ids = lote.map(l => l.id);
    
    const { error } = await supabase
      .from('quiz_leads')
      .update({
        is_aluno: true,
        is_aluno_bny2: true,
        updated_at: new Date().toISOString()
      })
      .in('id', ids);
    
    if (error) {
      console.error(`❌ Erro no lote ${Math.floor(i / LOTE_SIZE) + 1}:`, error);
      erros += lote.length;
    } else {
      atualizados += lote.length;
      console.log(`✅ Lote ${Math.floor(i / LOTE_SIZE) + 1}: ${lote.length} leads atualizados`);
    }
    
    // Delay entre lotes
    if (i + LOTE_SIZE < leadsParaAtualizar.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  // 9. Resumo final
  console.log('\n\n🎉 ========================================');
  console.log('   ATUALIZAÇÃO CONCLUÍDA!');
  console.log('========================================');
  console.log(`✅ Atualizados: ${atualizados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📊 Taxa: ${((atualizados / leadsParaAtualizar.length) * 100).toFixed(1)}%`);
  console.log('========================================\n');
  
  // 10. Verificar no banco
  console.log('🔍 Verificando no banco...\n');
  
  const { data: verificacao, error: errorVerif } = await supabase
    .from('quiz_leads')
    .select('id')
    .eq('is_aluno_bny2', true);
  
  if (!errorVerif) {
    console.log(`✅ Total de alunos BNY2 no banco: ${verificacao.length}\n`);
  }
}

main().catch(console.error);
