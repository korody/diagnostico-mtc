// verificar-ultimos-2.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.production' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verificar() {
  console.log('\n🔍 Verificando Yago e Maria Eduarda...\n');
  
  // Yago
  const { data: yago } = await supabase
    .from('quiz_leads')
    .select('nome, celular, whatsapp_status, whatsapp_sent_at')
    .eq('celular', '+5561991603630')
    .single();
  
  console.log('1. Yago Henrique (+5561991603630)');
  if (yago) {
    console.log(`   ✅ Encontrado no banco`);
    console.log(`   📊 Status: ${yago.whatsapp_status || 'NULL'}`);
    console.log(`   ⏰ Enviado em: ${yago.whatsapp_sent_at ? new Date(yago.whatsapp_sent_at).toLocaleString('pt-BR') : 'NULL'}`);
  } else {
    console.log('   ❌ Não encontrado');
  }
  
  // Maria Eduarda
  const { data: maria } = await supabase
    .from('quiz_leads')
    .select('nome, celular, whatsapp_status, whatsapp_sent_at')
    .eq('celular', '+5562991488735')
    .single();
  
  console.log('\n2. Maria Eduarda silva rodrigues (+5562991488735)');
  if (maria) {
    console.log(`   ✅ Encontrado no banco`);
    console.log(`   📊 Status: ${maria.whatsapp_status || 'NULL'}`);
    console.log(`   ⏰ Enviado em: ${maria.whatsapp_sent_at ? new Date(maria.whatsapp_sent_at).toLocaleString('pt-BR') : 'NULL'}`);
  } else {
    console.log('   ❌ Não encontrado');
  }
  
  console.log('\n' + '─'.repeat(60));
  
  if (yago?.whatsapp_status === 'audio_personalizado_enviado' && 
      maria?.whatsapp_status === 'audio_personalizado_enviado') {
    console.log('\n✅ AMBOS marcados corretamente como "audio_personalizado_enviado"\n');
  } else {
    console.log('\n⚠️  Um ou ambos NÃO foram marcados corretamente\n');
  }
}

verificar().catch(console.error);
