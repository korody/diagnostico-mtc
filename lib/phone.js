// phone.js (migrado de api/utils/phone)

// Lista de DDDs brasileiros válidos (11-99, exceto alguns não alocados)
const DDDs_VALIDOS_BR = [
  11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
  21, 22, 24, // RJ
  27, 28, // ES
  31, 32, 33, 34, 35, 37, 38, // MG
  41, 42, 43, 44, 45, 46, // PR
  47, 48, 49, // SC
  51, 53, 54, 55, // RS
  61, // DF
  62, 64, // GO
  63, // TO
  65, 66, // MT
  67, // MS
  68, // AC
  69, // RO
  71, 73, 74, 75, 77, // BA
  79, // SE
  81, 87, // PE
  82, // AL
  83, // PB
  84, // RN
  85, 88, // CE
  86, 89, // PI
  91, 93, 94, // PA
  92, 97, // AM
  95, // RR
  96, // AP
  98, 99  // MA
];

function normalizePhone(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  
  // Remover zeros à esquerda do formato antigo (0XX)
  if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.substring(1);
  }
  
  // CASO 1: Número com 13+ dígitos - assumir DDI internacional ou brasileiro com DDI
  if (clean.length >= 13) {
    // Se começa com 55 E tem 13 dígitos, verificar se é BR com DDI
    if (clean.startsWith('55') && clean.length === 13) {
      const possibleDDD = parseInt(clean.substring(2, 4), 10);
      if (DDDs_VALIDOS_BR.includes(possibleDDD)) {
        return clean.substring(2); // Remove DDI 55, mantém DDD + número
      }
    }
    // Outros casos: manter como está (números internacionais)
    return clean;
  }
  
  // CASO 2: Número com 12 dígitos
  if (clean.length === 12) {
    // Verificar se começa com 55 e os próximos 2 dígitos são DDD válido
    if (clean.startsWith('55')) {
      const possibleDDD = parseInt(clean.substring(2, 4), 10);
      if (DDDs_VALIDOS_BR.includes(possibleDDD)) {
        // É BR com DDI: 55 + DDD + número (10 dígitos)
        return clean.substring(2); // Remove DDI 55
      }
    }
    // Não é BR com DDI - pode ser número internacional, manter como está
    return clean;
  }
  
  // CASO 3: Número com 10 ou 11 dígitos (formato BR sem DDI)
  if (clean.length === 10 || clean.length === 11) {
    const possibleDDD = parseInt(clean.substring(0, 2), 10);
    if (DDDs_VALIDOS_BR.includes(possibleDDD)) {
      return clean; // DDD válido, retorna normalizado
    }
    // DDD inválido - pode ser número mal formatado
    console.warn(`⚠️ normalizePhone: DDD suspeito (${possibleDDD}) no número ${clean}`);
    return clean; // Retorna mesmo assim, mas loga warning
  }
  
  // CASO 4: Números curtos (8-9 dígitos) - número local sem DDD
  // NÃO assumir DDD aqui, apenas retornar normalizado
  if (clean.length >= 8 && clean.length <= 9) {
    console.warn(`⚠️ normalizePhone: número curto (${clean.length} dígitos) sem DDD: ${clean}`);
    return clean;
  }
  
  // CASO 5: Outros tamanhos - retornar como está
  return clean;
}

function formatPhoneForUnnichat(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  
  // Caso 1: Telefone brasileiro SEM DDI (10 ou 11 dígitos)
  // Verificar se tem DDD válido antes de adicionar DDI
  if (digits.length === 10 || digits.length === 11) {
    const possibleDDD = parseInt(digits.substring(0, 2), 10);
    if (DDDs_VALIDOS_BR.includes(possibleDDD)) {
      return `55${digits}`; // DDD válido, adiciona DDI 55
    }
    // DDD inválido - não adicionar DDI, retornar como está e logar erro
    console.error(`❌ formatPhoneForUnnichat: DDD inválido (${possibleDDD}) no número ${digits}`);
    return digits;
  }
  
  // Caso 2: Telefone COM DDI completo (12-15 dígitos)
  // Ex: 5511998457676 (BR) ou 351932736368 (PT)
  if (digits.length >= 12 && digits.length <= 15) {
    return digits;
  }
  
  // Caso 3: Telefone curto (8-9 dígitos) - número incompleto SEM DDD
  // NÃO assumir DDD - retornar erro
  if (digits.length === 8 || digits.length === 9) {
    console.error(`❌ formatPhoneForUnnichat: Número incompleto sem DDD (${digits.length} dígitos): ${digits}`);
    console.error(`   → Este número NÃO será enviado ao Unnichat. Adicione DDD manualmente.`);
    // Retornar vazio para forçar falha e evitar envio incorreto
    return '';
  }
  
  // Fallback: formato inesperado
  console.error(`❌ formatPhoneForUnnichat: Formato inesperado: ${digits} (${digits.length} dígitos)`);
  return '';
}

function isValidBrazilianPhone(phone) {
  if (!phone) return false;
  
  // Limpar e verificar tamanho ANTES de normalizar
  const digits = phone.replace(/\D/g, '');
  
  // Se tem 12+ dígitos, provavelmente tem DDI - não é formato esperado
  // (deve normalizar antes de validar)
  if (digits.length >= 12) {
    return false;
  }
  
  // Normalizar para validação
  const normalized = normalizePhone(phone);
  
  // Validar apenas formatos completos com DDD (10 ou 11 dígitos)
  if (normalized.length !== 10 && normalized.length !== 11) {
    return false;
  }
  
  // Verificar se o DDD é válido
  const ddd = parseInt(normalized.substring(0, 2), 10);
  if (!DDDs_VALIDOS_BR.includes(ddd)) {
    return false;
  }
  
  // Verificar formato do número após DDD
  const numeroLocal = normalized.substring(2);
  
  // 11 dígitos: DDD + 9 + 8 dígitos (celular)
  if (normalized.length === 11) {
    return numeroLocal.startsWith('9') && /^\d{9}$/.test(numeroLocal);
  }
  
  // 10 dígitos: DDD + 8 dígitos (fixo) ou DDD + celular antigo sem 9
  if (normalized.length === 10) {
    return /^\d{8}$/.test(numeroLocal);
  }
  
  return false;
}

// Aceita números em formato E.164 (12 a 15 dígitos com DDI) para países que não o Brasil
function isValidInternationalPhone(phone) {
  const digits = (phone || '').toString().replace(/\D/g, '');
  // Se começa com 55 e tem 12+ dígitos, trata-se de BR com DDI — preferimos normalizar para 10/11
  if (digits.startsWith('55')) return digits.length >= 12;
  // Outros países: aceitar 12 a 15 dígitos
  return digits.length >= 12 && digits.length <= 15;
}

function isValidPhoneUniversal(phone) {
  return isValidBrazilianPhone(phone) || isValidInternationalPhone(phone);
}

function formatPhoneForDisplay(phone) {
  const normalized = normalizePhone(phone);
  if (normalized.length === 11) {
    return `(${normalized.substring(0, 2)}) ${normalized.substring(2, 7)}-${normalized.substring(7)}`;
  } else if (normalized.length === 10) {
    return `(${normalized.substring(0, 2)}) ${normalized.substring(2, 6)}-${normalized.substring(6)}`;
  }
  return phone;
}

module.exports = {
  normalizePhone,
  formatPhoneForUnnichat,
  isValidBrazilianPhone,
  isValidInternationalPhone,
  isValidPhoneUniversal,
  formatPhoneForDisplay
};
