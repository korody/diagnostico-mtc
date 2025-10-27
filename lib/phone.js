// phone.js (migrado de api/utils/phone)
function normalizePhone(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('55') && clean.length >= 12) {
    clean = clean.substring(2);
  }
  if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.substring(1);
  }
  return clean;
}

function formatPhoneForUnnichat(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  
  // Caso 1: Telefone brasileiro SEM DDI (10 ou 11 dígitos) - LEGADO
  // Ex: 11998457676 -> 5511998457676
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  
  // Caso 2: Telefone COM DDI completo (12+ dígitos)
  // Ex: 5511998457676 (BR) ou 351932736368 (PT)
  // Usa como está
  if (digits.length >= 12) {
    return digits;
  }
  
  // Caso 3: Telefone curto (8-9 dígitos) - provavelmente número incompleto
  // Assume brasileiro e adiciona 55 + DDD padrão 11 (SP)
  // Ex: 98457676 -> 551198457676
  if (digits.length === 8 || digits.length === 9) {
    console.warn(`⚠️ Telefone curto detectado: ${digits}. Assumindo DDD 11.`);
    return `5511${digits}`;
  }
  
  // Fallback: retorna como está e loga warning
  console.warn(`⚠️ Formato de telefone inesperado: ${digits} (${digits.length} dígitos)`);
  return digits;
}

function isValidBrazilianPhone(phone) {
  const normalized = normalizePhone(phone);
  return normalized.length === 10 || normalized.length === 11;
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
  formatPhoneForDisplay
};
