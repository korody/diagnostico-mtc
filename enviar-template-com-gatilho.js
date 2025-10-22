// enviar-template-com-gatilho.js
// Envia template usando o gatilho da automação do Unnichat

const isProduction = process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env.local';

require('dotenv').config({ path: envFile });

const GATILHO_URL = process.env.UNNICHAT_GATILHO_URL;

if (!GATILHO_URL) {
  console.error('❌ ERRO: UNNICHAT_GATILHO_URL não configurado!');
  console.error('   Verifique seu arquivo:', envFile);
  process.exit(1);
}

async function enviarTemplateComGatilho() {
  // Dados do lead de teste
  const leadData = {
    name: 'Marcos Korody',
    email: 'marcos@teste.com',
    phone: '5511998457676'
  };
  
  console.log('📤 Enviando template via gatilho da automação...');
  console.log('🔧 Ambiente:', isProduction ? '🔴 PRODUÇÃO' : '🟡 TESTE');
  console.log('👤 Lead:', leadData);
  
  try {
    const response = await fetch(GATILHO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(leadData)
    });
    
    const result = await response.json();
    console.log('📥 Resposta do gatilho:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Template enviado via automação!');
      console.log('📱 Verifique seu WhatsApp!');
      console.log('🔘 Clique no botão "VER RESULTADOS"');
      console.log('⚡ O webhook será chamado automaticamente!');
    } else {
      console.error('\n❌ Erro ao enviar:', result);
    }
    
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

enviarTemplateComGatilho();