// test-phone-simple.js
// Teste da nova biblioteca phone-simple

const {
  formatToE164,
  isValidE164,
  formatForUnnichat,
  formatForDisplay,
  getSupportedCountries
} = require('./lib/phone-simple');

console.log('\n🧪 TESTANDO PHONE-SIMPLE.JS\n');

// Teste 1: Telefones brasileiros
console.log('=== TESTE 1: Telefones Brasileiros ===');
const testBR = [
  '11998457676',
  '(11) 99845-7676',
  '+5511998457676',
  '5511998457676',
  '11 99845-7676'
];

testBR.forEach(phone => {
  const e164 = formatToE164(phone, 'BR');
  console.log(`Input: ${phone.padEnd(20)} → E.164: ${e164} → Valid: ${isValidE164(e164)} → Unnichat: ${formatForUnnichat(e164)}`);
});

// Teste 2: Telefones internacionais
console.log('\n=== TESTE 2: Telefones Internacionais ===');
const testIntl = [
  { phone: '9177712345', country: 'US' },
  { phone: '932736368', country: 'PT' },
  { phone: '612345678', country: 'ES' }
];

testIntl.forEach(({ phone, country }) => {
  const e164 = formatToE164(phone, country);
  console.log(`${country}: ${phone.padEnd(15)} → E.164: ${e164} → Display: ${formatForDisplay(e164)}`);
});

// Teste 3: Telefones inválidos
console.log('\n=== TESTE 3: Telefones Inválidos ===');
const testInvalid = [
  '123',
  'abc',
  '',
  '00000000'
];

testInvalid.forEach(phone => {
  const e164 = formatToE164(phone, 'BR');
  console.log(`Input: ${phone.padEnd(15)} → E.164: ${e164} → Valid: ${isValidE164(e164)}`);
});

// Teste 4: Países suportados
console.log('\n=== TESTE 4: Países Suportados ===');
const countries = getSupportedCountries();
countries.forEach(c => {
  console.log(`${c.flag} ${c.code.padEnd(2)} - ${c.name.padEnd(20)} (${c.dialCode})`);
});

console.log('\n✅ Testes concluídos!\n');
