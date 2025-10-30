// phone-simple.js
// Sistema SIMPLIFICADO de validação de telefones
// Usa E.164 como padrão universal: +[código país][número]

const { parsePhoneNumber, isValidPhoneNumber, getCountries } = require('libphonenumber-js');

/**
 * Valida e formata telefone para E.164
 * @param {string} phone - Telefone raw do usuário
 * @param {string} country - Código do país (BR, US, PT, etc)
 * @returns {string|null} - Telefone em E.164 ou null se inválido
 */
function formatToE164(phone, country = 'BR') {
  if (!phone) return null;
  
  try {
    // Tentar parsear com o país especificado
    const phoneNumber = parsePhoneNumber(phone, country);
    
    if (phoneNumber && phoneNumber.isValid()) {
      // Retorna em formato E.164: +5511998457676
      return phoneNumber.number;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao formatar telefone:', error.message);
    return null;
  }
}

/**
 * Valida se telefone está em formato E.164 válido
 * @param {string} phone - Telefone em E.164
 * @returns {boolean}
 */
function isValidE164(phone) {
  if (!phone) return false;
  
  try {
    // E.164 deve começar com + e ter 1-15 dígitos
    if (!/^\+\d{1,15}$/.test(phone)) return false;
    
    return isValidPhoneNumber(phone);
  } catch (error) {
    return false;
  }
}

/**
 * Formata telefone E.164 para o formato esperado pelo Unnichat
 * Unnichat usa E.164 sem o símbolo +
 * @param {string} e164Phone - Telefone em E.164 (+5511998457676)
 * @returns {string} - Telefone para Unnichat (5511998457676)
 */
function formatForUnnichat(e164Phone) {
  if (!e164Phone) return '';
  
  // Remover o + do início
  return e164Phone.replace(/^\+/, '');
}

/**
 * Formata telefone E.164 para exibição amigável
 * @param {string} e164Phone - Telefone em E.164
 * @returns {string} - Formato visual amigável
 */
function formatForDisplay(e164Phone) {
  if (!e164Phone) return '';
  
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);
    
    if (phoneNumber) {
      // Formato internacional: +55 11 99845-7676
      return phoneNumber.formatInternational();
    }
    
    return e164Phone;
  } catch (error) {
    return e164Phone;
  }
}

/**
 * Busca lead por telefone com estratégia em 3 passos
 * 1. Busca exata por E.164
 * 2. Busca por email (fallback)
 * 3. Busca pelos últimos 8/9 dígitos (emergência)
 */
async function findLeadByPhone(supabase, phone, email = null) {
  console.log('🔍 Iniciando busca de lead...');
  console.log('   Telefone:', phone);
  console.log('   Email:', email || 'N/A');
  
  // PASSO 1: Busca exata por telefone E.164
  console.log('\n📍 PASSO 1: Busca exata');
  const { data: leadExato, error: errorExato } = await supabase
    .from('quiz_leads')
    .select('*')
    .eq('celular', phone)
    .maybeSingle();
  
  if (leadExato) {
    console.log('✅ Lead encontrado (busca exata):', leadExato.nome);
    return { lead: leadExato, method: '1-exact' };
  }
  
  console.log('⚠️  Não encontrado (busca exata)');
  
  // PASSO 2: Busca por email (fallback)
  if (email) {
    console.log('\n📍 PASSO 2: Busca por email');
    const { data: leadEmail, error: errorEmail } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    
    if (leadEmail) {
      console.log('✅ Lead encontrado (por email):', leadEmail.nome);
      console.log('⚠️  ATENÇÃO: Telefone no banco difere do recebido');
      console.log('   Recebido:', phone);
      console.log('   No banco:', leadEmail.celular);
      return { lead: leadEmail, method: '2-email', phoneMatch: false };
    }
    
    console.log('⚠️  Não encontrado (por email)');
  }
  
  // PASSO 3: Busca pelos últimos 8/9 dígitos (EMERGÊNCIA)
  console.log('\n📍 PASSO 3: Busca emergencial (últimos 8/9 dígitos)');
  
  const digits = phone.replace(/\D/g, '');
  const ultimos9 = digits.slice(-9);
  const ultimos8 = digits.slice(-8);
  
  console.log('   Últimos 9 dígitos:', ultimos9);
  console.log('   Últimos 8 dígitos:', ultimos8);
  
  // Buscar por últimos 9
  const { data: leads9, error: error9 } = await supabase
    .from('quiz_leads')
    .select('*')
    .ilike('celular', `%${ultimos9}`)
    .limit(5);
  
  if (leads9 && leads9.length > 0) {
    console.log(`⚠️  Encontrado ${leads9.length} lead(s) com últimos 9 dígitos`);
    console.log('   Lead selecionado:', leads9[0].nome);
    console.log('   ⚠️  ATENÇÃO: Busca emergencial! Verificar telefone manualmente');
    return { lead: leads9[0], method: '3-last9-emergency', phoneMatch: false };
  }
  
  // Buscar por últimos 8
  const { data: leads8, error: error8 } = await supabase
    .from('quiz_leads')
    .select('*')
    .ilike('celular', `%${ultimos8}`)
    .limit(5);
  
  if (leads8 && leads8.length > 0) {
    console.log(`⚠️  Encontrado ${leads8.length} lead(s) com últimos 8 dígitos`);
    console.log('   Lead selecionado:', leads8[0].nome);
    console.log('   ⚠️  ATENÇÃO: Busca emergencial! Verificar telefone manualmente');
    return { lead: leads8[0], method: '3-last8-emergency', phoneMatch: false };
  }
  
  console.log('\n❌ Lead NÃO ENCONTRADO em nenhum dos 3 passos');
  return { lead: null, method: 'not-found' };
}

/**
 * Lista de países suportados para o dropdown
 */
function getSupportedCountries() {
  return [
    { code: 'BR', name: 'Brasil', flag: '🇧🇷', dialCode: '+55' },
    { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', dialCode: '+1' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351' },
    { code: 'ES', name: 'Espanha', flag: '🇪🇸', dialCode: '+34' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54' },
    { code: 'MX', name: 'México', flag: '🇲🇽', dialCode: '+52' },
    { code: 'CO', name: 'Colômbia', flag: '🇨🇴', dialCode: '+57' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56' },
  ];
}

module.exports = {
  formatToE164,
  isValidE164,
  formatForUnnichat,
  formatForDisplay,
  findLeadByPhone,
  getSupportedCountries
};
