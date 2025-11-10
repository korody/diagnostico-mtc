// marcar-alunos-bny2.js
// Cruza dados do CSV de alunos BNY2 com Supabase e marca campo is_aluno_bny2

const { createClient } = require('@supabase/supabase-js');
const csv = require('csv-parser');
const fs = require('fs');

require('dotenv').config({ path: '.env.production' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

const CSV_PATH = 'G:\\.shortcut-targets-by-id\\1lrBL-vb42dxivhpbt5jLCzq1hQIjmiLN\\mestre ye\\listas gerais\\BNY2 - alunos.csv';

// ========================================
// Normalizar telefone (múltiplas variações)
// ========================================
function normalizePhone(phone) {
  if (!phone) return [];
  
  // Remove tudo que não é número
  let clean = phone.replace(/\D/g, '');
  
  const variations = new Set();
  
  // Variação original limpa
  variations.add(clean);
  
  // Remove 55 do início se tiver (>11 dígitos)
  if (clean.startsWith('55') && clean.length > 11) {
    const sem55 = clean.substring(2);
    variations.add(sem55);
    
    // Também adicionar últimos 9 e 8 dígitos
    if (sem55.length >= 9) variations.add(sem55.slice(-9));
    if (sem55.length >= 8) variations.add(sem55.slice(-8));
  }
  
  // Últimos 9 e 8 dígitos da versão original
  if (clean.length >= 9) variations.add(clean.slice(-9));
  if (clean.length >= 8) variations.add(clean.slice(-8));
  
  return Array.from(variations);
}

// ========================================
// Normalizar email
// ========================================
function normalizeEmail(email) {
  if (!email) return null;
  return email.trim().toLowerCase().replace(/\s+/g, '');
}

// ========================================
// Parse CSV
// ========================================
async function parseCSV() {
  console.log('📖 Lendo CSV de alunos BNY2...\n');
  
  return new Promise((resolve, reject) => {
    const alunos = [];
    
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        const email = normalizeEmail(row.Email || row.email);
        const phone = row['Número de telefone'] || row.phone || row.telefone || row.Telefone;
        const nome = row.Nome || row.nome;
        
        if (email || phone) {
          alunos.push({
            nome: nome,
            email: email,
            phone: phone,
            phoneVariations: normalizePhone(phone)
          });
        }
      })
      .on('end', () => {
        console.log(`✅ ${alunos.length} alunos BNY2 encontrados no CSV\n`);
        resolve(alunos);
      })
      .on('error', reject);
  });
}

// ========================================
// Verificar se lead é aluno BNY2
// ========================================
function isLeadAlunoBNY2(lead, emailsMap, phonesMap) {
  const emailLead = normalizeEmail(lead.email);
  const phoneLead = normalizePhone(lead.celular);
  
  // 1. Busca por email (mais confiável)
  if (emailLead && emailsMap.has(emailLead)) {
    return { match: true, method: 'email', value: emailLead };
  }
  
  // 2. Busca por qualquer variação do telefone
  for (const phoneVar of phoneLead) {
    if (phonesMap.has(phoneVar)) {
      return { match: true, method: 'phone', value: phoneVar };
    }
  }
  
  return { match: false };
}

// ========================================
// Marcar alunos BNY2 no Supabase
// ========================================
async function marcarAlunosBNY2() {
  console.log('🎓 ========================================');
  console.log('   MARCANDO ALUNOS BNY2 NO SUPABASE');
  console.log('   (Busca melhorada com múltiplas estratégias)');
  console.log('========================================\n');
  
  // 1. Parse CSV
  const alunos = await parseCSV();
  
  // 2. Criar maps para busca rápida
  console.log('🗂️  Criando índices de busca...');
  
  const emailsMap = new Map();
  const phonesMap = new Map();
  
  alunos.forEach(aluno => {
    // Indexar email
    if (aluno.email) {
      emailsMap.set(aluno.email, aluno);
    }
    
    // Indexar todas as variações de telefone
    aluno.phoneVariations.forEach(phoneVar => {
      phonesMap.set(phoneVar, aluno);
    });
  });
  
  console.log(`   📧 Emails únicos: ${emailsMap.size}`);
  console.log(`   📱 Variações de telefone: ${phonesMap.size}\n`);
  
  // 3. Buscar todos os leads do Supabase em lotes
  console.log('🔍 Buscando leads do Supabase...');
  
  let allLeads = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data: leads, error } = await supabase
      .from('quiz_leads')
      .select('id, nome, email, celular, is_aluno, is_aluno_bny2')
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar leads:', error);
      return;
    }
    
    if (!leads || leads.length === 0) break;
    
    allLeads = allLeads.concat(leads);
    page++;
    
    console.log(`   Carregados: ${allLeads.length} leads...`);
  }
  
  console.log(`✅ ${allLeads.length} leads encontrados no Supabase\n`);
  
  // 4. Cruzar dados
  console.log('🔄 Cruzando dados...\n');
  
  const stats = {
    jaEramAlunosBNY2: 0,
    novosAlunosBNY2Email: 0,
    novosAlunosBNY2Phone: 0,
    naoSaoAlunosBNY2: 0,
    erros: 0,
    desmarcados: 0
  };
  
  const updates = [];
  
  for (const lead of allLeads) {
    try {
      const result = isLeadAlunoBNY2(lead, emailsMap, phonesMap);
      
      // Se já estava marcado corretamente, pular
      if (lead.is_aluno_bny2 === result.match) {
        if (result.match) stats.jaEramAlunosBNY2++;
        else stats.naoSaoAlunosBNY2++;
        continue;
      }
      
      // Preparar update
      updates.push({
        id: lead.id,
        nome: lead.nome,
        email: lead.email,
        celular: lead.celular,
        is_aluno_bny2: result.match,
        matchMethod: result.method,
        matchValue: result.value
      });
      
      if (result.match) {
        if (result.method === 'email') stats.novosAlunosBNY2Email++;
        else stats.novosAlunosBNY2Phone++;
      } else {
        stats.desmarcados++;
      }
      
    } catch (error) {
      console.error(`   ❌ Erro processando ${lead.nome}:`, error.message);
      stats.erros++;
    }
  }
  
  // 5. Aplicar updates em lote
  if (updates.length > 0) {
    console.log(`\n📝 Aplicando ${updates.length} atualizações...\n`);
    
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('quiz_leads')
        .update({ is_aluno_bny2: update.is_aluno_bny2 })
        .eq('id', update.id);
      
      if (updateError) {
        console.error(`   ❌ Erro ao atualizar ${update.nome}:`, updateError.message);
        stats.erros++;
      } else {
        if (update.is_aluno_bny2) {
          console.log(`   ✅ Marcado como ALUNO BNY2: ${update.nome}`);
          console.log(`      Match: ${update.matchMethod} = ${update.matchValue}`);
        } else {
          console.log(`   ⚠️  Desmarcado: ${update.nome}`);
        }
      }
    }
  }
  
  // 6. Resumo
  console.log('\n========================================');
  console.log('📊 RESUMO');
  console.log('========================================');
  console.log(`✅ Novos alunos BNY2 (email): ${stats.novosAlunosBNY2Email}`);
  console.log(`✅ Novos alunos BNY2 (telefone): ${stats.novosAlunosBNY2Phone}`);
  console.log(`📚 Já eram alunos BNY2: ${stats.jaEramAlunosBNY2}`);
  console.log(`⚠️  Desmarcados: ${stats.desmarcados}`);
  console.log(`👤 Não são alunos BNY2: ${stats.naoSaoAlunosBNY2}`);
  console.log(`❌ Erros: ${stats.erros}`);
  console.log(`📊 Total: ${allLeads.length}`);
  console.log('========================================\n');
  
  // 7. Estatísticas finais
  console.log('📈 Verificando estatísticas finais...');
  
  const { count: totalLeads } = await supabase
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true });
  
  const { count: totalAlunosBNY2 } = await supabase
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true })
    .eq('is_aluno_bny2', true);
  
  const { count: totalNaoAlunosBNY2 } = await supabase
    .from('quiz_leads')
    .select('*', { count: 'exact', head: true })
    .eq('is_aluno_bny2', false);
  
  console.log(`\n📊 Estatísticas finais:`);
  console.log(`   Total de leads: ${totalLeads}`);
  console.log(`   Alunos BNY2: ${totalAlunosBNY2} (${((totalAlunosBNY2/totalLeads)*100).toFixed(1)}%)`);
  console.log(`   Não-alunos BNY2: ${totalNaoAlunosBNY2} (${((totalNaoAlunosBNY2/totalLeads)*100).toFixed(1)}%)`);
  console.log(`\n🎉 Processo concluído!\n`);
}

// Executar
marcarAlunosBNY2().catch(console.error);
