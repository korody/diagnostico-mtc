// listar-tabelas-supabase.js
// Lista todas as tabelas do banco Supabase para identificar quais não estão em uso

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Tabelas que SABEMOS que estamos usando
const TABELAS_EM_USO = [
  'quiz_leads',
  'whatsapp_logs'
];

async function listarTabelas() {
  console.log('\n📋 LISTANDO TABELAS DO SUPABASE\n');
  console.log('=========================================\n');

  try {
    // Tentar buscar de várias tabelas comuns para descobrir quais existem
    const tabelasPossiveis = [
      'quiz_leads',
      'whatsapp_logs',
      'whatsapp_messages',
      'leads',
      'messages',
      'contacts',
      'campaigns',
      'templates',
      'users',
      'profiles',
      'sessions',
      'audio_files',
      'diagnosticos',
      'respostas',
      'elementos',
      'quiz_responses',
      'quiz_results',
      'webhook_logs',
      'api_logs',
      'notifications',
      'settings'
    ];

    const tabelasExistentes = [];
    const tabelasNaoExistentes = [];

    console.log('🔍 Verificando tabelas...\n');

    for (const tabela of tabelasPossiveis) {
      try {
        const { count, error } = await supabase
          .from(tabela)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          const emUso = TABELAS_EM_USO.includes(tabela);
          tabelasExistentes.push({
            nome: tabela,
            registros: count || 0,
            emUso
          });
          
          const status = emUso ? '✅ EM USO' : '❌ NÃO USADA';
          console.log(`${status} | ${tabela.padEnd(25)} | ${count || 0} registros`);
        } else {
          tabelasNaoExistentes.push(tabela);
        }
      } catch (err) {
        tabelasNaoExistentes.push(tabela);
      }
    }

    console.log('\n=========================================\n');
    console.log('📊 RESUMO:\n');
    console.log(`Total de tabelas encontradas: ${tabelasExistentes.length}`);
    console.log(`Tabelas em uso: ${tabelasExistentes.filter(t => t.emUso).length}`);
    console.log(`Tabelas não usadas: ${tabelasExistentes.filter(t => !t.emUso).length}`);

    const tabelasParaApagar = tabelasExistentes.filter(t => !t.emUso);
    
    if (tabelasParaApagar.length > 0) {
      console.log('\n⚠️  TABELAS QUE PODEM SER APAGADAS:\n');
      tabelasParaApagar.forEach(t => {
        console.log(`   - ${t.nome} (${t.registros} registros)`);
      });

      console.log('\n=========================================\n');
      console.log('⚠️  ATENÇÃO: Para apagar essas tabelas, você precisa:');
      console.log('   1. Acessar o painel do Supabase');
      console.log('   2. Ir em "Table Editor" ou "SQL Editor"');
      console.log('   3. Executar o comando SQL para cada tabela:\n');
      
      tabelasParaApagar.forEach(t => {
        console.log(`      DROP TABLE IF EXISTS public.${t.nome} CASCADE;`);
      });

      console.log('\n   OU criar um script SQL com todos os comandos:\n');
      console.log('   -- Script para apagar tabelas não utilizadas');
      tabelasParaApagar.forEach(t => {
        console.log(`   DROP TABLE IF EXISTS public.${t.nome} CASCADE;`);
      });

      // Salvar script SQL
      const fs = require('fs');
      const sqlScript = tabelasParaApagar
        .map(t => `DROP TABLE IF EXISTS public.${t.nome} CASCADE;`)
        .join('\n');
      
      const filename = 'apagar-tabelas-nao-usadas.sql';
      fs.writeFileSync(filename, `-- Script para apagar tabelas não utilizadas\n-- Criado em: ${new Date().toLocaleString('pt-BR')}\n-- ATENÇÃO: Execute com cuidado!\n\n${sqlScript}\n`);
      
      console.log(`\n✅ Script SQL salvo em: ${filename}`);
      console.log('   Execute este arquivo no SQL Editor do Supabase');
    } else {
      console.log('\n✅ Nenhuma tabela não utilizada foi encontrada!');
    }

    console.log('\n=========================================\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

listarTabelas();
