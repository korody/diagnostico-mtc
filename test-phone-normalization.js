#!/usr/bin/env node
// ========================================
// TESTES UNITÁRIOS: lib/phone.js
// ========================================
// Testes para as funções de normalização e validação de telefones
// baseados nos casos reais documentados em docs/PROBLEMA_DE_NORMALIZACAO.md
//
// Para executar: node test-phone-normalization.js
// ========================================

const { normalizePhone, formatPhoneForUnnichat, isValidBrazilianPhone } = require('./lib/phone');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, expected, actual) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ ${testName}`);
  } else {
    failedTests++;
    console.log(`❌ ${testName}`);
    console.log(`   Esperado: ${expected}`);
    console.log(`   Obtido: ${actual}`);
  }
}

function testNormalizePhone() {
  console.log('\n📱 TESTES: normalizePhone()\n');
  
  // Caso 1: Números brasileiros com DDI 55 (12-13 dígitos)
  assert(
    normalizePhone('5511998457676') === '11998457676',
    'Remove DDI 55 de número BR completo (13 dígitos)',
    '11998457676',
    normalizePhone('5511998457676')
  );
  
  assert(
    normalizePhone('551199845767') === '1199845767',
    'Remove DDI 55 de número BR fixo (12 dígitos)',
    '1199845767',
    normalizePhone('551199845767')
  );
  
  // Caso 2: PROBLEMA REAL - DDD 35 confundido com DDI+DDD
  assert(
    normalizePhone('35997258445') === '35997258445',
    'NÃO remove 35 quando é DDD (11 dígitos)',
    '35997258445',
    normalizePhone('35997258445')
  );
  
  assert(
    normalizePhone('5535997258445') === '35997258445',
    'Remove DDI 55 mas mantém DDD 35 (13 dígitos)',
    '35997258445',
    normalizePhone('5535997258445')
  );
  
  // Caso 3: PROBLEMA REAL - DDD 55 (Rio Grande do Sul)
  assert(
    normalizePhone('55991679976') === '55991679976',
    'NÃO remove 55 quando é DDD do RS (11 dígitos)',
    '55991679976',
    normalizePhone('55991679976')
  );
  
  assert(
    normalizePhone('5555991679976') === '55991679976',
    'Remove DDI 55 mas mantém DDD 55 do RS (13 dígitos)',
    '55991679976',
    normalizePhone('5555991679976')
  );
  
  // Caso 4: PROBLEMA REAL - DDD 47 (SC)
  assert(
    normalizePhone('47997896688') === '47997896688',
    'Mantém DDD 47 mesmo com warning de formato suspeito',
    '47997896688',
    normalizePhone('47997896688')
  );
  
  assert(
    normalizePhone('554797896688') === '4797896688',
    'Remove DDI 55 e mantém DDD 47 (12 dígitos)',
    '4797896688',
    normalizePhone('554797896688')
  );
  
  // Caso 5: PROBLEMA REAL - DDD 71 (BA)
  assert(
    normalizePhone('71987643968') === '71987643968',
    'Mantém DDD 71 (11 dígitos)',
    '71987643968',
    normalizePhone('71987643968')
  );
  
  assert(
    normalizePhone('5571987643968') === '71987643968',
    'Remove DDI 55 e mantém DDD 71 (13 dígitos)',
    '71987643968',
    normalizePhone('5571987643968')
  );
  
  // Caso 6: Números internacionais (não BR)
  assert(
    normalizePhone('351932736368') === '351932736368',
    'Mantém número internacional PT (12 dígitos)',
    '351932736368',
    normalizePhone('351932736368')
  );
  
  // Caso 7: Números locais sem DDD (deve logar warning mas retornar)
  const resultado8dig = normalizePhone('98457676');
  assert(
    resultado8dig === '98457676',
    'Retorna número curto 8 dígitos com warning',
    '98457676',
    resultado8dig
  );
  
  const resultado9dig = normalizePhone('997258445');
  assert(
    resultado9dig === '997258445',
    'Retorna número curto 9 dígitos com warning',
    '997258445',
    resultado9dig
  );
  
  // Caso 8: Formato antigo com 0 (DDD)
  assert(
    normalizePhone('01199845767') === '1199845767',
    'Remove 0 do formato antigo 0XX',
    '1199845767',
    normalizePhone('01199845767')
  );
}

function testFormatPhoneForUnnichat() {
  console.log('\n📤 TESTES: formatPhoneForUnnichat()\n');
  
  // Caso 1: Números BR sem DDI (10-11 dígitos) com DDD válido
  assert(
    formatPhoneForUnnichat('11998457676') === '5511998457676',
    'Adiciona DDI 55 a número BR válido (11 dígitos)',
    '5511998457676',
    formatPhoneForUnnichat('11998457676')
  );
  
  assert(
    formatPhoneForUnnichat('1199845767') === '551199845767',
    'Adiciona DDI 55 a fixo BR válido (10 dígitos)',
    '551199845767',
    formatPhoneForUnnichat('1199845767')
  );
  
  // Caso 2: Números com DDD válidos diferentes
  assert(
    formatPhoneForUnnichat('35997258445') === '5535997258445',
    'Adiciona DDI 55 a DDD 35 (MG)',
    '5535997258445',
    formatPhoneForUnnichat('35997258445')
  );
  
  assert(
    formatPhoneForUnnichat('55991679976') === '5555991679976',
    'Adiciona DDI 55 a DDD 55 (RS)',
    '5555991679976',
    formatPhoneForUnnichat('55991679976')
  );
  
  assert(
    formatPhoneForUnnichat('47997896688') === '5547997896688',
    'Adiciona DDI 55 a DDD 47 (SC)',
    '5547997896688',
    formatPhoneForUnnichat('47997896688')
  );
  
  // Caso 3: Números com DDI já presente
  assert(
    formatPhoneForUnnichat('5511998457676') === '5511998457676',
    'Mantém número BR com DDI completo',
    '5511998457676',
    formatPhoneForUnnichat('5511998457676')
  );
  
  // Caso 4: Números internacionais
  assert(
    formatPhoneForUnnichat('351932736368') === '351932736368',
    'Mantém número internacional (PT)',
    '351932736368',
    formatPhoneForUnnichat('351932736368')
  );
  
  // Caso 5: Números incompletos SEM DDD (deve retornar vazio e logar erro)
  assert(
    formatPhoneForUnnichat('98457676') === '',
    'Retorna vazio para número sem DDD (8 dígitos)',
    '',
    formatPhoneForUnnichat('98457676')
  );
  
  assert(
    formatPhoneForUnnichat('997258445') === '',
    'Retorna vazio para número sem DDD (9 dígitos)',
    '',
    formatPhoneForUnnichat('997258445')
  );
  
  // Caso 6: DDD inválido (deve retornar sem DDI e logar erro)
  const resultadoDDDInvalido = formatPhoneForUnnichat('00998457676');
  assert(
    resultadoDDDInvalido === '00998457676',
    'Retorna sem DDI quando DDD é inválido',
    '00998457676',
    resultadoDDDInvalido
  );
}

function testIsValidBrazilianPhone() {
  console.log('\n✅ TESTES: isValidBrazilianPhone()\n');
  
  // Caso 1: Números válidos
  assert(
    isValidBrazilianPhone('11998457676') === true,
    'Válido: celular SP com 9 (11 dígitos)',
    'true',
    isValidBrazilianPhone('11998457676')
  );
  
  assert(
    isValidBrazilianPhone('1199845767') === true,
    'Válido: fixo SP (10 dígitos)',
    'true',
    isValidBrazilianPhone('1199845767')
  );
  
  assert(
    isValidBrazilianPhone('35997258445') === true,
    'Válido: celular MG DDD 35',
    'true',
    isValidBrazilianPhone('35997258445')
  );
  
  assert(
    isValidBrazilianPhone('55991679976') === true,
    'Válido: celular RS DDD 55',
    'true',
    isValidBrazilianPhone('55991679976')
  );
  
  // Caso 2: Números inválidos
  assert(
    isValidBrazilianPhone('98457676') === false,
    'Inválido: sem DDD (8 dígitos)',
    'false',
    isValidBrazilianPhone('98457676')
  );
  
  assert(
    isValidBrazilianPhone('997258445') === false,
    'Inválido: sem DDD (9 dígitos)',
    'false',
    isValidBrazilianPhone('997258445')
  );
  
  assert(
    isValidBrazilianPhone('00998457676') === false,
    'Inválido: DDD 00 não existe',
    'false',
    isValidBrazilianPhone('00998457676')
  );
  
  assert(
    isValidBrazilianPhone('11898457676') === false,
    'Inválido: 11 dígitos mas não começa com 9 após DDD',
    'false',
    isValidBrazilianPhone('11898457676')
  );
  
  // Caso 3: Números com DDI (devem ser normalizados primeiro)
  assert(
    isValidBrazilianPhone('5511998457676') === false,
    'Inválido: com DDI 55 (deve normalizar antes)',
    'false',
    isValidBrazilianPhone('5511998457676')
  );
}

function testCasosReaisDocumentados() {
  console.log('\n📋 TESTES: Casos reais do PROBLEMA_DE_NORMALIZACAO.md\n');
  
  // Caso 1: 55991679976 → normalizado incorretamente como 5555991679976
  const caso1Input = '55991679976';
  const caso1Normalized = normalizePhone(caso1Input);
  const caso1Formatted = formatPhoneForUnnichat(caso1Normalized);
  
  assert(
    caso1Normalized === '55991679976',
    'Caso 1: normalizar 55991679976',
    '55991679976',
    caso1Normalized
  );
  
  assert(
    caso1Formatted === '5555991679976',
    'Caso 1: formatar para Unnichat deve ser 5555991679976',
    '5555991679976',
    caso1Formatted
  );
  
  // Caso 2: 71987643968 → normalizado como 5571987643968
  const caso2Input = '71987643968';
  const caso2Normalized = normalizePhone(caso2Input);
  const caso2Formatted = formatPhoneForUnnichat(caso2Normalized);
  
  assert(
    caso2Normalized === '71987643968',
    'Caso 2: normalizar 71987643968',
    '71987643968',
    caso2Normalized
  );
  
  assert(
    caso2Formatted === '5571987643968',
    'Caso 2: formatar para Unnichat deve ser 5571987643968',
    '5571987643968',
    caso2Formatted
  );
  
  // Caso 3: 35997258445 → foi normalizado incorretamente como 3597258445
  const caso3Input = '35997258445';
  const caso3Normalized = normalizePhone(caso3Input);
  const caso3Formatted = formatPhoneForUnnichat(caso3Normalized);
  
  assert(
    caso3Normalized === '35997258445',
    'Caso 3: normalizar 35997258445 (NÃO remover 35)',
    '35997258445',
    caso3Normalized
  );
  
  assert(
    caso3Formatted === '5535997258445',
    'Caso 3: formatar para Unnichat deve ser 5535997258445',
    '5535997258445',
    caso3Formatted
  );
  
  // Caso 4: 479978966 → foi normalizado incorretamente como 4797896688
  const caso4Input = '479978966';
  const caso4Normalized = normalizePhone(caso4Input);
  
  assert(
    caso4Normalized === '479978966',
    'Caso 4: normalizar 479978966 (número incompleto, retorna com warning)',
    '479978966',
    caso4Normalized
  );
  
  const caso4Formatted = formatPhoneForUnnichat(caso4Normalized);
  assert(
    caso4Formatted === '',
    'Caso 4: formatPhoneForUnnichat rejeita número sem DDD',
    '',
    caso4Formatted
  );
}

// Executar todos os testes
console.log('🧪 EXECUTANDO TESTES DE NORMALIZAÇÃO DE TELEFONES\n');
console.log('='.repeat(60));

testNormalizePhone();
testFormatPhoneForUnnichat();
testIsValidBrazilianPhone();
testCasosReaisDocumentados();

console.log('\n' + '='.repeat(60));
console.log(`\n📊 RESULTADO DOS TESTES:`);
console.log(`   Total: ${totalTests}`);
console.log(`   ✅ Passou: ${passedTests}`);
console.log(`   ❌ Falhou: ${failedTests}`);
console.log(`   📈 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

if (failedTests > 0) {
  console.log('❌ Alguns testes falharam. Revise o código e execute novamente.\n');
  process.exit(1);
} else {
  console.log('✅ Todos os testes passaram!\n');
  process.exit(0);
}
