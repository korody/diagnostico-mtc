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
  const normalized = normalizePhone(phone);
  if (!normalized.startsWith('55')) {
    return `55${normalized}`;
  }
  return normalized;
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
