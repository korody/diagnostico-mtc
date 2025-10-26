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
  // Se já vier com +55/55 e tamanho completo (12+), mantém como está
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  const normalized = normalizePhone(phone);
  // Telefones brasileiros sem DDI: 10 ou 11 dígitos -> prefixa 55
  if (normalized.length === 10 || normalized.length === 11) {
    return `55${normalized}`;
  }
  // Caso contrário, assume internacional com DDI já presente
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
